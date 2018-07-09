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
		window.mapping = {};
		buildTrie(JSON.parse(xhr.responseText), window.mapping);
		// Save data in local storage
		chrome.storage.local.set({ fileName, mapping });
		// Update active tab
		chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
			chrome.tabs.sendMessage(tabs[0].id, { name: 'mapping', mapping });
		});
	};
	xhr.send();
}

// Build trie from object of word/result pairs
function buildTrie(obj, root) {
	let currentNode;
	for (var key in obj) {
		// Set root as current node
		currentNode = root;
		for (var char of key) {
			// Create child node for character if undefined
			currentNode[char] = currentNode[char] || {};
			// Set child as current node
			currentNode = currentNode[char];
		}
		// Store current value in leaf node
		currentNode.value = obj[key];
	}
	console.log(window.mapping);
}
