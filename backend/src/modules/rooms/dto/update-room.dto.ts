import { PartialType } from '@nestjs/mapped-types';
import { createRoomSchema, type CreateRoomDto } from './create-room.dto';
import z from 'zod';

export const updateRoomSchema = createRoomSchema.partial();

export type UpdateRoomDto = z.infer<typeof updateRoomSchema>;
