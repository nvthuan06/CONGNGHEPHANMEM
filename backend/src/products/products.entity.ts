// backend/src/products/products.entity.ts
import { Column, Entity, PrimaryGeneratedColumn, OneToMany, Relation } from 'typeorm';
import { ChiTietNguyenLieu } from '../NguyenLieu/Entities/nguyenlieu_product.entity.js';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'int' })
  price!: number; // VND

  @Column({ type: 'varchar', name: 'image_url' })
  imageUrl!: string;

  @Column({ type: 'int', default: 0 })
  stock!: number;

  @OneToMany(() => ChiTietNguyenLieu, (chiTiet) => chiTiet.product)
  // SỬA Ở ĐÂY: Bọc mảng ChiTietNguyenLieu trong Relation<>
  ingredients: Relation<ChiTietNguyenLieu>[];
}