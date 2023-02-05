import { Component, Input, OnInit, ElementRef, HostBinding, ViewChild, Renderer2 } from '@angular/core';
import { ColumnDefinition } from '../ColumnDefinition';

@Component({
  selector: 'lk-grid',
  templateUrl: './lk-grid-component.html',
  styleUrls: ['./lk-grid-component.css']
})
export class LkGridComponent implements OnInit {

  @Input() columnDefs!: ColumnDefinition[];

  @Input() data!: any[];

  @Input() height!: number;

  @HostBinding("style.height.px") hostHeight!: number;

  @ViewChild('columnHeaders') columnHeaders!: ElementRef<HTMLElement>;

  @ViewChild('columnHeadersTable') columnHeadersTable!: ElementRef<HTMLElement>;
 
  @ViewChild('listContent') listContent! : ElementRef<HTMLElement>;

  // List table wrapper must be parent of list table to get width of scrollbar
  // when the list table is larger than list content
  @ViewChild('listTableWrapper') listTableWrapper!: ElementRef<HTMLElement>;

  @ViewChild('listTable') listTable! : ElementRef<HTMLElement>;

  public columnSizes: number[] = [];
  
  constructor(private renderer: Renderer2) { 

  }

  ngOnInit(): void {
    this.hostHeight = this.height;
  }

  ngAfterViewInit(): void {
    this.shiftColumnHeadersByVerticalScrollbar();
    this.computeColumnSizes();

    // Before the column sizes are computed the column headers table and list table must not have set css property 'table-layout' to 'fixed'.
    // After column sizes are computed they are used to set width of table columns
    // but the tables must have set css property 'table-layout' to 'fixed', otherwise the width of the columns will not work properly.
    this.renderer.addClass(this.columnHeadersTable.nativeElement, 'lk-datagrid-table-fixed');
    this.renderer.addClass(this.listTable.nativeElement, 'lk-datagrid-table-fixed');
  }

  public onListTableScroll($event: any): void {
    this.moveColumnHeadersWithListTable($event);
  }

  private shiftColumnHeadersByVerticalScrollbar(): void
  {
    // List table wrapper must be parent of list table to get width of scrollbar
    // when the list table is larger than list content
    let listContentEl = this.listContent.nativeElement;
    let listTableWrapperEl = this.listTableWrapper.nativeElement;;

    let scrollbarWidth = 
    listContentEl.getBoundingClientRect().width - 
    listTableWrapperEl.getBoundingClientRect().width;

    scrollbarWidth = Math.round(scrollbarWidth);
  
    this.renderer.setStyle(this.columnHeaders.nativeElement, 'padding-right', `${scrollbarWidth}px`);
  }

  private moveColumnHeadersWithListTable($event: any): void
  {
    let listContentRect = this.listContent.nativeElement.getBoundingClientRect();
    let listTableRect = this.listTable.nativeElement.getBoundingClientRect();

    // Get relative position of list table element to its parent
    // The list content element is parent of list table element
    let relativePos = listTableRect.left - listContentRect.left;

    // Ensure the position of the column headers element will match the position of list table element
    this.renderer.setStyle( this.columnHeadersTable.nativeElement, 'transform', `translateX(${relativePos}px)`);
  }

  private computeColumnSizes(): void
  {
    let colHeadersRow = this.columnHeadersTable.nativeElement.querySelector('tr');
    let dataRow = this.listTable.nativeElement.querySelector('tr');

    if (colHeadersRow === null) {
      return;
    }

    let i;
    for (i = 0; i < colHeadersRow.childNodes.length; i++)
    {
      let colHeader = colHeadersRow.childNodes[i] as HTMLElement;

      if (colHeader.tagName !== 'TH') {
        continue;
      }

      let size = colHeader.getBoundingClientRect().width;

      if (dataRow !== null) {
        let dataCol = dataRow.childNodes[i] as HTMLElement;

        if (dataCol.tagName !== 'TD') {
          continue;
        }

        let dataColSize = dataCol.getBoundingClientRect().width;

        if (dataColSize > size) {
          size = dataColSize;
        }
      }

      this.columnSizes[i] = size;
    }
  }
}
