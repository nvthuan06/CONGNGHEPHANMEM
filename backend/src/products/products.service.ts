import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from './products.entity.js';

@Injectable()
export class ProductsService {
  private readonly products: Product[] = [
    { id: 1, name: 'Cà phê sữa', price: 35000, imageUrl: '/images/ca-phe-sua.jpg', stock: 100 },
    { id: 2, name: 'Americano', price: 40000, imageUrl: '/images/americano.jpg', stock: 100 },
    { id: 3, name: 'Cappuccino', price: 45000, imageUrl: '/images/cappuccino.jpg', stock: 100 },
    { id: 4, name: 'Trà đào', price: 39000, imageUrl: '/images/tra-dao.jpg', stock: 100 },
  ];

  findAll(): Product[] {
    return this.products;
  }

  findOne(id: number): Product {
    const product = this.products.find((p) => p.id === id);
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }
  /*createOne(){
    var product = new Product();
    product.
  }*/
}