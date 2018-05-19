/* global parseXML */
/* Notes:
    #1: See <https://github.com/SpaceK33z/web-to-plex/commit/db01d1a83d32e4d73f2ea671f634e6cc5b4c0fe7>
    #2: See <https://github.com/SpaceK33z/web-to-plex/commit/27506b9a4c12496bd7aad6ee09deb8a5b9418cac>
*/

// FireFox doesn't support sync storage.
const storage = (chrome.storage.sync || chrome.storage.local),
      __servers__ = document.querySelector('#plex_servers'),
      __radarr_qualityProfile__ = document.querySelector(
          `[data-option="radarrQualityProfileId"]`
      ),
      /* See #2 */
      __radarr_storagePath__ = document.querySelector(
            `[data-option="radarrStoragePath"]`
      ),
      __sonarr_qualityProfile__ = document.querySelector(
          `[data-option="sonarrQualityProfileId"]`
      ),
      /* See #2 */
      __sonarr_storagePath__ = document.querySelector(
          `[data-option="sonarrStoragePath"]`
      ),
      __save__ = document.querySelector('#save'),
      __options__ = [
            'plexToken',
            'couchpotatoURLRoot',
            'couchpotatoToken',
            'couchpotatoBasicAuthUsername',
            'couchpotatoBasicAuthPassword',
            'couchpotatoQualityProfileId',
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
            'sonarrQualityProfileId'
      ];

var PlexServers = [],
    ClientID = null,
    manifest = chrome.runtime.getManifest();

function getServers(plexToken) {
	return fetch('https://plex.tv/api/resources?includeHttps=1', {
		headers: {
			'X-Plex-Token': plexToken,
		},
	})
    .then(response => response.text())
    .then(xml => {
        let data = parseXML(xml);

        if (/^\s*Invalid/i.test(data)) {
            return null;
        }

        return data.Device.filter(device => device.provides === 'server');
    });
}

/* See #1 */
function tryPlexLogin(username, password) {
    let hash = btoa(`${username}:${password}`);

    return fetch(`https://plex.tv/users/sign_in.json`, {
        method: 'POST',
        headers: {
            'X-Plex-Product': 'Web to Plex+',
            'X-Plex-Version': manifest.version,
            'X-Plex-Client-Identifier': ClientID,
            'Authorization': `Basic ${ hash }`,
        }
    })
    .then(response => response.json());
}

function performPlexLogin() {
    let u = document.querySelector('#plex_username').value,
        p = document.querySelector('#plex_password').value,
        s = document.querySelector('#plex_test_status');

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
                let t = document.querySelector('#plex_token');

                ClientID = t.value = t.textContent = response.user.authToken;

                return performPlexTest();
            }
        });
}

function performPlexTest(ServerID) {
	let plexToken = document.querySelector('#plex_token').value,
        teststatus = document.querySelector('#plex_test_status');

	__save__.disabled = true;
	__servers__.innerHTML = '';
	teststatus.textContent = '';

	getServers(plexToken).then(servers => {
		PlexServers = servers || [];

		if (!servers) {
			return teststatus.textContent = 'Plex: invalid token';
        }

		__save__.disabled = false;
        teststatus.textContent = 'Success!';

		servers.forEach(server => {
			let $option = document.createElement('option'),
                source = server.sourceTitle;

			$option.value = server.clientIdentifier;
			$option.textContent = `${ server.name } ${ source ? `(${ source })` : '' }`;
			__servers__.appendChild($option);
		});

		if (ServerID) {
			__servers__.value = ServerID;
        }
	});
}

function getPlexConnections(server) {
	// `server.Connection` can be an array or object.
	let connections = [];

	if (server.Connection instanceof Array) {
		connections = server.Connection;
 	} else {
		connections = [server.Connection];
    }

	return connections.map(connection => ({
		uri: connection.uri,
		local: connection.local === '1',
	}));
}

