
export interface Entity {
    [key: string]: any;
}

export interface Person extends Entity
{
    id: number;
    firstName: string;
    lastName: string;
    city: string;
    job: string;
    age: number;
    hobby: string;
}