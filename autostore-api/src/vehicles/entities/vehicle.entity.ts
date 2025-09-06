import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

class ColumnNumericTransformer {
  to(value: number | null): number | null {
    return value;
  }
  from(value: string | null): number | null {
    return value === null ? null : parseFloat(value);
  }
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  brand: string;

  @Column({ length: 100 })
  model: string;

  @Column()
  year: number;

  @Column('decimal')
  price: number;

  @Column({ unique: true, length: 17 })
  vin: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  isAvailable: boolean;
}