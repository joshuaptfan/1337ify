document.onreadystatechange = function () {
	document.getElementById('toggle-enabled').addEventListener('change', () => { setIsEnabled(!window.isEnabled); });
	document.getElementById('set-mapping').addEventListener('change', e => { setMapping(e.target.value) });

	var background = chrome.extension.getBackgroundPage();

	// Retrieve data from local storage
	chrome.storage.local.get(null, items => {
		setIsEnabled(items.isEnabled || items.isEnabled === undefined);
		document.getElementById('set-mapping').value = items.fileName;
		showMapping(items.fileName);
	})
};

function setIsEnabled(isEnabled) {
	window.isEnabled = isEnabled;
	// Save data in local storage
	chrome.storage.local.set({ isEnabled });
	// Update background script
	chrome.runtime.sendMessage({ name: 'isEnabled', isEnabled });
	// Update active tab
	chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
		chrome.tabs.sendMessage(tabs[0].id, { name: 'isEnabled', isEnabled });
	});
	document.getElementById('toggle-enabled').checked = isEnabled;
}

// Tell background script to load file
function setMapping(fileName) {
	chrome.runtime.sendMessage({ name: 'loadMapping', fileName });
	showMapping(fileName);
}

function showMapping(fileName) {
	let xhr = new XMLHttpRequest();
	xhr.open('GET', 'mappings/' + fileName + '.json', true);
	xhr.onload = () => {
		let mapping = JSON.parse(xhr.responseText);
		let editMapping = document.getElementById('edit-mapping');
		while (editMapping.childNodes.length)
			editMapping.removeChild(editMapping.lastChild);
		for (key in mapping) {
			const branch = document.createElement('div');
			branch.className = 'mapping-branch';
			editMapping.appendChild(branch);
			const divKey = document.createElement('div');
			divKey.className = 'mapping-key';
			divKey.textContent = key;
			branch.appendChild(divKey);
			if (typeof mapping[key] == 'string')
				// Single result with 100% chance
				showValue(branch, mapping[key], 1);
			else
				// Probabilistic result pool
				for (val in mapping[key])
					showValue(branch, val, mapping[key][val]);
		}
	};
	xhr.send();
}

function showValue(container, value, probability) {
	const row = document.createElement('div');
	row.className = 'mapping-value-row';
	const val = document.createElement('div');
	val.className = 'mapping-value';
	val.textContent = value;
	row.appendChild(val);
	const prob = document.createElement('div');
	prob.className = 'mapping-probability';
	prob.textContent = probability * 100 + '%';
	row.appendChild(prob);
	container.appendChild(row);
}
