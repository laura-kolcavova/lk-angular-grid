import { 
  Component, Input, OnInit, ElementRef, HostBinding, ViewChild, 
  Renderer2, Output, EventEmitter, ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { ColumnDefinition } from '../ColumnDefinition';
import { SortChangeEvent, SegmentChangeEvent, FilterChangeEvent } from '../Events';
import { FilterDefinition } from '../FilterDefinition';
import { segment } from '../InMemoryQuery';
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

  @Input() totalItems!: number;

  // Output bindings for grid view
  @Output() sortChange: EventEmitter<SortChangeEvent> = new EventEmitter<SortChangeEvent>();

  @Output() filterChange: EventEmitter<FilterChangeEvent> = new EventEmitter<FilterChangeEvent>();

  @Output() segmentChange: EventEmitter<SegmentChangeEvent> = new EventEmitter<SegmentChangeEvent>();

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
  public columnSizes: (number | null)[] = [];

  public sort: SortDefinition[] = [];

  public filter: FilterDefinition[] = [];

  // Properites for virutal scrolling
  public scrollTop: number = 0; // Scroll top value of list table element - obtained during onScroll event.

  public scrollLeft: number = 0; // Scroll left value of list table element - obtainted during onScroll event.

  public totalContentHeight: number = 0; // Total scrolling height (of all possible items) - important for scrolling bar

  public itemsTolerance = 0; // Count of items above and under viewport window - important for smooth scrolling (cached renderd items)

  public viewportHeight: number = 0; // Height of visible viewport window.

  public visibleItemsCount: number = 0; // Count of items visible in viewport window.

  public startIndex: number = 0; // Index of possible first rendered item - it can have negative value.

  public itemsOffset: number = 0; // Index of first rendered item - equal to count of items skiped in datasource

  public offsetY: number = 0; // Relative top position of buffer window.

  public offsetX: number = 0; // Relaitve left position of list table element.

  public bufferedItemsHeight: number = 0; // Height of buffer window.
 
  public bufferedItemsCount: number = 0; // Count of items to be rendered - computed with itemsTolerance and visibleItemsCount

  public bufferedItems: any[] = []; // Loaded items to be rendered.

  constructor(private renderer: Renderer2, private cdRef: ChangeDetectorRef) { 
  }

  ngOnInit(): void {
    // Set height of host element to specific height from input.
    this.hostHeight = this.height;

    this.initColumnsFilter();
    this.initVirtualScroller();
  }

  ngOnChanges(changes: SimpleChanges): void {
    let dataCurrent = changes['data'].currentValue;
    let dataPrevious = changes['data'].previousValue;
   
    if (dataCurrent && dataPrevious) 
    {
      if (dataCurrent.length === dataPrevious.length)
      {
        // If length of data items are same (for example data were been sorted) 
        // load new data subset into buffer.
        this.bufferedItems = this.getDataSegment();
      }
      else {
        this.runVirtualScroller({target: {scrollTop: 0}}, true);
      }
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

    // Column sizes are computed - the view must be rerendered.
    this.cdRef.detectChanges();
  }

  // Init column filter definitions
  public initColumnsFilter(): void
  {
     for(let i = 0; i < this.columnDefs.length; i++)
     {
       this.filter[i] = {
         field: this.columnDefs[i].field,
         value: undefined,
         operator: 'eq',
         caseSensitivy: 'ordinalignorecase'
       };
     }
  }

  // Init virtual scroll state
  public initVirtualScroller(): void
  {
     this.totalContentHeight = this.itemHeight * this.totalItems;
 
     this.viewportHeight = this.height - 36; //Todo - this is not good solution.
     this.visibleItemsCount = Math.ceil(this.viewportHeight/ this.itemHeight);
 
     this.itemsTolerance = this.visibleItemsCount;
 
     this.runVirtualScroller({target: { scrollTop: 0}}, true);
  }

  // Gets css transform value of column headers element - used in the view template.
  public getColumnHeadersTransformValue(): string
  {
    return `translateX(${this.offsetX}px)`;
  }

  // Gets css transform value of list table element - used in the view template.
  public getListTableTransformValue(): string
  {
    return `translateY(${this.offsetY}px)`;
  }

  // Gets sort definition of specific column.
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

  // Gets filter definition of specific column.
  public getFilterDefOfColumn(columnDef: ColumnDefinition): FilterDefinition | null
  {
    let i;
    for (i = 0; i < this.filter.length; i++) {
      if (columnDef.field === this.filter[i].field) {
        return this.filter[i];
      }
    }

    return null;
  }

  // Gets pairs of column definitions and sort definitions in the same order as an order of columns. 
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
        }
      };
    });
  }

  // Get filter definitions of columns in the same order as an order of columns.
  // Order of columns can be changed by the user in the future.
  // This will ensure correct order of filter definitions.
  public getColumnFilters(): FilterDefinition[]
  {
    let columnFilters: FilterDefinition[] = [];

    for (let i = 0; i < this.columnDefs.length; i++) {
      let filterDef = this.getFilterDefOfColumn(this.columnDefs[i]);
      if (filterDef !== null) {
        columnFilters.push(filterDef);
      }
    }
    return columnFilters;
  }

  // Gets partial data segment from data source.
  public getDataSegment(): any[]
  {
      return segment(this.data, this.itemsOffset, this.bufferedItemsCount);
  }

  // Runs horizontal scroller as a respone to scroll event of list table element.
  public runHorizontalScroller($event: any): void
  {
    // Get relative position of list table element to its parent.
    // Relative position = listTableRect.left - listViewport.left.
    // This is equal to minus value of listViewporttEl.scrollLeft.
    this.offsetX = -$event.target.scrollLeft;
  }

  // Runs virtual scroller as a respone to scroll event of list table element.
  public runVirtualScroller($event: any, isInit: boolean = false): void
  {
    // Data will be rerendered when only when scroller reachs end or start of data subset (in buffer).
    // This condition prevents rerendering of data subset (in buffer) during each scroll event.
    if (!(
      isInit === true || 
      $event.target.scrollTop + this.viewportHeight >= this.offsetY + this.bufferedItemsHeight || 
      $event.target.scrollTop <= this.offsetY))
    {
          // $event.target.scrollTop > (this.startIndex + 2 * this.itemsTolerance) * this.itemHeight || -- 
          // $event.target.scrollTop >= (this.itemsOffset + this.bufferedItemsCount - this.visibleItemsCount) * this.itemHeight
          // $event.target.scrollTop <= this.startIndex * this.itemHeight))
      return;
    } 
    
    this.startIndex = Math.floor($event.target.scrollTop / this.itemHeight) - this.itemsTolerance;

    // If rerendering of data subset (in buffer) during each scroll event is prevented,
    // the start index must be always added or substracted by value of items tolerance

    // TODO: this is not working

    // if (this.startIndex < this.itemsOffset)
    // {
    //   this.startIndex = this.itemsOffset - this.itemsTolerance;
    // }
    // else if (this.startIndex > this.itemsOffset)
    // {
    //   this.startIndex = this.itemsOffset + this.itemsTolerance;
    // }

    this.itemsOffset = Math.max(0, this.startIndex);

    this.bufferedItemsCount = this.visibleItemsCount + 2 * this.itemsTolerance;
    this.bufferedItemsCount = Math.min(this.startIndex + this.bufferedItemsCount, this.bufferedItemsCount)
    this.bufferedItemsCount = Math.min(this.totalItems - this.startIndex, this.bufferedItemsCount);

    this.offsetY = this.itemsOffset * this.itemHeight;
    this.bufferedItemsHeight = this.bufferedItemsCount * this.itemHeight;

    if (isInit === false)
    {
      this.segmentChange.emit({
        offset: this.itemsOffset,
        limit: this.bufferedItemsCount
      });
    }

    this.bufferedItems = this.getDataSegment();
  }

  // Updated Performs sort logic of specific column.
  public updateSortDefOfColumn(columnDef: ColumnDefinition): void
  {
    let newSort: SortDefinition[] = [];

    let newSortDef: SortDefinition = {
      field: columnDef.field,
      dir: 'asc',
    };

    let addNew: boolean = true;

    let i;
    for (i = 0; i < this.sort.length; i++)
    {
      let sortDef = this.sort[i];

      if (sortDef.field === newSortDef.field)
      {
        // If sort definition with same field name already exists in the sort array update its sort direction
        // by adding new sort definition into the new sort array
        // or delete sort definition by not adding the new sort definition into the array.
        switch(sortDef.dir) 
        {
          case 'asc': newSortDef.dir = 'desc'; break;
          case 'desc': newSortDef.dir = undefined; break;
        }

        if (newSortDef.dir !== undefined)
        {
          newSort.push(newSortDef);
        }
       
        addNew = false;;
      }
      else
      {
        // Add existing sort definition into the new sort array.
        newSort.push(sortDef);
      }
    }

    if (addNew === true) {
      newSort.push(newSortDef);
    }

    this.sort = newSort;
  }

  // Apply sort by emitting of sortChange event.
  public applySort(): void {
    this.sortChange.emit({
      sort: this.sort.map(s => Object.assign({}, s)),
    });
  }

  // Apply filter by emitting of filterChange event.
  public applyFilter(): void
  {
    let outputFilter: FilterDefinition[] = [];

    for (let i = 0; i < this.filter.length; i++)
    {
      if (this.filter[i].value === undefined)
      {
        continue;
      }

      // Gets string value - this works only for text filter
      let strValue: string = this.filter[i].value.toString();
      
      if (strValue.trim().length === 0)
      {
        continue;
      }
      
      outputFilter.push({ ...this.filter[i] });
    }

    this.filterChange.emit({
      filter:  outputFilter
    });
  }

  // In case of event when user scrolls horizontaly or verticaly.
  public onListTableScroll($event: any): void {
    this.runHorizontalScroller($event);
    this.runVirtualScroller($event);

    this.scrollTop = $event.target.scrollTop;
    this.scrollLeft = $event.target.scrollLeft;
  }

  // In case of event when user clicks on column header
  public onColumnHeaderClick($event: any, columnDef: ColumnDefinition): void {
    this.updateSortDefOfColumn(columnDef);
    this.applySort();
  }

  // After view template is rendered shifts column headers element to the left by width of scroll bar
  // This prevents expand colum headers element behind scroll bar.
  private shiftColumnHeadersByVerticalScrollbar(): void
  {
    // List table wrapper must be parent of list table to get width of scrollbar
    // when the list table is larger than list content.
    let listViewportEl = this.elListViewport.nativeElement;
    let listTableWrapperEl = this.elListTableWrapper.nativeElement;;

    let diff =  listViewportEl.getBoundingClientRect().width - 
    listTableWrapperEl.getBoundingClientRect().width;

    let scrollbarWidth = Math.round(diff);

    this.renderer.setStyle(this.elColumnHeaders.nativeElement, 'padding-right', `${scrollbarWidth}px`);
  }

  // After view template is rendered compute new sizes of columns 
  // based on defined width of specific column or use automatic rendered width.
  private computeColumnSizes(): (number | null)[]
  {
    let columnSizes: (number | null)[] = [];
    let colHeadersRow: HTMLTableRowElement | null = null;
    let dataRow: HTMLTableRowElement | null = null;

    for (let i = 0; i < this.columnDefs.length; i++)
    {
      let columnDef = this.columnDefs[i];

      if (columnDef.width !== undefined)
      {
        columnSizes[i] = columnDef.width;
        continue;
      }

      // If width of columnDef is not defined the width size will be set to rendered width of column header or data cell (the wider one).
      // For this solution at this time the table element must not have css property 'table-layout' set to 'fixed'.
      // The 'fixed' value must be set to table after the computation is complete.
      colHeadersRow = colHeadersRow ??= this.elColumnHeadersTable.nativeElement.querySelector('tr');
      dataRow = dataRow ??= this.elListTable.nativeElement.querySelector('tr')

      if (colHeadersRow == null) {
        columnSizes[i] = null;
        continue;
      }

      let colHeader = colHeadersRow.querySelectorAll('th')[i];
      let colHeaderSize: number = colHeader.getBoundingClientRect().width;

      if (dataRow == null) {
        columnSizes[i] = colHeaderSize;
        continue;
      }

      let dataCell = dataRow.querySelectorAll('td')[i];
      let dataCellSize: number = dataCell.getBoundingClientRect().width;

      columnSizes[i] = colHeaderSize >= dataCellSize ? colHeaderSize : dataCellSize;
    }

    return columnSizes;
  }
}
