var isEnabled;
var mapping;

// Retrieve data from background script on load
chrome.runtime.sendMessage({ name: 'getData' }, items => {
	window.isEnabled = items.isEnabled;
	window.mapping = items.mapping;
	if (isEnabled)
		findReplace(document.body);

	// Parse DOM on change
	new MutationObserver(mutations => {
		if (document.hidden || !window.isEnabled) return;
		for (var mutation of mutations)
			for (var node of mutation.addedNodes)
				findReplace(node);
	}).observe(document.body, {
		childList: true,
		attributes: true,
		characterData: true,
		subtree: true
	});
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	window.mapping = msg;
});

// Listen for connections from popup
chrome.runtime.onConnect.addListener(port => {
	window.port = port;
	port.onMessage.addListener(msg => {
		window.isEnabled = msg;
		if (isEnabled)
			findReplace(document.body);
	});
	port.onDisconnect.addListener(() => { window.port = null; });
});

// Parse DOM if changed on tab activation
document.addEventListener('visibilitychange', () => {
	if (document.hidden) return;
	chrome.runtime.sendMessage({ name: 'getData' }, items => {
		window.isEnabled = items.isEnabled;
		window.mapping = items.mapping;
		if (isEnabled)
			findReplace(document.body);
	});
});

// Find and replace within descendent text nodes
function findReplace(parentNode) {
	for (var node of parentNode.childNodes) {
		switch (node.nodeType) {
			case 1:    // element node
			case 11:   // document fragment node
				if (!/SCRIPT|STYLE/.test(node.nodeName))
					findReplace(node);
				break;
			case 3:    // text node
				let str = node.nodeValue;
				let out = '';
				for (var i = 0, sLen = str.length; i < sLen; i++)
					out += mapping[str[i]] || str[i];
				node.nodeValue = out;
		}
	}
}
