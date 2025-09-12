import { ISchemaResponse } from '@types';
import Joi from 'joi';

export const validateData = <T = any>(schema: Joi.Schema, data: any): ISchemaResponse<T> => {
    const { error, value } = schema.validate(data);
    return {
        isError: !!error,
        error: error ? error?.message : null,
        data: error ? null : value,
    };
};
