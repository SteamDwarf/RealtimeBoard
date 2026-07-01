import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { createClient } from 'redis';

@Global()
@Module({
    providers: [
        {
            provide: 'REDIS_DATA_CLIENT',
            useFactory: async () => {
                const client = createClient({
                    url: process.env.REDIS_URL || 'redis://localhost:6379',
                });

                await client.connect();
                return client;
            },
        },
    ],
    exports: ['REDIS_DATA_CLIENT'],
})
export class RedisModule implements OnModuleDestroy {
    constructor() {}
    onModuleDestroy() {}
}
