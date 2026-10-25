# BrewLite – Coffee Shop Management System

BrewLite là đồ án môn **Công nghệ Phần mềm**, xây dựng hệ thống bán hàng và quản lý đơn hàng cho cửa hàng cà phê.

## 1. Thông tin đồ án

- **Học phần:** Công nghệ Phần mềm
- **Giảng viên hướng dẫn:** Từ Lãng Phiêu
- **Nhóm thực hiện:** Nhóm 12

### Danh sách thành viên

| STT | Họ và tên | Mã số sinh viên |
|---|---|---|
| 1 | Vãn Nguyễn Đức Thịnh | 3124410344 |
| 2 | Nguyễn Vũ Thuần | 3124410347 |
| 3 | Nguyễn Triệu Thiên | 3124410335 |
| 4 | Trần Diệu Vi | 3124410402 |
| 5 | Lâm Thái Thuận | 3124410346 |
| 6 | Ngô Đông Ất | 3123410014 |

## 2. Giới thiệu dự án

**BrewLite** là ứng dụng web hỗ trợ quy trình bán hàng tại cửa hàng cà phê, từ việc xem sản phẩm, thêm vào giỏ hàng, đặt hàng đến theo dõi trạng thái thanh toán và lịch sử đơn hàng.

### Các chức năng chính

- Đăng ký và đăng nhập tài khoản.
- Xem danh sách và thông tin chi tiết sản phẩm.
- Thêm sản phẩm vào giỏ hàng và cập nhật số lượng.
- Tạo đơn hàng từ giỏ hàng.
- Hiển thị thông tin thanh toán và mã QR.
- Theo dõi trạng thái thanh toán của đơn hàng.
- Xem lịch sử đơn hàng của người dùng.

## 3. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL 17 |
| Authentication | JWT |
| Containerization | Docker, Docker Compose |
| Version Control | Git, GitHub |

### Kiến trúc hệ thống

```text
                Người dùng
                    |
                    v
          +-------------------+
          | Next.js Frontend  |
          |  localhost:3000   |
          +-------------------+
                    |
                    | HTTP / REST API
                    v
          +-------------------+
          |  NestJS Backend   |
          |  localhost:3001   |
          +-------------------+
                    |
                    | Database Connection
                    v
          +-------------------+
          |    PostgreSQL     |
          |  Docker Network   |
          +-------------------+
```

Hệ thống sử dụng Docker Compose để quản lý ba service: `frontend`, `backend` và `db`.

## 4. Cấu trúc thư mục

```text
CONGNGHEPHANMEM/
├── backend/                # NestJS Backend
│   ├── src/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
│
├── frontend/               # Next.js Frontend
│   ├── app/
│   ├── components/
│   ├── public/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
│
├── compose.yaml            # Docker Compose
├── .env.example            # Biến môi trường mẫu
├── .gitignore
└── README.md
```

## 5. Yêu cầu hệ thống

Để chạy BrewLite bằng Docker Compose, cần cài đặt:

- Git
- Docker Desktop (Windows/macOS) hoặc Docker Engine (Linux)
- Docker Compose

**Lưu ý:** Khi sử dụng Docker, không cần cài đặt Node.js hoặc PostgreSQL riêng trên máy.

Kiểm tra Docker:

```bash
docker --version
docker compose version
```

Đảm bảo Docker Engine đã khởi động trước khi tiếp tục.

## 6. Hướng dẫn cài đặt và chạy dự án

### Bước 1: Clone repository

```bash
git clone https://github.com/nvthuan06/CONGNGHEPHANMEM.git
cd CONGNGHEPHANMEM
```

### Bước 2: Cấu hình biến môi trường

Tại thư mục gốc, sao chép file `.env.example` thành `.env`.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**Linux/macOS:**

```bash
cp .env.example .env
```

Mở file `.env` và thay các giá trị mẫu:

```env
DB_PASSWORD=your_secure_database_password
JWT_SECRET=your_long_random_jwt_secret
```

Trong đó:

| Biến | Mô tả |
|---|---|
| `DB_PASSWORD` | Mật khẩu PostgreSQL |
| `JWT_SECRET` | Khóa bí mật dùng để ký JWT |

**Quan trọng:**

- Thay các giá trị mẫu bằng giá trị đủ mạnh trước khi chạy.
- Không commit file `.env` lên GitHub.
- File `.env.example` chỉ dùng làm mẫu và không chứa thông tin bí mật thật.

### Bước 3: Build và khởi chạy

Chạy lệnh sau tại thư mục gốc:

