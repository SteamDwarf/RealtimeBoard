import { z } from 'zod';

export const joinRoomSchema = z.object({
    roomId: z.uuid('ID комнаты должен быть валидным UUID'),
    userName: z.string().min(2),
});

export type JoinRoomDTO = z.infer<typeof joinRoomSchema>;
