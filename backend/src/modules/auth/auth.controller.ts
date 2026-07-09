import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
    constructor(private readonly jwtService: JwtService) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() body: { username: string }) {
        const mockUserId = `user_${Math.random().toString(36).substring(2, 9)}`;

        const payload = {
            sub: mockUserId,
            username: body.username,
        };

        return {
            access_token: await this.jwtService.signAsync(payload),
            user: payload,
        };
    }
}