```bash
docker compose up -d --build
```

Lệnh này sẽ:

1. Tải PostgreSQL image nếu chưa có.
2. Build Docker image cho Backend NestJS.
3. Build Docker image cho Frontend Next.js.
4. Tạo Docker network và volume.
5. Khởi chạy ba container.

### Bước 4: Kiểm tra trạng thái container

```bash
docker compose ps
```

Kết quả mong đợi:

| Service | Trạng thái |
|---|---|
| `db` | Up (healthy) |
| `backend` | Up |
| `frontend` | Up |

### Bước 5: Truy cập ứng dụng

Sau khi các container chạy thành công:

| Thành phần | Địa chỉ |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:3001 |
| API sản phẩm | http://localhost:3001/products |

Có thể truy cập Frontend, đăng ký tài khoản mới và đăng nhập để sử dụng hệ thống.

## 7. Cấu hình Docker Compose

Dự án bao gồm ba service:

### PostgreSQL (`db`)

- Sử dụng image `postgres:17-alpine`.
- Lưu dữ liệu trong Docker volume `postgres_data`.
- Có healthcheck kiểm tra trạng thái sẵn sàng.
- Chỉ truy cập qua mạng nội bộ Docker.

### NestJS Backend (`backend`)

- Build từ `backend/Dockerfile`.
- Lắng nghe tại cổng `3001`.
- Kết nối PostgreSQL thông qua hostname `db`.
- Sử dụng `JWT_SECRET` từ file `.env`.
- Chờ PostgreSQL đạt trạng thái healthy trước khi khởi chạy.

### Next.js Frontend (`frontend`)

- Build từ `frontend/Dockerfile`.
- Lắng nghe tại cổng `3000`.
- Sử dụng API URL `http://localhost:3001`.
- Phụ thuộc vào service Backend.

## 8. Các lệnh Docker thường dùng

### Khởi chạy hệ thống

```bash
docker compose up -d
```

### Build lại và khởi chạy

```bash
docker compose up -d --build
```

### Xem trạng thái container

```bash
docker compose ps
```

### Xem log toàn bộ hệ thống

```bash
docker compose logs -f
```

### Xem log Backend

```bash
docker compose logs -f backend
```

### Xem log Frontend

```bash
docker compose logs -f frontend
```

### Khởi động lại hệ thống

```bash
docker compose restart
```

### Dừng và xóa container

```bash
docker compose down
```

Lệnh này không xóa Docker volume chứa dữ liệu PostgreSQL.

### Xóa container và dữ liệu PostgreSQL

```bash
docker compose down -v
```

**Cảnh báo:** Lệnh trên xóa Docker volume của dự án, có thể làm mất toàn bộ dữ liệu PostgreSQL đang lưu trong volume.

Chỉ sử dụng khi thực sự muốn đặt lại dữ liệu.

## 9. Kiểm tra hệ thống

### Kiểm tra Frontend

```bash
curl -I http://localhost:3000
```

Kết quả mong đợi: `HTTP/1.1 200 OK`.

### Kiểm tra Backend

```bash
curl -i http://localhost:3001
```

Kết quả mong đợi: `HTTP/1.1 200 OK`.

### Kiểm tra API sản phẩm

```bash
curl -i http://localhost:3001/products
```

Kết quả mong đợi: `HTTP/1.1 200 OK` và dữ liệu sản phẩm ở định dạng JSON.

### Kiểm tra giao diện

1. Truy cập `http://localhost:3000`.
2. Kiểm tra danh sách sản phẩm.
3. Đăng ký tài khoản.
4. Đăng nhập bằng tài khoản vừa đăng ký.
5. Kiểm tra các chức năng đặt hàng và lịch sử đơn hàng khi cần.

## 10. Lưu ý khi triển khai

- Đảm bảo cổng `3000` và `3001` không bị ứng dụng khác chiếm dụng.
- PostgreSQL trong Docker sử dụng volume riêng, không tự động sử dụng dữ liệu PostgreSQL cài trực tiếp trên máy.
- File `.env` cần được tạo trước khi chạy Docker Compose.
- Không chia sẻ `DB_PASSWORD` hoặc `JWT_SECRET` thật.
- Khi thay đổi mã nguồn Frontend hoặc Backend, sử dụng `docker compose up -d --build` để build lại image.
- Khi khởi động lại máy, cần đảm bảo Docker Engine đang chạy trước khi sử dụng Docker Compose.

---

**BrewLite – Đồ án Công nghệ Phần mềm | Nhóm 12**