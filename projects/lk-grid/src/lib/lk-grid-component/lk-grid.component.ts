import { Component, Input, OnInit, ElementRef, HostBinding, ViewChild, Renderer2 } from '@angular/core';
import { ColumnDefinition } from '../ColumnDefinition';

@Component({
  selector: 'lk-grid',
  templateUrl: './lk-grid-component.html',
  styleUrls: ['./lk-grid-component.css']
})
export class LkGridComponent implements OnInit {

  // Input properties for grid view
  @Input() columnDefs!: ColumnDefinition[];

  @Input() data!: any[];

  // Input properties for virutal scrolling
  @Input() height!: number;

  @Input() itemHeight!: number;

  // DOM bindings
  @HostBinding("style.height.px") hostHeight!: number;

  @ViewChild('columnHeaders') columnHeaders!: ElementRef<HTMLElement>;

  @ViewChild('columnHeadersTable') columnHeadersTable!: ElementRef<HTMLElement>;
 
  @ViewChild('listViewport') listViewport! : ElementRef<HTMLElement>;

  // List table wrapper must be parent of list table to get width of scrollbar
  // when the list table is larger than list content
  @ViewChild('listTableWrapper') listTableWrapper!: ElementRef<HTMLElement>;

  @ViewChild('listTable') listTable! : ElementRef<HTMLElement>;

  // Properties for grid view
  public columnSizes: number[] = [];

  // Properites for virutal scrolling
  public totalContentHeight: number = 0;

  public viewportHeight: number = 0;

  public offsetY: number = 0;

  public offsetX: number = 0;

  public itemsOffset: number = 0;

  public startIndex: number = 0;

  public itemsTolerance = 0;

  public visibleItemsCount: number = 0;

  public bufferedItemsCount: number = 0;

  public bufferedItems: any[] = [];

  constructor(private renderer: Renderer2) { 
    
  }

  ngOnInit(): void {
    this.hostHeight = this.height;

    // Init virutal scroll state
    this.totalContentHeight = this.itemHeight * this.data.length;

    this.viewportHeight = this.height - 36;
    this.visibleItemsCount = Math.ceil(this.viewportHeight/ this.itemHeight);

    this.itemsTolerance = this.visibleItemsCount;

    this.runVirtualScroller({target: { scrollTop: 0}});
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
    // Get relative position of list table element to its parent
    // Relative position = listTableRect.left - listViewport.left
    // This is equal to minus value of listViewporttEl.scrollLeft
    this.offsetX = -$event.target.scrollLeft;

    this.runVirtualScroller($event);
  }

  public getColumnHeadersTransformValue(): string
  {
    return `translateX(${this.offsetX}px)`;
  }

  public getListTableTransformValue(): string
  {
    return `translateY(${this.offsetY}px)`;
  }

  private shiftColumnHeadersByVerticalScrollbar(): void
  {
    // List table wrapper must be parent of list table to get width of scrollbar
    // when the list table is larger than list content
    let listViewportEl = this.listViewport.nativeElement;
    let listTableWrapperEl = this.listTableWrapper.nativeElement;;

    let diff =  listViewportEl.getBoundingClientRect().width - 
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
  
  private runVirtualScroller($event: any): void
  {
    if (!(
      $event.target.scrollTop === 0 || 
      $event.target.scrollTop > (this.startIndex + 2 * this.itemsTolerance) * this.itemHeight || 
      $event.target.scrollTop <= this.startIndex * this.itemHeight))
    {
      return;
    } 
    
    this.startIndex = Math.floor($event.target.scrollTop / this.itemHeight) - this.itemsTolerance;
    this.itemsOffset = Math.max(0, this.startIndex);

    this.bufferedItemsCount = this.visibleItemsCount + 2 * this.itemsTolerance;
    this.bufferedItemsCount = Math.min(this.startIndex + this.bufferedItemsCount, this.bufferedItemsCount)
    this.bufferedItemsCount = Math.min(this.data.length - this.startIndex, this.bufferedItemsCount);

    this.offsetY = this.itemsOffset * this.itemHeight;

    this.bufferedItems = this.getDataSubset(this.itemsOffset, this.bufferedItemsCount);

    console.log(this.itemsOffset, this.bufferedItemsCount);
  }

  private getDataSubset(offset: number, limit: number): any[]
  {
    // let items: any[] = [];

    // let start: number = Math.max(0, offset);
    // let end: number = Math.min(offset + limit - 1, this.data.length - 1);

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
