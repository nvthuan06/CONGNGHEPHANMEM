import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './products.entity.js';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  // Chạy 1 lần khi app khởi động: nếu bảng rỗng thì thêm 4 sản phẩm mẫu
  async onModuleInit(): Promise<void> {
    const count = await this.productsRepository.count();
    if (count > 0) return;

    await this.productsRepository.save([
      { name: 'Cà phê sữa', price: 35000, imageUrl: '/images/ca-phe-sua.jpg', stock: 100 },
      { name: 'Americano', price: 40000, imageUrl: '/images/americano.jpg', stock: 100 },
      { name: 'Cappuccino', price: 45000, imageUrl: '/images/cappuccino.jpg', stock: 100 },
      { name: 'Trà đào', price: 39000, imageUrl: '/images/tra-dao.jpg', stock: 100 },
    ]);
  }

  findAll(): Promise<Product[]> {
    return this.productsRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }
}
  /*createOne(){
    var product = new Product();
    product.
  }*/
