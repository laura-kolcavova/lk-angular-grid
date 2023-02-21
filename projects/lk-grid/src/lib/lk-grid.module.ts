import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { LkGridComponent } from './lk-grid-component/lk-grid.component';

@NgModule({
  declarations: [
    LkGridComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  exports: [
    LkGridComponent
  ]
})
export class LkGridModule { }
