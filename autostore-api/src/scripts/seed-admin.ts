import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { Role } from '../users/entities/role.enum';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const email = 'admin@autostore.com';
  const exists = await usersService.findByEmail(email);

  if (exists) {
    console.log('El usuario administrador ya existe');
  } else {
    await usersService.create({
      email,
      password: 'admin123',
      name: 'Administrador',
      role: Role.Admin,
    });
    console.log('Usuario administrador creado');
  }

  await app.close();
}

seed().catch((err) => {
  console.error('Error al crear el administrador', err);
  process.exit(1);
});