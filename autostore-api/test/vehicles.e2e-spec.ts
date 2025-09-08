import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { VehiclesController } from '../src/vehicles/vehicles.controller';
import { VehiclesService } from '../src/vehicles/vehicles.service';
import { Repository } from 'typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Vehicle } from '../src/vehicles/entities/vehicle.entity';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

class MockVehicleRepository {
  private data: Vehicle[] = [];
  private seq = 1;

  create(dto: Partial<Vehicle>): Vehicle {
    return dto as Vehicle;
  }

  async save(vehicle: Vehicle): Promise<Vehicle> {
    if (!vehicle.id) {
      // create
      if (this.data.some((v) => v.vin === vehicle.vin)) {
        const err: any = new Error('duplicate');
        err.code = '23505';
        throw err;
      }
      vehicle.id = this.seq++;
      vehicle.isAvailable = vehicle.isAvailable ?? true;
      this.data.push(vehicle);
      return vehicle;
    }
    // update
    const index = this.data.findIndex((v) => v.id === vehicle.id);
    if (index === -1) {
      throw new Error('not found');
    }
    if (
      vehicle.vin &&
      this.data.some((v) => v.vin === vehicle.vin && v.id !== vehicle.id)
    ) {
      const err: any = new Error('duplicate');
      err.code = '23505';
      throw err;
    }
    this.data[index] = { ...this.data[index], ...vehicle };
    return this.data[index];
  }

  merge(entity: Vehicle, dto: Partial<Vehicle>): Vehicle {
    return { ...entity, ...dto } as Vehicle;
  }

  async findAndCount(): Promise<[Vehicle[], number]> {
    return [this.data, this.data.length];
  }

  async findOne(options: { where: { id: number } }): Promise<Vehicle | null> {
    return this.data.find((v) => v.id === options.where.id) ?? null;
  }

  async delete(id: number): Promise<{ affected: number }> {
    const index = this.data.findIndex((v) => v.id === id);
    if (index === -1) {
      return { affected: 0 };
    }
    this.data.splice(index, 1);
    return { affected: 1 };
  }
}

describe('Vehicles endpoints (e2e)', () => {
  let app: INestApplication;
  let repo: MockVehicleRepository;
  let vehicleId: number;

  let adminAuth: string;
  let clientAuth: string;

  beforeAll(async () => {
    repo = new MockVehicleRepository();
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register({ isGlobal: true }),
        PassportModule,
        JwtModule.register({ secret: 'test-secret' }),
      ],
      controllers: [VehiclesController],
      providers: [
        VehiclesService,
        RolesGuard,
        JwtAuthGuard,
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => 'test-secret' },
        },
        { provide: Repository, useValue: repo },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const jwt = moduleRef.get(JwtService);
    adminAuth = `Bearer ${jwt.sign({ sub: 1, role: 'admin' })}`;
    clientAuth = `Bearer ${jwt.sign({ sub: 2, role: 'client' })}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /vehicles should create a vehicle for admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', adminAuth)
      .send({
        brand: 'Toyota',
        model: 'Corolla',
        year: 2024,
        price: 150000,
        vin: '1HGCM82633A004352',
      })
      .expect(201);

    vehicleId = res.body.id;
    expect(res.body).toMatchObject({
      id: vehicleId,
      brand: 'Toyota',
      model: 'Corolla',
      year: 2024,
      price: 150000,
      vin: '1HGCM82633A004352',
      isAvailable: true,
    });
  });

  it('POST /vehicles should forbid client role', () => {
    return request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', clientAuth)
      .send({
        brand: 'Ford',
        model: 'Fiesta',
        year: 2019,
        price: 100000,
        vin: '1HGCM82633A004353',
      })
      .expect(403);
  });

  it('GET /vehicles should return list of vehicles', async () => {
    const res = await request(app.getHttpServer())
      .get('/vehicles')
      .set('Authorization', clientAuth)
      .expect(200);
    expect(res.body.total).toBe(1);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].id).toBe(vehicleId);
  });

  it('GET /vehicles/:id should return a vehicle', async () => {
    const res = await request(app.getHttpServer())
      .get(`/vehicles/${vehicleId}`)
      .set('Authorization', clientAuth)
      .expect(200);
    expect(res.body.id).toBe(vehicleId);
  });

  it('GET /vehicles/:id should return 404 for non-existing vehicle', () => {
    return request(app.getHttpServer())
      .get('/vehicles/999')
      .set('Authorization', clientAuth)
      .expect(404);
  });

  it('PATCH /vehicles/:id should update vehicle for admin', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/vehicles/${vehicleId}`)
      .set('Authorization', adminAuth)
      .send({ price: 160000 })
      .expect(200);
    expect(res.body.price).toBe(160000);
  });

  it('PATCH /vehicles/:id should forbid client role', () => {
    return request(app.getHttpServer())
      .patch(`/vehicles/${vehicleId}`)
      .set('Authorization', clientAuth)
      .send({ price: 170000 })
      .expect(403);
  });

  it('DELETE /vehicles/:id should forbid client role', () => {
    return request(app.getHttpServer())
      .delete(`/vehicles/${vehicleId}`)
      .set('Authorization', clientAuth)
      .expect(403);
  });

  it('DELETE /vehicles/:id should remove vehicle for admin', () => {
    return request(app.getHttpServer())
      .delete(`/vehicles/${vehicleId}`)
      .set('Authorization', adminAuth)
      .expect(204);
  });

  it('DELETE /vehicles/:id should return 404 when vehicle is missing', () => {
    return request(app.getHttpServer())
      .delete(`/vehicles/${vehicleId}`)
      .set('Authorization', adminAuth)
      .expect(404);
  });
});
