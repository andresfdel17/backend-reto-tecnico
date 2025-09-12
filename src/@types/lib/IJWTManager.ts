import { JwtPayload } from 'jsonwebtoken';

export interface IPayload<S = any> extends JwtPayload {
    data: S;
    iss: string;
    sub: string;
    aud: string[];
    expiresIn: number;
}
