import { Component } from '@angular/core';
import { ColumnDefinition } from 'dist/lk-grid/lib/ColumnDefinition';
import { SortDefinition } from 'dist/lk-grid/lib/SortDefinition';
import { Entity, Person } from './Person';
import { PersonFactory } from './PersonFactory';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private factory = new PersonFactory();

  private persistentData: Person[] = this.factory.create(10000);

  public title = 'lk-grid-demo';

  public columnDefs: ColumnDefinition[] = [
    { field: 'id', title: '#'},
    { field: 'firstName', title: 'First name' },
    { field: 'lastName', title: 'Last name' },
    { field: 'city', title: 'City' },
    { field: 'job', title: 'Job' },
    { field: 'age', title: 'Age'},
    { field: 'hobby', title: 'Hobby'},
  ];

  public data = this.persistentData.slice();

  public onSort(sort: SortDefinition[])
  {
    let tmpData = this.persistentData.slice();

    let i;
    for (i = 0; i < sort.length; i++)
    {
      let sortDef = sort[i];
    
      tmpData.sort(this.compareObjectsByField(sortDef.field, sortDef.dir));
    }

    this.data = tmpData;
  }

  private compareObjectsByField(fieldName: string, sortingDir: string | undefined):
  (a: Entity, b: Entity) => number
  {
    if (sortingDir === 'asc') {
      return (a: Entity, b: Entity) => this.compare(a[fieldName], b[fieldName]);
    }

    if (sortingDir === 'desc')
    {
      return (a: Entity, b: Entity) => this.compare(b[fieldName], a[fieldName]);
    }

    return (a: Entity, b: Entity) => 0;
  }

  private compare(a: any, b: any): number
  {
    if (a > b) {
      return 1;
    }

    if (a < b) {
      return -1
    }

    return 0;
  }
}
