import { Component } from '@angular/core';
import { ColumnDefinition } from 'dist/lk-grid/lib/ColumnDefinition';
import { products } from '../products';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'lk-grid-demo';

  columnDefs: ColumnDefinition[] = [
    { field: 'ProductID', title: 'ID' },
    { field: 'ProductName', title: 'Name' },
    { field: 'UnitsInStock', title: 'Count' },
    { field: 'UnitPrice', title: 'Price' },
  ];

  data = products;
}
