import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('Ingredient')
export class NguyenLieu{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'varchar'})
    name: string;

    @Column({type: 'int'})
    KhoiLuong: number;

}