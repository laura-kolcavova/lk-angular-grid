export interface ColumnDefinition {
    field: string;
    title?: string;
    type?: 'text' | 'integer' | 'double' | 'datetime' | 'timespan';
    width?: number;
}