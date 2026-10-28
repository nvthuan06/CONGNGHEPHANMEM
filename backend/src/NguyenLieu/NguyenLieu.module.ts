import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NguyenLieuController } from './NguyenLieu.controller.js';
import { NguyenLieuService } from './NguyenLieu.service.js';
import { NguyenLieu } from './Entities/nguyenlieu.entity.js';
import { ChiTietNguyenLieu } from './Entities/nguyenlieu_product.entity.js';
import { ProductsModule } from '../products/products.module.js';

@Module({
  imports: [
    // 1. Đăng ký Entity NguyenLieu để TypeORM cấp quyền dùng Repository
    TypeOrmModule.forFeature([NguyenLieu, ChiTietNguyenLieu]),
    forwardRef(() => ProductsModule),
  ],
  controllers: [
    // 2. Khai báo Controller xử lý API đầu vào
    NguyenLieuController,
  ],
  providers: [
    // 3. Khai báo Service chứa logic xử lý
    NguyenLieuService,
  ],
  exports: [
    NguyenLieuService,
  ],
})
export class NguyenLieuModule {}