import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
    private readonly logger = new Logger('WsJwtGuard');

    constructor(private readonly jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const client: Socket = context.switchToWs().getClient();

            const authHeader =
                client.handshake.auth?.token ||
                client.handshake.headers?.authorization;

            if (!authHeader) {
                this.logger.warn(
                    `Отсутствует токен авторизации у клиента: ${client.id}`,
                );
                throw new WsException(
                    'Неавторизованный доступ. Токен отсутствует.',
                );
            }

            const [type, token] = authHeader.split(' ');

            if (type !== 'Bearer' || !token) {
                throw new WsException(
                    'Неверный формат токена. Ожидается Bearer [token]',
                );
            }

            const payload = await this.jwtService.verifyAsync(token);

            client['user'] = payload;

            return true;
        } catch (error) {
            this.logger.error(
                `Клиент не прошел валидацию: ${(error as Error).message}`,
            );

            const client: Socket = context.switchToWs().getClient();

            client.emit('error', {
                status: 'unauthorized',
                message: 'Сессия невалидна или истекла',
            });

            client.disconnect(true);

            return false;
        }
    }
}
