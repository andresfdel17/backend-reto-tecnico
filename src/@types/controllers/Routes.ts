import { IRoute, IVehicle, IDriver, IRouteWithVehicle, IApiResponse } from '../general';

// Re-exportar las interfaces generales para compatibilidad
export type { IRoute, IVehicle, IDriver, IRouteWithVehicle };

// Respuestas específicas del controlador de rutas
export type IGetRoutesResponse = IApiResponse<IRouteWithVehicle[]>;
export type IGetDriversResponse = IApiResponse<IDriver[]>;
