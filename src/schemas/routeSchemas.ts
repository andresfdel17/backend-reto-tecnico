import Joi from 'joi';

// Schema simple para obtener todas las rutas sin paginación
export const getRoutesSchema = Joi.object({}).unknown(true);
