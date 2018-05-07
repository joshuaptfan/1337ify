document.onreadystatechange = function () {
	document.getElementById('toggle-enabled').addEventListener('change', () => { setIsEnabled(!window.isEnabled); });

	chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
		window.port = chrome.tabs.connect(tabs[0].id);
	});

	chrome.storage.local.get(null, items => {
		setIsEnabled(items.isEnabled || items.isEnabled === undefined);
	})
};

function setIsEnabled(isEnabled) {
	window.isEnabled = isEnabled;
	chrome.storage.local.set({ isEnabled });
	// Update background script
	chrome.runtime.sendMessage(isEnabled);
	// Update active tab
	try {
		window.port.postMessage(isEnabled);
	} catch (e) {}
	document.getElementById('toggle-enabled').checked = isEnabled;
}
