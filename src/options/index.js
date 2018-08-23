/* global parseXML */
/* Notes:
    #1: See <https://github.com/SpaceK33z/web-to-plex/commit/db01d1a83d32e4d73f2ea671f634e6cc5b4c0fe7>
    #2: See <https://github.com/SpaceK33z/web-to-plex/commit/27506b9a4c12496bd7aad6ee09deb8a5b9418cac>
    #3: See <https://github.com/SpaceK33z/web-to-plex/issues/21>
*/

// FireFox doesn't support sync storage.
const storage = (chrome.storage.sync || chrome.storage.local),
      $$ = selector => document.querySelector(selector),
      __servers__ = $$('#plex_servers'),
      __watcher_qualityProfile__ = $$(
          `[data-option="watcherQualityProfileId"]`
      ),
      __watcher_storagePath__ = $$(
            `[data-option="watcherStoragePath"]`
      ),
      __radarr_qualityProfile__ = $$(
          `[data-option="radarrQualityProfileId"]`
      ),
      /* See #2 */
      __radarr_storagePath__ = $$(
            `[data-option="radarrStoragePath"]`
      ),
      __sonarr_qualityProfile__ = $$(
          `[data-option="sonarrQualityProfileId"]`
      ),
      /* See #2 */
      __sonarr_storagePath__ = $$(
          `[data-option="sonarrStoragePath"]`
      ),
      __save__ = $$('#save'),
      __options__ = [
            'plexURL',
            'plexToken',
            'couchpotatoURLRoot',
            'couchpotatoToken',
            'couchpotatoBasicAuthUsername',
            'couchpotatoBasicAuthPassword',
            'couchpotatoQualityProfileId',
            'watcherURLRoot',
            'watcherToken',
            'watcherBasicAuthUsername',
            'watcherBasicAuthPassword',
            'watcherStoragePath',
            'watcherQualityProfileId',
            'radarrURLRoot',
            'radarrToken',
            'radarrBasicAuthUsername',
            'radarrBasicAuthPassword',
            'radarrStoragePath',
            'radarrQualityProfileId',
            'sonarrURLRoot',
            'sonarrToken',
            'sonarrBasicAuthUsername',
            'sonarrBasicAuthPassword',
            'sonarrStoragePath',
            'sonarrQualityProfileId',
            'OMDbAPI',
            'TMDbAPI'
      ];

let PlexServers = [],
    ClientID = null,
    manifest = chrome.runtime.getManifest(),
    terminal = // See #3
//                { error: m => m, info: m => m, log: m => m, warn: m => m } ||
                console;

chrome.manifest = chrome.runtime.getManifest();

function getServers(plexToken) {
	return fetch('https://plex.tv/api/resources?includeHttps=1', {
		headers: {
			'X-Plex-Token': plexToken
		}
	})
    .then(response => response.text())
    .then(xml => {
        let data = parseXML(xml);

        if(/^\s*Invalid/i.test(data))
            return null;

        return data.Device.filter(device => device.provides === 'server');
    });
}

/* See #1 */
function tryPlexLogin(username, password) {
    let hash = btoa(`${username}:${password}`);

    return fetch(`https://plex.tv/users/sign_in.json`, {
        method: 'POST',
        headers: {
            'X-Plex-Product': 'Web to Plex',
            'X-Plex-Version': manifest.version,
            'X-Plex-Client-Identifier': ClientID,
            'Authorization': `Basic ${ hash }`
        }
    })
    .then(response => response.json());
}

function performPlexLogin() {
    let u = $$('#plex_username').value,
        p = $$('#plex_password').value,
        s = $$('#plex_test_status');

    s.textContent = '';
    __servers__.innerHTML = '';
    __save__.disabled = true;

    tryPlexLogin(u, p)
        .then(response => {
            if(response.error) {
                s.textContent = 'Invalid login information';

                return;
            }

            if(response.user) {
                let t = $$('#plex_token');

                ClientID = t.value = t.textContent = response.user.authToken;

                return performPlexTest();
            }
        });
}

