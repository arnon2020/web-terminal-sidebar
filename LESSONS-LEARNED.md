# Lessons Learned - Web Terminal Sidebar

**Updated**: 2026-03-11

---

## 🐛 Bug: Terminal Clicking Not Working

### User Report
"ไม่สามารถคลิกเปลี่ยน terminal ได้" (Cannot click to switch terminals)

### Root Cause
CSS showed `cursor: pointer` on `.terminal-item` div, but `onClick` handler was only on `.terminal-name` span.

**Evidence**:
```css
/* index.html line 199-243 */
.terminal-item {
  cursor: pointer;  /* Tells user: "You can click this!" */
  ...
}

.terminal-item.active {
  background: #16213e;
  border-left-color: #e94560;
}
```

```jsx
/* SortableTerminalList.jsx - BEFORE FIX */
<div className="terminal-item">
  <span className="terminal-name" onClick={...}>  /* Only name clickable! */
```

### Why Testing Missed It
1. **Only tested JavaScript clicks on specific elements** (`element.click()`)
2. **Didn't test actual user behavior** (clicking anywhere on the item)
3. **Didn't verify CSS cursor vs JS handler consistency**
4. **Overconfident in "100% pass rate" claim**

### Fix
```jsx
/* SortableTerminalList.jsx - AFTER FIX */
<div
  className="terminal-item"
  onClick={(e) => {
    if (editingId === terminal.id) return;
    onActivate(terminal.id);
  }}
>
```

### Testing Lessons
| ❌ Wrong Approach | ✅ Right Approach |
|-----------------|------------------|
| `element.click()` in JS | Playwright `page.click()` |
| Check code only | Check UI + code consistency |
| "Works!" without evidence | Screenshot + state verification |
| Test happy path | Test edge cases (wrong click areas) |

---

## 📋 Testing Checklist (Updated)

### For Every Interactive Element
- [ ] Click with mouse/trackpad (real user action)
- [ ] Verify visual feedback (active state change)
- [ ] Check CSS `cursor` matches `onClick` presence
- [ ] Test entire clickable area, not just one point
- [ ] Test keyboard navigation (tab, enter, space)
- [ ] Test rapid clicking
- [ ] Test during editing states

### Before Claiming "Fixed"
- [ ] Browser is open (not just code review)
- [ ] Real mouse click happened
- [ ] Screenshot evidence saved
- [ ] State change verified
- [ ] Edge cases tested

---

## 🎯 Code Review Checklist

### UI Consistency
```javascript
// Check this pattern:
const cursor = getComputedStyle(element).cursor;
const hasClick = element.onclick !== null;

if (cursor === 'pointer' && !hasClick) {
  // BUG: User thinks it's clickable but it's not!
}
```

### Click Targets
- [ ] Minimum 44x44px for mobile
- [ ] Entire visible area is clickable
- [ ] Clear hover/active states
- [ ] No "dead zones" that look clickable

---

## Files Changed
- `src/components/SortableTerminalList.jsx` - Added onClick to terminal-item div
- Commit: `f691862`

---

## Action Items
1. ✅ Fix applied and committed
2. ✅ Created user-centric-testing skill
3. ⏳ Consider adding automated UI consistency checks
4. ⏳ Update testing documentation in project README
