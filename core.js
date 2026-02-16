const COLORS = [
	'grey',
	'blue',
	'red',
	'yellow',
	'green',
	'pink',
	'purple',
	'cyan',
	'orange',
];
const OPT_KEYS = [
	'groupBySubdomain',
	'sortAlphabetically',
	'ignorePinnedTabs',
	'collapseInactive',
	'avoidDuplicates',
];

const hashKey = (s) =>
	s.split('').reduce((h, c) => ((h << 5) + h + c.codePointAt(0)) | 0, 5381);
const colorForKey = (key) => COLORS[Math.abs(hashKey(key)) % COLORS.length];
const colorByIndex = (i) => COLORS[i % COLORS.length];

function getKey(url, groupBySubdomain) {
	if (!url?.startsWith('http')) return null;
	try {
		const hostname = new URL(url).hostname;
		if (!hostname) return null;
		const raw = hostname.replace(/^www\./i, '');
		if (groupBySubdomain) return raw;
		const parts = raw.split('.');
		if (parts.length <= 2) return raw;
		const n = parts[parts.length - 1].length === 2 ? 3 : 2;
		return parts.slice(-n).join('.');
	} catch {
		return null;
	}
}

const getOpts = () =>
	new Promise((resolve) => {
		chrome.storage.sync.get(OPT_KEYS, (o) =>
			resolve({ ...Object.fromEntries(OPT_KEYS.map((k) => [k, false])), ...o }),
		);
	});

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const isGrouped = (t) => t.groupId != null && t.groupId !== -1;
const getWin = (id) =>
	id != null
		? Promise.resolve(id)
		: chrome.windows
				.getLastFocused()
				.then((w) => w?.id)
				.catch(() => null);

function buildByKey(tabs, opts) {
	const include = (t) => !opts.ignorePinnedTabs || !t.pinned;
	return tabs.filter(include).reduce((map, tab) => {
		const key = getKey(tab.url, opts.groupBySubdomain);
		if (key) map.set(key, [...(map.get(key) || []), tab.id]);
		return map;
	}, new Map());
}

const colorFor = (key, idx) =>
	idx !== undefined ? colorByIndex(idx) : colorForKey(key);

async function createGroup({ windowId, key, tabIds, idx }) {
	const groupId = await chrome.tabs.group({
		tabIds,
		createProperties: { windowId },
	});
	await chrome.tabGroups.update(groupId, {
		title: key,
		color: colorFor(key, idx),
	});
	return { groupId, title: key, key, idx };
}

const groupContainsTab = (groupId, tabId) =>
	chrome.tabs
		.query({ groupId })
		.then((tabs) => tabs.some((t) => t.id === tabId));

const collapseGroupWithMove = (groupId, index) =>
	chrome.tabGroups
		.update(groupId, { collapsed: true })
		.then(() => chrome.tabGroups.move(groupId, { index: -1 }))
		.then(() => chrome.tabGroups.move(groupId, { index }));

const TAB_EDIT_BLOCKED = 'Tabs cannot be edited right now';

const collapseWithRetry = (groupId, index) =>
	collapseGroupWithMove(groupId, index).catch((err) => {
		if (!String(err?.message ?? err).includes(TAB_EDIT_BLOCKED)) throw err;
		return delay(80).then(() =>
			collapseGroupWithMove(groupId, index).catch(() => {}),
		);
	});

async function collapseOneGroup(g, i, focusedTabId) {
	const isFocused = await groupContainsTab(g.id, focusedTabId);
	if (isFocused || g.collapsed) return;
	await collapseWithRetry(g.id, i);
	await delay(40);
}

async function collapseInactiveInWindow(windowId, activeTabId = null) {
	const opts = await getOpts();
	if (!opts.collapseInactive) return;
	const focusedTabId =
		activeTabId ?? (await chrome.tabs.query({ windowId, active: true }))[0]?.id;
	if (!focusedTabId) return;
	if (activeTabId) await delay(150);
	const groups = await chrome.tabGroups.query({ windowId });
	await Promise.all(groups.map((g, i) => collapseOneGroup(g, i, focusedTabId)));
}