function performPlexTest(ServerID) {
	let plexToken = $$('#plex_token').value,
        teststatus = $$('#plex_test_status');

	__save__.disabled = true;
	__servers__.innerHTML = '';
	teststatus.textContent = '?';

	getServers(plexToken).then(servers => {
		PlexServers = servers || [];
        teststatus.textContent = '!';

		if(!servers) {
            teststatus.classList = false;

            return;
        }

		__save__.disabled = false;
        teststatus.classList = true;

		servers.forEach(server => {
			let $option = document.createElement('option'),
                source = server.sourceTitle;

			$option.value = server.clientIdentifier;
			$option.textContent = `${ server.name } ${ source ? `(${ source })` : '' }`;
			__servers__.appendChild($option);
		});

		if(ServerID)
			__servers__.value = ServerID;
	});
}

function getPlexConnections(server) {
	// `server.Connection` can be an array or object.
	let connections = [];

	if(server.Connection instanceof Array)
		connections = server.Connection;
 	else
		connections = [server.Connection];

	return connections.map(connection => ({
		uri: connection.uri,
		local: connection.local === '1'
	}));
}

function getOptionValues() {
	let options = {};

	__options__.forEach(option => {
        let element = $$(
			`[data-option="${ option }"]`
		);

        if(element)
            options[option] = element.value;
	});

	return options;
}

function getWatcher(options, api = "getconfig") {
	let headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'X-Api-Key': options.watcherToken
	};

	if(options.watcherBasicAuthUsername)
		headers.Authorization = `Basic ${ btoa(`${ options.watcherBasicAuthUsername }:${ options.watcherBasicAuthPassword }`) }`;

    options.watcherURLRoot = options.watcherURLRoot.replace(/^(?!^https?:)/, 'http://').replace(/\/+$/, '');

	return fetch(`${ options.watcherURLRoot }/api/?apikey=${ options.watcherToken }&mode=${ api }&quality=${ options.watcherQualityProfileId || 'Default' }`, { headers })
		.then(response => response.json())
		.catch(error => {
			return terminal.error('Watcher failed to connect with error:', error),
              [];
		});
}

function performWatcherTest(QualityProfileID = 'Default') {
	let options = getOptionValues(),
        teststatus = $$('#watcher_test_status'),
        storagepath = __watcher_storagePath__;

	__watcher_qualityProfile__.innerHTML = '';
	teststatus.textContent = '?';
    storagepath.value = '[Empty]';

    getWatcher(options, 'getconfig').then(config => {
        let names = config.config.Quality.Profiles,
            path = config.config.Postprocessing.moverpath,
            profiles = [];

        for(let name in names)
            profiles.push({
                id: name,
                name
            });

		teststatus.textContent = '!';
        teststatus.classList = !!profiles.length;

		profiles.forEach(profile => {
			let option = document.createElement('option');

			option.value = profile.id;
			option.textContent = profile.name;
			__watcher_qualityProfile__.appendChild(option);
		});

		// Because the <select> was reset, the original value is lost.
		if(QualityProfileID)
			__watcher_qualityProfile__.value = QualityProfileID;

        storagepath.value = path || '[Empty]';
	});
}

function getRadarr(options, api = "profile") {
	let headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'X-Api-Key': options.radarrToken
	};

	if(options.radarrBasicAuthUsername)
		headers.Authorization = `Basic ${ btoa(`${ options.radarrBasicAuthUsername }:${ options.radarrBasicAuthPassword }`) }`;

    options.radarrURLRoot = options.radarrURLRoot.replace(/^(?!^https?:)/, 'http://').replace(/\/+$/, '');

	return fetch(`${ options.radarrURLRoot }/api/${ api }`, { headers })
		.then(response => response.json())
		.catch(error => {
			return terminal.error('Radarr failed to connect with error:', error),
              [];
		});
}

function performRadarrTest(QualityProfileID, StoragePath) {
	let options = getOptionValues(),
        teststatus = $$('#radarr_test_status'),
        storagepath = __radarr_storagePath__;

	__radarr_qualityProfile__.innerHTML = '';
	teststatus.textContent = '?';
    storagepath.textContent = '';

	getRadarr(options, 'profile').then(profiles => {
		teststatus.textContent = '!';
        teststatus.classList = !!profiles.length;

		profiles.forEach(profile => {
			let option = document.createElement('option');

			option.value = profile.id;
			option.textContent = profile.name;
			__radarr_qualityProfile__.appendChild(option);
		});

		// Because the <select> was reset, the original value is lost.
		if(QualityProfileID)
			__radarr_qualityProfile__.value = QualityProfileID;
	});

    getRadarr(options, 'rootfolder').then(storagepaths => {
		storagepaths.forEach(path => {
			let option = document.createElement('option');

			option.value = path.path;
			option.textContent = path.path;
			__radarr_storagePath__.appendChild(option);
		});

		// Because the <select> was reset, the original value is lost.
		if(StoragePath)
			__radarr_storagePath__.value = StoragePath;
    });
}

