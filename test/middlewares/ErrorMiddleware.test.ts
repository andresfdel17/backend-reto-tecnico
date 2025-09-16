import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../src/middlewares/ErrorMiddleware';

describe('ErrorMiddleware - Unit Tests', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockRequest = {
            method: 'GET',
            url: '/test',
            ip: '127.0.0.1',
            get: jest.fn().mockReturnValue('test-agent'),
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });

    it('debería manejar errores básicos', () => {
        // Arrange
        const error = new Error('Test error');

        // Act
        errorHandler(
            error,
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
            code: 500,
            text: 'server-error',
        });
    });

    it('debería manejar diferentes tipos de errores', () => {
        // Arrange
        const error1 = new Error('Database error');
        const error2 = new Error('Validation error');

        // Act & Assert - Primer error
        errorHandler(
            error1,
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
            code: 500,
            text: 'server-error',
        });

        // Reset mocks
        jest.clearAllMocks();

        // Act & Assert - Segundo error
        errorHandler(
            error2,
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
            code: 500,
            text: 'server-error',
        });
    });

    it('debería funcionar con diferentes propiedades de request', () => {
        // Arrange
        const error = new Error('Test error');
        const customRequest = {
            method: 'POST',
            url: '/api/test',
            ip: '192.168.1.1',
            get: jest.fn().mockReturnValue('Mozilla/5.0'),
        };

        // Act
        errorHandler(
            error,
            customRequest as unknown as Request,
            mockResponse as Response,
            mockNext
        );

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
            code: 500,
            text: 'server-error',
        });
        expect(customRequest.get).toHaveBeenCalledWith('User-Agent');
    });
});
