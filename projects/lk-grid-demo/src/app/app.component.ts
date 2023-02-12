import { Component } from '@angular/core';
import { ColumnDefinition } from 'dist/lk-grid/lib/ColumnDefinition';
import { SegmentChangeEvent, SortChangeEvent } from 'projects/lk-grid/src/lib/Events';
import { executeQuery, InMemoryQuery, orderBy, select } from 'projects/lk-grid/src/lib/InMemoryQuery';
import { Person } from './Person';
import { PersonFactory } from './PersonFactory';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private factory: PersonFactory = new PersonFactory();

  private persistentData: Person[] = this.factory.create(10000);

  private query: InMemoryQuery<Person> = {
    from: this.persistentData
  };

  public title: string = 'lk-grid-demo';

  public data: any[] = this.loadData();

  public columnDefs: ColumnDefinition[] = [
    { field: 'id', title: '#', width: 75},
    { field: 'firstName', title: 'First name', width: 160 },
    { field: 'lastName', title: 'Last name', width: 160 },
    { field: 'city', title: 'City' },
    { field: 'job', title: 'Job' },
    { field: 'age', title: 'Age'},
    { field: 'hobby', title: 'Hobby'},
  ];

  constructor() {
  }

  public get totalItems(): number {
    return this.persistentData.length;
  }

  public onSort(event: SortChangeEvent)
  {
    this.query.orderBy = event.sort;
    this.data = this.loadData();
  }

  public onSegmentChange(event: SegmentChangeEvent)
  {
    console.log(event);
    // this.query.offset = event.offset;
    // this.query.limit = event.limit;
    // this.data = this.loadData();
  }

  private loadData(): any[]
  {
    let result = executeQuery(this.query);
    return result.data;
  }
}
