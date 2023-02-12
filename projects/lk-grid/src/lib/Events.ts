import { SortDefinition } from './SortDefinition';

export interface SortChangeEvent {
    sort: SortDefinition[]
}

export interface SegmentChangeEvent {
    offset: number,
    limit: number,
}