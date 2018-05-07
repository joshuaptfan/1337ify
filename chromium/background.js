var isEnabled;
chrome.storage.local.get('isEnabled', items => {
	isEnabled = items.isEnabled || true;
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (typeof msg == 'boolean')
		isEnabled = msg;
	else
		sendResponse(isEnabled);
});
