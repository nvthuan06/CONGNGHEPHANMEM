// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ProductsModule } from './products/products.module.js';
import { NguyenLieuModule } from './NguyenLieu/NguyenLieu.module.js';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { OrdersModule } from './orders/orders.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { PaymentsModule } from './payments/payments.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>(
          'DATABASE_URL',
          'postgresql://brewlite:brewlite@localhost:5432/brewlite',
        ),
        autoLoadEntities: true,
        synchronize: true, // chỉ dùng khi phát triển: tự tạo bảng theo entity
      }),
    }),
    ProductsModule,
    OrdersModule,
    UsersModule,
    AuthModule,
    PaymentsModule,
    ServeStaticModule.forRoot({
      // Chỉ định thư mục chứa ảnh (ví dụ: tạo thư mục tên 'public' ngang hàng với 'src')
      rootPath: join(import.meta.dirname, '..', 'images'),
      serveRoot: '/images', // Đường dẫn trên URL sẽ có dạng http://localhost:3001/images/...
    }),
    NguyenLieuModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

/*import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ProductsModule } from './products/products.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'backend',
    }),
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}*/
