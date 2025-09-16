import Joi from 'joi';

// Schema para crear un nuevo conductor
export const createDriverSchema = Joi.object({
    cifnif: Joi.string()
        .required()
        .min(8)
        .max(20)
        .pattern(/^[0-9A-Za-z]+$/)
        .messages({
            'string.base': 'El CIFNIF debe ser una cadena de texto',
            'string.empty': 'El CIFNIF es obligatorio',
            'string.min': 'El CIFNIF debe tener al menos 8 caracteres',
            'string.max': 'El CIFNIF no puede tener más de 20 caracteres',
            'string.pattern.base': 'El CIFNIF solo puede contener letras y números',
            'any.required': 'El CIFNIF es obligatorio',
        }),
    name: Joi.string().required().min(2).max(255).trim().messages({
        'string.base': 'El nombre debe ser una cadena de texto',
        'string.empty': 'El nombre es obligatorio',
        'string.min': 'El nombre debe tener al menos 2 caracteres',
        'string.max': 'El nombre no puede tener más de 255 caracteres',
        'any.required': 'El nombre es obligatorio',
    }),
});

// Schema para obtener todos los conductores (sin parámetros específicos)
export const getDriversSchema = Joi.object({}).unknown(true);

// Schema para obtener un conductor por ID
export const getDriverByIdSchema = Joi.object({
    id: Joi.number().integer().positive().required().messages({
        'number.base': 'El ID debe ser un número',
        'number.integer': 'El ID debe ser un número entero',
        'number.positive': 'El ID debe ser un número positivo',
        'any.required': 'El ID es obligatorio',
    }),
});
