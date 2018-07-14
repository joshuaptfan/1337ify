var isEnabled;
var mapping;
var randSeed;

// Retrieve data from background script on load
chrome.runtime.sendMessage({ name: 'getData' }, items => {
	window.isEnabled = items.isEnabled;
	window.mapping = items.mapping;
	genRandSeed();
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
		genRandSeed();
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
	genRandSeed();
	processText(document.body, isEnabled ? 3 : 1);
});

// Recursively process text within descendent text nodes
function processText(parentNode, mode) {
	for (var node of parentNode.childNodes)
		switch (node.nodeType) {
			case 1:    // Element node
			case 11:   // Document fragment node
				if (!/SCRIPT|STYLE/.test(node.nodeName))
					processText(node, mode);
				break;
			case 3:    // Text node
				switch (mode) {
					case 0:    // Cache text
						node.originalText = node.nodeValue;
						break;
					case 1:    // Restore text
						node.nodeValue = node.originalText;
						break;
					case 2:    // Cache and replace text
						node.originalText = node.nodeValue;
					case 3:    // Replace text
						let str = node.originalText || node.nodeValue;
						let out = '';
						for (var i = 0, sLen = str.length; i < sLen; i++) {
							if (!mapping[str[i]])
								out += str[i];
							else {
								// Search trie
								let currentNode = mapping[str[i]];
								let depth = 0;
								let result = '';
								while (true) {
									if (currentNode.value) {
										if (typeof currentNode.value == 'string')
											// Single result
											result = currentNode.value;
										else {
											// Probalistic result pool
											let rand = nextRand();
											for (var val in currentNode.value) {
												rand -= currentNode.value[val];
												if (rand < 0) {
													result = val;
													break;
												}
											}
										}
									}
									if (currentNode[str[i + depth + 1]])
										currentNode = currentNode[str[i + ++depth]];
									else break;
								}
								// Insert original text if match is incomplete
								out += result || str.substr(i, depth + 1);
								i += depth;
							}
						}
						node.nodeValue = out;
				}
		}
}

// Generate PRNG seed from URL
function genRandSeed() {
	randSeed = location.href.split('').reduce((v, c) => v + c.codePointAt(), 0) * 16807
}

// Generate next random number in range [0, 1)
function nextRand() {
	randSeed = randSeed * 16807 % 0x7FFFFFFF;
	return (randSeed - 1) / 0x7FFFFFFF;
}