function getSonarr(options, api = "profile") {
	let headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'X-Api-Key': options.sonarrToken
	};

	if(options.sonarrBasicAuthUsername)
		headers.Authorization = `Basic ${ btoa(`${ options.sonarrBasicAuthUsername }:${ options.sonarrBasicAuthPassword }`) }`;

    options.sonarrURLRoot = options.sonarrURLRoot.replace(/^(?!^https?:)/, 'http://').replace(/\/+$/, '');

	return fetch(`${ options.sonarrURLRoot }/api/${ api }`, { headers })
		.then(response => response.json())
		.catch(error => {
			return terminal.error('Sonarr failed to connect with error:', error),
              [];
		});
}

function performSonarrTest(QualityProfileID, StoragePath) {
	let options = getOptionValues(),
        teststatus = $$('#sonarr_test_status'),
        storagepath = __sonarr_storagePath__;

	__sonarr_qualityProfile__.innerHTML = '';
	teststatus.textContent = '?';
    storagepath.textContent = '';

	getSonarr(options, 'profile').then(profiles => {
		teststatus.textContent = '!';
        teststatus.classList = !!profiles.length;

		profiles.forEach(profile => {
			let option = document.createElement('option');
			option.value = profile.id;
			option.textContent = profile.name;
			__sonarr_qualityProfile__.appendChild(option);
		});

		// Because the <select> was reset, the original value is lost.
		if(QualityProfileID)
			__sonarr_qualityProfile__.value = QualityProfileID;
	});

    getSonarr(options, 'rootfolder').then(storagepaths => {
		storagepaths.forEach(path => {
			let option = document.createElement('option');

			option.value = path.path;
			option.textContent = path.path;
			__sonarr_storagePath__.appendChild(option);
		});

		// Because the <select> was reset, the original value is lost.
		if(StoragePath)
			__sonarr_storagePath__.value = StoragePath;
    });
}

