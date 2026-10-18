
import {
    Injectable,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UsersService) { }

    async register(registerDto: RegisterDto) {
        const email = registerDto.email?.trim().toLowerCase();
        const password = registerDto.password;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new BadRequestException('Email không hợp lệ');
        }

        if (typeof password !== 'string' || password.length < 8) {
            throw new BadRequestException(
                'Mật khẩu phải có ít nhất 8 ký tự',
            );
        }

        // Kiểm tra email đã được đăng ký chưa
        const existingUser = await this.usersService.findByEmail(email);

        if (existingUser) {
            throw new ConflictException('Email đã được sử dụng');
        }

        // Băm mật khẩu trước khi lưu vào cơ sở dữ liệu
        const passwordHash = await bcrypt.hash(password, 10);

        // Tạo người dùng mới
        const user = await this.usersService.create(email, passwordHash);

        // Chỉ trả về thông tin an toàn
        return {
            id: user.id,
            email: user.email,
            loyaltyPoints: user.loyaltyPoints,
        };
    }
}
