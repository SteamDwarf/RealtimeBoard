import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JoinRoomDTO, joinRoomSchema } from './dto/join-room.dto';
import { Inject, Logger, UseFilters, UsePipes } from '@nestjs/common';
import { BoardObjectsService } from '../board-objects/board-objects.service';
import { ZodWsValidationPipe } from 'src/common/pipes/zod-ws.validation.pipe';
import {
    CreateBoardObjectDTO,
    createBoardObjectSchema,
} from '../board-objects/dto/create-board-object.dto';
import { WsExceptionFilter } from 'src/common/filters/ws-exception.filter';
import {
    GetBoardObjectsDTO,
    getBoardObjectsSchema,
} from '../board-objects/dto/get-board-objects.dto';
import { RedisClientType } from 'redis';
import {
    MoveBoardObjectDTO,
    moveBoardObjectSchema,
} from '../board-objects/dto/move-board-object.dto';
import { BoardSyncService } from '../board-objects/board-sync.service';

@UseFilters(new WsExceptionFilter())
@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class BoardGatewayGateway
    implements OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer()
    server!: Server;

    private readonly logger = new Logger(BoardGatewayGateway.name);

    constructor(
        private readonly boardObjectsService: BoardObjectsService,
        private readonly boardSyncService: BoardSyncService,
        @Inject('REDIS_DATA_CLIENT')
        private readonly redisClient: RedisClientType,
    ) {}

    handleConnection(client: Socket) {
        this.logger.log(`🔌 Клиент подключился: ${client.id}`);

        client.on('disconnecting', async () => {
            await this.handleClientLeave(client);
        });
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`❌ Клиент отключился: ${client.id}`);
    }

    async handleClientLeave(client: Socket) {
        const rooms = Array.from(client.rooms).filter((r) => r !== client.id);

        for (const roomId of rooms) {
            const socketIdsInRoom = await this.server.in(roomId).fetchSockets();

            if (socketIdsInRoom && socketIdsInRoom.length === 1) {
                this.logger.log(
                    `🧹 Комната ${roomId} опустела. Очищаем RAM...`,
                );

                await this.boardSyncService.syncSingleRoomAndClear(roomId);
            }
        }
    }

    @SubscribeMessage('room:join')
    handleRoomJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody(new ZodWsValidationPipe(joinRoomSchema)) data: JoinRoomDTO,
    ) {
        const { roomId, userName } = data;

        client.join(roomId);

        this.logger.log(`👤 Юзер ${userName} вошел в комнату ${roomId}`);

        client.to(roomId).emit('room:user_joined', {
            message: `${userName} присоединился к сессии`,
            userName: userName,
        });

        return {
            status: 'ok',
            message: `Вы успешно вошли в комнату ${roomId}`,
        };
    }

    @SubscribeMessage('object:create')
    async handleCreateBoardObject(
        @ConnectedSocket() client: Socket,
        @MessageBody(new ZodWsValidationPipe(createBoardObjectSchema))
        dto: CreateBoardObjectDTO, // Чистые данные из пайпа
    ) {
        const newObject = await this.boardObjectsService.create(dto);
        this.server.to(dto.roomId).emit('object:created', newObject);

        return { status: 'ok', data: newObject };
    }

    @SubscribeMessage('objects:get')
    async getBoardObjects(
        @ConnectedSocket() client: Socket,
        @MessageBody(new ZodWsValidationPipe(getBoardObjectsSchema))
        dto: GetBoardObjectsDTO,
    ) {
        const { roomId } = dto;

        try {
            const dbObjects =
                await this.boardObjectsService.findAllByRoomId(roomId);
            const redisKey = `room:objects:${roomId}`;
            const cachedCoords = await this.redisClient.hGetAll(redisKey);

            const objects = dbObjects.map((obj) => {
                if (cachedCoords && cachedCoords[obj.id]) {
                    const { x, y } = JSON.parse(cachedCoords[obj.id]);

                    return { ...obj, x, y };
                }

                return obj;
            });

            this.logger.log(
                `📦 Клиент ${client.id} запросил объекты для комнаты ${roomId}. Найдено: ${objects.length}`,
            );

            return {
                status: 'ok',
                data: objects,
            };
        } catch (error) {
            this.logger.error(
                `Ошибка при получении объектов для комнаты ${roomId}`,
                error,
            );
            throw new WsException({
                status: 'error',
                message: 'Не удалось загрузить объекты доски',
            });
        }
    }

    @SubscribeMessage('object:move')
    async moveBoardObject(
        @ConnectedSocket() client: Socket,
        @MessageBody(new ZodWsValidationPipe(moveBoardObjectSchema))
        dto: MoveBoardObjectDTO,
    ) {
        const { id, roomId, x, y } = dto;
        const redisKey = `room:objects:${roomId}`;

        await this.redisClient.hSet(redisKey, id, JSON.stringify({ x, y }));
        await this.redisClient.sAdd('board:dirty_rooms', roomId);

        client.to(roomId).emit('object:moved', {
            id,
            x,
            y,
        });

        return { status: 'ok' };
    }
}
