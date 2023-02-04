import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LkGridComponent } from './lk-grid-component/lk-grid.component';

@NgModule({
  declarations: [
    LkGridComponent
  ],
  imports: [
    BrowserModule
  ],
  exports: [
    LkGridComponent
  ]
})
export class LkGridModule { }
