export type ISendCreatebody = {
    reference: string;
    address: string;
    width: number;
    height: number;
    length: number;
};

export type ISendUpdateBody = {
    reference?: string;
    address?: string;
    width?: number;
    height?: number;
    length?: number;
    state?: number;
    units?: number;
    route_id?: number;
    driver_id?: number;
};

export type ISendGetFilteredbody = {
    user_id?: number;
    state?: number;
    page?: number;
    limit?: number;
};
