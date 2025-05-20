# Rich Editor

Một rich text editor hiện đại, nhẹ và dễ tùy chỉnh, được xây dựng bằng JavaScript thuần. Editor này cung cấp giao diện người dùng thân thiện và nhiều tính năng phong phú tương tự như TinyMCE hoặc Quill.

## 🛠 Công nghệ sử dụng

- **JavaScript ES6+**: Ngôn ngữ lập trình chính
- **HTML5**: Cấu trúc và semantic markup
- **CSS3**: Styling và animations
- **Font Awesome**: Icon library
- **Vite**: Development server và build tool

## 📁 Cấu trúc dự án

```
richeditor/
├── src/
│   ├── lib/
│   │   └── Editor.js      # Core editor logic
│   └── style.css          # Main styles
├── public/
│   └── index.html         # Demo page
├── package.json           # Dependencies và scripts
├── vite.config.js         # Vite configuration
└── README.md             # Documentation
```

## 🚀 Cài đặt & Chạy

### Yêu cầu hệ thống
- Node.js >= 14.0.0
- npm >= 6.0.0

### Cài đặt

```bash
# Clone repository
git clone https://github.com/yourusername/richeditor.git

# Di chuyển vào thư mục dự án
cd richeditor

# Cài đặt dependencies
npm install
```

### Chạy môi trường development

```bash
# Chạy development server
npm run dev

# Build cho production
npm run build

# Preview build
npm run preview
```

### Cấu hình Vite

```javascript
// vite.config.js
export default {
  root: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'public/index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
}
```

## 💻 Sử dụng

```html
<!-- Thêm Font Awesome cho icons -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

<!-- Thêm editor vào trang -->
<div id="editor"></div>

<script type="module">
  import { createEditor } from './src/lib/Editor.js';

  // Khởi tạo editor với options
  const editor = createEditor('#editor', {
    toolbar: [
      'bold', 'italic', 'underline', 'strike', 'emoji', 'image', 'link', 'table', 'undo', 'redo'
    ],
    placeholder: 'Type here...',
    theme: 'light',
    height: 400,
    width: 800,
    maxWidth: 1200,
    maxHeight: 800,
    features: {
      emoji: true,
      image: true,
      table: true,
      wordCount: true,
      breadcrumb: true
    },
    blockToolbarFeatures: [
      'image', 'table', 'heading', 'list', 'quote', 'code'
    ]
  });
</script>
```

## 🔧 Phát triển

### Cấu trúc code

- **Editor.js**: Class chính chứa toàn bộ logic của editor
  - `constructor()`: Khởi tạo editor với options
  - `init()`: Khởi tạo UI và bind events
  - `createToolbar()`: Tạo thanh công cụ
  - `bindEvents()`: Xử lý các sự kiện
  - `createBlockToolbar()`: Tạo floating toolbar

### Quy ước code

- Sử dụng ES6+ features
- Tuân thủ camelCase cho variables và functions
- Comment đầy đủ cho các methods phức tạp
- Sử dụng async/await cho các operations bất đồng bộ

### Debug

```bash
# Chạy với source maps
npm run dev

# Build với source maps
npm run build -- --sourcemap
```

### Testing

```bash
# Chạy tests
npm test

# Chạy tests với coverage
npm run test:coverage
```

## 🌟 Tính năng

- **Định dạng văn bản cơ bản**
  - In đậm, in nghiêng, gạch chân, gạch ngang
  - Chỉ số trên, chỉ số dưới
  - Căn lề trái, phải, giữa
  - Đổi font chữ

- **Định dạng khối**
  - Heading (H1, H2)
  - Blockquote
  - Code block
  - Danh sách có thứ tự và không thứ tự

- **Chèn nội dung**
  - Hình ảnh (từ URL hoặc upload)
  - Bảng (với khả năng resize)
  - Link
  - Emoji

- **Tính năng nâng cao**
  - Floating toolbar khi select text
  - Block toolbar khi tạo dòng mới
  - Resize ảnh và bảng
  - Xem/sửa mã nguồn HTML
  - Đếm từ và ký tự
  - Breadcrumb hiển thị cấu trúc HTML
  - Undo/Redo
  - Chọn màu chữ và màu nền

## ⚙️ Tùy chỉnh

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| toolbar | Array | [...] | Danh sách các nút trong toolbar |
| placeholder | String | 'Type here...' | Placeholder text |
| theme | String | 'light' | Theme của editor ('light' hoặc 'dark') |
| height | Number | 400 | Chiều cao editor (px) |
| width | Number | 800 | Chiều rộng editor (px) |
| maxWidth | Number | 1200 | Chiều rộng tối đa (px) |
| maxHeight | Number | 800 | Chiều cao tối đa (px) |
| features | Object | {...} | Các tính năng được bật/tắt |
| blockToolbarFeatures | Array | [...] | Các tính năng trong block toolbar |

### Features

```javascript
features: {
  emoji: true,      // Bật/tắt chèn emoji
  image: true,      // Bật/tắt chèn ảnh
  table: true,      // Bật/tắt chèn bảng
  wordCount: true,  // Bật/tắt đếm từ
  breadcrumb: true  // Bật/tắt hiển thị breadcrumb
}
```

## 🎨 Styling

Editor sử dụng CSS thuần và có thể dễ dàng tùy chỉnh thông qua CSS. Các class chính:

- `.editor-wrapper`: Wrapper chính của editor
- `.toolbar`: Thanh công cụ chính
- `.editor-area`: Vùng soạn thảo
- `.editor-statusbar`: Thanh trạng thái
- `.block-toolbar`: Toolbar nổi khi select text
- `.table-toolbar`: Toolbar cho bảng
- `.toolbar-btn`: Style cho các nút trong toolbar

## 📝 API

### Methods

- `createEditor(selector, options)`: Khởi tạo editor mới
- `toggleSourceView()`: Chuyển đổi giữa chế độ soạn thảo và xem mã nguồn
- `updateStatusbar()`: Cập nhật thanh trạng thái
- `showBlockToolbar(rect)`: Hiển thị block toolbar
- `hideBlockToolbar()`: Ẩn block toolbar

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Vui lòng:

1. Fork dự án
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

MIT License - Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 👥 Tác giả

- Tên của bạn - [@yourusername](https://github.com/yourusername)

## 🙏 Cảm ơn

- Font Awesome cho icons
- Tất cả contributors đã đóng góp cho dự án 