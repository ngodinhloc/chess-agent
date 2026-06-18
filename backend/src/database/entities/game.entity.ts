import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('games')
export class Game {
  @PrimaryColumn({ type: 'uuid' })
  uuid!: string;

  @Column({ name: 'user_name', type: 'varchar', length: 200 })
  userName!: string;

  @Column({ name: 'engine_level', type: 'varchar', length: 50 })
  engineLevel!: string;

  @Column({ type: 'jsonb', default: '[]' })
  moves!: Record<string, unknown>[];

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'modified_at' })
  modifiedAt!: Date;
}
