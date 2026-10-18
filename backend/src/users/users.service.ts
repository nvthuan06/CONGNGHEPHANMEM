import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) { }

    // Tìm người dùng theo email
    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { email },
        });
    }

    // Tìm người dùng theo email, bao gồm passwordHash
    async findByEmailWithPassword(
        email: string,
    ): Promise<User | null> {
        return this.usersRepository
            .createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .where('user.email = :email', { email })
            .getOne();
    }

    // Tạo người dùng mới
    async create(
        email: string,
        passwordHash: string,
    ): Promise<User> {
        const user = this.usersRepository.create({
            email,
            passwordHash,
        });

        return this.usersRepository.save(user);
    }
}