import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión y obtener un JWT' })
  @ApiBody({ type: LoginDto })
    @ApiOkResponse({
    description:
      'Devuelve un token JWT. Copia el valor de access_token y utilízalo en Swagger pulsando Authorize y escribiendo: Bearer <token>.',
    schema: {
      example: { access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    },
  })
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }
}
