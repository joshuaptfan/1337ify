var isEnabled;
var charMap = Object.freeze({
	'a': '4',
	'e': '3',
	'g': '6',
	'i': '1',
	'o': '0',
	's': '5',
	't': '7'
});

// Check auto/manual mode on load
chrome.runtime.sendMessage('', isEnabled => {
	window.isEnabled = isEnabled;
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

// Listen for connections from popup
chrome.runtime.onConnect.addListener(port => {
	window.port = port;
	port.onMessage.addListener(isEnabled => {
		window.isEnabled = isEnabled;
		if (isEnabled)
			findReplace(document.body);
	});
	port.onDisconnect.addListener(() => { window.port = null; });
});

// Parse DOM if changed on tab activation
document.addEventListener('visibilitychange', () => {
	if (document.hidden) return;
	chrome.runtime.sendMessage('', isEnabled => {
		window.isEnabled = isEnabled;
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
				var str = node.nodeValue.toLowerCase();
				var out = '';
				for (var i = 0, sLen = str.length; i < sLen; i++)
					out += charMap[str[i]] || node.nodeValue[i];
				node.nodeValue = out;
		}
	}
}