function getOptionValues() {
	let options = {};

	__options__.forEach(option => {
        let element = document.querySelector(
			`[data-option="${ option }"]`
		);

        if(element) {
            options[option] = element.value;
        }
	});

	return options;
}

function getRadarr(options, api = "profile") {
	let headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'X-Api-Key': options.radarrToken,
	};

	if (options.radarrBasicAuthUsername) {
		headers.Authorization = `Basic ${ btoa(`${ options.radarrBasicAuthUsername }:${ options.radarrBasicAuthPassword }`) }`;
    }

    options.radarrURLRoot = options.radarrURLRoot.replace(/^(?!^https?:)/, 'http://').replace(/\/+$/, '');

	return fetch(`${ options.radarrURLRoot }/api/${ api }`, { headers })
		.then(response => response.json())
		.catch(error => {
			return console.error('Radarr failed to connect with error:', error),
              [];
		});
}

function performRadarrTest(QualityProfileID, StoragePath) {
	let options = getOptionValues(),
        teststatus = document.querySelector('#radarr_test_status'),
        storagepath = __radarr_storagePath__;

	__radarr_qualityProfile__.innerHTML = '';
	teststatus.textContent = '';
    storagepath.textContent = '';

	getRadarr(options, 'profile').then(profiles => {
		teststatus.textContent = !~profiles.length ? 'Failed.' : 'Success!';
		profiles.forEach(profile => {
			let option = document.createElement('option');

			option.value = profile.id;
			option.textContent = profile.name;
			__radarr_qualityProfile__.appendChild(option);
		});

		// Because the <select> was reset, the original value is lost.
		if (QualityProfileID) {
			__radarr_qualityProfile__.value = QualityProfileID;
        }
	});

    getRadarr(options, 'rootfolder').then(storagepaths => {
		storagepaths.forEach(path => {
			let option = document.createElement('option');

			option.value = path.path;
			option.textContent = path.path;
			__radarr_storagePath__.appendChild(option);
		});

		// Because the <select> was reset, the original value is lost.
		if (StoragePath) {
			__radarr_storagePath__.value = StoragePath;
        }
    });
}

function getSonarr(options, api = "profile") {
	let headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'X-Api-Key': options.sonarrToken,
	};

	if (options.sonarrBasicAuthUsername) {
		headers.Authorization = `Basic ${ btoa(`${ options.sonarrBasicAuthUsername }:${ options.sonarrBasicAuthPassword }`) }`;
    }

    options.sonarrURLRoot = options.sonarrURLRoot.replace(/^(?!^https?:)/, 'http://').replace(/\/+$/, '');

	return fetch(`${ options.sonarrURLRoot }/api/${ api }`, { headers })
		.then(response => response.json())
		.catch(error => {
			return console.error('Sonarr failed to connect with error:', error),
              [];
		});
}

function performSonarrTest(QualityProfileID, StoragePath) {
	let options = getOptionValues(),
        teststatus = document.querySelector('#sonarr_test_status');

	__sonarr_qualityProfile__.innerHTML = '';
	teststatus.textContent = '';

	getSonarr(options, 'profile').then(profiles => {
		teststatus.textContent = !~profiles.length ? 'Failed.' : 'Success!';
		profiles.forEach(profile => {
			let option = document.createElement('option');
			option.value = profile.id;
			option.textContent = profile.name;
			__sonarr_qualityProfile__.appendChild(option);
		});

		// Because the <select> was reset, the original value is lost.
		if (QualityProfileID) {
			__sonarr_qualityProfile__.value = QualityProfileID;
        }
	});

    getSonarr(options, 'rootfolder').then(storagepaths => {
		storagepaths.forEach(path => {
			let option = document.createElement('option');

			option.value = path.path;
			option.textContent = path.path;
			__sonarr_storagePath__.appendChild(option);
		});

		// Because the <select> was reset, the original value is lost.
		if (StoragePath) {
			__sonarr_storagePath__.value = StoragePath;
        }
    });
}

