import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodWsValidationPipe implements PipeTransform {
    constructor(private schema: ZodSchema) {}

    transform(value: any, metadata: ArgumentMetadata) {
        let payload = value;

        if (Array.isArray(payload)) {
            payload = payload[0];
        }

        if (payload && typeof payload === 'object') {
            if ('data' in payload) payload = payload.data;
            else if ('text' in payload) payload = payload.text;
        }

        if (typeof payload === 'string') {
            try {
                payload = JSON.parse(payload.trim());
            } catch (e) {
                throw new WsException({
                    status: 'error',
                    message: 'Невалидный JSON формат строки',
                });
            }
        }

        const result = this.schema.safeParse(payload);

        if (!result.success) {
            throw new WsException({
                status: 'error',
                errors: result.error.flatten((issue) => issue.message)
                    .fieldErrors,
            });
        }

        return result.data;
    }
}
