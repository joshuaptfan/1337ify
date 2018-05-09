var isEnabled;
var fileName;
var mapping;

// Retrieve data from local storage
chrome.storage.local.get(null, items => {
	isEnabled = items.isEnabled || true;
	if (items.fileName && items.mapping) {
		window.fileName = items.fileName;
		window.mapping = items.mapping;
	} else
		loadMapping('leet');
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	switch (msg.name) {
		case 'isEnabled':
			isEnabled = msg.isEnabled;
			break;
		case 'loadMapping':
			loadMapping(msg.fileName);
			break;
		case 'getData':
			sendResponse({ isEnabled, mapping });
	}
});

// Load mapping from file
function loadMapping(fileName) {
	window.fileName = fileName;
	let xhr = new XMLHttpRequest();
	xhr.open('GET', 'mappings/' + fileName + '.json', true);
	xhr.onload = () => {
		window.mapping = Object.freeze(JSON.parse(xhr.responseText));
		// Save data in local storage
		chrome.storage.local.set({ fileName, mapping });
		// Update active tab
		chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
			chrome.tabs.sendMessage(tabs[0].id, { name: 'mapping', mapping });
		});
	};
	xhr.send();
}
