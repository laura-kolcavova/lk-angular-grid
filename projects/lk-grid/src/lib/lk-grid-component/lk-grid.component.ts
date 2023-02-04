import { Component, Input, OnInit, ElementRef, HostBinding, ViewChild, Renderer2 } from '@angular/core';
import { ColumnDefinition } from '../ColumnDefinition';

@Component({
  selector: 'lk-grid',
  templateUrl: './lk-grid-component.html',
  styleUrls: ['./lk-grid-component.css']
})
export class LkGridComponent implements OnInit {

  @Input() columnDefs: ColumnDefinition[] | undefined;

  @Input() data: any[] | undefined;

  @Input() height: number | undefined;

  @HostBinding("style.height.px") hostHeight: number | undefined;

  @ViewChild('columnHeaders') columnHeaders: ElementRef<HTMLElement> | undefined;

  @ViewChild('columnHeadersTable') columnHeadersTable: ElementRef<HTMLElement> | undefined;
 
  @ViewChild('listContent') listContent : ElementRef<HTMLElement> | undefined;

  @ViewChild('listTable') listTable : ElementRef<HTMLElement> | undefined;
  
  constructor(private renderer: Renderer2) { 
  }

  ngOnInit(): void {
    this.hostHeight = this.height;
  }

  ngAfterViewInit(): void {
    if (this.columnHeaders === undefined || this.listContent === undefined || this.listTable === undefined) {
      return;
    }

    let listContentEl = this.listContent.nativeElement;
    let listTableEl = this.listTable.nativeElement;;

    let scrollbarWidth = listContentEl.getBoundingClientRect().width - listTableEl.getBoundingClientRect().width;

    scrollbarWidth = Math.round(scrollbarWidth);
    
    this.renderer.setStyle(this.columnHeaders.nativeElement, 'padding-right', `${scrollbarWidth}px`);
  }

  public onListTableScroll($event: any) {
    if (this.listTable === undefined || this.columnHeadersTable === undefined) {
      return;
    }

    let el = this.listTable.nativeElement;
    
    let parentRect = (el.parentNode as HTMLElement).getBoundingClientRect();
    let rect = el.getBoundingClientRect();

    let diff = parentRect.left - rect.left

    if (diff > 0)
    {
        this.renderer.setStyle( this.columnHeadersTable.nativeElement, 'transform', `translateX(${-diff}px)`);
    }  
  }
}
