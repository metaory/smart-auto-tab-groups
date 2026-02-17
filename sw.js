importScripts('core.js');

const reply = (sendResponse) => (ok, err) =>
	sendResponse({ ok, err: err ? String(err) : undefined });

const runIfAutomatic = (fn) =>
	getOpts().then((opts) => opts.automatic && fn());

chrome.runtime.onInstalled.addListener((d) =>
	d.reason === 'install' ? runIfAutomatic(groupAllTabs) : null,
);
chrome.runtime.onStartup.addListener(() => runIfAutomatic(groupAllTabs));
chrome.management.onEnabled.addListener((d) =>
	d.id === chrome.runtime.id ? runIfAutomatic(groupAllTabs) : null,
);

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
	const r = reply(sendResponse);
	if (msg.action === 'groupNow')
		groupAllTabs()
			.then(() => r(true))
			.catch((e) => r(false, e));
	if (msg.action === 'ungroupAll')
		ungroupAllTabs()
			.then(() => r(true))
			.catch((e) => r(false, e));
	return true;
});

chrome.commands.onCommand.addListener((cmd) => {
	if (cmd === 'group-now') groupAllTabs().catch(() => {});
	if (cmd === 'ungroup-all') ungroupAllTabs().catch(() => {});
});

chrome.tabs.onCreated.addListener((tab) => {
	if (!tab.url?.startsWith('http')) return;
	runIfAutomatic(() =>
		focusExistingAndCloseNew(tab.windowId, tab.id, tab.url).then((focused) => {
			if (!focused) assignTabToGroup(tab.id, tab.url, tab.windowId);
		}),
	);
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (!changeInfo.url) return;
	runIfAutomatic(() =>
		focusExistingAndCloseNew(tab.windowId, tabId, changeInfo.url).then(
			(focused) => {
				if (!focused) assignTabToGroup(tabId, changeInfo.url, tab.windowId);
			},
		),
	);
});
chrome.tabs.onActivated.addListener((info) =>
	runIfAutomatic(() =>
		collapseInactiveInWindow(info.windowId, info.tabId),
	),
);
