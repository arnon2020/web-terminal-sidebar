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
| 2026-03-10 | Search Terminals | f05d68f |
| 2026-03-10 | Terminal Colors/Icons (6 colors) | f05d68f |
| 2026-03-10 | Replace prompt() with Modal | - |

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
| 6 | Replace prompt() with Modal | ✅ DONE | 2026-03-10 | 2026-03-10 |
| 7 | Drag & Drop Reorder | ✅ DONE | 2026-03-10 | 2026-03-10 |
| 8 | Terminal Groups/Tabs | ✅ DONE | 2026-03-10 | 2026-03-10 |
| 9 | Quick Actions Menu (Right-click) | ✅ DONE | 2026-03-10 | 2026-03-10 |
| 10 | Status Indicators | ✅ DONE | 2026-03-10 | 2026-03-10 |

### Details

#### 6. Replace prompt() with Modal ✅
- ✅ Done: Modal component for new terminal
- ✅ Features: Enter to save, Escape to cancel, auto-focus input
- ✅ Clean UI with Cancel/Add Terminal buttons

#### 7. Drag & Drop Reorder
- ใช้ react-beautiful-dnd หรือ dnd-kit
- เรียงลำดับ terminals ตามใจ

#### 8. Terminal Groups/Tabs
- จัดกลุ่มตามโปรเจค
- เช่น "Project A" → backend, frontend, db

#### 9. Quick Actions Menu ✅
- ✅ Done: Right-click context menu component
- ✅ Menu items: Rename, Change Color, Move to Group, Duplicate, Close Terminal
- ✅ Click outside or Escape to close
- ✅ Submenu for "Move to Group" when multiple groups exist

#### 10. Status Indicators ✅
- ✅ Done: Connection status tracking per terminal
- ✅ States: loading (yellow pulse), connected (green), disconnected (gray)
- ✅ iframe load event handlers for status updates
- ✅ Visual indicator with tooltip (status-dot per terminal)
- ✅ CSS animations for loading state

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
| Phase 2 | 5 | 5 | 0 | **100%** ✅ |
| Phase 3 | 5 | 0 | 0 | 0% |
| **Total** | **15** | **10** | **0** | **67%** |

---

_Changelog:_
- 2026-03-10 19:45: **PHASE 2 COMPLETE** - All 5 features done (Modal, Drag&Drop, Groups, Context Menu, Status)
- 2026-03-10 19:30: Phase 2 #10 Done - Status Indicators (loading/connected/disconnected)
- 2026-03-10 19:30: Phase 2 #9 Done - Quick Actions Menu (Right-click context menu)
- 2026-03-10 19:00: Phase 2 #8 Done - Terminal Groups with expand/collapse
- 2026-03-10 18:30: Phase 2 #7 Done - Drag & Drop Reorder with @dnd-kit
- 2026-03-10 17:00: Phase 2 #6 Done - Modal replaces prompt() for new terminals
- 2026-03-10 16:30: **PHASE 1 COMPLETE** - All 5 features done (Persistence, Shortcuts, Search, Colors, Confirm)
- 2026-03-10 16:00: Phase 1 progress - Session Persistence, Shortcuts, Confirm Close implemented
- 2026-03-10 15:30: Updated - Found existing features (inline editing, tooltips)
- 2026-03-10 15:13: Initial roadmap created
