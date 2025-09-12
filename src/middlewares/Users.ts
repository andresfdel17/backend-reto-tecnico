import { JWTManager } from '@lib';
//import { ILoginUser } from '@types';
import { Request, Response, NextFunction, RequestHandler } from 'express';

export const getUserData: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    const { headers } = req;
    const [type, token] = headers?.authorization?.split(' ') ?? [];
    if (!type || type !== 'Bearer' || !token) {
        res.json({ code: 401, text: 'Unauthorized' });
        return;
    }
    const data = JWTManager.decodeToken(token ?? '', req?.ip ?? '');
    if (!data) {
        res.json({ code: 401, text: 'Unauthorized' });
        return;
    }
    const { exp, data: user } = data;
    if (!user || (exp ?? 0) < Date.now() / 1000) {
        res.json({ code: 401, text: 'Unauthorized' });
        return;
    }
    //req.actualUser = user;
    next();
};
