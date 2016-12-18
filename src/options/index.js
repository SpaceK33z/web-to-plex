/* global parseXml */
// FireFox doesn't support sync storage.
const storage = chrome.storage.sync || chrome.storage.local;

const $selectServer = document.getElementById('plex_servers');
const $saveButton = document.getElementById('save');
let plexServers = [];

function getServers(plexToken) {
	return fetch('https://plex.tv/api/resources?includeHttps=1', {
		headers: {
			'X-Plex-Token': plexToken,
		},
	})
	.then(res => res.text())
	.then((res) => {
		const data = parseXml(res);
		if (data === 'Invalid authentication token.') {
			return null;
		}
		return data.Device.filter(device => device.provides === 'server');
	});
}

function getSections(url, plexToken) {
	return fetch(`${url}/library/sections`, {
		headers: {
			'X-Plex-Token': plexToken,
			Accept: 'application/json',
		},
	})
	.then(res => res.json())
	.then(res => res.MediaContainer.Directory);
}

function getBestConnectionUrl(server) {
	// `server.Connection` can be an array or object.
	if (Array.isArray(server.Connection)) {
		const conn = server.Connection.find(connection => connection.local === '0');
		if (conn) {
			return conn.uri;
		}
		// If there are only local connections, fine then.
		return conn[0].uri;
	}
	return server.Connection.uri;
}

function performTest() {
	const plexToken = document.getElementById('plex_token').value;
	const $testStatus = document.getElementById('plex_test_status');
	$selectServer.innerHTML = '';
	$testStatus.textContent = '';
	$saveButton.disabled = true;

	getServers(plexToken)
	.then((servers) => {
		plexServers = servers || [];
		if (!servers) {
			$testStatus.textContent = 'Invalid token.';
			return;
		}

		$saveButton.disabled = false;

		servers.forEach((server) => {
			const $opt = document.createElement('option');
			const source = server.sourceTitle;
			$opt.value = server.clientIdentifier;
			$opt.textContent = `${server.name} ${source ? `(${source})` : ''}`;
			$selectServer.appendChild($opt);
		});
	});
}

function saveOptions() {
	const status = document.getElementById('status');
	const selectedServerId = $selectServer.options[$selectServer.selectedIndex].value;
	if (!selectedServerId) {
		status.textContent = 'Select a server first!';
		return;
	}

	const server = plexServers.find(ser => ser.clientIdentifier === selectedServerId);

	// Important detail: we get the token from the selected server, NOT the token the user has entered before.
	const serverToken = server.accessToken;
	const serverId = server.clientIdentifier;
	const serverUrl = getBestConnectionUrl(server);
	let plexSectionsMovie = [];
	let plexSectionsShow = [];

	// With a "user token" you can access multiple servers. A "normal" token is just for one server.
	const plexToken = document.getElementById('plex_token').value;
	const couchpotatoUrlRoot = document.getElementById('couchpotato_url_root').value;
	const couchpotatoToken = document.getElementById('couchpotato_token').value;
	const couchpotatoBasicAuthUsername = document.getElementById('couchpotato_basic_auth_username').value;
	const couchpotatoBasicAuthPassword = document.getElementById('couchpotato_basic_auth_password').value;

	if (couchpotatoUrlRoot && (!couchpotatoUrlRoot.startsWith('http') || couchpotatoUrlRoot.endsWith('/'))) {
		status.textContent = 'CouchPotato URL should start with "http" and end without a slash!';
		return;
	}

	// Dynamically asking permissions
	// TODO: FireFox doesn't have support for chrome.permissions API.
	if (couchpotatoUrlRoot && chrome.permissions) {
		// When asking permissions the URL needs to have a trailing slash.
		chrome.permissions.request({
			origins: [`${couchpotatoUrlRoot}/`],
		});
	}

	getSections(serverUrl, serverToken)
	.then((sections) => {
		// Get the relevant movie and TV show sections
		plexSectionsMovie = sections
			.filter(section => section.type === 'movie' && section.agent !== 'com.plexapp.agents.none')
			.map(section => section.key);
		plexSectionsShow = sections
			.filter(section => section.type === 'show' && section.agent !== 'com.plexapp.agents.none')
			.map(section => section.key);
	})
	.then(() => {
		// `plexLibraryId` is a legacy option, it's no longer necessary after the user has saved again.
		storage.remove(['plexLibraryId', 'plexMachineId', 'plexUrlRoot', 'plexToken']);
		storage.set({
			plexToken,
			servers: [{
				id: serverId,
				token: serverToken,
				url: serverUrl,
				movieSections: plexSectionsMovie,
				showSections: plexSectionsShow,
			}],
			couchpotatoUrlRoot,
			couchpotatoToken,
			couchpotatoBasicAuthUsername,
			couchpotatoBasicAuthPassword,
		}, () => {
			// Update status to let user know options were saved.
			status.textContent = 'Options saved.';
			setTimeout(() => {
				status.textContent = '';
			}, 750);
		});
	});
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
	storage.get(null, (items) => {
		document.getElementById('plex_token').value = items.plexToken || '';
		document.getElementById('couchpotato_url_root').value = items.couchpotatoUrlRoot || '';
		document.getElementById('couchpotato_token').value = items.couchpotatoToken || '';
		document.getElementById('couchpotato_basic_auth_username').value = items.couchpotatoBasicAuthUsername || '';
		document.getElementById('couchpotato_basic_auth_password').value = items.couchpotatoBasicAuthPassword || '';

		if (items.plexToken) {
			performTest();
		}
	});
}
document.addEventListener('DOMContentLoaded', restoreOptions);
$saveButton.addEventListener('click', saveOptions);
document.getElementById('plex_test').addEventListener('click', performTest);