function saveOptions() {
	let status = document.querySelector('#status'),
        ServerID = __servers__.options[__servers__.selectedIndex].value;

	if (!ServerID) {
		return status.textContent = 'Select a server!',
            null;
    }

	let server = PlexServers.find(ID => ID.clientIdentifier === ServerID);

    // This should never happen, but can be useful for debugging.
	if (!server) {
		return status.textContent = `Could not find Plex server ${ ServerID }`,
            null;
    }

	console.log('Selected server information:', server);

	// Important detail: we get the token from the selected server, NOT the token the user has entered before.
	let serverToken = server.accessToken,
        serverConnections = getPlexConnections(server);
    ClientID = server.clientIdentifier;

	if (!~serverConnections.length) {
		return status.textContent = 'Could not locate Plex server URL',
            null;
    }

	console.log(
		'Plex Server connections:',
		serverConnections
	);

	// With a "user token" you can access multiple servers. A "normal" token is just for one server.
	let options = getOptionValues(),
        endingSlash = ($0, $1, $$, $_) => ($1 + (/\\/.test($_)? '\\': '/'));

    // Instead of having the user be so wordy, complete the URL ourselves here
    if (!options.radarrURLRoot && !options.sonarrURLRoot) {
      return status.textContent = 'Please enter a valid URL',
          null;
    } if (!options.radarrStoragePath && !options.sonarrStoragePath) {
      return status.textContent = 'Please enter a valid storage path',
          null;
    } if (options.radarrURLRoot && !options.radarrQualityProfileId) {
		return status.textContent = 'Select a Radarr quality profile',
            null;
    } if (options.sonarrURLRoot && !options.sonarrQualityProfileId) {
		return status.textContent = 'Select a Sonarr quality profile',
            null;
    } if(!ClientID) {
        ClientID = window.crypto.getRandomValues(new Uint32Array(5))
            .join('-');
        storage.set({ ClientID });
    }

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
		if (chrome.permissions) {
			// When asking permissions the URL needs to have a trailing slash.
			chrome.permissions.request({
				origins: [`${ url }`],
			});
        }
	}

	// Dynamically asking permissions
	requestURLPermissions(options.couchpotatoURLRoot);
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
				connections: serverConnections,
			},
		],
	};

	storage.set(data, () => {
		if (chrome.runtime.lastError) {
			console.error('Error with saving', chrome.runtime.lastError.message);
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
            let el = document.querySelector(`[data-option="${ option }"]`);

            if(!el) return;

			el.value = items[option] || '';

            if(el.value !== '') {
                if(/password$/i.test(option))
                    el.setAttribute('type', el.type = 'password');
                else 
                    el.placeholder = `Last save: ${ el.value }`;
            }
		});

		if (items.plexToken) {
			performPlexTest(items.servers ? items.servers[0].id : null);
        } if (items.radarrURLRoot) {
			performRadarrTest(items.radarrQualityProfileId, items.radarrStoragePath);
        } if (items.sonarrURLRoot) {
			performSonarrTest(items.sonarrQualityProfileId, items.sonarrStoragePath);
        }
	}

	storage.get(null, items => {
		// Sigh... This is a workaround for Firefox; newer versions have support for the `chrome.storage.sync` API,
		// BUT, it will throw an error if you haven't enabled it...
		if (chrome.runtime.lastError) {
			chrome.storage.local.get(null, setOptions);
        } else {
			setOptions(items);
        }
	});
}

document.addEventListener('DOMContentLoaded', restoreOptions);
__save__.addEventListener('click', saveOptions);

document
	.querySelector('#plex_test')
	.addEventListener('click', () => {
        let t = document.querySelector('#plex_token');

        if(t && t.value)
            performPlexTest(ServerID);
        else
            performPlexLogin();
    });
document
	.querySelector('#radarr_test')
	.addEventListener('click', performRadarrTest);
document
	.querySelector('#sonarr_test')
	.addEventListener('click', performSonarrTest);
