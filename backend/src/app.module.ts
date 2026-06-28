import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { RoomsModule } from './modules/rooms/rooms.module';
import { BoardGatewayGateway } from './modules/board-gateway/board-gateway.gateway';
import { BoardObjectsModule } from './modules/board-objects/board-objects.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        RoomsModule,
        BoardObjectsModule,
    ],
    controllers: [AppController],
    providers: [AppService, BoardGatewayGateway],
})
export class AppModule {}