function saveOptions() {
	let status = $$('#status'),
        ServerID = __servers__.options[__servers__.selectedIndex].value;

	if(!ServerID) {
		return status.textContent = 'Select a server!',
            null;
    }

	let server = PlexServers.find(ID => ID.clientIdentifier === ServerID);

    // This should never happen, but can be useful for debugging.
	if(!server) {
		return status.textContent = `Could not find Plex server ${ ServerID }`,
            null;
    }

	terminal.log('Selected server information:', server);

	// Important detail: we get the token from the selected server, NOT the token the user has entered before.
	let serverToken = server.accessToken,
        serverConnections = getPlexConnections(server);
    ClientID = server.clientIdentifier;

	if(!serverConnections.length) {
		return status.textContent = 'Could not locate Plex server URL',
            null;
    }

	terminal.log(
		'Plex Server connections:',
		serverConnections
	);

	// With a "user token" you can access multiple servers. A "normal" token is just for one server.
	let options = getOptionValues(),
        endingSlash = ($0, $1, $$, $_) => ($1 + (/\\/.test($_)? '\\': '/'));

    // Instead of having the user be so wordy, complete the URL ourselves here
    if((!options.radarrURLRoot && options.radarrToken) || (!options.sonarrURLRoot && options.sonarrToken) || (!options.watcherURLRoot && options.watcherToken)) {
      return status.textContent = 'Please enter a valid manager URL',
          null;
    } if((options.radarrURLRoot && !options.radarrStoragePath) && (options.sonarrURLRoot && !options.sonarrStoragePath)) {
      return status.textContent = 'Please enter a valid manager storage path',
          null;
    } if(options.watcherURLRoot && !options.watcherQualityProfileId) {
        return status.textContent = 'Select a Watcher quality profile',
            null;
    } if(options.radarrURLRoot && !options.radarrQualityProfileId) {
        return status.textContent = 'Select a Radarr quality profile',
            null;
    } if(options.sonarrURLRoot && !options.sonarrQualityProfileId) {
        return status.textContent = 'Select a Sonarr quality profile',
            null;
    } if(!ClientID) {
        ClientID = window.crypto.getRandomValues(new Uint32Array(5))
            .join('-');
        storage.set({ ClientID });
    }

    options.plexURL = (options.plexURL || "")
        .replace(/([^\\\/])$/, endingSlash)
        .replace(/^(?!^https?:\/\/)(.+)/, 'http://$1');

    options.watcherURLRoot = (options.watcherURLRoot || "")
        .replace(/([^\\\/])$/, endingSlash)
        .replace(/^(?!^https?:\/\/)(.+)/, 'http://$1');

    options.radarrURLRoot = (options.radarrURLRoot || "")
        .replace(/([^\\\/])$/, endingSlash)
        .replace(/^(?!^https?:\/\/)(.+)/, 'http://$1');

    options.sonarrURLRoot = (options.sonarrURLRoot || "")
        .replace(/([^\\\/])$/, endingSlash)
        .replace(/^(?!^https?:\/\/)(.+)/, 'http://$1');

    options.radarrStoragePath = options.radarrStoragePath
        .replace(/([^\\\/])$/, endingSlash);

    options.sonarrStoragePath = options.sonarrStoragePath
        .replace(/([^\\\/])$/, endingSlash);

	function requestURLPermissions(url) {
        if(!url) return;

		// TODO: FireFox doesn't have support for chrome.permissions API.
		if(chrome.permissions) {
			// When asking permissions the URL needs to have a trailing slash.
			chrome.permissions.request({
				origins: [`${ url }`]
			});
        }
	}

	// Dynamically asking permissions
	requestURLPermissions(options.couchpotatoURLRoot);
	requestURLPermissions(options.watcherURLRoot);
	requestURLPermissions(options.radarrURLRoot);
	requestURLPermissions(options.sonarrURLRoot);

	function showOptionsSaved() {
		// Update status to let user know options were saved.
		status.textContent = 'Saved';
		setTimeout((() => status.textContent = ''), 2500);
	}
	status.textContent = 'Saving...';

	let data = {
		...options,
		servers: [
			{
				id: ClientID,
				token: serverToken,
				connections: serverConnections
			},
		]
	};

	storage.set(data, () => {
		if(chrome.runtime.lastError) {
			terminal.error('Error with saving', chrome.runtime.lastError.message);
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
            let el = $$(`[data-option="${ option }"]`);

            if(!el) return;

			el.value = items[option] || '';

            if(el.value !== '' && !el.disabled) {
                if(/password$/i.test(option))
                    el.setAttribute('type', el.type = 'password');
                else 
                    el.placeholder = `Last save: ${ el.value }`,
                    el.title = `Double-click to restore value ("${ el.value }")`,
                    el.setAttribute('save', el.value);
            }

            el.ondblclick = event => el.value = el.getAttribute('save');
        });

		if(items.plexToken)
			performPlexTest(items.servers ? items.servers[0].id : null);
        if(items.watcherURLRoot)
			performWatcherTest(items.watcherQualityProfileId);
        if(items.radarrURLRoot)
			performRadarrTest(items.radarrQualityProfileId, items.radarrStoragePath);
        if(items.sonarrURLRoot)
			performSonarrTest(items.sonarrQualityProfileId, items.sonarrStoragePath);
	}

	storage.get(null, items => {
		// Sigh... This is a workaround for Firefox; newer versions have support for the `chrome.storage.sync` API,
		// BUT, it will throw an error if you haven't enabled it...
		if(chrome.runtime.lastError)
			chrome.storage.local.get(null, setOptions); else {
			setOptions(items);
        }
	});
}

document.addEventListener('DOMContentLoaded', restoreOptions);
__save__.addEventListener('click', saveOptions);

document
	.querySelector('#plex_test')
	.addEventListener('click', () => {
        let t = $$('#plex_token');

        if(t && t.value)
            performPlexTest(ServerID);
        else
            performPlexLogin();
    });
document
	.querySelector('#watcher_test')
	.addEventListener('click', performWatcherTest);
document
	.querySelector('#radarr_test')
	.addEventListener('click', performRadarrTest);
document
	.querySelector('#sonarr_test')
	.addEventListener('click', performSonarrTest);
document
    .querySelector('#version')
    .innerHTML = `Version ${ chrome.manifest.version }`;
