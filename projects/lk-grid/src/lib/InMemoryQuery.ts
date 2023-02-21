import { SortDefinition } from "./SortDefinition";
import { FilterDefinition } from "./FilterDefinition";

const compareValues = function(a: any, b: any): number
{
    if (a > b) {
        return 1;
    }

    if (a < b) {
        return -1
    }

    return 0;
}

const getCompareObjectsByFieldFn = function(sortDef: SortDefinition):
    (a: any, b: any) => number
{
    if (sortDef.dir === 'asc') {
        return (a: any, b: any) => compareValues(
            a[sortDef.field], 
            b[sortDef.field]);
    }

    if (sortDef.dir === 'desc')
    {
        return (a: any, b: any) => compareValues(
            b[sortDef.field], 
            a[sortDef.field]);
    }

    return (a: any, b: any) => 0;
}
  
const projectionOfObject = function(obj: any, keys: string[]) : any
{
    if (!(typeof(obj) === 'object' && obj !== null)) {
        return obj;
    }

    let projcetedObj: {[key: string] : any} = {};

    let i;
    for (i = 0; i < keys.length; i++)
    {
        let key: string = keys[i];
        projcetedObj[key] = obj[key];
    }

    return projcetedObj;
}

export const select = function<T>(data: T[], fields: string[] = []): any[]
{
    let result: any[] = data.map(o => projectionOfObject(o, fields));
    return result;
}

export const orderBy = function<T>(data: T[], sort: SortDefinition[]): T[]
{
    let result: T[] = data.slice(0);

    let i;
    for (i = 0; i < sort.length; i++)
    {
        result.sort(getCompareObjectsByFieldFn(sort[i]));
    }

    return result;
}

export const filterBy = function<T>(data: T[], filter: FilterDefinition[]): T[]
{
    let result: T[] = [];

    for (let i = 0; i < data.length; i++)
    {
        let item = data[i];
        let addItem: boolean = true;

        for (let j = 0; j < filter.length; j++)
        {
            let filterDef = filter[j];
            let itemValue: any = item[filterDef.field as keyof typeof item];
            let fulfill: boolean = false;

            if (typeof(itemValue) === 'string')
            {
                if (filterDef.operator === 'eq')
                {
                    if (filterDef.caseSensitivy === 'ordinal')
                    {
                        if (itemValue === filterDef.value)
                        {
                            fulfill = true;
                        }
                    }
                    else if (filterDef.caseSensitivy === 'ordinalignorecase')
                    {
                        if (itemValue.toLowerCase() === filterDef.value.toLowerCase())
                        {
                            fulfill = true;
                        }
                    }
                    else 
                    {
                        fulfill = true;
                    }
                }
            }
            
            if (fulfill === false)
            {
                addItem = false;
            }
        }

        if (addItem === true)
        {
            result.push(item);
        }
    }

    return result;
}

export const offset = function<T>(data: T[], offset: number): T[]
{
    let result: T[] = data.slice(offset);
    return result;
}

export const limit = function<T>(data: T[], limit: number): T[]
{
    let result: T[] = data.slice(0, limit);
    return result;
}

export const segment = function<T>(data: T[], offset: number, limit: number): T[]
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

    let result: T[] = data.slice(offset, offset + limit);
    return result;
}

export interface InMemoryQuery<T>
{
    from: T[];
    select?: string[];
    orderBy?: SortDefinition[];
    filterBy?: FilterDefinition[];
    offset?: number;
    limit?: number;
}

export interface DataResult
{
    data: any[],
    total: number,
}

export const executeQuery = function<T>(query: InMemoryQuery<T>): DataResult
{
    let data: T[] = query.from.slice(0);

    if (query.filterBy !== undefined) {
        data = filterBy(data, query.filterBy);
    }
    
    if (query.select !== undefined)
    {
        data = select(data, query.select);
    }

    if (query.orderBy !== undefined)
    {
        data = orderBy(data, query.orderBy);
    }

    if (query.offset !== undefined && query.limit !== undefined)
    {
        data = segment(data, query.offset, query.limit);
    }
    else if (query.offset !== undefined)
    {
        data = offset(data, query.offset);
    }
    else if (query.limit !== undefined)
    {
        data = limit(data, query.limit);
    }

    return {
        data: data,
        total: data.length
    };
}