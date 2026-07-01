import { z } from 'zod';

export const moveBoardObjectSchema = z.object({
    id: z.uuid(),
    roomId: z.uuid(),
    x: z.number(),
    y: z.number(),
});

export type MoveBoardObjectDTO = z.infer<typeof moveBoardObjectSchema>;
