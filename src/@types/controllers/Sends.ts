export type ISendCreatebody = {
    user_id: number;
};

export type ISendGetFilteredbody = {
    user_id?: number;
    state?: number;
    page?: number;
    limit?: number;
};
