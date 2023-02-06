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

  @Input() itemHeight!: number;

  @Input() itemTolerance!: number;

  @HostBinding("style.height.px") hostHeight!: number;

  @ViewChild('columnHeaders') columnHeaders!: ElementRef<HTMLElement>;

  @ViewChild('columnHeadersTable') columnHeadersTable!: ElementRef<HTMLElement>;
 
  @ViewChild('listContent') listContent! : ElementRef<HTMLElement>;

  // List table wrapper must be parent of list table to get width of scrollbar
  // when the list table is larger than list content
  @ViewChild('listTableWrapper') listTableWrapper!: ElementRef<HTMLElement>;

  @ViewChild('listTable') listTable! : ElementRef<HTMLElement>;

  public columnSizes: number[] = [];

  public listContentTotalHeight: number = 0;

  public scrollLeft: number = 0;

  public scrollTop: number = 0;

  public virtualData: any[] = [];

  public startIndex: number = 0;

  public visibleItemsCount: number = 0;

  constructor(private renderer: Renderer2) { 
    
  }

  ngOnInit(): void {
    this.hostHeight = this.height;
    this.virtualScroll();
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
    this.scrollLeft = this.listContent.nativeElement.scrollLeft
    this.scrollTop = this.listContent.nativeElement.scrollTop;

    this.virtualScroll();
  }

  public getColumnHeadersTransformValue(): string
  {
    // Get relative position of list table element to its parent
    // Relative position = listTableRect.left - listContent.left
    // This is equal to minus value of listContentEl.scrollLeft
    let relativePos = -this.scrollLeft;

    return `translateX(${relativePos}px)`;
  }

  public getListTableTransformValue(): string
  {
    let offsetY = this.startIndex * this.itemHeight;

    return `translateY(${offsetY}px)`;
  }

  private shiftColumnHeadersByVerticalScrollbar(): void
  {
    // List table wrapper must be parent of list table to get width of scrollbar
    // when the list table is larger than list content
    let listContentEl = this.listContent.nativeElement;
    let listTableWrapperEl = this.listTableWrapper.nativeElement;;

    let diff =  listContentEl.getBoundingClientRect().width - 
    listTableWrapperEl.getBoundingClientRect().width;

    let scrollbarWidth = Math.round(diff);

    this.renderer.setStyle(this.columnHeaders.nativeElement, 'padding-right', `${scrollbarWidth}px`);
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
  
  private virtualScroll(): void
  {
    this.listContentTotalHeight = this.itemHeight * this.data.length;

    this.startIndex = Math.floor(this.scrollTop / this.itemHeight) - this.itemTolerance;
    this.startIndex = Math.max(0, this.startIndex);

    this.visibleItemsCount = Math.ceil(this.height / this.itemHeight) + 2 * this.itemTolerance;
    this.visibleItemsCount = Math.min(this.data.length - this.startIndex, this.visibleItemsCount);

    this.virtualData = this.getDataSubset(this.startIndex, this.visibleItemsCount);
  }

  public getDataSubset(offset: number, limit: number): any[]
  {
    // let items: any[] = [];

    // let start: number = Math.max(0, offset);
    // let end: number = Math.min(offset + limit - 1, this.data.length);

    // if (start <= end)
    // {
    //   for (let i = start; i <= end; i++)
    //   {
    //     items.push(this.data[i]);
    //   }
    // }

    let items: any[] = this.data.slice(offset, offset + limit);

    return items;
  }
}
