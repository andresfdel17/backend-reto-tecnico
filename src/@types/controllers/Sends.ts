import { ISend, IApiResponse, IApiResponseWithPagination } from '../general';

// Re-exportar interfaces generales para compatibilidad
export type { ISend };

// Interfaces específicas para el controlador de Sends
export interface ISendCreateBody {
    reference: string;
    address: string;
    width: number;
    height: number;
    length: number;
    units?: number;
    route_id?: number;
    driver_id?: number;
}

export interface ISendUpdateBody {
    reference?: string;
    address?: string;
    width?: number;
    height?: number;
    length?: number;
    state?: number;
    units?: number;
    route_id?: number;
    driver_id?: number;
}

export interface ISendGetFilteredBody {
    user_id?: number;
    state?: number;
    page?: number;
    limit?: number;
}

// Respuestas específicas del controlador de Sends
export type ISendCreateResponse = IApiResponse<ISend>;
export type ISendUpdateResponse = IApiResponse<ISend>;
export type ISendGetFilteredResponse = IApiResponseWithPagination<ISend[]>;
