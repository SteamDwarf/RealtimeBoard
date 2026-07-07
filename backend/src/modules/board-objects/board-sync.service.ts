import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from 'generated/prisma/client';
import { RedisClientType } from 'redis';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BoardSyncService {
    private readonly logger = new Logger(BoardSyncService.name);

    constructor(
        @Inject('REDIS_DATA_CLIENT')
        private readonly redisClient: RedisClientType,
        private readonly prisma: PrismaService,
    ) {}

    @Cron(CronExpression.EVERY_5_SECONDS)
    async syncCoordsToDatabase() {
        const dirtyRoomIds = await this.redisClient.sPopCount(
            'board:dirty_rooms',
            1000,
        );

        if (!dirtyRoomIds || dirtyRoomIds.length === 0) {
            return;
        }

        this.logger.log(
            `⏳ Начало синхронизации координат для ${dirtyRoomIds.length} комнат...`,
        );

        await this.processRoomsAndSync(dirtyRoomIds);
    }

    async syncSingleRoomAndClear(roomId: string) {
        const redisKey = `room:objects:${roomId}`;
        const cachedObjects = await this.redisClient.hGetAll(redisKey);

        if (cachedObjects && Object.keys(cachedObjects).length > 0) {
            this.logger.log(
                `💾  Финальный флеш данных пустой комнаты ${roomId} в Postgres...`,
            );

            const updates: Prisma.PrismaPromise<any>[] = [];
            this.buildUpdatesList(cachedObjects, updates);

            if (updates.length > 0) {
                try {
                    await this.prisma.$transaction(updates);
                } catch (error) {
                    this.logger.error(
                        `❌ Ошибка фиксации данных для комнаты ${roomId}`,
                        error,
                    );
                }
            }
        }

        await Promise.all([
            this.redisClient.del(redisKey),
            this.redisClient.sRem('board:dirty_rooms', roomId),
        ]);

        this.logger.log(`🗑️  RAM очищен для комнаты ${roomId}`);
    }

    private async processRoomsAndSync(roomIds: string[]) {
        const updates: Prisma.PrismaPromise<any>[] = [];

        for (const roomId of roomIds) {
            const key = `room:objects:${roomId}`;
            const cachedObjects = await this.redisClient.hGetAll(key);
            if (!cachedObjects) continue;

            this.buildUpdatesList(cachedObjects, updates);
        }

        if (updates.length > 0) {
            try {
                await this.prisma.$transaction(updates);
                this.logger.log(
                    `✅ Успешно синхронизировано объектов в БД: ${updates.length}`,
                );
            } catch (error) {
                this.logger.error(
                    '❌ Ошибка при массовом сохранении координат в Postgres',
                    error,
                );
            }
        }
    }

    private buildUpdatesList(
        cachedObjects: Record<string, string>,
        updates: Prisma.PrismaPromise<any>[],
    ) {
        for (const [objectId, coordsJson] of Object.entries(cachedObjects)) {
            try {
                const { x, y } = JSON.parse(coordsJson);

                updates.push(
                    this.prisma.boardObject.update({
                        where: { id: objectId },
                        data: { x, y },
                    }),
                );
            } catch (error) {
                this.logger.log(
                    `Ошибка парсинга координат для объекта ${objectId}`,
                );
            }
        }
    }
}
