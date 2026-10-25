# BrewLite – Coffee Shop Management System

BrewLite là đồ án học phần **Công nghệ Phần mềm**, xây dựng hệ thống bán hàng và quản lý đơn hàng cho cửa hàng cà phê.

## 1. Thông tin đồ án

- **Học phần:** Công nghệ Phần mềm
- **Giảng viên hướng dẫn:** Từ Lãng Phiêu
- **Nhóm:** 12

| STT | Họ và tên | MSSV |
|---|---|---|
| 1 | Vãn Nguyễn Đức Thịnh | 3124410344 |
| 2 | Nguyễn Vũ Thuần | 3124410347 |
| 3 | Nguyễn Triệu Thiên | 3124410335 |
| 4 | Trần Diệu Vi | 3124410402 |
| 5 | Lâm Thái Thuận | 3124410346 |
| 6 | Ngô Đông Ất | 3123410014 |

## 2. Chức năng chính

- Đăng ký, đăng nhập bằng tài khoản người dùng.
- Xem sản phẩm, chi tiết sản phẩm và quản lý giỏ hàng.
- Tạo đơn hàng, xem trang thanh toán và trạng thái đơn hàng.
- Xem lịch sử đơn hàng.
- Tích hợp webhook SePay để kiểm thử xác nhận thanh toán bằng chuyển khoản.

## 3. Công nghệ và kiến trúc

| Thành phần | Công nghệ | Truy cập từ máy chạy Docker |
|---|---|---|
| Frontend | Next.js, React, TypeScript | http://localhost:3000 |
| Backend | NestJS, TypeScript | http://localhost:3001 |
| Database | PostgreSQL 17 | Chỉ trong mạng Docker |
| Triển khai | Docker, Docker Compose | `compose.yaml` |
| Xác thực | JWT | Qua Backend |

Luồng cơ bản: **Trình duyệt → Next.js → NestJS → PostgreSQL**. Để nhận webhook từ SePay qua Internet trong lúc thử nghiệm: **SePay → Cloudflare Tunnel HTTPS → `localhost:3001` → NestJS → PostgreSQL**.

## 4. Cấu trúc thư mục

```text
CONGNGHEPHANMEM/
├── backend/
│   ├── src/
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── app/
│   ├── components/
│   ├── public/
│   ├── Dockerfile
│   └── .dockerignore
├── compose.yaml
├── .env.example
├── .gitignore
└── README.md
```

## 5. Cài đặt và chạy bằng Docker Compose

### Yêu cầu

- Git và Docker Desktop (Windows/macOS) hoặc Docker Engine + Docker Compose (Linux).
- Docker Engine đang hoạt động.
- Cổng `3000` và `3001` chưa bị chương trình khác chiếm dụng.

Khi chạy bằng Docker, không cần cài Node.js hoặc PostgreSQL trực tiếp trên máy.

### Bước 1 – Clone repository

```bash
git clone https://github.com/nvthuan06/CONGNGHEPHANMEM.git
cd CONGNGHEPHANMEM
```

### Bước 2 – Cấu hình môi trường

Tại thư mục gốc, tạo `.env` từ `.env.example`:

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**Linux/macOS:**

```bash
cp .env.example .env
```

Sửa file `.env` với giá trị bí mật riêng:

```dotenv
DB_PASSWORD=your_secure_database_password
JWT_SECRET=your_long_random_jwt_secret
```

Không commit `.env`, khóa webhook, token hay mật khẩu thật lên Git.

### Bước 3 – Khởi chạy

```bash
docker compose up -d --build
docker compose ps
```

Dự kiến `db` ở trạng thái `healthy`, `backend` và `frontend` ở trạng thái `Up`.

Truy cập:

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- API sản phẩm: http://localhost:3001/products

Đăng ký tài khoản mới và đăng nhập để thử các chức năng. PostgreSQL trong Docker dùng volume riêng, không tự động dùng chung dữ liệu với PostgreSQL cài trên Windows.

## 6. Các lệnh Docker hữu ích

```bash
# Xem container
docker compose ps

# Xem log Backend
docker compose logs -f backend

# Xem log toàn hệ thống
docker compose logs -f

# Build lại sau khi sửa code
docker compose up -d --build

# Khởi động lại
docker compose restart

# Dừng và xóa container, giữ volume dữ liệu
docker compose down
```

