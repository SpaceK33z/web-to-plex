/* global parseXml */
// FireFox doesn't support sync storage.
const storage = (chrome.storage.sync || chrome.storage.local),
      __servers__ = document.getElementById('plex_servers'),
      __radarr_qualityProfile__ = document.querySelector(
          `[data-option="radarrQualityProfileId"]`
      ),
      __sonarr_qualityProfile__ = document.querySelector(
          `[data-option="sonarrQualityProfileId"]`
      ),
      __save__ = document.getElementById('save'),
      __options__ = [
          'plexToken',
//        'couchpotatoUrlRoot',
//        'couchpotatoToken',
//        'couchpotatoBasicAuthUsername',
//        'couchpotatoBasicAuthPassword',
          'radarrUrlRoot',
          'radarrToken',
          'radarrBasicAuthUsername',
          'radarrBasicAuthPassword',
          'radarrStoragePath',
          'radarrQualityProfileId',
          'sonarrUrlRoot',
          'sonarrToken',
          'sonarrBasicAuthUsername',
          'sonarrBasicAuthPassword',
          'sonarrStoragePath',
          'sonarrQualityProfileId'
      ];

var PlexServers = [];

function getServers(plexToken) {
	return fetch('https://plex.tv/api/resources?includeHttps=1', {
		headers: {
			'X-Plex-Token': plexToken,
		},
	})
    .then(response => response.text())
    .then(xml => {
        let data = parseXml(xml);
        if (data === 'Invalid authentication token.')
            return null;

        return data.Device.filter(device => device.provides === 'server');
    });
}

function getPlexConnections(server) {
	// `server.Connection` can be an array or object.

	let connections = [];
	if (server.Connection instanceof Array)
		connections = server.Connection;
 	else
		connections = [server.Connection];

	return connections.map(connection => ({
		uri: connection.uri,
		local: connection.local === '1',
	}));
}

function performPlexTest(ServerID) {
	let plexToken = document.getElementById('plex_token').value,
        teststatus = document.getElementById('plex_test_status');

	__save__.disabled = true;
	__servers__.innerHTML = '';
	teststatus.textContent = '';

	getServers(plexToken).then(servers => {
		PlexServers = servers || [];

		if (!servers)
			return teststatus.textContent = 'Plex: invalid token';

		__save__.disabled = false;

		servers.forEach(server => {
			let $option = document.createElement('option'),
                source = server.sourceTitle;

			$option.value = server.clientIdentifier;
			$option.textContent = `${ server.name } ${ source ? `(${ source })` : '' }`;
			__servers__.appendChild($option);
		});

		if (ServerID)
			__servers__.value = ServerID;
	});
}

function getOptionValues() {
	let options = {};

	__options__.forEach(option => {
		options[option] = document.querySelector(
			`[data-option="${ option }"]`
		).value;
	});

	return options;
}

function getRadarrProfiles(options) {
	let headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'X-Api-Key': options.radarrToken,
	};

	if (options.radarrBasicAuthUsername)
		headers.Authorization = `Basic ${ btoa(`${ options.radarrBasicAuthUsername }:${ options.radarrBasicAuthPassword }`) }`;

	return fetch(`${ options.radarrUrlRoot }/api/profile`, { headers })
		.then(response => response.json())
		.catch(error => {
			return console.error('Radarr failed to connect with error:', error),
              [];
		});
}

function performRadarrTest(QualityProfileID) {
	let options = getOptionValues(),
        teststatus = document.getElementById('radarr_test_status');

	__radarr_qualityProfile__.innerHTML = '';
	teststatus.textContent = '';

	getRadarrProfiles(options).then(profiles => {
		teststatus.textContent = !~profiles.length ? 'Failed.' : 'Success!';
		profiles.forEach(profile => {
			let option = document.createElement('option');
			option.value = profile.id;
			option.textContent = profile.name;
			__radarr_qualityProfile__.appendChild(option);
		});

		// Because the <select> was reset, the original value is lost.
		if (QualityProfileID)
			__radarr_qualityProfile__.value = QualityProfileID;
	});
}

function getSonarrProfiles(options) {
	let headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'X-Api-Key': options.sonarrToken,
	};

	if (options.sonarrBasicAuthUsername)
		headers.Authorization = `Basic ${ btoa(`${ options.sonarrBasicAuthUsername }:${ options.sonarrBasicAuthPassword }`) }`;

	return fetch(`${ options.sonarrUrlRoot }/api/profile`, { headers })
		.then(response => response.json())
		.catch(error => {
			return console.error('Sonarr failed to connect with error:', error),
              [];
		});
}

