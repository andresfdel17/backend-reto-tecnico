import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { JWTManager } from './JWTManager';
import { JWT_SECRET } from '@util';
import { Logger } from './Logger';

export class SocketManager {
    private io: SocketIOServer;
    private userSockets: Map<string, string> = new Map(); // email -> socketId

    constructor(server: HTTPServer) {
        this.io = new SocketIOServer(server, {
            //Se deja para fines de pruebas
            cors: { origin: '*' }, // ajusta en prod
        });
        this.registerEvents();
    }

    private registerEvents() {
        this.io.on('connection', (socket: Socket) => {
            console.log(`🔌 client-connected: ${socket.id}`);

            // Emitir mensaje de nueva conexión para diccionario dinámico del frontend
            socket.emit('new-connection-message', {
                message: 'client-connected',
                socketId: socket.id,
                timestamp: new Date().toISOString(),
            });

            // Escuchar evento de autenticación del cliente
            socket.on('authenticate', (data: { token: string }) => {
                try {
                    const decoded: any = JWTManager.decodeToken(data.token, JWT_SECRET);
                    const userEmail = decoded?.data?.email;
                    if (!userEmail) {
                        throw new Error('User email not found');
                    }
                    // Asociar email con socketId
                    this.userSockets.set(userEmail, socket.id);
                    Logger.info(`🔐 User authenticated: ${userEmail} -> ${socket.id}`);
                    // Confirmar autenticación al cliente
                    socket.emit('authenticated', {
                        message: 'authentication-success',
                        email: userEmail,
                        timestamp: new Date().toISOString(),
                    });

                    // Emitir mensaje de bienvenida después de la autenticación
                    /*socket.emit('login-success', {
                        message: 'login-successful',
                        userName: decoded.data.name,
                        userEmail: userEmail,
                        timestamp: new Date().toISOString(),
                    });*/
                } catch {
                    socket.emit('authentication-error', {
                        message: 'invalid-token',
                        timestamp: new Date().toISOString(),
                    });
                }
            });

            socket.on('disconnect', () => {
                // Remover usuario de la lista cuando se desconecte
                for (const [email, socketId] of this.userSockets.entries()) {
                    if (socketId === socket.id) {
                        this.userSockets.delete(email);
                        Logger.info(`🔓 User disconnected: ${email}`);
                        break;
                    }
                }
            });
        });
    }

    // Método público para emitir mensajes desde otros servicios
    public emitToAll(event: string, data: any) {
        this.io.emit(event, data);
    }

    // Método público para emitir mensajes a un socket específico
    public emitToSocket(socketId: string, event: string, data: any) {
        this.io.to(socketId).emit(event, data);
    }

    // Método público para emitir mensajes a un usuario específico por email
    public emitToUser(email: string, event: string, data: any): boolean {
        const socketId = this.userSockets.get(email);
        if (socketId) {
            this.io.to(socketId).emit(event, data);
            console.log(`📧 Message sent to user: ${email} (${socketId})`);
            return true;
        }
        console.log(`❌ User not connected: ${email}`);
        return false;
    }

    // Método para obtener usuarios conectados
    public getConnectedUsers(): string[] {
        return Array.from(this.userSockets.keys());
    }

    // Método para verificar si un usuario está conectado
    public isUserConnected(email: string): boolean {
        return this.userSockets.has(email);
    }
}