**Cảnh báo:** `docker compose down -v` còn xóa volume PostgreSQL và có thể làm mất dữ liệu thử nghiệm.

## 7. Hướng dẫn kiểm thử tích hợp SePay Test Mode trên Docker

> **Chỉ sử dụng môi trường thử nghiệm.** Không sử dụng tài khoản hoặc chuyển tiền thật để thử các trường hợp chưa được đối soát và xác thực đầy đủ.

### 7.1. Điều kiện trước khi thử

1. Docker Compose đang chạy và `docker compose ps` hiển thị ba service hoạt động.
2. Có tài khoản BrewLite và đăng nhập được tại `http://localhost:3000`.
3. Có quyền cấu hình webhook trong môi trường **SePay Test Mode**.
4. Có Cloudflare Tunnel (`cloudflared`) để SePay truy cập Backend chạy trên máy cục bộ.
5. Chuẩn bị thông tin cấu hình webhook theo thiết lập của môi trường SePay Test Mode; không công khai thông tin xác thực.

### 7.2. Kiểm tra Backend

**PowerShell:**

```powershell
curl.exe -i http://localhost:3001
curl.exe -i http://localhost:3001/products
```

Kết quả mong đợi là phản hồi HTTP thành công; API `/products` trả JSON danh sách sản phẩm.

### 7.3. Cài và chạy Cloudflare Tunnel trên Windows

Có thể cài bằng Windows Package Manager:

```powershell
winget install --id Cloudflare.cloudflared -e
```

Mở PowerShell mới và thử:

```powershell
cloudflared --version
```

Nếu PowerShell chưa nhận lệnh nhưng file đã được cài ở vị trí mặc định trên máy thử nghiệm, dùng đường dẫn đầy đủ:

```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" --version
```

**Mở một cửa sổ PowerShell riêng** và chạy tunnel:

```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3001
```

Nếu `cloudflared` đã có trong `PATH`, có thể dùng lệnh ngắn:

```powershell
cloudflared tunnel --url http://localhost:3001
```

Chờ công cụ hiển thị URL HTTPS dạng `https://<random>.trycloudflare.com`. **Giữ cửa sổ tunnel mở** trong suốt thời gian kiểm thử. Đây là URL tạm, có thể đổi sau mỗi lần chạy.

> Tunnel công khai cho phép người bên ngoài gửi HTTP request đến Backend. Chỉ bật khi thử nghiệm, đảm bảo endpoint webhook có cơ chế xác thực phù hợp, và tắt sau khi xong.

### 7.4. Cấu hình webhook trong SePay Test Mode

Trong phần quản lý webhook của SePay Test Mode, cấu hình URL theo mẫu:

```text
https://<random>.trycloudflare.com/payments/sepay-webhook
```

Thay `<random>` bằng hostname thực tế Cloudflare Tunnel cấp. **Không dùng `localhost:3001` làm URL webhook trên SePay**, vì SePay không truy cập được `localhost` trên máy cá nhân của bạn.

Phương thức: **POST**. Lưu cấu hình webhook theo thiết lập xác thực của môi trường thử nghiệm. Không đưa token xác thực, API key hoặc URL có bí mật vào README.

**Kiểm tra đường đi:** truy cập `https://<random>.trycloudflare.com/` trong trình duyệt. Nếu nhận phản hồi từ NestJS (trong bản đã kiểm thử là `Hello World!`) thì tunnel đã chuyển tiếp được HTTP. Kiểm tra này **chưa chứng minh webhook thanh toán hoạt động đúng**.

### 7.5. Thử giao dịch từ giao diện BrewLite

1. Mở http://localhost:3000 và đăng nhập.
2. Chọn sản phẩm, thêm vào giỏ và đặt hàng.
3. Xác nhận trang thanh toán hiển thị mã đơn, QR và trạng thái `PENDING`.
4. Dùng **công cụ tạo giao dịch thử nghiệm của SePay Test Mode** theo quy trình của nhóm; nội dung giao dịch phải chứa mã đơn hàng, ví dụ `DH18` hoặc `ORDER18` cho đơn `18`.
5. Kiểm tra SePay có gửi webhook đến URL tunnel và xem kết quả nhận webhook.
6. Kiểm tra log Backend và tải lại/trông chờ giao diện cập nhật trạng thái. Chỉ đánh dấu **PASS `PENDING → PAID`** nếu giao dịch hợp lệ được Backend ghi nhận và trạng thái đơn thực sự chuyển sang `PAID`.
7. Mở lịch sử đơn hàng để kiểm tra trạng thái tương ứng.

