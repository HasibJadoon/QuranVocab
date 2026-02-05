import { AfterContentInit, ChangeDetectorRef, ContentChildren, Directive, Input, OnDestroy, OnInit, QueryList, Renderer2, ViewContainerRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, combineLatest, merge, Observable, ReplaySubject, Subscription } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';

import { McitTranslatedElementDirective } from './translated-element.directive';

interface TranslationData {
  elements: McitTranslatedElementDirective[];
  rawTranslation: string;
}

const TOKEN_START_DEMARC = '{{';
const TOKEN_END_DEMARC = '}}';

// adapted from @kasperlauge's solution in https://github.com/ngx-translate/core/issues/223
@Directive({
  selector: '[mcitTranslatedContent]'
})
export class McitTranslatedContentDirective implements OnInit, OnDestroy, AfterContentInit {
  @Input('mcitTranslatedContent')
  set translationKey(key: string) {
    this.translationKeySubject.next(key);
  }

  @ContentChildren(McitTranslatedElementDirective)
  private elements: QueryList<McitTranslatedElementDirective>;

  private translationKeySubject = new ReplaySubject<string>(1);
  private subs: Subscription[] = [];
  private rawTranslation: Observable<string>;

  constructor(private viewRef: ViewContainerRef, private renderer: Renderer2, private translateService: TranslateService, private changeDetectorRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.rawTranslation = this.translationKeySubject.asObservable().pipe(
      distinctUntilChanged(),
      switchMap((k) => this.translateService.get(k))
    );
  }

  public ngAfterContentInit(): void {
    // QueryList.changes doesn't re-emit after its initial value, which we have by now
    // BehaviorSubjects re-emit their initial value on subscription, so we get what we need by merging
    // the BehaviorSubject and the QueryList.changes observable
    const elementsSubject = new BehaviorSubject(this.elements.toArray());
    const elementsChanges = merge(elementsSubject, this.elements.changes);

    this.subs.push(
      combineLatest([this.rawTranslation, elementsChanges])
        .pipe(
          map(([rawTranslation]) => ({
            elements: this.elements.toArray(),
            rawTranslation
          }))
        )
        .subscribe((next) => {
          this.render(next);
        })
    );
  }

  private render(translationData: TranslationData): void {
    this.viewRef.clear();

    const childElements = this.viewRef.element.nativeElement.children;
    for (const child of childElements) {
      this.renderer.removeChild(this.viewRef.element.nativeElement, child);
    }
    this.viewRef.element.nativeElement.textContent = '';

    let lastTokenEnd = 0;
    while (lastTokenEnd < translationData.rawTranslation.length) {
      const tokenStartDemarc = translationData.rawTranslation.indexOf(TOKEN_START_DEMARC, lastTokenEnd);
      if (tokenStartDemarc < 0) {
        break;
      }
      const tokenStart = tokenStartDemarc + TOKEN_START_DEMARC.length;
      const tokenEnd = translationData.rawTranslation.indexOf(TOKEN_END_DEMARC, tokenStart);
      if (tokenEnd < 0) {
        throw new Error(`Encountered unterminated token in translation string '${this.translationKey}'`);
      }
      const tokenEndDemarc = tokenEnd + TOKEN_END_DEMARC.length;

      const precedingText = translationData.rawTranslation.substring(lastTokenEnd, tokenStartDemarc);
      const precedingTextElement = this.renderer.createText(precedingText.replace(/ /g, '\u00A0'));
      this.renderer.appendChild(this.viewRef.element.nativeElement, precedingTextElement);

      const elementKey = translationData.rawTranslation.substring(tokenStart, tokenEnd);
      const embeddedElementTemplate = translationData.elements.find((element) => element.elementKey === elementKey);
      if (embeddedElementTemplate) {
        const embeddedElementView = embeddedElementTemplate.viewRef.createEmbeddedView(embeddedElementTemplate.templateRef);
        this.renderer.appendChild(this.viewRef.element.nativeElement, embeddedElementView.rootNodes[0]);
      } else {
        const missingTokenText = translationData.rawTranslation.substring(tokenStartDemarc, tokenEndDemarc);
        const missingTokenElement = this.renderer.createText(missingTokenText);
        this.renderer.appendChild(this.viewRef.element.nativeElement, missingTokenElement);
      }

      lastTokenEnd = tokenEndDemarc;
    }

    const trailingText = translationData.rawTranslation.substring(lastTokenEnd);
    const trailingTextElement = this.renderer.createText(trailingText.replace(/ /g, '\u00A0'));
    this.renderer.appendChild(this.viewRef.element.nativeElement, trailingTextElement);

    // in case the rendering happens outside of a change detection event, this ensures that any translations in the
    // embedded elements are rendered
    this.changeDetectorRef.detectChanges();
  }

  public ngOnDestroy(): void {
    this.subs.forEach((sub) => sub.unsubscribe());
  }
}
