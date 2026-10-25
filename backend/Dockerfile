
# Sử dụng Node.js 22 trên Linux
FROM node:22-bookworm-slim

# Thư mục làm việc trong container
WORKDIR /app

# Cài dependencies theo package-lock.json
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Sao chép mã nguồn và ảnh sản phẩm
COPY . .

# Build ứng dụng NestJS
RUN npm run build

# Backend chạy tại cổng 3001
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Khởi động Backend
CMD ["npm", "run", "start:prod"]
