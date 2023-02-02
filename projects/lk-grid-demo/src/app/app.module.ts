import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { LkGridModule } from 'lk-grid';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    LkGridModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
