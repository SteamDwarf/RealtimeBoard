import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createRoomDto: CreateRoomDto) {
        return this.prisma.room.create({
            data: {
                name: createRoomDto.name,
            },
        });
    }

    findAll() {
        return this.prisma.room.findMany();
    }

    async findOne(id: string) {
        const room = await this.prisma.room.findUnique({
            where: { id },
            include: {
                users: true,
                objects: true,
            },
        });

        if (!room) {
            throw new NotFoundException(`Комната с ID ${id} не найдена`);
        }

        return room;
    }

    async update(id: string, updateRoomDto: UpdateRoomDto) {
        await this.findOne(id);

        return this.prisma.room.update({
            where: { id },
            data: updateRoomDto,
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        return this.prisma.room.delete({ where: { id } });
    }
}
