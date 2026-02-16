# Smart Auto Tab Group

Chrome extension: auto-group tabs by domain or subdomain.

## Install

Chrome → `chrome://extensions` → **Developer mode** → **Load unpacked** → select this directory.

## Popup

- **Group now** — (re)group all tabs in the current window.
- **Ungroup all** — remove grouping in the current window.

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
