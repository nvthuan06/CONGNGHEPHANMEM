import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: 'varchar',
        length: 255,
        unique: true,
    })
    email!: string;

    @Column({
        type: 'varchar',
        length: 255,
        select: false,
    })
    passwordHash!: string;

    @Column({
        type: 'int',
        default: 0,
    })
    loyaltyPoints!: number;
}