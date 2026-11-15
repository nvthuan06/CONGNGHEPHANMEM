import { describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy.js';

describe('JwtStrategy', () => {
  const createConfig = (secret: string | undefined) => {
    const get = vi.fn().mockReturnValue(secret);
    return {
      config: { get } as unknown as ConfigService,
      get,
    };
  };

  it('khởi tạo thành công khi có JWT_SECRET', () => {
    const { config, get } = createConfig('unit-test-secret');

    const strategy = new JwtStrategy(config);

    expect(strategy).toBeInstanceOf(JwtStrategy);
    expect(get).toHaveBeenCalledWith('JWT_SECRET');
  });

  it.each([undefined, ''])(
    'báo lỗi nếu JWT_SECRET bị thiếu hoặc rỗng (%s)',
    (secret) => {
      const { config } = createConfig(secret);

      expect(() => new JwtStrategy(config)).toThrow(
        'Thiếu JWT_SECRET trong cấu hình môi trường',
      );
    },
  );

  it('lấy JWT từ Authorization: Bearer', () => {
    const { config } = createConfig('unit-test-secret');
    const strategy = new JwtStrategy(config);
    const extractToken = (strategy as unknown as {
      _jwtFromRequest: (request: { headers: Record<string, string> }) => string | null;
    })._jwtFromRequest;

    expect(
      extractToken({ headers: { authorization: 'Bearer header.payload.signature' } }),
    ).toBe('header.payload.signature');
  });

  it('không lấy token khi header Authorization không phải Bearer', () => {
    const { config } = createConfig('unit-test-secret');
    const strategy = new JwtStrategy(config);
    const extractToken = (strategy as unknown as {
      _jwtFromRequest: (request: { headers: Record<string, string> }) => string | null;
    })._jwtFromRequest;

    expect(extractToken({ headers: { authorization: 'Basic abc123' } })).toBeNull();
    expect(extractToken({ headers: {} })).toBeNull();
  });

  it('không bỏ qua thời hạn hết hạn của JWT', () => {
    const { config } = createConfig('unit-test-secret');
    const strategy = new JwtStrategy(config);
    const verifyOptions = (strategy as unknown as {
      _verifOpts: { ignoreExpiration: boolean };
    })._verifOpts;

    expect(verifyOptions.ignoreExpiration).toBe(false);
  });

  it('validate ánh xạ sub thành userId và giữ email', async () => {
    const { config } = createConfig('unit-test-secret');
    const strategy = new JwtStrategy(config);

    await expect(
      strategy.validate({ sub: 123, email: 'user@example.com' }),
    ).resolves.toEqual({ userId: 123, email: 'user@example.com' });
  });

  it('validate chỉ trả về userId và email, không trả dữ liệu thừa', async () => {
    const { config } = createConfig('unit-test-secret');
    const strategy = new JwtStrategy(config);
    const payload = {
      sub: 456,
      email: 'test@example.com',
      passwordHash: 'should-not-be-returned',
      role: 'admin',
    };

    const result = await strategy.validate(payload);

    expect(result).toEqual({ userId: 456, email: 'test@example.com' });
    expect(result).not.toHaveProperty('passwordHash');
    expect(result).not.toHaveProperty('role');
  });
});
