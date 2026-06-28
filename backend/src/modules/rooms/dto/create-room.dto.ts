import { z } from 'zod';

export const createRoomSchema = z.object({
    name: z
        .string()
        .min(2, 'Название комнаты должно быть не менее 2 символов')
        .max(50),
});

export type CreateRoomDto = z.infer<typeof createRoomSchema>;
