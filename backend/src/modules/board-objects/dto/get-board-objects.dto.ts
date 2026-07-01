import { z } from 'zod';

export const getBoardObjectsSchema = z.object({
    roomId: z.uuid('ID комнаты должен быть валидным UUID'),
});

export type GetBoardObjectsDTO = z.infer<typeof getBoardObjectsSchema>;
