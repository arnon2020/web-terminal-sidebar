# Contributing to Web Terminal Sidebar

สวัสดี! ขอบคุณที่สนใจร่วมพัฒนา Web Terminal Sidebar 🎉

## 🚀 เริ่มต้นพัฒนา (Quick Start)

### 1. Clone Repository

```bash
git clone https://github.com/arnon2020/web-terminal-sidebar.git
cd web-terminal-sidebar
```

### 2. Install Dependencies

```bash
npm install
```

### 3. เริ่ม Development Server

```bash
# Terminal 1: เริ่ม ttyd backend
ttyd bash

# Terminal 2: เริ่ม Vite dev server
npm run dev
```

เปิด browser ที่: http://localhost:5173

### 4. เริ่มแก้โค้ด

ไฟล์หลักที่ต้องแก้:
- `src/App.jsx` - React component หลัก
- `index.html` - HTML + CSS styles

## 📁 โครงสร้างโปรเจ็กต์

```
web-terminal-sidebar/
├── src/
│   ├── App.jsx          # ⭐ Main React component (logic)
│   ├── main.jsx         # React entry point
│   └── index.css        # Additional CSS
├── index.html           # ⭐ HTML + main CSS styles
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
├── .gitignore          # Git ignore rules
└── README.md           # Project documentation
```

## 🛠️ Development Workflow

### การแก้ไขโค้ด

```bash
# 1. แก้ไขไฟล์ (เช่น src/App.jsx)
vim src/App.jsx

# 2. Vite จะ auto-reload ให้เลย
# เปิด browser ดูผลลัพธ์ทันที
```

### Build สำหรับ Production

```bash
npm run build
```

ไฟล์จะถูกสร้างใน `dist/`

### Preview Production Build

```bash
npm run preview
```

## 🎨 การแก้ไข Styles

### วิธีแรก: แก้ใน `index.html` (ง่ายที่สุด)

```html
<!-- index.html -->
<style>
  .terminal-item {
    padding: 15px; /* เปลี่ยนตรงนี้ */
  }
</style>
```

### วิธีที่สอง: ใช้ CSS Module

สร้างไฟล์ใหม่ `src/App.css`:

```css
/* src/App.css */
.my-custom-class {
  background: red;
}
```

แล้ว import ใน `src/App.jsx`:

```jsx
import './App.css';

function App() {
  return <div className="my-custom-class">...</div>;
}
```

## 🔧 งานที่ทำได้ (Ideas)

### Easy (เหมาะสำหรับมือใหม่)
- [ ] เพิ่ม keyboard shortcuts (เช่น Ctrl+T เพื่อสร้าง terminal ใหม่)
- [ ] เพิ่ม theme selector (dark/light mode)
- [ ] เพิ่ม export/import settings
- [ ] เพิ่ม search bar สำหรับค้นหา terminal

### Medium
- [ ] บันทึก terminal layout ไว้ใน localStorage
- [ ] เพิ่ม drag & drop สำหรับจัดลำดับ terminal
- [ ] เพิ่ม terminal groups (folder)
- [ ] เพิ่ม stats แสดงจำนวน terminal ที่เปิดอยู่

### Hard (ท้าทาย)
- [ ] สร้าง native desktop app ด้วย Electron
- [ ] สนับสนุน SSH connection โดยตรง
- [ ] เพิ่ม split view (แนวตั้ง/แนวนอน)
- [ ] สร้าง plugin system

## 📝 ส่ง Pull Request

1. Fork repository
2. สร้าง branch ใหม่: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. เปิด Pull Request ที่ GitHub

### Commit Message Guidelines

```
type(scope): description

# Examples
feat(terminal): Add keyboard shortcut for new terminal
fix(sidebar): Correct alignment on mobile devices
docs(readme): Update installation instructions
style(css): Improve hover effects
```

Types:
- `feat` - ฟีเจอร์ใหม่
- `fix` - แก้บั๊ก
- `docs` - เอกสาร
- `style` - จัดรูปแบบ
- `refactor` - ปรับโครงสร้าง
- `test` - เทส
- `chore` - งานอื่นๆ

## 🐛 รายงาน Bug

ใช้ GitHub Issues: https://github.com/arnon2020/web-terminal-sidebar/issues

ใส่ข้อมูล:
- Version ที่ใช้
- OS และ Browser
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (ถ้ามี)

## 💬 พูดคุย

- GitHub Issues: สำหรับ bug reports และ feature requests
- GitHub Discussions: สำหรับคำถามทั่วไป

## 📄 License

โค้ดที่ส่งมาจะถูกจัดจำหน่ายภายใต้ MIT License เหมือนกับโปรเจคนี้

---

**ขอบคุณที่ร่วมพัฒนา! 🙏**
