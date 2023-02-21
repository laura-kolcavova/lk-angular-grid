export interface FilterDefinition {
    field: string;
    value?: any;
    operator: 'eq' | 'neq' | 'startswith' | 'endswith' | 'contians' | 'doesnotcontain' | 'isempty' | 'isnotempty';
    caseSensitivy: 'ordinal' | 'ordinalignorecase';
}