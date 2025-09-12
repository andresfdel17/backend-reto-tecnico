export interface ILoginBody {
    email: string;
    password: string;
}

export type IRecoverPasswordBody = Pick<ILoginBody, 'email'>;

export interface ILoginUser {
    //Tipo de campos de usuario
    [key: string]: any;
    id: number;
    name: string;
    email: string;
    password: string;
    rol_id: number;
    rol_name: Pick<IRol, 'name'>;
}

export interface IRol {
    id: number;
    code: number;
    name: string;
}
