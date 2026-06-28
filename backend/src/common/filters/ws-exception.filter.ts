import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { WsExceptionFilter as NestWsExceptionFilter } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WsExceptionFilter implements NestWsExceptionFilter {
    private readonly logger = new Logger('WsExceptionFilter');

    catch(exception: any, host: ArgumentsHost) {
        const client = host.switchToWs().getClient<Socket>();

        if (exception instanceof WsException) {
            this.logger.warn(
                `[WS Validation Error] Клиент ${client.id} отправил некорректные данные: ${JSON.stringify(exception.getError())}`,
            );
        } else {
            const stack = exception instanceof Error ? exception.stack : '';
            this.logger.error(
                `[WS Internal Error] Критическая ошибка от клиента ${client.id}: ${exception.message}`,
                stack,
            );
        }

        if (exception instanceof WsException) {
            const errorData = exception.getError();

            client.emit(
                'error',
                typeof errorData === 'string'
                    ? { status: 'error', message: errorData }
                    : errorData,
            );

            return;
        }

        const message =
            exception instanceof Error
                ? exception.message
                : 'Internal server error';

        client.emit('error', {
            status: 'error',
            message: 'Внутренняя ошибка сервера при обработке сокета',
            details:
                process.env.NODE_ENV === 'development' ? message : undefined,
        });
    }
}
