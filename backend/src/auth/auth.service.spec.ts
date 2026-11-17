import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';

describe('AuthService (mock UsersService/JwtService)', () => {
  const users = {
    findByEmail: vi.fn(),
    findByEmailWithPassword: vi.fn(),
    create: vi.fn(),
  };
  const jwt = { signAsync: vi.fn() };
  const service = new AuthService(users as any, jwt as any);

  beforeEach(() => {
    vi.resetAllMocks();
    users.findByEmail.mockResolvedValue(null);
    jwt.signAsync.mockResolvedValue('jwt-demo');
  });

  it.each(['', 'wrong-email', 'abc@', '   '])('từ chối email không hợp lệ (%s)', async (email) => {
    await expect(service.register({ email, password: 'password123' })).rejects.toBeInstanceOf(BadRequestException);
    expect(users.create).not.toHaveBeenCalled();
  });

  it('từ chối mật khẩu ngắn hoặc thiếu', async () => {
    await expect(service.register({ email: 'a@example.com', password: '123' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.register({ email: 'a@example.com', password: undefined as any })).rejects.toBeInstanceOf(BadRequestException);
    expect(users.create).not.toHaveBeenCalled();
  });

  it('không đăng ký khi email đã tồn tại', async () => {
    users.findByEmail.mockResolvedValue({ id: 3, email: 'a@example.com' });
    await expect(service.register({ email: ' A@Example.com ', password: 'password123' })).rejects.toBeInstanceOf(ConflictException);
    expect(users.findByEmail).toHaveBeenCalledWith('a@example.com');
    expect(users.create).not.toHaveBeenCalled();
  });

  it('chuẩn hóa email, hash mật khẩu và không trả passwordHash', async () => {
    users.create.mockImplementation(async (email: string, passwordHash: string) => ({ id: 7, email, passwordHash, loyaltyPoints: 0 }));
    const result = await service.register({ email: ' Test@Example.COM ', password: 'password123' });
    expect(users.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(users.create).toHaveBeenCalledOnce();
    const [email, hash] = users.create.mock.calls[0];
    expect(email).toBe('test@example.com');
    expect(hash).not.toBe('password123');
    expect(await bcrypt.compare('password123', hash)).toBe(true);
    expect(result).toEqual({ id: 7, email: 'test@example.com', loyaltyPoints: 0 });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('từ chối login thiếu email hoặc mật khẩu', async () => {
    await expect(service.login({ email: '', password: 'password123' })).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.login({ email: 'a@example.com', password: undefined as any })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(users.findByEmailWithPassword).not.toHaveBeenCalled();
  });

  it('từ chối khi không tìm thấy tài khoản', async () => {
    users.findByEmailWithPassword.mockResolvedValue(null);
    await expect(service.login({ email: 'a@example.com', password: 'password123' })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('từ chối mật khẩu sai', async () => {
    users.findByEmailWithPassword.mockResolvedValue({ id: 1, email: 'a@example.com', passwordHash: await bcrypt.hash('correct_password', 4) });
    await expect(service.login({ email: 'a@example.com', password: 'wrong_password' })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('đăng nhập thành công bằng email chuẩn hóa, ký JWT chỉ chứa sub và email', async () => {
    users.findByEmailWithPassword.mockResolvedValue({ id: 9, email: 'a@example.com', passwordHash: await bcrypt.hash('password123', 4) });
    const result = await service.login({ email: ' A@Example.COM ', password: 'password123' });
    expect(users.findByEmailWithPassword).toHaveBeenCalledWith('a@example.com');
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 9, email: 'a@example.com' });
    expect(result).toEqual({ access_token: 'jwt-demo' });
  });
});
