import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'mcit-full-text',
  templateUrl: './full-text.component.html',
  styleUrls: ['./full-text.component.scss']
})
export class McitFullTextComponent implements OnInit {
  @Input()
  text: string;

  showFull = false;

  constructor() {}

  ngOnInit(): void {}
}