async function applyTitleRefresh(groupId, key, idx) {
	await chrome.tabGroups.update(groupId, {
		title: key,
		color: colorFor(key, idx),
	});
	await chrome.tabGroups.update(groupId, { collapsed: true });
	await delay(30);
	await chrome.tabGroups.update(groupId, { collapsed: false });
}

async function removeDuplicateTabsInWindow(windowId) {
	const opts = await getOpts();
	if (!opts.avoidDuplicates) return;
	const tabs = await chrome.tabs.query({ windowId });
	const active = (await chrome.tabs.query({ windowId, active: true }))[0]?.id;
	const byUrl = tabs
		.filter((t) => t.url?.startsWith('http'))
		.reduce((acc, t) => {
			acc[t.url] = [...(acc[t.url] || []), t.id];
			return acc;
		}, {});
	const toRemove = Object.values(byUrl)
		.filter((ids) => ids.length > 1)
		.flatMap((ids) => {
			const keep = ids.includes(active) ? active : ids[0];
			return ids.filter((id) => id !== keep);
		});
	if (toRemove.length) await chrome.tabs.remove(toRemove);
}

async function groupAllTabs(windowId) {
	const opts = await getOpts();
	const win = await getWin(windowId);
	if (!win) return;
	await removeDuplicateTabsInWindow(win);
	const tabs = await chrome.tabs.query({ windowId: win });
	const toUngroup = tabs.filter(isGrouped).map((t) => t.id);
	if (toUngroup.length) await chrome.tabs.ungroup(toUngroup);
	const byKey = buildByKey(tabs, opts);
	const entries = [...byKey.entries()];
	const groupIds = [];
	for (let idx = 0; idx < entries.length; idx++) {
		const [key, tabIds] = entries[idx];
		const groupId = await chrome.tabs.group({
			tabIds,
			createProperties: { windowId: win },
		});
		groupIds.push({ groupId, title: key, key, idx });
	}
	await delay(300);
	await Promise.all(
		groupIds.map(({ groupId, key, idx }) =>
			applyTitleRefresh(groupId, key, idx),
		),
	);
	if (opts.sortAlphabetically && groupIds.length) {
		groupIds.sort((a, b) => a.title.localeCompare(b.title));
		await Promise.all(
			groupIds.map((g, i) => chrome.tabGroups.move(g.groupId, { index: i })),
		);
	}
	if (opts.collapseInactive && groupIds.length) {
		await delay(100);
		await collapseInactiveInWindow(win);
	}
}

async function ungroupAllTabs(windowId) {
	const win = await getWin(windowId);
	if (!win) return;
	const tabs = await chrome.tabs.query({ windowId: win });
	const ids = tabs.filter(isGrouped).map((t) => t.id);
	if (ids.length) await chrome.tabs.ungroup(ids);
}

async function focusExistingAndCloseNew(windowId, newTabId, url) {
	const opts = await getOpts();
	if (!opts.avoidDuplicates || !url?.startsWith('http')) return false;
	const tabs = await chrome.tabs.query({ windowId, url });
	const existing = tabs.find((t) => t.id !== newTabId);
	if (!existing) return false;
	await chrome.tabs.remove(newTabId);
	await chrome.tabs.update(existing.id, { active: true });
	return true;
}

async function assignTabToGroup(tabId, url, windowId) {
	const opts = await getOpts();
	const tab = await chrome.tabs.get(tabId).catch(() => null);
	if (!tab || (opts.ignorePinnedTabs && tab.pinned)) return;
	const key = getKey(url, opts.groupBySubdomain);
	if (!key) return;
	const winId = tab.windowId ?? windowId;
	const groups = await chrome.tabGroups.query({ windowId: winId });
	const existing = groups.find((g) => g.title === key);
	if (existing) {
		const inGroup = await chrome.tabs
			.query({ groupId: existing.id })
			.catch(() => []);
		await chrome.tabs
			.group({
				groupId: existing.id,
				tabIds: [...inGroup.map((t) => t.id), tabId],
			})
			.catch(() => createGroup({ windowId: winId, key, tabIds: [tabId] }));
		return;
	}
	await createGroup({ windowId: winId, key, tabIds: [tabId] });
}
