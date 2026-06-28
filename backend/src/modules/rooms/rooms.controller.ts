import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UsePipes,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, createRoomSchema } from './dto/create-room.dto';
import { ZodValidationPipe } from 'src/common/pipes/zod.validation.pipe';
import { UpdateRoomDto, updateRoomSchema } from './dto/update-room.dto';

@Controller('rooms')
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) {}

    @Post()
    create(@Body(new ZodValidationPipe(createRoomSchema)) body: CreateRoomDto) {
        return this.roomsService.create(body);
    }

    @Get()
    findAll() {
        return this.roomsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.roomsService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(updateRoomSchema))
        updateRoomDto: UpdateRoomDto,
    ) {
        return this.roomsService.update(id, updateRoomDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.roomsService.remove(id);
    }
}
