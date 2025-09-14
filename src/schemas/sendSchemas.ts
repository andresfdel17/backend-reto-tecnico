import Joi from 'joi';

export const getSendsFilteredSchema = Joi.object({
    user_id: Joi.number().optional(),
    state: Joi.number().optional(),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
}).unknown(true);

export const createSendSchema = Joi.object({}).unknown(true);
