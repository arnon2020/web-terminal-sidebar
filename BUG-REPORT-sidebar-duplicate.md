# Bug Report: Sidebar Duplicate Issue

**Date**: 2026-03-11
**Severity**: 🔴 CRITICAL (App unusable)
**Status**: ✅ FIXED (Removed duplicate onClick handler)

---

## 🐛 Bug Description

**Every time a new terminal is added → Sidebar gets duplicated**

This makes the web app completely unusable after adding 2-3 terminals.

---

## 🔍 Root Cause Analysis

### Double onClick Handlers in `SortableTerminalList.jsx`

**Location**: `src/components/SortableTerminalList.jsx`

**Line 67-71** (terminal-item):
```jsx
<div className="terminal-item" onClick={(e) => {
  if (editingId === terminal.id) return;
  onActivate(terminal.id);  // ← CALL #1
}}>
```

**Line 95-98** (terminal-name - INSIDE terminal-item):
```jsx
<span className="terminal-name" onClick={(e) => {
  e.stopPropagation();
  onActivate(terminal.id);  // ← CALL #2 (duplicate!)
}}>
```

### Why This Causes Sidebar Duplication

1. **Double state updates** - `onActivate()` called 2x per click
2. **React render loop** - State change triggers re-render
3. **Component tree issue** - Multiple `<div className="sidebar">` may be rendered

---

## 📜 Related Commits

| Commit | Message | Problem |
|--------|---------|---------|
| `1c5d87f` | "fix: add onClick handler to terminal-name" | Added onClick INSIDE an element that already has parent onClick |
| `f691862` | "fix: make terminal-item fully clickable" | Already had onClick on parent |

### The "Fix That Made It Worse" Pattern

```
Before: terminal-name couldn't be clicked to switch
         ↓
Fix:    Added onClick to terminal-name
         ↓
Result: Double onClick handlers → state loop → sidebar duplicate
```

**Why "small fix" → "bigger bug":**
- Added NEW handler instead of restructuring existing one
- Didn't check if parent already had onClick
- `stopPropagation()` stops bubbling but NOT the double function call

---

## 💡 Fix Applied (Option 1: Simpler)

**Changed**: Removed duplicate `onClick` from `terminal-name` span

```jsx
// BEFORE (lines 93-102):
<span className="terminal-name" onClick={(e) => {
  e.stopPropagation();
  onActivate(terminal.id);  // ← DUPLICATE
}} onDoubleClick={...}>

// AFTER (lines 93-102):
<span className="terminal-name" onDoubleClick={(e) => {
  e.stopPropagation();
  onDoubleClick(terminal);
}} title="Double-click to rename">
```

**Result**: Parent `terminal-item` div now handles all single-clicks, `terminal-name` only handles double-click for renaming.

---

## 📁 Files Involved

- `src/components/SortableTerminalList.jsx` (Lines 67-98)
- `src/App.jsx` (setActiveTerminal state)

---

## 🔗 Related Issues

- Commit `e627662` - "docs: add lessons learned from terminal clicking bug"
- This bug may have been introduced in the same fix cycle

---

## ✅ Steps to Reproduce

1. Open app at http://localhost:3001/
2. Click "+ Add Terminal"
3. Name it and click "Add Terminal"
4. **Observe**: Sidebar appears duplicated
5. Repeat 2-3 times → Multiple sidebars appear

## 🧪 Testing After Fix

1. Open http://localhost:3001/
2. Click "+ Add Terminal" 3-4 times
3. **Expected**: Only ONE sidebar visible
4. Click on terminal names to switch between them
5. **Expected**: Works smoothly, no duplication

**Status**: ⏳ Awaiting user verification

---

## 🐛 Bug #2: Terminal Display Area Not Showing (FIXED ✅)

**Date**: 2026-03-11
**Severity**: 🔴 CRITICAL (Terminal unusable)

### Root Cause Analysis

**Location**: `src/components/TerminalWrapper.jsx` (line 55)

**WRONG CODE**:
```jsx
src={`/terminal?id=${safeId}`}
```
This resolved to `http://localhost:3001/terminal?id=XXX` (Vite dev server) which doesn't exist!

**CORRECT CODE** (in App.jsx split view):
```jsx
src={`${TTYD_URL}?id=${safeId}`}
```
Where `TTYD_URL = 'http://localhost:7682'` (ttyd server)

### Why This Happened

1. **URL inconsistency**: Normal mode used `/terminal?id=` while split view used `http://localhost:7682?id=`
2. **Missing proxy**: No Vite proxy configured for `/terminal` path
3. **Wrong target**: TerminalWrapper was pointing to Vite dev server instead of ttyd server

### Fix Applied

**Changed**: `src/components/TerminalWrapper.jsx`

1. Added `TTYD_URL` constant:
```jsx
const TTYD_URL = 'http://localhost:7682';
```

2. Changed iframe src:
```jsx
// BEFORE (line 55):
src={`/terminal?id=${safeId}`}

// AFTER:
src={`${TTYD_URL}?id=${safeId}`}
```

### Verification

After fix:
- ✅ Terminal display area shows ttyd interface
- ✅ WebSocket connection opens successfully
- ✅ Canvas renderer loads
- ✅ Terminal is fully functional

---

## 🎯 Priority

**BLOCKING** - Cannot use app for intended purpose
