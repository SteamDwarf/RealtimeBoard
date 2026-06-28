import { Module } from '@nestjs/common';
import { BoardObjectsService } from './board-objects.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [BoardObjectsService],
    exports: [BoardObjectsService],
})
export class BoardObjectsModule {}
