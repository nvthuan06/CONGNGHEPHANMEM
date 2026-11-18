
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
        synchronize: true,

        // Chỉ bật SSL khi DB_SSL=true
        ssl:
          config.get<string>('DB_SSL', 'false') === 'true'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),

    ProductsModule,
    OrdersModule,
    UsersModule,
    AuthModule,
    PaymentsModule,

    ServeStaticModule.forRoot({
      rootPath: join(import.meta.dirname, '..', 'images'),
      serveRoot: '/images',
    }),

    NguyenLieuModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
