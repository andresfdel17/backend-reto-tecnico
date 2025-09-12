import Joi from 'joi';

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

export const recoverPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
});
