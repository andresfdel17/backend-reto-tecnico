import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';

// Tipos para mocks de DB
export interface MockUser {
    id: number;
    name: string;
    email: string;
    password: string;
    rol_id: number;
}

export interface MockSend {
    id: number;
    user_id: number;
    unique_id: string;
    route_id?: number | null;
    driver_id?: number | null;
    reference: string;
    address: string;
    units: number;
    state: number;
    create_datetime: string;
    transit_datetime?: string | null;
    deliver_datetime?: string | null;
    width: number;
    height: number;
    length: number;
}

export interface MockRoute {
    id: number;
    vehicle_id?: number | null;
    code: string;
    desc_route: string;
    vehicle?: string | null; // JSON string del vehículo
}

export interface MockDriver {
    id: number;
    cifnif: string;
    name: string;
}

export interface MockVehicle {
    id: number;
    code: string;
    brand: string;
    capacity: number;
}

// Datos de prueba basados en database.sql
export const mockUsers: MockUser[] = [
    {
        id: 1,
        name: 'admin_user',
        email: 'a@mail.com',
        password: '$2y$10$m1tCyWFHFcrJamIKUS1kLeF621XjPsF.X/vZNUncow2VbRrpA0lDa', // password: admin123
        rol_id: 1,
    },
    {
        id: 2,
        name: 'user',
        email: 'afd@mail.com',
        password: '$2b$12$i0CFnw5IIBWhPaA/CMudfeeeYTecEG5DvB89JXFljd7qrD5qlD8r2', // password: user123
        rol_id: 2,
    },
];

export const mockSends: MockSend[] = [
    {
        id: 1,
        user_id: 2,
        unique_id: '12345678',
        route_id: null,
        driver_id: null,
        reference: 'TEST',
        address: 'Callee busquela con cra encuentrela',
        units: 1,
        state: 1,
        create_datetime: '2025-09-13 19:11:36',
        transit_datetime: null,
        deliver_datetime: null,
        width: 10,
        height: 10,
        length: 10,
    },
    {
        id: 14,
        user_id: 1,
        unique_id: '1757886110943',
        route_id: null,
        driver_id: null,
        reference: 'saldnslad',
        address: 'Cll 30 # 30 - 50 Armenia',
        units: 1,
        state: 1,
        create_datetime: '2025-09-14 16:41:50',
        transit_datetime: null,
        deliver_datetime: null,
        width: 10,
        height: 10,
        length: 10,
    },
];

export const mockDrivers: MockDriver[] = [
    { id: 1, cifnif: '12345678', name: 'Juan cano' },
    { id: 2, cifnif: '123456789', name: 'Jose Pekerman' },
    { id: 3, cifnif: '98765432', name: 'Camilo Vargas' },
];

export const mockVehicles: MockVehicle[] = [
    { id: 1, code: '001', brand: 'Turbo', capacity: 15 },
    { id: 2, code: '002', brand: 'Chevrolet', capacity: 2 },
];

export const mockRoutes: MockRoute[] = [
    {
        id: 1,
        vehicle_id: null,
        code: 'COL001',
        desc_route: 'De sur a norte',
        vehicle: null,
    },
];

// Helper para generar JWT tokens válidos
export const generateValidToken = (userId: number, email: string, rolId: number = 2): string => {
    const payload = {
        id: userId,
        email,
        rol_id: rolId,
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });
};

// Helper para generar tokens inválidos
export const generateInvalidToken = (): string => {
    return 'invalid.jwt.token';
};

// Helper para mock de resultados de DB
export const createMockDbResult = <T>(data: T[], affectedRows: number = 0, insertId: number = 0): [T[], any[]] => {
    const resultSetHeader = {
        fieldCount: 0,
        affectedRows,
        insertId,
        info: '',
        serverStatus: 0,
        warningStatus: 0,
        changedRows: 0,
    };

    return [data, [resultSetHeader]];
};

// Helper para mock de INSERT results
export const createMockInsertResult = (insertId: number, affectedRows: number = 1): [any[], any[]] => {
    const resultSetHeader = {
        fieldCount: 0,
        affectedRows,
        insertId,
        info: '',
        serverStatus: 0,
        warningStatus: 0,
        changedRows: 0,
    };

    return [[resultSetHeader], [resultSetHeader]];
};

// Helper para mock de UPDATE/DELETE results
export const createMockUpdateResult = (affectedRows: number = 1, changedRows: number = 1): [any[], any[]] => {
    const resultSetHeader = {
        fieldCount: 0,
        affectedRows,
        insertId: 0,
        info: '',
        serverStatus: 0,
        warningStatus: 0,
        changedRows,
    };

    return [[resultSetHeader], [resultSetHeader]];
};

// Helper para hashear passwords (para comparaciones en tests)
export const hashPassword = async (password: string): Promise<string> => {
    return bcryptjs.hash(password, 12);
};

// Helper para verificar passwords
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    return bcryptjs.compare(password, hash);
};