Xem log Backend:

```powershell
docker compose logs -f backend
```

Dừng theo dõi log bằng `Ctrl+C` (không dừng container). **Không cần sửa hoặc tạo giao dịch thật** chỉ để kiểm tra webhook.

### 7.6. Các tình huống kiểm thử

| Tình huống | Cách kiểm tra | Kết quả mong đợi |
|---|---|---|
| Tạo đơn mới | Đặt hàng từ giỏ hàng | Đơn được tạo với trạng thái `PENDING`, hiển thị mã đơn và QR |
| Giao dịch đúng mã, đủ tiền | Tạo giao dịch thử trong SePay Test Mode | Webhook được tiếp nhận; đơn chuyển thành `PAID` khi Backend xác nhận hợp lệ |
| Giao dịch thiếu tiền | Tạo giao dịch thử có `transferAmount` nhỏ hơn tổng đơn | Đơn không chuyển sang `PAID` |
| Nội dung không có mã đơn | Tạo giao dịch thử không chứa `DH<id>` hoặc `ORDER<id>` | Không đánh dấu thanh toán cho đơn hàng |
| Mã đơn không tồn tại | Tạo giao dịch thử với mã đơn không có trong database | Không thay đổi trạng thái đơn khác |
| Gửi lại thông báo cho đơn đã thanh toán | Phát lại webhook thử nghiệm | Đơn vẫn ở trạng thái `PAID`, không thay đổi trạng thái ngoài ý muốn |

Khi kiểm thử, đối chiếu cả **kết quả gửi webhook trên SePay**, **log Backend** và **trạng thái đơn hàng trên BrewLite**. Một yêu cầu HTTP gửi thành công chưa đủ để kết luận thanh toán đã được xác nhận.

### 7.7. Xử lý sự cố webhook

**SePay báo timeout/không thể kết nối:**

- Kiểm tra Docker còn chạy: `docker compose ps`.
- Kiểm tra `http://localhost:3001` còn phản hồi.
- Kiểm tra cửa sổ Cloudflare Tunnel còn mở.
- Kiểm tra URL trong SePay có đúng hostname tunnel **hiện tại** và đường dẫn `/payments/sepay-webhook`.

**SePay báo phản hồi không đúng quy cách hoặc body thiếu `{"success": true}`:**

- Xem HTTP status và JSON response trong lịch sử webhook trên SePay.
- Kiểm tra Backend có trả đúng định dạng phản hồi mà SePay yêu cầu hay không.
- Nếu thấy HTTP `201`, kiểm tra cấu hình mã trạng thái của endpoint POST trong NestJS.
- Kiểm tra log Backend để xác định giao dịch được xử lý hay bị bỏ qua; không đánh dấu đơn là đã thanh toán chỉ để tạo phản hồi thành công.

**Đơn vẫn `PENDING`:**

- Kiểm tra log để xác định webhook có tới Backend không.
- Kiểm tra mã đơn trong `content` và `transferAmount` có hợp lệ không.
- Kiểm tra webhook có bị SePay từ chối do phản hồi sai định dạng không.
- Kiểm tra dữ liệu đơn hàng trên **PostgreSQL Docker**, không nhầm với database cài trực tiếp trên Windows.

### 7.8. Dừng tunnel sau kiểm thử

Nhấn `Ctrl+C` trong cửa sổ PowerShell đang chạy `cloudflared`. Có thể tắt webhook thử nghiệm trong SePay nếu không còn sử dụng.

## 8. Lưu ý khi kiểm thử thanh toán

- Chỉ dùng SePay Test Mode và dữ liệu thử nghiệm theo quy trình kiểm thử của nhóm.
- Không đưa mật khẩu, token, API key hoặc thông tin xác thực webhook vào Git.
- Chỉ xác nhận giao dịch thành công khi mã đơn, số tiền và trạng thái trong hệ thống khớp với dữ liệu kiểm thử.
- Dừng Cloudflare Tunnel khi hoàn tất kiểm thử để ngừng công khai Backend cục bộ.
- Trước khi triển khai thanh toán thật, cần kiểm thử đầy đủ xác thực webhook, chống xử lý trùng, đối soát số tiền và các trường hợp lỗi.

---

**BrewLite – Đồ án Công nghệ Phần mềm | Nhóm 12**
