const OPTIONS = [
	{ id: 'groupBySubdomain', label: 'Group by subdomain' },
	{ id: 'sortAlphabetically', label: 'Sort groups alphabetically' },
	{ id: 'ignorePinnedTabs', label: 'Ignore pinned tabs' },
	{ id: 'collapseInactive', label: 'Collapse inactive groups' },
	{ id: 'avoidDuplicates', label: 'Avoid duplicates' },
];

const container = document.getElementById('options');
OPTIONS.forEach(({ id, label }) => {
	const labelEl = document.createElement('label');
	labelEl.innerHTML = `<input type="checkbox" id="${id}"> ${label}`;
	container.appendChild(labelEl);
});

chrome.storage.sync.get(
	OPTIONS.map((o) => o.id),
	(opts) =>
		OPTIONS.forEach(({ id }) => {
			const el = document.getElementById(id);
			if (el) el.checked = opts[id] === true;
		}),
);

OPTIONS.forEach(({ id }) => {
	const el = document.getElementById(id);
	el?.addEventListener('change', () => {
		chrome.storage.sync.set({ [id]: el.checked });
		chrome.runtime.sendMessage({ action: 'groupNow' });
	});
});

document
	.getElementById('groupNow')
	?.addEventListener('click', () =>
		chrome.runtime.sendMessage({ action: 'groupNow' }),
	);
document
	.getElementById('ungroupAll')
	?.addEventListener('click', () =>
		chrome.runtime.sendMessage({ action: 'ungroupAll' }),
	);
document.getElementById('shortcutsLink')?.addEventListener('click', (e) => {
	e.preventDefault();
	chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});
