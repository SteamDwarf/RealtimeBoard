import { z } from 'zod';

export const createBoardObjectSchema = z.object({
    roomId: z.uuid('ID комнаты должен быть валидным UUID'),
    type: z.string().min(1, 'Тип объекта не может быть пустым'),
    x: z.number('Координата X обязательна'),
    y: z.number('Координата Y обязательна'),
    width: z.number().positive().optional().default(150),
    height: z.number().positive().optional().default(100),
    content: z.string().optional().default(''),
    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Цвет должен быть в формате HEX')
        .optional()
        .default('#F7EEB0'),
});

export type CreateBoardObjectDTO = z.infer<typeof createBoardObjectSchema>;
