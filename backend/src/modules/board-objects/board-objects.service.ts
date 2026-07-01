import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBoardObjectDTO } from './dto/create-board-object.dto';

@Injectable()
export class BoardObjectsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateBoardObjectDTO) {
        return await this.prisma.boardObject.create({
            data: { ...dto },
        });
    }

    async findAllByRoomId(roomId: string) {
        return await this.prisma.boardObject.findMany({
            where: { roomId },
            orderBy: { createdAt: 'asc' },
        });
    }
}
