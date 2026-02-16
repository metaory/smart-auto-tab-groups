importScripts('core.js');

const reply = (sendResponse) => (ok, err) =>
	sendResponse({ ok, err: err ? String(err) : undefined });

chrome.runtime.onInstalled.addListener(
	(d) => d.reason === 'install' && groupAllTabs(),
);
chrome.runtime.onStartup.addListener(groupAllTabs);
chrome.management.onEnabled.addListener((d) =>
	d.id === chrome.runtime.id ? groupAllTabs() : null,
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
	focusExistingAndCloseNew(tab.windowId, tab.id, tab.url).then((focused) => {
		if (!focused) assignTabToGroup(tab.id, tab.url, tab.windowId);
	});
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (!changeInfo.url) return;
	focusExistingAndCloseNew(tab.windowId, tabId, changeInfo.url).then(
		(focused) => {
			if (!focused) assignTabToGroup(tabId, changeInfo.url, tab.windowId);
		},
	);
});
chrome.tabs.onActivated.addListener((info) =>
	collapseInactiveInWindow(info.windowId, info.tabId),
);
