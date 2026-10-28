// Trong file NguyenLieu.controller.ts
import { Controller, Get } from '@nestjs/common';
import { NguyenLieuService } from './NguyenLieu.service.js';

@Controller('nguyen-lieu')
export class NguyenLieuController {
  constructor(private readonly nguyenLieuService: NguyenLieuService) {}

  // API: GET /nguyen-lieu
  @Get()
  getAllNguyenLieu() {
    return this.nguyenLieuService.findAll();
  }
  @Get('chi-tiet')
  getAllChiTiet() {
    return this.nguyenLieuService.findAllChiTiet();
  }
}