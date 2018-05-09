document.onreadystatechange = function () {
	document.getElementById('toggle-enabled').addEventListener('change', () => { setIsEnabled(!window.isEnabled); });
	document.getElementById('set-mapping').addEventListener('change', e => { setMapping(e.target.value) });

	// Establish port to active tab
	chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
		window.port = chrome.tabs.connect(tabs[0].id);
	});

	// Retrieve data from local storage
	chrome.storage.local.get(null, items => {
		setIsEnabled(items.isEnabled || items.isEnabled === undefined);
		document.getElementById('set-mapping').value = items.fileName;
	})
};

function setIsEnabled(isEnabled) {
	window.isEnabled = isEnabled;
	chrome.storage.local.set({ isEnabled });
	// Update background script
	chrome.runtime.sendMessage({ name: 'isEnabled', isEnabled });
	// Update active tab
	try {
		window.port.postMessage(isEnabled);
	} catch (e) {}
	document.getElementById('toggle-enabled').checked = isEnabled;
}

// Tell background script to load file
function setMapping(fileName) {
	chrome.runtime.sendMessage({ name: 'loadMapping', fileName });
}
