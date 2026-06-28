import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
    constructor(private schema: ZodType) {}

    transform(value: any) {
        const result = this.schema.safeParse(value);

        if (!result.success) {
            const errors = result.error.flatten(
                (issue) => issue.message,
            ).fieldErrors;

            throw new BadRequestException({
                message: 'Ошибка валидации данных',
                errors,
            });
        }

        return result.data;
    }
}
