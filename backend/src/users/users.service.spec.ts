import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from './users.service.js';

describe('UsersService (mock TypeORM repository)', () => {
  const builder = { addSelect: vi.fn(), where: vi.fn(), getOne: vi.fn() };
  const repo = { findOne: vi.fn(), createQueryBuilder: vi.fn(), create: vi.fn(), save: vi.fn() };
  const service = new UsersService(repo as any);

  beforeEach(() => {
    vi.resetAllMocks();
    builder.addSelect.mockReturnValue(builder);
    builder.where.mockReturnValue(builder);
    repo.createQueryBuilder.mockReturnValue(builder);
  });

  it('tra cứu người dùng theo email', async () => {
    repo.findOne.mockResolvedValue({ id: 1, email: 'a@example.com' });
    await expect(service.findByEmail('a@example.com')).resolves.toMatchObject({ id: 1 });
    expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'a@example.com' } });
  });

  it('trả null khi không có người dùng', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findByEmail('missing@example.com')).resolves.toBeNull();
  });

  it('chọn thêm passwordHash chỉ khi phục vụ đăng nhập', async () => {
    builder.getOne.mockResolvedValue({ id: 1, passwordHash: 'hash' });
    await expect(service.findByEmailWithPassword('a@example.com')).resolves.toMatchObject({ passwordHash: 'hash' });
    expect(repo.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(builder.addSelect).toHaveBeenCalledWith('user.passwordHash');
    expect(builder.where).toHaveBeenCalledWith('user.email = :email', { email: 'a@example.com' });
  });

  it('tạo và lưu người dùng bằng mật khẩu đã hash', async () => {
    repo.create.mockReturnValue({ email: 'a@example.com', passwordHash: 'hashed' });
    repo.save.mockResolvedValue({ id: 7, email: 'a@example.com', passwordHash: 'hashed' });
    await expect(service.create('a@example.com', 'hashed')).resolves.toMatchObject({ id: 7 });
    expect(repo.create).toHaveBeenCalledWith({ email: 'a@example.com', passwordHash: 'hashed' });
    expect(repo.save).toHaveBeenCalledWith({ email: 'a@example.com', passwordHash: 'hashed' });
  });
});
