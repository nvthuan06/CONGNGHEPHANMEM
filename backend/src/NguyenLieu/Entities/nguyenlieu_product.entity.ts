
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Product } from '../../products/products.entity.js'
import {NguyenLieu} from '../Entities/nguyenlieu.entity.js'

@Entity('IngredientDetail')
export class ChiTietNguyenLieu {

    @PrimaryGeneratedColumn()
    id: number
    
    @Column({ type: 'int' })
    productId: number;

    @Column({ type: 'int' })
    nguyenLieuId: number;

  // Định lượng nguyên liệu (VD: 20 gram, 30 ml...)
    @Column({ type: 'float' }) 
    dinhluong: number;

  // Khai báo quan hệ N-1 với Product
    @ManyToOne(() => Product, (product) => product.ingredients)
    @JoinColumn({ name: 'productId' })
  // SỬA Ở ĐÂY: Bọc Product trong Relation<>
    product: Relation<Product>; 

    @ManyToOne(() => NguyenLieu)
    @JoinColumn({ name: 'nguyenLieuId' })
  // SỬA Ở ĐÂY: Bọc NguyenLieu trong Relation<>
    nguyenLieu: Relation<NguyenLieu>;
}