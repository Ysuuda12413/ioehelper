# 🚀 IOE Helper - Minimal Whisper API

## ✨ Tính năng

- ✅ **Cực kỳ nhẹ** - Chỉ có API, không có UI phức tạp
- ✅ **Tự động** - Script tự tạo iframe ẩn, không cần mở tab
- ✅ **Nhanh** - Whisper Tiny model (~40MB)
- ✅ **Đơn giản** - Chỉ cần paste 1 script vào console

## 🎯 Cách sử dụng

### Bước 1: Paste script vào Console trang IOE

Mở Console (F12) trên trang làm bài IOE, paste toàn bộ code từ file `ioe.js`

### Bước 2: Làm bài bình thường

Script sẽ tự động:

- ✅ Bắt API request và hiển thị câu hỏi + đáp án
- ✅ Phát hiện câu listening
- ✅ Tự động load Whisper API trong iframe ẩn

### Bước 3: Transcribe audio

Khi gặp câu listening, gõ:

```javascript
transcribe(1)  // Nhận diện câu 1
transcribe(2)  // Nhận diện câu 2
```

Kết quả sẽ hiện ngay trong console!

## 🔧 Lệnh có sẵn

```javascript
showAll()          // Xem tất cả đáp án
playAudio(số)      // Phát audio
transcribe(số)     // Nhận diện giọng nói (auto)
```

## 📦 Deploy lên GitHub Pages

### Cài đặt

```bash
npm install
```

### Build

```bash
npm run build
```

### Deploy

```bash
npm run deploy
```

Hoặc dùng GitHub Actions (tự động khi push):

- File workflow: `.github/workflows/deploy.yml`
- Push lên branch `main` → tự động deploy

## 🌐 URL sau khi deploy

```
https://duyundz.is-a.dev/ioehelper/
```

Script sẽ tự động load từ URL này.

## ⚙️ Cấu hình

### Thay đổi base URL

Trong `ioe.js`, đổi dòng:

```javascript
const API_URL = 'https://duyundz.is-a.dev/ioehelper/';
```

Trong `vite.config.ts`, đổi:

```javascript
base: '/ioehelper/'
```

## 🎯 Architecture

```
┌─────────────────┐
│   IOE Website   │
│   (ioe.vn)      │
└────────┬────────┘
         │
         │ (1) Paste script ioe.js
         ▼
┌─────────────────┐
│   Console       │
│   Script        │
└────────┬────────┘
         │
         │ (2) Auto create iframe
         ▼
┌─────────────────────────┐
│  Hidden Iframe          │
│  duyundz.is-a.dev/...   │
│  ┌───────────────────┐  │
│  │  Whisper Worker   │  │
│  │  (Tiny Model)     │  │
│  └───────────────────┘  │
└────────┬────────────────┘
         │
         │ (3) postMessage API
         ▼
┌─────────────────┐
│  Transcription  │
│  Result         │
└─────────────────┘
```

## 🔥 So sánh phiên bản

| Feature | v6 (Old) | v7 (New) |
|---------|----------|----------|
| Cần mở tab thủ công | ✅ | ❌ |
| Tự động load API | ❌ | ✅ |
| UI phức tạp | ✅ | ❌ |  
| Kích thước | Lớn | Nhỏ |
| Tốc độ | Trung bình | Nhanh |

## 📁 Files quan trọng

```
whisper-web-main/
├── src/
│   ├── App.tsx          ← API endpoint minimal UI
│   └── worker.js        ← Whisper Tiny worker
├── ioe.js               ← Script paste vào IOE (v7 - Auto)
├── vite.config.ts       ← Base path config
└── package.json         ← Deploy script
```

## 🐛 Troubleshooting

### Lỗi: "Whisper API not ready"

- **Nguyên nhân**: Iframe chưa load xong
- **Giải pháp**: Đợi 3-5 giây rồi thử lại

### Lỗi: CORS

- **Nguyên nhân**: Audio server không cho CORS
- **Giải pháp**: Thường không xảy ra vì iframe cùng domain

### Model load chậm

- **Nguyên nhân**: Lần đầu download ~40MB
- **Giải pháp**: Chờ download xong, lần sau dùng cache

---

Made with ❤️ for IOE | Whisper Tiny + Zero UI = 🚀
