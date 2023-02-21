import { FilterDefinition } from './FilterDefinition';
import { SortDefinition } from './SortDefinition';

export interface SortChangeEvent {
    sort: SortDefinition[];
}

export interface SegmentChangeEvent {
    offset: number;
    limit: number;
}

export interface FilterChangeEvent {
    filter: FilterDefinition[];
}