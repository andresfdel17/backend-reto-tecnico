import { Request, Response, Router } from 'express';
import { socketManager } from '../app';

export const Notifications = Router();

// Endpoint para enviar notificación a todos los usuarios
Notifications.post('/broadcast', (req: Request, res: Response) => {
    const { message, type = 'info' } = req.body;

    if (!message) {
        res.json({
            code: 400,
            text: 'message-required',
        });
        return;
    }

    // 🔌 Emitir notificación a todos los clientes conectados
    socketManager.emitToAll('notification', {
        message: message,
        type: type, // info, success, warning, error
        timestamp: new Date().toISOString(),
        from: 'system',
    });

    res.json({
        code: 200,
        text: 'notification-sent',
        data: { message, type },
    });
});

// Endpoint para enviar mensaje privado a un usuario específico por email
Notifications.post('/private', (req: Request, res: Response) => {
    const { email, message, type = 'info' } = req.body;

    if (!email || !message) {
        res.json({
            code: 400,
            text: 'email-and-message-required',
        });
        return;
    }

    // 🔌 Emitir mensaje privado a un usuario específico por email
    const messageSent = socketManager.emitToUser(email, 'private-notification', {
        message: message,
        type: type,
        timestamp: new Date().toISOString(),
        from: 'system',
    });

    if (messageSent) {
        res.json({
            code: 200,
            text: 'private-message-sent',
            data: { email, message, delivered: true },
        });
    } else {
        res.json({
            code: 200,
            text: 'user-not-connected',
            data: { email, message, delivered: false },
        });
    }
});

// Endpoint para enviar actualización de estado del sistema
Notifications.post('/system-status', (req: Request, res: Response) => {
    const { status, details } = req.body;

    // 🔌 Emitir estado del sistema a todos
    socketManager.emitToAll('system-status-update', {
        message: 'system-status-changed',
        status: status, // online, maintenance, offline
        details: details,
        timestamp: new Date().toISOString(),
    });

    res.json({
        code: 200,
        text: 'system-status-broadcasted',
        data: { status, details },
    });
});

// Endpoint para obtener usuarios conectados
Notifications.get('/connected-users', (_req: Request, res: Response) => {
    const connectedUsers = socketManager.getConnectedUsers();

    res.json({
        code: 200,
        text: 'connected-users-retrieved',
        data: {
            count: connectedUsers.length,
            users: connectedUsers,
        },
    });
});

// Endpoint para verificar si un usuario específico está conectado
Notifications.get('/user-status/:email', (req: Request, res: Response) => {
    const { email } = req.params;
    const isConnected = socketManager.isUserConnected(email);

    res.json({
        code: 200,
        text: 'user-status-retrieved',
        data: {
            email,
            connected: isConnected,
        },
    });
});
