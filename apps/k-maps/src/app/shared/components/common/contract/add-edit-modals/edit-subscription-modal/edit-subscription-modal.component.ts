import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { LANGUAGES } from '@lib-shared/common/models/language';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { IInfoDetailedContact } from '@lib-shared/common/models/info-contact.model';
import * as lodash from 'lodash';
import { isNil, omitBy } from 'lodash';
import { EMAIL_REGEX } from '@lib-shared/common/helpers/email.helper';
import { isValidNumber, parsePhoneNumber } from 'libphonenumber-js';
import { SUBSCRIPTION_MODES, SubscriptionMode } from '@lib-shared/common/models/subscription-mode';
import { SUBSCRIPTION_EVENT_TYPES } from '@lib-shared/common/models/subscription-event-type';
import { merge, Observable, of, Subscription, timer } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ISubscriptionMemberRole } from '@lib-shared/common/models/member-role.model';
import { DispatcherApiRoutesEnum } from '../../../../../../../dispatcher/src/app/business/services/offers-http.service';
import { ISubscriptionTemplate } from '../../../../../../../supervision/src/app/business/models/subscription-template.model';
import { SubscriptionTemplatesHttpService } from '../../../../../../../supervision/src/app/business/services/subscription-templates-http.service';
import { map, switchMap } from 'rxjs/operators';
import { SUBSCRIPTION_LEVELS, SubscriptionLevel } from '@lib-shared/common/models/subscription-level';

@Component({
  selector: 'mcit-edit-subscription-modal',
  templateUrl: './edit-subscription-modal.component.html',
  styleUrls: ['./edit-subscription-modal.component.scss']
})
export class EditSubscriptionModalComponent implements OnInit, OnDestroy {
  form: UntypedFormGroup;
  submitAttempt = false;
  languages = LANGUAGES;
  modes = SUBSCRIPTION_MODES;
  levels = SUBSCRIPTION_LEVELS;
  templates$: Observable<ISubscriptionTemplate[]>;
  eventTypes = SUBSCRIPTION_EVENT_TYPES;
  disabledTags = false;

  private subscription: ISubscriptionMemberRole = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private dialogRef: McitDialogRef<EditSubscriptionModalComponent>,
    @Inject(MCIT_DIALOG_DATA)
    private data: {
      role: string;
      apiRoute: DispatcherApiRoutesEnum;
      service: string;
      subscription: ISubscriptionMemberRole;
      third_party_id: string;
      withPushNotifications?: boolean;
    },
    private formBuilder: UntypedFormBuilder,
    private translateService: TranslateService,
    private subscriptionTemplatesHttpService: SubscriptionTemplatesHttpService
  ) {
    if (!data.withPushNotifications) {
      this.modes = this.modes.filter((mode) => mode !== SubscriptionMode.PUSH);
    }
    this.form = this.formBuilder.group(
      {
        event_type: ['', Validators.compose([Validators.required])],
        mode: ['', Validators.compose([Validators.required])],
        level: ['', Validators.compose([Validators.required])],
        template: [null],
        use_member_role_contact: [null],
        _contacts: [''],
        _language: ['', Validators.compose([Validators.required])],
        tags: [[]],
        context: [null]
      },
      {
        validators: this.validatorModeContacts()
      }
    );

    this.subscription = data.subscription;
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.form.get('use_member_role_contact').valueChanges.subscribe((next) => {
        if (next) {
          this.form.get('_language').clearValidators();
        } else {
          this.form.get('_language').setValidators(Validators.compose([Validators.required]));
        }
        this.form.get('_language').updateValueAndValidity();
      })
    );

    if (this.subscription) {
      this.form.patchValue({
        event_type: this.subscription.event_type,
        mode: this.subscription.mode,
        level: this.subscription.level ?? SubscriptionLevel.TRANSPORT_ORDER,
        template: this.subscription.template_id,
        use_member_role_contact: this.subscription.use_member_role_contact,
        _language: lodash.get(this.subscription.contacts, '[0].language'),
        _contacts: lodash
          .get(this.subscription, 'contacts', [] as IInfoDetailedContact[])
          .map((c: IInfoDetailedContact) => {
            switch (this.subscription.mode) {
              case SubscriptionMode.SMS:
                return c.phone;
              case SubscriptionMode.EMAIL:
                return c.email;
            }
            return '';
          })
          .join(','),
        tags: this.subscription.tags ?? [],
        context: this.subscription.context
      });
    } else {
      this.form.patchValue({
        use_member_role_contact: true,
        _language: this.translateService.currentLang
      });
    }

    this.templates$ = merge(timer(0, 5 * 60000), this.form.get('event_type').valueChanges, this.form.get('mode').valueChanges, this.form.get('level').valueChanges).pipe(
      switchMap(() => {
        const eventType = this.form.get('event_type').value;
        const mode = this.form.get('mode').value;
        const level = this.form.get('level').value;

        if (eventType && mode && level) {
          return this.subscriptionTemplatesHttpService.search('', 1, 20, omitBy({ mode, level, event_type: eventType }, isNil), '', '_id,code,description').pipe(map((resp) => resp.body));
        }
        return of(null);
      })
    );

    this.subscriptions.push(
      this.form
        .get('template')
        .valueChanges.pipe()
        .subscribe((next) => {
          this.disabledTags = !!next;
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  goBack(): void {
    this.dialogRef.close();
  }

  doValidate(): void {
    this.submitAttempt = true;

    if (!this.form.valid) {
      return;
    }

    const form = this.form.getRawValue();

    const obj = {
      event_type: form.event_type,
      mode: form.mode,
      level: form.level,
      use_member_role_contact: form.use_member_role_contact,
      contacts: form._contacts
        ? form._contacts.split(',').map((c) => {
            switch (form.mode) {
              case SubscriptionMode.SMS:
                const phoneNumber = parsePhoneNumber(c);
                return {
                  phone: phoneNumber.format('E.164'),
                  language: form._language
                };
              case SubscriptionMode.EMAIL:
                return {
                  email: c,
                  language: form._language
                };
            }
          })
        : [],
      tags: form.tags?.length > 0 && !form.template ? form.tags : null,
      context: form.context,
      ...(form.template && { template_id: form.template })
    };

    this.dialogRef.close(obj);
  }

  private validatorModeContacts(): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      const mode = c.get('mode').value;
      const contacts = c.get('_contacts').value;
      if (mode == null || !contacts) {
        return null;
      }
      switch (mode) {
        case SubscriptionMode.EMAIL:
          const emails = contacts.split(',').filter((e) => !EMAIL_REGEX.test(e));
          if (emails && emails.length > 0) {
            return { contacts: emails.join(',') };
          }
          break;
        case SubscriptionMode.SMS:
          const smss = contacts.split(',').filter((p) => {
            if (!p || !p.startsWith('+')) {
              return true;
            }
            try {
              const phoneNumber = parsePhoneNumber(p);
              return !isValidNumber(phoneNumber.nationalNumber, phoneNumber.country);
            } catch (e) {
              return true;
            }
          });
          if (smss && smss.length > 0) {
            return { contacts: smss.join(',') };
          }
          break;
      }
      return null;
    };
  }

  onTagListChange(list) {
    this.form.get('tags').setValue(list);
  }
}
