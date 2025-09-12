import { Router, Request, Response } from 'express';
import { authRateLimit } from '@middlewares';
export const Login = Router();
//-- Importar tablas de conexion de bd
import { db } from '@database';
import { JWT_SECRET, validateData } from '@util';
import { loginSchema } from '@schemas';
import { ILoginBody, ILoginUser } from '@types';
import { JWTManager, PasswordManager } from '@lib';
import { RowDataPacket } from 'mysql2';

Login.get('/', (_req: Request, res: Response) => {
    res.json({
        code: 200,
        message: 'Login controller Ready!',
    });
    return;
});

Login.post('/login', authRateLimit, async (req: Request, res: Response) => {
    // Validar el body
    const { isError, error, data } = validateData<ILoginBody>(loginSchema, req.body);
    if (isError || !data) {
        res.json({
            code: 400,
            text: error,
        });
        return;
    }
    const { email, password } = data;
    const [rows] = await db.execute<RowDataPacket[]>('SELECT * FROM main_users WHERE email = ?', [email]);
    const user: ILoginUser | null = (rows?.[0] as ILoginUser) ?? null;
    if (!user) {
        res.json({
            code: 401,
            text: 'user-pass-unk',
        });
        return;
    }
    const [validatePassword] = await Promise.all([PasswordManager.comparePassword(password, user?.password ?? '')]);
    if (!validatePassword) {
        res.json({
            code: 400,
            text: 'user-pass-unk',
        });
        return;
    }
    console.log(user);
    const userJson = user?.toJSON();

    const token = JWTManager.createToken<ILoginUser>({ ...userJson }, JWT_SECRET, req?.ip ?? '');
    res.json({
        code: 200,
        token,
        text: 'Sesión iniciada',
    });
    return;
});
