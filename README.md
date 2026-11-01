# BLACK APPLE — Vũ trụ Nhân vật & Hồ sơ Nghệ thuật

Nền tảng hồ sơ nhân vật, vũ trụ sáng tác và lưu trữ trực tuyến của tác giả **Táo.** (Creator Roleplay AI).

Website được cấu hình sẵn sàng để triển khai trực tiếp trên **GitHub Pages** tại địa chỉ:
👉 **`https://nhiendie57-creator.github.io/blackapple/`**

---

## 🚀 Tính năng chính

- **Hồ sơ nhân vật (Character Dossier)**: Trình bày chi tiết ngoại hình, tính cách, bối cảnh, quan hệ xã hội, trích dẫn, ảnh đại diện, poster và bộ sưu tập ảnh.
- **Audio Player đương đại**: Trình phát nhạc nền không gián đoạn xuyên suốt các trang với danh sách phát tùy chỉnh.
- **Hệ thống Quản trị (Admin Panel)**: Dành riêng cho tài khoản quản trị `anhitoo8@gmail.com` để thêm, sửa, xóa nhân vật, cập nhật ảnh bìa/avatar bằng URL hoặc tải từ thiết bị, quản lý danh mục và duyệt confession.
- **Biểu mẫu Đặt Commission Roleplay AI**: Nhận brief đặt prompt Roleplay AI từ độc giả với thông tin liên hệ Discord/Facebook và thời hạn mong muốn.
- **Lưu trữ Cloud Firebase**: Sử dụng Firebase Firestore thời gian thực và xác thực bảo mật Firebase Auth.

---

## 🛠️ Công nghệ sử dụng

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Motion (Framer Motion)
- **Icons**: Lucide React
- **Routing**: React Router v7 (tương thích GitHub Pages base path & 404 SPA fallback)
- **Database & Auth**: Google Firebase Firestore & Firebase Authentication
- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml`)

---

## 🌐 Hướng dẫn Kích hoạt GitHub Pages (3 bước đơn giản)

Sau khi push mã nguồn lên repository `nhiendie57-creator/blackapple`:

### Bước 1: Bật GitHub Actions cho GitHub Pages
1. Mở repository `https://github.com/nhiendie57-creator/blackapple` trên trình duyệt.
2. Bấm vào tab **Settings** (ở thanh menu phía trên).
3. Ở menu bên trái, tìm và chọn mục **Pages**.
4. Tại phần **Build and deployment**:
   - Ở mục **Source**, chọn: **`GitHub Actions`** (thay vì "Deploy from a branch").
5. GitHub Actions sẽ tự động phát hiện file `.github/workflows/deploy.yml` và kích hoạt luồng build & deploy tự động.

### Bước 2: Thêm tên miền vào Firebase Authorized Domains
Để tính năng đăng nhập Quản trị viên Google hoạt động trên GitHub Pages:
1. Truy cập [Firebase Console](https://console.firebase.google.com/).
2. Chọn dự án `gen-lang-client-0749173268` (hoặc tên dự án Firebase của bạn).
3. Vào mục **Authentication** ở menu bên trái -> Bấm sang thẻ **Settings**.
4. Cuộn xuống phần **Authorized domains** (Miền được ủy quyền) -> Bấm **Add domain**.
5. Nhập:
   ```text
   nhiendie57-creator.github.io
   ```
6. Bấm **Add** để lưu lại.

### Bước 3: Truy cập website
Website của bạn sẽ xuất hiện tại:
👉 **`https://nhiendie57-creator.github.io/blackapple/`**

---

## 💻 Hướng dẫn chạy và kiểm tra cục bộ (Local)

```bash
# Cài đặt dependencies
npm install

# Chạy môi trường phát triển (Dev Server)
npm run dev

# Kiểm tra cú pháp & type check (Lint)
npm run lint

# Đóng gói sản phẩm (Build Production)
npm run build
```
