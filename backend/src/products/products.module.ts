// backend/src/products/products.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './products.entity.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { NguyenLieuModule } from '../NguyenLieu/NguyenLieu.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), forwardRef(() => NguyenLieuModule)],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}