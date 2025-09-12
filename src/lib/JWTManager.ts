import { IPayload } from '@types';
import { APP_URL } from '@util';
import jwt from 'jsonwebtoken';

export class JWTManager {
    /**
     * @remarks Metodo que crea un token con la data que se le pase y codifica con elementos de seguridad
     * @param data Cualquier data de tipo JSON
     * @param secret CLave secreta
     * @param ip Ip del frontend
     * @returns Token codificado o false si hay un error
     */
    static createToken<T = any>(data: T, secret: string, ip: string): string | boolean {
        try {
            if (!data) {
                throw new Error('');
            }
            return jwt.sign(
                {
                    data,
                    iss: APP_URL,
                    sub: 'Login',
                    aud: [ip],
                },
                secret,
                {
                    algorithm: 'HS256',
                    expiresIn: 60 * 60 * 12, //
                },
            );
        } catch (error) {
            console.log({ errorJWTClass: error });
            return false;
        }
    }
    /**
     * @remarks Metodo que decodifica un token y verifica si la ip es la misma que la que se le paso
     * @param token Token codificado
     * @param ip Ip del frontend que envio la peticion
     * @returns La info decodificada o false si hay un error
     */
    static decodeToken<T = any>(token: string, ip: string): IPayload<T> | false {
        try {
            const data = jwt.decode(token) as IPayload<T>;
            if (!data?.aud?.includes(ip)) {
                return false;
            }
            return data;
        } catch (error) {
            console.log({ errorJWTDecodeClass: error });
            return false;
        }
    }
}
