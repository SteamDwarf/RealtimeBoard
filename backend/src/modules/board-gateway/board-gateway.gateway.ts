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
import { Logger, UseFilters, UsePipes } from '@nestjs/common';
import { BoardObjectsService } from '../board-objects/board-objects.service';
import { ZodWsValidationPipe } from 'src/common/pipes/zod-ws.validation.pipe';
import {
    CreateBoardObjectDTO,
    createBoardObjectSchema,
} from '../board-objects/dto/create-board-object.dto';
import { error } from 'console';
import { WsExceptionFilter } from 'src/common/filters/ws-exception.filter';

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

    constructor(private readonly boardObjectsService: BoardObjectsService) {}

    handleConnection(client: Socket) {
        this.logger.log(`🔌 Клиент подключился: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`❌ Клиент отключился: ${client.id}`);
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
}
