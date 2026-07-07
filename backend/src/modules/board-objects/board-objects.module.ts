import { Module } from '@nestjs/common';
import { BoardObjectsService } from './board-objects.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BoardSyncService } from './board-sync.service';

@Module({
    imports: [PrismaModule],
    providers: [BoardObjectsService, BoardSyncService],
    exports: [BoardObjectsService, BoardSyncService],
})
export class BoardObjectsModule {}
