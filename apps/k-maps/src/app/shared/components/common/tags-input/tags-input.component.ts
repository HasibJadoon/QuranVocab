import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange, SimpleChanges, ViewChild } from '@angular/core';
import { UntypedFormControl, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import * as _ from 'lodash';

@Component({
  selector: 'mcit-tags-input',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: McitTagsInputComponent,
      multi: true
    }
  ],
  templateUrl: './tags-input.component.html',
  styleUrls: ['./tags-input.component.scss']
})
export class McitTagsInputComponent implements OnInit, OnChanges {
  @Input() max: number;
  @Input() tagList: string[] | Array<any> = [];
  @Input() charactersLength: number;
  @Input() maxCharactersLength: number;
  @Input() displayAttr = 'name';
  /**
   * Les attributs supplémentaires seront affichés entre parenthèses séparés par des tirets
   */
  @Input() displayAdditionalAttr: Array<string> = [];
  @Input() keyAttr = 'id';
  @Input() disabled = false;
  @Input() isTagRemovable = false;
  @Input() inline = false;
  @Input() twoline = false;
  @Input() maxLength = 50;
  @Input() isEmail = false;
  @Input() placeholder = '';
  @Input() iconClass = '';
  @Input() center = false;
  @Output() valueChange = new EventEmitter();

  @ViewChild('newTagInput', { static: true }) newTagInput: ElementRef;

  inputDisabled = false;
  expanded = false;

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    const tagList: SimpleChange = changes.tagList;
    if (tagList && tagList.currentValue) {
      if (typeof tagList?.currentValue[0] === 'object') {
        if (this.disabled === false) {
          console.error(`Error tagList list with object elements, does not work in activated edit mode`);
          this.disabled = true;
        }
        const isAllConform = tagList?.currentValue.every((tagObject) => {
          const keys = Object.keys(tagObject);
          return keys.indexOf(this.keyAttr) !== -1 && keys.indexOf(this.displayAttr) !== -1;
        });
        if (isAllConform) {
          this.tagList = _.uniqBy(tagList?.currentValue, this.keyAttr);
        } else {
          console.error(`Error with tagList attribute shoud have key attribute '${this.keyAttr}' and display attribute '${this.displayAttr}'`);
        }
      } else {
        this.tagList = _.uniq(tagList?.currentValue.filter(Boolean));
      }
    }
  }

  doToggleExpanded(): void {
    this.expanded = !this.expanded;
  }

  doValidTag(event: any): boolean {
    const newTag = event.srcElement.value.replace(/\s+/g, ' ').trim();
    const emailControl = new UntypedFormControl(newTag, Validators.email);
    const isValidEmailOrIsNotAnEmail = this.isEmail ? emailControl.status === 'VALID' : true;
    if (newTag && newTag !== '' && this.tagList.indexOf(newTag) === -1 && isValidEmailOrIsNotAnEmail) {
      this.tagList.push(newTag);
      this.valueChange.emit(this.tagList);
      this.inputDisabled = this.tagList.length >= this.maxLength;
    }
    event.srcElement.value = '';
    return false;
  }

  doDeleteLastTag(event: any): boolean {
    if (event.srcElement.value === '') {
      this.tagList.pop();
      this.valueChange.emit(this.tagList);
      this.inputDisabled = this.tagList.length >= this.maxLength;
      return false;
    }
  }

  doRemoveTag(tag: any, index: number): boolean {
    this.tagList.splice(index, 1);
    this.valueChange.emit(this.tagList);
    this.inputDisabled = this.tagList.length >= this.maxLength;
    return false;
  }

  doFocusInput(): void {
    if (this.newTagInput) {
      this.newTagInput.nativeElement.focus();
    }
  }
}
