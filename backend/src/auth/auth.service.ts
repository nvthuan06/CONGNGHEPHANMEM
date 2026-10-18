
import {
    Injectable,
    ConflictException,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

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


    async login(loginDto: LoginDto) {
        const email = loginDto?.email?.trim().toLowerCase();
        const password = loginDto?.password;

        if (!email || typeof password !== 'string') {
            throw new UnauthorizedException(
                'Email hoặc mật khẩu không chính xác',
            );
        }

        // Tìm người dùng, bao gồm passwordHash
        const user = await this.usersService.findByEmailWithPassword(email);

        if (!user) {
            throw new UnauthorizedException(
                'Email hoặc mật khẩu không chính xác',
            );
        }

        // So sánh mật khẩu nhập vào với hash trong database
        const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException(
                'Email hoặc mật khẩu không chính xác',
            );
        }

        // Payload chứa thông tin định danh, không chứa mật khẩu
        const payload = {
            sub: user.id,
            email: user.email,
        };

        const accessToken = await this.jwtService.signAsync(payload);

        return {
            access_token: accessToken,
        };
    }

}
