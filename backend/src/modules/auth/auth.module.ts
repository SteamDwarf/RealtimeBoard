import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'dev_secret_key_123',
            signOptions: { expiresIn: '7d' },
        }),
    ],
    controllers: [AuthController],
    exports: [JwtModule],
})
export class AuthModule {}
