var isEnabled;
var mapping;

// Retrieve data from background script on load
chrome.runtime.sendMessage({ name: 'getData' }, items => {
	window.isEnabled = items.isEnabled;
	window.mapping = items.mapping;
	processText(document.body, isEnabled ? 2 : 0);

	// Parse DOM on change
	new MutationObserver(mutations => {
		for (var mutation of mutations)
			for (var node of mutation.addedNodes)
				processText(node, !document.hidden && isEnabled ? 2 : 0);
	}).observe(document.body, {
		childList: true,
		attributes: true,
		characterData: true,
		subtree: true
	});
});

// Update data from background script on tab activation
document.addEventListener('visibilitychange', () => {
	if (document.hidden) return;
	chrome.runtime.sendMessage({ name: 'getData' }, items => {
		window.isEnabled = items.isEnabled;
		window.mapping = items.mapping;
		processText(document.body, isEnabled ? 3 : 1);
	});
});

// Listen for messages from popup and background script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	switch (msg.name) {
		case 'isEnabled':
			window.isEnabled = msg.isEnabled;
			break;
		case 'mapping':
			window.mapping = msg.mapping;
	}
	processText(document.body, isEnabled ? 3 : 1);
});

// Recursively process text within descendent text nodes
function processText(parentNode, mode) {
	for (var node of parentNode.childNodes) {
		switch (node.nodeType) {
			case 1:    // element node
			case 11:   // document fragment node
				if (!/SCRIPT|STYLE/.test(node.nodeName))
					processText(node, mode);
				break;
			case 3:    // text node
				switch (mode) {
					case 0:    // cache text
						node.originalText = node.nodeValue;
						break;
					case 1:    // restore text
						node.nodeValue = node.originalText;
						break;
					case 2:    // cache and replace text
						node.originalText = node.nodeValue;
					case 3:    // replace text
						let str = node.originalText || node.nodeValue;
						let out = '';
						for (var i = 0, sLen = str.length; i < sLen; i++) {
							if (!mapping[str[i]])
								out += str[i];
							else {
								let currentNode = mapping[str[i]];
								let depth = 0;
								let result = '';
								while (true) {
									if (currentNode.value)
										result = currentNode.value;
									if (currentNode[str[i + depth + 1]])
										currentNode = currentNode[str[i + ++depth]];
									else break;
								}
								out += result || str.slice(i, i + depth + 1);
								i += depth;
							}
						}
						node.nodeValue = out;
				}
		}
	}
}
