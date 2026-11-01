# BLACK APPLE — Vũ trụ Nhân vật & Hồ sơ Nghệ thuật

Nền tảng hồ sơ nhân vật, vũ trụ sáng tác và lưu trữ trực tuyến của tác giả **Táo.** (Creator Roleplay AI).

## 🚀 Tính năng chính

- **Hồ sơ nhân vật (Character Dossier)**: Trình bày chi tiết ngoại hình, tính cách, bối cảnh, quan hệ xã hội, trích dẫn, ảnh đại diện, poster và bộ sưu tập ảnh.
- **Audio Player đương đại**: Trình phát nhạc nền không gián đoạn xuyên suốt các trang với danh sách phát tùy chỉnh.
- **Hệ thống Quản trị (Admin Panel)**: Dành riêng cho tài khoản `anhitoo8@gmail.com` để chỉnh sửa nhân vật, upload ảnh, quản lý danh mục và duyệt confession.
- **Biểu mẫu Đặt Commission**: Nhận brief đặt prompt Roleplay AI từ độc giả với thông tin liên hệ Discord/Facebook và thời hạn mong muốn.
- **Lưu trữ Cloud Firebase**: Tích hợp Firebase Firestore thời gian thực và xác thực bảo mật Firebase Auth.

---

## 🛠️ Công nghệ sử dụng

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Motion (Framer Motion)
- **Icons**: Lucide React
- **Routing**: React Router v7
- **Database & Auth**: Google Firebase Firestore & Firebase Authentication

---

## 📦 Hướng dẫn cài đặt & chạy Local

```bash
# 1. Cài đặt dependencies
npm install

# 2. Khởi chạy môi trường phát triển
npm run dev

# 3. Kiểm tra lỗi mã nguồn (Lint)
npm run lint

# 4. Đóng gói cho Production
npm run build
```

---

## 🌐 Triển khai trên Vercel (Deployment)

Dự án đã được tích hợp sẵn cấu hình `vercel.json` phục vụ điều hướng Single Page Application (SPA).

1. Truy cập [Vercel](https://vercel.com/) và bấm **Add New Project**.
2. Chọn repository `nhiendie57-creator/blackapple` từ GitHub của bạn.
3. Cấu hình triển khai:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Bấm **Deploy**.

> ⚠️ **Lưu ý quan trọng về Firebase Google Auth trên Vercel**:
> Sau khi website được triển khai và có tên miền Vercel (ví dụ `blackapple.vercel.app`), hãy truy cập:
> **Firebase Console** -> **Authentication** -> thẻ **Settings** -> mục **Authorized domains** -> Bấm **Add domain** và nhập tên miền Vercel của bạn để tính năng Đăng nhập Admin Google hoạt động bình thường.
