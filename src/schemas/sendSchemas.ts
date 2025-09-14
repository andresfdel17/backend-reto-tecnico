import Joi from 'joi';

export const getSendsFilteredSchema = Joi.object({
    user_id: Joi.number().optional(),
    state: Joi.number().optional(),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
}).unknown(true);

export const createSendSchema = Joi.object({
    reference: Joi.string().required(),
    address: Joi.string().required(),
    width: Joi.number().required(),
    height: Joi.number().required(),
    length: Joi.number().required(),
}).unknown(true);

export const updateSendSchema = Joi.object({
    reference: Joi.string().optional(),
    address: Joi.string().optional(),
    width: Joi.number().positive().optional(),
    height: Joi.number().positive().optional(),
    length: Joi.number().positive().optional(),
    state: Joi.number().integer().min(1).max(4).optional(), // 1-En espera, 2-En tránsito, 3-Entregado, 4-Cancelado/Anulado
    units: Joi.number().integer().positive().optional(),
    route_id: Joi.number().integer().positive().optional(),
    driver_id: Joi.number().integer().positive().optional(),
})
    .min(1)
    .unknown(true); // Al menos un campo debe estar presente