function performSonarrTest(QualityProfileID) {
	let options = getOptionValues(),
        teststatus = document.getElementById('sonarr_test_status');

	__sonarr_qualityProfile__.innerHTML = '';
	teststatus.textContent = '';

	getSonarrProfiles(options).then(profiles => {
		teststatus.textContent = !~profiles.length ? 'Failed.' : 'Success!';
		profiles.forEach(profile => {
			let option = document.createElement('option');
			option.value = profile.id;
			option.textContent = profile.name;
			__sonarr_qualityProfile__.appendChild(option);
		});

		// Because the <select> was reset, the original value is lost.
		if (QualityProfileID)
			__sonarr_qualityProfile__.value = QualityProfileID;
	});
}

function saveOptions() {
	let status = document.getElementById('status'),
        ServerID = __servers__.options[__servers__.selectedIndex].value;

	if (!ServerID)
		return status.textContent = 'Select a server!',
            null;

	let server = PlexServers.find(ID => ID.clientIdentifier === ServerID);

	console.log('Selected server information:', JSON.stringify(server));

    // This should never happen, but can be useful for debugging.
	if (!server)
		return status.textContent = `Could not find Plex server ${ ServerID }`,
            null;

	// Important detail: we get the token from the selected server, NOT the token the user has entered before.
	let serverToken = server.accessToken,
        ClientID = server.clientIdentifier,
        serverConnections = getPlexConnections(server);

	console.log(
		'Found Plex Server connections:',
		JSON.stringify(serverConnections)
	);

	if (!~serverConnections.length)
		return status.textContent = 'Could not locate Plex server URL',
            null;

	// With a "user token" you can access multiple servers. A "normal" token is just for one server.
	let options = getOptionValues(),
        drl = null,
        // Instead of having the user be so wordy, complete the URL ourselves here
        url = (
            (drl = options.radarrUrlRoot)?
                drl:
            (drl = options.sonarrUrlRoot)?
                drl:
            null
        ),
        pth = (
            (drl = options.radarrStoragePath)?
                drl:
            (drl = options.sonarrStoragePath)?
                drl:
            null
        );

    if (url === null)
      return status.textContent = 'Please enter a valid URL',
          null;
    if (pth === null)
      return status.textContent = 'Please enter a valid storage path',
          null;
	if (!options.radarrQualityProfileId)
		return status.textContent = 'Select a Radarr quality profile',
            null;
    if (!options.sonarrQualityProfileId)
		return status.textContent = 'Sonarr a Sonarr quality profile',
            null;

    url = url
        .replace(/(?!^https?:)/, 'http://')
        .replace(/\/+$/, '');

    pth = pth
        .replace(/([^\\\/])$/, ($0, $1, $$, $_) => ($1 + (/\\/.test($_)? '\\': '/')));

	function requestUrlPermissions(url) {
		// TODO: FireFox doesn't have support for chrome.permissions API.
		if (chrome.permissions)
			// When asking permissions the URL needs to have a trailing slash.
			chrome.permissions.request({
				origins: [`${ url }/`],
			});
	}

	// Dynamically asking permissions
//	requestUrlPermissions(options.couchpotatoUrlRoot);
	requestUrlPermissions(options.radarrUrlRoot);
	requestUrlPermissions(options.sonarrUrlRoot);

	function showOptionsSaved() {
		// Update status to let user know options were saved.
		status.textContent = 'Saved';
		setTimeout((() => status.textContent = ''), 750);
	}
	status.textContent = 'Saving...';

	let data = {
		...options,
		servers: [
			{
				id: ClientID,
				token: serverToken,
				connections: serverConnections,
			},
		],
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
// stored in chrome.storage.*
function restoreOptions() {
	function setOptions(items) {
		__options__.forEach(option => {
			document.querySelector(`[data-option="${ option }"]`).value = items[option] || '';
		});

		if (items.plexToken)
			performPlexTest(items.servers ? items.servers[0].id : null);
		if (items.radarrUrlRoot)
			performRadarrTest(items.radarrQualityProfileId);
		if (items.sonarrUrlRoot)
			performSonarrTest(items.sonarrQualityProfileId);
	}

	storage.get(null, items => {
		// Sigh... This is a workaround for Firefox; newer versions have support for the `chrome.storage.sync` API,
		// BUT, it will throw an error if you haven't enabled it...
		if (chrome.runtime.lastError)
			chrome.storage.local.get(null, setOptions);
        else
			setOptions(items);
	});
}

document.addEventListener('DOMContentLoaded', restoreOptions);
__save__.addEventListener('click', saveOptions);

document
	.getElementById('plex_test')
	.addEventListener('click', performPlexTest);
document
	.getElementById('radarr_test')
	.addEventListener('click', performRadarrTest);
document
	.getElementById('sonarr_test')
	.addEventListener('click', performSonarrTest);
