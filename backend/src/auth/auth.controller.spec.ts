import { describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller.js';

describe('AuthController', () => {
  const auth = { register: vi.fn(), login: vi.fn() };
  const controller = new AuthController(auth as any);

  it('chuyển DTO đăng ký tới service', async () => {
    const dto = { email: 'a@example.com', password: 'password123' };
    auth.register.mockResolvedValueOnce({ id: 1, email: dto.email });
    await expect(controller.register(dto)).resolves.toEqual({ id: 1, email: dto.email });
    expect(auth.register).toHaveBeenCalledWith(dto);
  });

  it('chuyển DTO đăng nhập tới service', async () => {
    const dto = { email: 'a@example.com', password: 'password123' };
    auth.login.mockResolvedValueOnce({ access_token: 'token' });
    await expect(controller.login(dto)).resolves.toEqual({ access_token: 'token' });
    expect(auth.login).toHaveBeenCalledWith(dto);
  });
});
