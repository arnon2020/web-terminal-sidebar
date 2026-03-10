# Web Terminal Sidebar - Development Roadmap

**Created**: 2026-03-10
**Last Updated**: 2026-03-10

---

## 🎯 Vision

Web-based multi-terminal manager ที่ใช้งานง่าย รวดเร็ว และไม่ลืม sessions

---

## ✅ Completed

| Date | Feature | Commit |
|------|---------|--------|
| 2026-03-08 | Multi-terminal web interface with sidebar | e840063 |
| 2026-03-09 | Comprehensive README | 1b3d797 |
| 2026-03-09 | Multiple ttyd installation options | 1b02941 |
| 2026-03-09 | Contributing guide | f0c45c8 |
| 2026-03-09 | Double-click to rename (inline editing) | e840063 |
| 2026-03-09 | Auto focus on edit input | e840063 |
| 2026-03-09 | Tooltip hints | e840063 |
| 2026-03-10 | Session Persistence (localStorage) | cf75692 |
| 2026-03-10 | Keyboard Shortcuts (Ctrl+1-9, N/T, W) | cf75692 |
| 2026-03-10 | Confirm Before Close dialog | cf75692 |
| 2026-03-10 | Search Terminals | - |
| 2026-03-10 | Terminal Colors/Icons (6 colors) | - |

---

## 🚧 In Progress

_ยังไม่มี_

---

## 📋 Phase 1: Quick Wins (Priority: HIGH) ✅ COMPLETE

| # | Feature | Status | Started | Completed |
|---|---------|--------|---------|-----------|
| 1 | Session Persistence (localStorage) | ✅ DONE | 2026-03-10 | 2026-03-10 |
| 2 | Keyboard Shortcuts (Ctrl+1-9, Ctrl+N, Ctrl+W) | ✅ DONE | 2026-03-10 | 2026-03-10 |
| 3 | Search Terminals | ✅ DONE | 2026-03-10 | 2026-03-10 |
| 4 | Terminal Colors/Icons | ✅ DONE | 2026-03-10 | 2026-03-10 |
| 5 | Confirm Before Close | ✅ DONE | 2026-03-10 | 2026-03-10 |

### Details

#### 1. Session Persistence
```jsx
// เก็บ terminals ใน localStorage
useEffect(() => {
  const saved = localStorage.getItem('terminals');
  if (saved) setTerminals(JSON.parse(saved));
}, []);

useEffect(() => {
  localStorage.setItem('terminals', JSON.stringify(terminals));
}, [terminals]);
```

#### 2. Keyboard Shortcuts
- `Ctrl+1` ถึง `Ctrl+9` - สลับ terminal
- `Ctrl+N` - สร้าง terminal ใหม่
- `Ctrl+W` - ปิด terminal ปัจจุบัน
- `Ctrl+Shift+F` - ค้นหา terminal

#### 3. Search Terminals
- Input สำหรับค้นหาจากชื่อ
- Filter แบบ real-time

#### 4. Terminal Colors/Icons
- เลือกสีจาก preset (🟢 🟡 🔵 🟣 🟠 🔴)
- หรือเลือกไอคอน (🖥️ 🗄️ 🔧 📊 🐳)

#### 5. Confirm Before Close
- Modal ยืนยันก่อนปิด terminal
- หรือใช้ toast notification แทน

---

## 📋 Phase 2: UX Improvements (Priority: MEDIUM)

| # | Feature | Status | Started | Completed |
|---|---------|--------|---------|-----------|
| 6 | Replace prompt() with Modal | 🟡 PARTIAL | - | - |
| 7 | Drag & Drop Reorder | ⬜ TODO | - | - |
| 8 | Terminal Groups/Tabs | ⬜ TODO | - | - |
| 9 | Quick Actions Menu (Right-click) | ⬜ TODO | - | - |
| 10 | Status Indicators | ⬜ TODO | - | - |

### Details

#### 6. Replace prompt() with Modal
- ✅ Done: Double-click inline editing for rename
- ❌ TODO: Replace `prompt()` for new terminal name
- Inline input หรือ modal component สำหรับสร้างใหม่

#### 7. Drag & Drop Reorder
- ใช้ react-beautiful-dnd หรือ dnd-kit
- เรียงลำดับ terminals ตามใจ

#### 8. Terminal Groups/Tabs
- จัดกลุ่มตามโปรเจค
- เช่น "Project A" → backend, frontend, db

#### 9. Quick Actions Menu
- Right-click context menu
- Rename, Duplicate, Change Color, Close

#### 10. Status Indicators
- แสดงว่า terminal กำลังรันอะไร
- อาจต้องมี backend support

---

## 📋 Phase 3: Power User Features (Priority: LOW)

| # | Feature | Status | Started | Completed |
|---|---------|--------|---------|-----------|
| 11 | Split View (2 terminals) | ⬜ TODO | - | - |
| 12 | Command Templates | ⬜ TODO | - | - |
| 13 | Terminal Profiles | ⬜ TODO | - | - |
| 14 | Auto-reconnect | ⬜ TODO | - | - |
| 15 | Export/Import Sessions | ⬜ TODO | - | - |

---

## 🔮 Future Ideas

- [ ] WebSocket Backend (เขียนเองแทน ttyd)
- [ ] Multi-user Support
- [ ] Session Recording
- [ ] Remote Terminal (SSH)
- [ ] Electron Desktop App
- [ ] Cloud Sync
- [ ] Team Features

---

## 📝 Notes

### Architecture Decisions
- ใช้ React 18 + Vite 5
- Embed ttyd ผ่าน iframe
- State management ด้วย useState (อาจเปลี่ยนเป็น Zustand ถ้าซับซ้อนขึ้น)

### Known Issues
- ทุก terminal ใช้ ttyd instance เดียวกัน (อาจซ้ำ session)
- ไม่มี real status detection (ต้องการ backend support)

---

## 📊 Progress Summary

| Phase | Total | Done | Partial | Progress |
|-------|-------|------|---------|----------|
| Phase 1 | 5 | 5 | 0 | **100%** ✅ |
| Phase 2 | 5 | 0 | 1 | 10% |
| Phase 3 | 5 | 0 | 0 | 0% |
| **Total** | **15** | **5** | **1** | **40%** |

---

_Changelog:_
- 2026-03-10 16:30: **PHASE 1 COMPLETE** - All 5 features done (Persistence, Shortcuts, Search, Colors, Confirm)
- 2026-03-10 16:00: Phase 1 progress - Session Persistence, Shortcuts, Confirm Close implemented
- 2026-03-10 15:30: Updated - Found existing features (inline editing, tooltips)
- 2026-03-10 15:13: Initial roadmap created
