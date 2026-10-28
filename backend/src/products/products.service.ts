// backend/src/products/products.service.ts
import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './products.entity.js';


@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async seedProducts(): Promise<void> {
    const count = await this.productsRepository.count();
    if (count > 0) return;

    await this.productsRepository.save([
      { name: 'Cà phê sữa', price: 35000, imageUrl: '/images/ca-phe-sua.jpg', stock: 0 },
      { name: 'Americano', price: 40000, imageUrl: '/images/americano.jpg', stock: 0 },
      { name: 'Cappuccino', price: 45000, imageUrl: '/images/cappuccino.jpg', stock: 0 },
      { name: 'Trà đào', price: 39000, imageUrl: '/images/tra-dao.jpg', stock: 0 },
    ]);
  }
  async syncProductStock(productId: number): Promise<void> {
    const product = await this.productsRepository.findOne({
      where: { id: productId },
      relations: { ingredients: { nguyenLieu: true } },
    });
    if (!product) return;
    let minStock = Infinity;
    const ingredients = product.ingredients ?? [];
    if (ingredients.length === 0) {
      minStock = 0;
    } else {
      for (const detail of ingredients) {
        const tonKhoHienTai = detail.nguyenLieu.KhoiLuong;
        const dinhMuc = detail.dinhluong;
        const soLuongLamDuoc = Math.floor(tonKhoHienTai / dinhMuc);

        if (soLuongLamDuoc < minStock) {
          minStock = soLuongLamDuoc;
        }
      }
    }
    product.stock = minStock === Infinity ? 0 : minStock;
    await this.productsRepository.save(product);
  }
  async syncAllProductsStock(): Promise<void> {
    const products = await this.findAll();
    for (const product of products) {
      await this.syncProductStock(product.id);
    }
    console.log('Đã đồng bộ xong toàn bộ tồn kho!');
  }
  

  findAll(): Promise<Product[]> {
    return this.productsRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm ${id}`);
    }
    return product;
  }
}

