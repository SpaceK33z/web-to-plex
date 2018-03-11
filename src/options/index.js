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
		.then(res => {
			const data = parseXml(res);
			if (data === 'Invalid authentication token.') {
				return null;
			}
			return data.Device.filter(device => device.provides === 'server');
		});
}

function getBestConnectionUrl(server) {
	// `server.Connection` can be an array or object.
	if (Array.isArray(server.Connection)) {
		const conn = server.Connection.find(connection => connection.local === '0');
		if (conn) {
			return conn.uri;
		}
		// If there are only local connections, fine then.
		return server.Connection[0].uri;
	}
	return server.Connection.uri;
}

function performTest() {
	const plexToken = document.getElementById('plex_token').value;
	const $testStatus = document.getElementById('plex_test_status');
	$selectServer.innerHTML = '';
	$testStatus.textContent = '';
	$saveButton.disabled = true;

	getServers(plexToken).then(servers => {
		plexServers = servers || [];
		if (!servers) {
			$testStatus.textContent = 'Invalid token.';
			return;
		}

		$saveButton.disabled = false;

		servers.forEach(server => {
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
	const selectedServerId =
		$selectServer.options[$selectServer.selectedIndex].value;
	if (!selectedServerId) {
		status.textContent = 'Select a server first!';
		return;
	}

	const server = plexServers.find(
		ser => ser.clientIdentifier === selectedServerId
	);

	if (!server) {
		// This _should_ never happen, but can be useful for debugging.
		status.textContent = 'Could not find Plex server by identifier.';
		return;
	}

	// Important detail: we get the token from the selected server, NOT the token the user has entered before.
	const serverToken = server.accessToken;
	const serverId = server.clientIdentifier;
	const serverUrl = getBestConnectionUrl(server);

	if (!serverUrl) {
		status.textContent = 'Could not find Plex server URL.';
		return;
	}

	// With a "user token" you can access multiple servers. A "normal" token is just for one server.
	const plexToken = document.getElementById('plex_token').value;
	const couchpotatoUrlRoot = document.getElementById('couchpotato_url_root')
		.value;
	const couchpotatoToken = document.getElementById('couchpotato_token').value;
	const couchpotatoBasicAuthUsername = document.getElementById(
		'couchpotato_basic_auth_username'
	).value;
	const couchpotatoBasicAuthPassword = document.getElementById(
		'couchpotato_basic_auth_password'
	).value;

	if (
		couchpotatoUrlRoot &&
		(!couchpotatoUrlRoot.startsWith('http') || couchpotatoUrlRoot.endsWith('/'))
	) {
		status.textContent =
			'CouchPotato URL should start with "http" and end without a slash!';
		return;
	}

	if (!serverUrl) {
		status.textContent = 'Could not get Plex connection URL.';
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

	function showOptionsSaved() {
		// Update status to let user know options were saved.
		status.textContent = 'Options saved.';
		setTimeout(() => {
			status.textContent = '';
		}, 750);
	}

	status.textContent = 'Saving…';

	// These are legacy options, they are no longer necessary after the user has saved again.
	storage.remove(['plexLibraryId', 'plexMachineId', 'plexUrlRoot']);
	const data = {
		plexToken,
		servers: [
			{
				id: serverId,
				token: serverToken,
				url: serverUrl,
			},
		],
		couchpotatoUrlRoot,
		couchpotatoToken,
		couchpotatoBasicAuthUsername,
		couchpotatoBasicAuthPassword,
	};
	storage.set(data, () => {
		if (chrome.runtime.lastError) {
			console.log('Error with saving', chrome.runtime.lastError.message);
			chrome.storage.local.set(data, showOptionsSaved);
		} else {
			showOptionsSaved();
		}
	});
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
	function setOptions(items) {
		document.getElementById('plex_token').value = items.plexToken || '';
		document.getElementById('couchpotato_url_root').value =
			items.couchpotatoUrlRoot || '';
		document.getElementById('couchpotato_token').value =
			items.couchpotatoToken || '';
		document.getElementById('couchpotato_basic_auth_username').value =
			items.couchpotatoBasicAuthUsername || '';
		document.getElementById('couchpotato_basic_auth_password').value =
			items.couchpotatoBasicAuthPassword || '';

		if (items.plexToken) {
			performTest();
		}
	}
	storage.get(null, items => {
		// Sigh... This is a workaround for Firefox; newer versions do have support for the `chrome.storage.sync` API,
		// but it will throw an error if you haven't enabled that. ARGHHHHHHHHH.
		if (chrome.runtime.lastError) {
			chrome.storage.local.get(null, setOptions);
		} else {
			setOptions(items);
		}
	});
}
document.addEventListener('DOMContentLoaded', restoreOptions);
$saveButton.addEventListener('click', saveOptions);
document.getElementById('plex_test').addEventListener('click', performTest);
