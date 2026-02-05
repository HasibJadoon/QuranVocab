import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { IGroup, IGroupOption } from '@lib-shared/common/group/group-options';

@Component({
  selector: 'mcit-group',
  styleUrls: ['group.component.scss'],
  templateUrl: 'group.component.html'
})
export class McitGroupComponent implements OnInit {
  @Input() options: { [key: string]: IGroupOption };
  @Input() groups$: Observable<IGroup[]>;
  @Output() doAddGroupKey = new EventEmitter<string>();
  @Output() doDeleteGroupKey = new EventEmitter<string>();
  @Output() doToggleGroupDirection = new EventEmitter<string>();
  constructor() {}

  ngOnInit(): void {}

  doChangeAddGroupKey(key: string): void {
    this.doAddGroupKey.emit(key);
  }
  doChangeDeleteGroupKey(key: string): void {
    this.doDeleteGroupKey.emit(key);
  }
  doChangeToggleGroupDirection(key: string): void {
    this.doToggleGroupDirection.emit(key);
  }

  trackByGroup(index: number, item: IGroup): string {
    return item.key;
  }
}
