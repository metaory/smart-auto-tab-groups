
<div align="center">
  <img src="assets/logo.svg" alt="Smart Auto Tab Group" width="128" height="128">
  <h3>Smart Auto Tab Group</h3>
  <p>Auto-group Chrome tabs by domain or subdomain</p>
</div>

---

Groups by domain or subdomain; new tabs auto-join

- **Domain/Subdomain** (group by domain or subdomain)
- **Sort A-Z** (sort tabs alphabetically)
- **Skip pinned** (exclude from groups)
- **Collapse inactive** (collapse groups without active tab)
- **No duplicates** (remove duplicate tabs)

---

## Install

Chrome → `chrome://extensions` → **Developer mode** → **Load unpacked** → select this directory.

## Popup

- **Group now** — (re)group all tabs in the current window
- **Ungroup all** — remove grouping in the current window

### Options

| Option | Default | Description |
|--------|---------|-------------|
| Group by subdomain | off | Use full subdomain (e.g. `mail.google.com`) as group key instead of base domain. |
| Sort groups alphabetically | off | Order groups A–Z. |
| Ignore pinned tabs | off | Do not put pinned tabs into groups. |
| Collapse inactive groups | off | Collapse groups that don’t contain the active tab. |
| Avoid duplicates | off | New tab with same URL as existing tab in window → focus existing, close new. **Group now** also removes duplicate tabs (keeps one per URL). |

## Shortcuts

- **Group now**: `Ctrl+Shift+G` (Windows/Linux) / `Cmd+Shift+G` (Mac)
- **Ungroup all**: `Ctrl+Shift+U` (Windows/Linux) / `Cmd+Shift+U` (Mac)

Change at `chrome://extensions` → shortcut icon next to the extension.

## Behavior

- On install/startup/enable: runs **Group now** once.
- New or updated tab (http(s) URL): assigned to the matching domain group or creates a new group.
- With **Avoid duplicates**: opening/navigating to a URL that already exists in the window focuses that tab and closes the duplicate.
