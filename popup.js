const ICON_MAP = {
	groupBySubdomain: { subdomain: 'tabler--badges-filled.svg', domain: 'tabler--arrows-minimize.svg' },
	sortAlphabetically: 'placeholder.svg',
	ignorePinnedTabs: 'placeholder.svg',
	collapseInactive: 'placeholder.svg',
	avoidDuplicates: 'tabler--copy-minus-filled.svg',
	groupNow: 'placeholder.svg',
	ungroupAll: 'placeholder.svg',
	shortcuts: 'placeholder.svg',
};

const ICON_STATE = {
	groupBySubdomain: (el) => (el?.checked ? 'subdomain' : 'domain'),
};

const OPTIONS = [
	{ id: 'groupBySubdomain', short: 'Subdomain' },
	{ id: 'sortAlphabetically', short: 'Sort A–Z' },
	{ id: 'ignorePinnedTabs', short: 'Skip pinned' },
	{ id: 'collapseInactive', short: 'Collapse inactive' },
	{ id: 'avoidDuplicates', short: 'No duplicates' },
];

const BUTTONS = [
	{ id: 'groupNow', action: 'groupNow' },
	{ id: 'ungroupAll', action: 'ungroupAll' },
];

const iconUrl = (name) => `assets/icons/${name}`;

const getIconFile = (key) => {
	const map = ICON_MAP[key];
	if (typeof map === 'string') return map;
	const state = ICON_STATE[key]?.(document.getElementById(key)) ?? 'domain';
	return map?.[state];
};

const injectIcon = (slot, key) => {
	const file = getIconFile(key);
	if (!file) return;
	fetch(iconUrl(file))
		.then((r) => r.text())
		.then((html) => {
			const svg = new DOMParser().parseFromString(html, 'image/svg+xml').documentElement;
			svg.setAttribute('width', '1em');
			svg.setAttribute('height', '1em');
			svg.setAttribute('aria-hidden', 'true');
			slot.replaceChildren(svg);
		});
};

const container = document.getElementById('options');
OPTIONS.forEach(({ id, short: shortLabel }) => {
	const row = document.createElement('label');
	row.className = 'option';
	const iconSlot = document.createElement('span');
	iconSlot.dataset.icon = id;
	const input = Object.assign(document.createElement('input'), { type: 'checkbox', id, className: 'toggle' });
	row.append(iconSlot, input, Object.assign(document.createElement('span'), { className: 'short', textContent: shortLabel }));
	container.appendChild(row);
});

const injectAllIcons = () => {
	document.querySelectorAll('[data-icon]').forEach((slot) => {
		injectIcon(slot, slot.dataset.icon);
	});
};

const initStorageAndIcons = () => {
	OPTIONS.forEach(({ id }) => {
		const el = document.getElementById(id);
		if (el) el.checked = opts[id] === true;
	});
	injectAllIcons();
};

if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
	chrome.storage.sync.get(OPTIONS.map((o) => o.id), (opts) => {
		OPTIONS.forEach(({ id }) => {
			const el = document.getElementById(id);
			if (el) el.checked = opts[id] === true;
		});
		injectAllIcons();
	});
} else {
	injectAllIcons();
}

OPTIONS.forEach(({ id }) => {
	const el = document.getElementById(id);
	el?.addEventListener('change', () => {
		chrome.storage.sync.set({ [id]: el.checked });
		chrome.runtime.sendMessage({ action: 'groupNow' });
		const slot = el.closest('.option')?.querySelector('[data-icon]');
		if (slot && typeof ICON_MAP[id] === 'object') injectIcon(slot, id);
	});
});

BUTTONS.forEach(({ id, action }) => {
	document
		.getElementById(id)
		?.addEventListener('click', () => chrome.runtime.sendMessage({ action }));
});

document.getElementById('shortcutsLink')?.addEventListener('click', (e) => {
	e.preventDefault();
	chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});
