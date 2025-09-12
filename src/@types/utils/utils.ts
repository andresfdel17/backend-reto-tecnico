export interface ISchemaResponse<T = any> {
    isError: boolean;
    error: string | null;
    data: T | null;
}
