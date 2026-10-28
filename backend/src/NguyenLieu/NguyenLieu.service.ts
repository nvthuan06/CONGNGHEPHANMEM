import { Injectable, BadRequestException, OnModuleInit, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { NguyenLieu } from './Entities/nguyenlieu.entity.js';
import {ChiTietNguyenLieu} from './Entities/nguyenlieu_product.entity.js'
import { ProductsService } from '../products/products.service.js';

@Injectable()
export class NguyenLieuService implements OnModuleInit {
  constructor(
    @InjectRepository(NguyenLieu)
    private readonly nguyenLieuRepo: Repository<NguyenLieu>,
    @InjectRepository(ChiTietNguyenLieu)
    private readonly chiTietRepo: Repository<ChiTietNguyenLieu>,
    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService
  ) {}
  async onModuleInit() {
    const chitietnguyenlieu = await this.chiTietRepo.count();
    const nguyenlieu = await this.nguyenLieuRepo.count();
    if (chitietnguyenlieu > 0 && nguyenlieu > 0){
      return;
    }else{
      await this.productsService.seedProducts();
      const suaDac = await this.nguyenLieuRepo.save({ name: 'Sữa đặc', KhoiLuong: 5000 });
      const cafe = await this.nguyenLieuRepo.save({ name: 'Cà phê', KhoiLuong: 5000 });
      const dao = await this.nguyenLieuRepo.save({ name: 'Đào',KhoiLuong: 5000 });
      const tra= await this.nguyenLieuRepo.save({ name: 'Trà',KhoiLuong: 5000 });
      const kem = await this.nguyenLieuRepo.save({ name: 'Kem',KhoiLuong:5000 });
      const duong = await this.nguyenLieuRepo.save({ name: 'ĐƯờng',KhoiLuong: 5000 });
      
      await this.chiTietRepo.save([
      // Công thức Cà phê sữa: Cần 30ml sữa + 20g cafe
      { productId: 1, nguyenLieuId: 1, dinhluong: 30 },
      { productId: 1, nguyenLieuId: 2, dinhluong: 20 },
      //Công thức Americado
      { productId: 2, nguyenLieuId: 2, dinhluong: 10 },
      { productId: 2, nguyenLieuId: 6, dinhluong: 10 },
      //Công thức Capuchino
      { productId: 3, nguyenLieuId: 1, dinhluong: 30 },
      { productId: 3, nguyenLieuId: 2, dinhluong: 40 },
      { productId: 3, nguyenLieuId: 5, dinhluong: 10 },
      //Công thức trà đào
      { productId: 4, nguyenLieuId: 3, dinhluong: 30 },
      { productId: 4, nguyenLieuId: 4, dinhluong: 40 },
      { productId: 4, nguyenLieuId: 6, dinhluong: 30 },

    ]);  

    }
    await this.productsService.seedProducts();
    await this.productsService.syncAllProductsStock();  
  }

  // Hàm này nên nhận EntityManager để chạy trong Transaction
  async deductStock(nguyenLieuId: number, dinhluong: number, manager: EntityManager) {
    const nguyenLieu = await manager.findOne(NguyenLieu, { where: { id: nguyenLieuId } });
    
    if (!nguyenLieu) throw new BadRequestException('Không tìm thấy nguyên liệu');
    if (nguyenLieu.KhoiLuong < dinhluong) {
      throw new BadRequestException(`Nguyên liệu ${nguyenLieu.name} không đủ tồn kho`);
    }

    nguyenLieu.KhoiLuong -= dinhluong ;
    return await manager.save(nguyenLieu);
  }
  async findAll() {
    return await this.nguyenLieuRepo.find();
  }
  async findAllChiTiet() {
  return await this.chiTietRepo.find({
    // Lấy kèm thông tin Sản phẩm và Nguyên liệu để dễ đọc, thay vì chỉ hiện ID
    relations: { product: true, nguyenLieu: true },
  });
}
}