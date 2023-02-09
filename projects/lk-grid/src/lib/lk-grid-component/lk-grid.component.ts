import { 
  Component, Input, OnInit, ElementRef, HostBinding, ViewChild, 
  Renderer2, Output, EventEmitter, ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { ColumnDefinition } from '../ColumnDefinition';
import { SortDefinition } from '../SortDefinition';

@Component({
  selector: 'lk-grid',
  templateUrl: './lk-grid-component.html',
  styleUrls: ['./lk-grid-component.css']
})
export class LkGridComponent implements OnInit {

  // Input bindings for grid view
  @Input() columnDefs!: ColumnDefinition[];

  @Input() data!: any[];

  // Input bindings for virutal scrolling
  @Input() height!: number;

  @Input() itemHeight!: number;

  // Output bindings for grid view
  @Output() sortChange: EventEmitter<SortDefinition[]> = new EventEmitter<SortDefinition[]>();

  // DOM bindings
  @HostBinding("style.height.px") hostHeight!: number;

  @ViewChild('columnHeaders') elColumnHeaders!: ElementRef<HTMLElement>;

  @ViewChild('columnHeadersTable') elColumnHeadersTable!: ElementRef<HTMLElement>;
 
  @ViewChild('listViewport') elListViewport! : ElementRef<HTMLElement>;

  // List table wrapper must be parent of list table to get width of scrollbar
  // when the list table is larger than list content
  @ViewChild('listTableWrapper') elListTableWrapper!: ElementRef<HTMLElement>;

  @ViewChild('listTable') elListTable! : ElementRef<HTMLElement>;

  // Properties for grid view
  public columnSizes: number[] = [];

  public sort: SortDefinition[] = [];

  // Properites for virutal scrolling
  public totalContentHeight: number = 0;

  public viewportHeight: number = 0;

  public offsetY: number = 0;

  public offsetX: number = 0;

  public scrollTop: number = 0;

  public scrollLeft: number = 0;

  public itemsOffset: number = 0;

  public startIndex: number = 0;

  public itemsTolerance = 0;

  public visibleItemsCount: number = 0;

  public bufferedItemsCount: number = 0;

  public bufferedItems: any[] = [];

  constructor(private renderer: Renderer2, private cdRef: ChangeDetectorRef) { 
    
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

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
    let dataCurrent = changes['data'].currentValue;
    let dataPrevious = changes['data'].previousValue;

    // If length of data items are same (for example data were been sorted) 
    // load new data subset into buffer.
    if (dataCurrent && dataPrevious && dataCurrent.length === dataPrevious.length)
    {
      this.bufferedItems = this.getDataSubset(this.itemsOffset, this.bufferedItemsCount);
    }
  }

  ngAfterViewChecked(): void {
    this.shiftColumnHeadersByVerticalScrollbar();
    this.columnSizes = this.computeColumnSizes();

    // Before the column sizes are computed the column headers table and list table must not have set css property 'table-layout' to 'fixed'.
    // After column sizes are computed they are used to set width of table columns
    // but the tables must have set css property 'table-layout' to 'fixed', otherwise the width of the columns will not work properly.
    this.renderer.addClass(this.elColumnHeadersTable.nativeElement, 'lk-datagrid-table-fixed');
    this.renderer.addClass(this.elListTable.nativeElement, 'lk-datagrid-table-fixed');

    this.cdRef.detectChanges();
  }

  public onListTableScroll($event: any): void {
    this.runHorizontalScroller($event);
    this.runVirtualScroller($event);

    this.scrollTop = $event.target.scrollTop;
    this.scrollLeft = $event.target.scrollLeft;
  }

  public onColumnHeaderClick($event: any, columnDef: ColumnDefinition): void {
    let newSort: SortDefinition[] = [];

    let newSortDef: SortDefinition = {
      field: columnDef.field,
      dir: 'asc',
    };

    let updatedOrDeleted: boolean = false;

    let i;
    for (i = 0; i < this.sort.length; i++)
    {
      let sortDef = this.sort[i];

      if (sortDef.field === newSortDef.field)
      {
        // If sort definition with same field name already exists in the sort array update its sort direction
        // By adding new sort definition into the new sort array
        // Or delete sort definition by not adding the new sort definition into the array
        switch(sortDef.dir) 
        {
          case 'asc': newSortDef.dir = 'desc'; break;
          case 'desc': newSortDef.dir = undefined; break;
        }

        if (newSortDef.dir !== undefined)
        {
          newSort.push(newSortDef);
        }
       
        updatedOrDeleted = true;;
      }
      else
      {
        // Add existing sort definition into the new sort array
        newSort.push(sortDef);
      }
    }

    if (updatedOrDeleted === false) {
      newSort.push(newSortDef);
    }

    this.sort = newSort;

    this.sortChange.emit(newSort.map(s => Object.assign({}, s)));
  }

  public getSortDefOfColumn(columnDef: ColumnDefinition): SortDefinition | null
  {
    let i;
    for (i = 0; i < this.sort.length; i++)
    {
      let sortDef = this.sort[i];

      if (sortDef.field === columnDef.field)
      {
        return sortDef
      }
    }

    return null;
  }

  public getColumnHeaders(): {
    columnDef: ColumnDefinition,
    sortDef: SortDefinition
  }[]
  {
    let self = this;

    return this.columnDefs.map(c => {
      return {
        columnDef: c,
        sortDef: self.getSortDefOfColumn(c) || {
          field: c.field,
          dir: undefined
        },
      };
    });
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
    let listViewportEl = this.elListViewport.nativeElement;
    let listTableWrapperEl = this.elListTableWrapper.nativeElement;;

    let diff =  listViewportEl.getBoundingClientRect().width - 
    listTableWrapperEl.getBoundingClientRect().width;

    let scrollbarWidth = Math.round(diff);

    this.renderer.setStyle(this.elColumnHeaders.nativeElement, 'padding-right', `${scrollbarWidth}px`);
  }

  private computeColumnSizes(): number[]
  {
    let columnSizes: number[] = [];
    let colHeadersRow = this.elColumnHeadersTable.nativeElement.querySelector('tr');
    let dataRow = this.elListTable.nativeElement.querySelector('tr');

    if (colHeadersRow === null) {
      return [];
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

      columnSizes[i] = size;
    }

    return columnSizes;
  }

  private runHorizontalScroller($event: any): void
  {
    // Get relative position of list table element to its parent
    // Relative position = listTableRect.left - listViewport.left
    // This is equal to minus value of listViewporttEl.scrollLeft
    this.offsetX = -$event.target.scrollLeft;
  }
  
  private runVirtualScroller($event: any): void
  {
    // Data will be rerendered when only when scroller reachs end or start of data subset (in buffer)
    // This condition prevents rerendering of data subset (in buffer) during each scroll event
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
