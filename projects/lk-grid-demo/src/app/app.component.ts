import { Component } from '@angular/core';
import { ColumnDefinition } from 'dist/lk-grid/lib/ColumnDefinition';
import { Person } from './Person';
import { PersonFactory } from './PersonFactory';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'lk-grid-demo';

  columnDefs: ColumnDefinition[] = [
    { field: 'id', title: '#'},
    { field: 'firstName', title: 'First name' },
    { field: 'lastName', title: 'Last name' },
    { field: 'city', title: 'City' },
    { field: 'job', title: 'Job' },
    { field: 'age', title: 'Age'},
    { field: 'hobby', title: 'Hobby'},
  ];

  factory = new PersonFactory();

  data: Person[] = this.factory.create(10000);
}
