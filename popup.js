// [iconFile, label] — id = iconFile without .svg
const OPTIONS = [
  ["groupBySubdomain.svg", "Subdomain"],
  ["sortAlphabetically.svg", "Sort A–Z"],
  ["ignorePinnedTabs.svg", "Skip pinned"],
  ["collapseInactive.svg", "Collapse inactive"],
  ["avoidDuplicates.svg", "No duplicates"],
];

// [id, action, iconFile?]
const BUTTONS = [
  ["groupNow", "groupNow"],
  ["ungroupAll", "ungroupAll"],
  ["shortcuts", null, "shortcuts.svg"],
];

const ext = typeof chrome !== "undefined" && chrome.runtime?.id;

const toId = (iconFile) => iconFile.replace(/\.svg$/i, "");

const iconUrl = (name) =>
  `assets/icons/${name.endsWith(".svg") ? name : `${name}.svg`}`;

const getIconFile = (key) =>
  OPTIONS.find(([iconFile]) => toId(iconFile) === key)?.[0] ??
  BUTTONS.find(([id]) => id === key)?.[2];

const injectIcon = (slot, key) => {
  const file = getIconFile(key);
  if (!file) return;
  fetch(iconUrl(file))
    .then((r) => r.text())
    .then((html) => {
      const svg = new DOMParser().parseFromString(
        html,
        "image/svg+xml",
      ).documentElement;
      svg.setAttribute("width", "1em");
      svg.setAttribute("height", "1em");
      svg.setAttribute("aria-hidden", "true");
      slot.replaceChildren(svg);
    });
};

const container = document.getElementById("options");
OPTIONS.forEach(([iconFile, label]) => {
  const id = toId(iconFile);
  const row = document.createElement("label");
  row.className = "option";
  const iconSlot = document.createElement("span");
  iconSlot.dataset.icon = id;
  const input = Object.assign(document.createElement("input"), {
    type: "checkbox",
    id,
    className: "toggle",
  });
  row.append(
    iconSlot,
    input,
    Object.assign(document.createElement("span"), {
      className: "short",
      textContent: label,
    }),
  );
  container.appendChild(row);
});

const injectAllIcons = () => {
  document.querySelectorAll("[data-icon]").forEach((slot) => {
    injectIcon(slot, slot.dataset.icon);
  });
};

if (ext && chrome.storage.sync) {
  chrome.storage.sync.get(
    OPTIONS.map(([iconFile]) => toId(iconFile)),
    (opts) => {
      OPTIONS.forEach(([iconFile]) => {
        const id = toId(iconFile);
        const el = document.getElementById(id);
        if (el) el.checked = opts[id] === true;
      });
      injectAllIcons();
    },
  );
}
injectAllIcons();

OPTIONS.forEach(([iconFile]) => {
  const id = toId(iconFile);
  const el = document.getElementById(id);
  el?.addEventListener("change", () => {
    if (ext) chrome.storage.sync.set({ [id]: el.checked });
    if (ext) chrome.runtime.sendMessage({ action: "groupNow" });
  });
});

BUTTONS.forEach(([id, action]) => {
  const el = document.getElementById(id === "shortcuts" ? "shortcutsLink" : id);
  el?.addEventListener("click", (e) => {
    if (id === "shortcuts") {
      e.preventDefault();
      if (ext) chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
    } else if (ext) chrome.runtime.sendMessage({ action });
  });
});
