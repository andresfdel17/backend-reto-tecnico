import { Router, Request, Response } from 'express';
import { authRateLimit } from '@middlewares';
export const Login = Router();
//-- Importar tablas de conexion de bd
import { db } from '@database';
import { JWT_SECRET, validateData } from '@util';
import { loginSchema, registerSchema } from '@schemas';
import { ILoginBody, ILoginUser, IRegisterBody } from '@types';
import { JWTManager, PasswordManager } from '@lib';
import { RowDataPacket } from 'mysql2';
import { socketManager } from '../app';

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
    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT mu.*, mr.name as rol_name FROM main_users mu JOIN main_roles mr ON mu.rol_id = mr.id WHERE mu.email = ?`,
        [email],
    );
    const user: ILoginUser | null = (rows?.[0] as ILoginUser) ?? null;
    if (!user) {
        res.json({
            code: 401,
            text: 'user-pass-unk',
        });
        return;
    }
    const validatePassword = await PasswordManager.comparePassword(password, user?.password ?? '');
    if (!validatePassword) {
        res.json({
            code: 400,
            text: 'user-pass-unk',
        });
        return;
    }
    const token = JWTManager.createToken<ILoginUser>(user, JWT_SECRET, req?.ip ?? '');

    res.json({
        code: 200,
        token,
        text: 'session-started',
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
    });
    return;
});

Login.post('/register', authRateLimit, async (req: Request, res: Response) => {
    const { isError, error, data } = validateData<IRegisterBody>(registerSchema, req.body);
    if (isError || !data) {
        res.json({
            code: 400,
            text: error,
        });
        return;
    }
    const { email, name, password } = data;

    const [rows] = await db.execute<RowDataPacket[]>(`SELECT 1 as user_exists FROM main_users WHERE email = ?;`, [
        email,
    ]);
    const userExists = rows?.[0]?.user_exists ?? false;
    if (userExists) {
        res.json({
            code: 400,
            text: 'user-exists',
        });
        return;
    }

    const passwordHash = await PasswordManager.hashPassword(password);
    await db.execute<RowDataPacket[]>(`INSERT INTO main_users (name,email, password, rol_id) VALUES (?,?, ?, ?);`, [
        name,
        email,
        passwordHash,
        2,
    ]);
    // 🔌 Emitir evento de nuevo usuario registrado
    socketManager.emitToAll('user-registered', {
        message: 'new-user-registered',
        userEmail: email,
        userName: name,
        timestamp: new Date().toISOString(),
    });

    res.json({
        code: 201,
        text: 'user-created',
    });
    return;
});
