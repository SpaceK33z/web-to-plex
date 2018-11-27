/* global parseXML */
/* Notes:
    #1: See https://github.com/SpaceK33z/web-to-plex/commit/db01d1a83d32e4d73f2ea671f634e6cc5b4c0fe7
    #2: See https://github.com/SpaceK33z/web-to-plex/commit/27506b9a4c12496bd7aad6ee09deb8a5b9418cac
    #3: See https://github.com/SpaceK33z/web-to-plex/issues/21
*/

let NO_DEBUGGER = false;

// FireFox doesn't support sync storage.
const storage = (chrome.storage.sync || chrome.storage.local),
      $$ = (selector, all) => (all? document.querySelectorAll(selector): document.querySelector(selector)),
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
//          'couchpotatoQualityProfileId',
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

            // Advance Settings
            'OMDbAPI',
            'TMDbAPI',
            'UseLoose',
            'UseLooseScore',
            'ManagerSearch',

            // Plugins - End of file, before "let empty = ..."
            'plugin_toloka',
            'plugin_shanaproject',
            'plugin_myanimelist',
      ];

let PlexServers = [],
    ServerID = null,
    ClientID = null,
    manifest = chrome.runtime.getManifest(),
    terminal = // See #3
        NO_DEBUGGER?
            { error: m => m, info: m => m, log: m => m, warn: m => m, group: m => m, groupEnd: m => m }:
        console;

chrome.manifest = chrome.runtime.getManifest();

function load(name) {
    return JSON.parse(localStorage.getItem(btoa(name)));
}

function save(name, data) {
    return localStorage.setItem(btoa(name), JSON.stringify(data));
}

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

		if(!servers)
            return teststatus.title = 'Failed to communicate with Plex', teststatus.classList = false;

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

        if(element) {
            if(element.type == 'checkbox')
                options[option] = element.checked;
            else
                options[option] = element.value;
        }
	});

	return options;
}

function getWatcher(options, api = "getconfig") {
    if(!options.watcherToken)
        return;

	let headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'X-Api-Key': options.watcherToken
	};

	if(options.watcherBasicAuthUsername)
		headers.Authorization = `Basic ${ btoa(`${ options.watcherBasicAuthUsername }:${ options.watcherBasicAuthPassword }`) }`;

    return fetch(`${ options.watcherURLRoot }/api/?apikey=${ options.watcherToken }&mode=${ api }&quality=${ options.watcherQualityProfileId || 'Default' }`, { headers })
        .then(response => response.json())
        .catch(error => {
            return terminal.error('Watcher failed to connect with error:' + String(error)),
              [];
        });
}

function performWatcherTest(QualityProfileID = 'Default', refreshing = false) {
	let options = getOptionValues(),
        teststatus = $$('#watcher_test_status'),
        storagepath = __watcher_storagePath__,
        quality = __watcher_qualityProfile__,
        url;

	quality.innerHTML = '';
	teststatus.textContent = '?';
    storagepath.value = '[Empty]';
    options.watcherURLRoot = url = options.watcherURLRoot.replace(/^(\:\d+)/, 'localhost$1').replace(/^(?!^http(s)?:)/, 'http$1://').replace(/\/+$/, '');

    let Get = () =>
        getWatcher(options, 'getconfig').then(config => {
            let names = config.config.Quality.Profiles,
                path = config.config.Postprocessing.moverpath,
                syntax = path.replace(/\/([\w\s\/\\\{\}]+)$/, '$1'),
                profiles = [];

            path = path.replace(syntax, '');

            for(let name in names)
                profiles.push({
                    id: name,
                    name
                });

            teststatus.textContent = '!';
            teststatus.classList = !!profiles.length;

            if(!profiles.length)
                teststatus.title = 'Failed to communicate with Watcher';

            profiles.forEach(profile => {
                let option = document.createElement('option');

                option.value = profile.id;
                option.textContent = profile.name;
                quality.appendChild(option);
            });

            // Because the <select> was reset, the original value is lost.
            if(QualityProfileID)
                quality.value = QualityProfileID;

            storagepath.value = path || '[Empty]';
        });

    if(refreshing)
        Get();
    else if(url && url.length)
        requestURLPermissions(url + '/*', allowed =>
            (allowed)?
                Get():
            terminal.error('The user refused permission to access Watcher')
        );
}

function getRadarr(options, api = "profile") {
    if(!options.radarrToken)
        return;

	let headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'X-Api-Key': options.radarrToken
	};

	if(options.radarrBasicAuthUsername)
		headers.Authorization = `Basic ${ btoa(`${ options.radarrBasicAuthUsername }:${ options.radarrBasicAuthPassword }`) }`;

	return fetch(`${ options.radarrURLRoot }/api/${ api }`, { headers })
		.then(response => response.json())
		.catch(error => {
			return terminal.error('Radarr failed to connect with error:' + String(error)),
              [];
		});
}

function performRadarrTest(QualityProfileID, StoragePath, refreshing = false) {
	let options = getOptionValues(),
        teststatus = $$('#radarr_test_status'),
        storagepath = __radarr_storagePath__,
        quality = __radarr_qualityProfile__,
        url;

	quality.innerHTML = '';
	teststatus.textContent = '?';
    storagepath.textContent = '';
    options.radarrURLRoot = url = options.radarrURLRoot.replace(/^(\:\d+)/, 'localhost$1').replace(/^(?!^http(s)?:)/, 'http$1://').replace(/\/+$/, '');

    let Get = () => {
        getRadarr(options, 'profile').then(profiles => {
            teststatus.textContent = '!';
            teststatus.classList = !!profiles.length;

            if(!profiles.length)
                teststatus.title = 'Failed to communicate with Radarr';

            profiles.forEach(profile => {
                let option = document.createElement('option');

                option.value = profile.id;
                option.textContent = profile.name;
                quality.appendChild(option);
            });

            // Because the <select> was reset, the original value is lost.
            if(QualityProfileID)
                quality.value = QualityProfileID;
        });

        getRadarr(options, 'rootfolder').then(storagepaths => {
            storagepaths.forEach(path => {
                let option = document.createElement('option');

                option.value = path.path;
                option.textContent = path.path;
                storagepath.appendChild(option);
            });

            // Because the <select> was reset, the original value is lost.
            if(StoragePath)
                storagepath.value = StoragePath;
        });
    };

    if(refreshing)
        Get();
    else if(url && url.length)
        requestURLPermissions(url + '/*', allowed =>
            (allowed)?
                Get():
            terminal.error('The user refused permission to access Radarr')
        );
}

function getSonarr(options, api = "profile") {
    if(!options.sonarrToken)
        return;

	let headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'X-Api-Key': options.sonarrToken
	};

	if(options.sonarrBasicAuthUsername)
		headers.Authorization = `Basic ${ btoa(`${ options.sonarrBasicAuthUsername }:${ options.sonarrBasicAuthPassword }`) }`;

	return fetch(`${ options.sonarrURLRoot }/api/${ api }`, { headers })
		.then(response => response.json())
		.catch(error => {
			return terminal.error('Sonarr failed to connect with error:' + String(error)),
              [];
		});
}

function performSonarrTest(QualityProfileID, StoragePath, refreshing = false) {
	let options = getOptionValues(),
        teststatus = $$('#sonarr_test_status'),
        storagepath = __sonarr_storagePath__,
        quality = __sonarr_qualityProfile__,
        url;

	quality.innerHTML = '';
	teststatus.textContent = '?';
    storagepath.textContent = '';
    options.sonarrURLRoot = url = options.sonarrURLRoot.replace(/^(\:\d+)/, 'localhost$1').replace(/^(?!^http(s)?:)/, 'http$1://').replace(/\/+$/, '');

    let Get = () => {
        getSonarr(options, 'profile').then(profiles => {
            teststatus.textContent = '!';
            teststatus.classList = !!profiles.length;

            if(!profiles.length)
                teststatus.title = 'Failed to communicate with Sonarr';

            profiles.forEach(profile => {
                let option = document.createElement('option');
                option.value = profile.id;
                option.textContent = profile.name;
                quality.appendChild(option);
            });

            // Because the <select> was reset, the original value is lost.
            if(QualityProfileID)
                quality.value = QualityProfileID;
        });

        getSonarr(options, 'rootfolder').then(storagepaths => {
            storagepaths.forEach(path => {
                let option = document.createElement('option');

                option.value = path.path;
                option.textContent = path.path;
                storagepath.appendChild(option);
            });

            // Because the <select> was reset, the original value is lost.
            if(StoragePath)
                storagepath.value = StoragePath;
        });
    };

    if(refreshing)
        Get();
    else if(url && url.length)
        requestURLPermissions(url + '/*', allowed =>
            (allowed)?
                Get():
            terminal.error('The user refused permission to access Sonarr')
        );
}

function saveOptions() {
	let status = $$('#status');

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

    options.plexURL = options.plexURLRoot = (options.plexURL || "https://app.plex.tv/")
        .replace(/([^\\\/])$/, endingSlash)
        .replace(/^(?!^http(s)?:\/\/)(.+)/, 'http$1://$2');

    options.watcherURLRoot = (options.watcherURLRoot || "")
        .replace(/([^\\\/])$/, endingSlash)
        .replace(/^(?!^http(s)?:\/\/)(.+)/, 'http$1://$2');

    options.radarrURLRoot = (options.radarrURLRoot || "")
        .replace(/([^\\\/])$/, endingSlash)
        .replace(/^(?!^http(s)?:\/\/)(.+)/, 'http$1://$2');

    options.sonarrURLRoot = (options.sonarrURLRoot || "")
        .replace(/([^\\\/])$/, endingSlash)
        .replace(/^(?!^http(s)?:\/\/)(.+)/, 'http$1://$2');

    options.radarrStoragePath = options.radarrStoragePath
        .replace(/([^\\\/])$/, endingSlash);

    options.sonarrStoragePath = options.sonarrStoragePath
        .replace(/([^\\\/])$/, endingSlash);

    for(let index = 0, array = 'plex watcher radarr sonarr couchpotato'.split(' '), item = save('URLs', array); index < array.length; index++)
        save(`${ item = array[index] }.url`, options[`${ item }URLRoot`]);

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
            terminal.log('Saved Options:', options);
			showOptionsSaved();
		}
	});
}

function requestURLPermissions(url, callback) {
    if(url && callback)
        return callback(true);
    else if(url)
        return true;
    else
        return false;

    /* Obsolete code, but may be useful later? */
    if(!url || /https?\:\/\/\*/.test(url))
        return;

    // TODO: FireFox doesn't have support for chrome.permissions API.
    if(chrome.permissions) {
        // When asking permissions the URL needs to have a trailing slash.
        chrome.permissions.request({ origins: [`${ url }`] }, callback);
    }
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.*
function restoreOptions() {
	function setOptions(items) {
		__options__.forEach(option => {
            let el = $$(`[data-option="${ option }"]`);

            if(!el) return;

            if(el.type == 'checkbox')
                el.checked = (items[option] + '') == 'true';
            else
                el.value = items[option] || '';

            if(el.value !== '' && !el.disabled) {
                if(el.type == 'checkbox')
                    el.setAttribute('save', el.checked == 'true');
                else if(el.type == 'range')
                    el.setAttribute('save', el.value),
                    el.oninput({ target: el });
                else if(/password$/i.test(option))
                    el.setAttribute('type', el.type = 'password');
                else 
                    el.placeholder = `Last save: ${ el.value }`,
                    el.title = `Double-click to restore value ("${ el.value }")`,
                    el.setAttribute('save', el.value),
                    el.ondblclick = event => el.value = el.getAttribute('save');
            }
        });

		if(items.plexToken)
			performPlexTest(items.servers ? items.servers[0].id : null);
        if(items.watcherURLRoot)
			performWatcherTest(items.watcherQualityProfileId, true);
        if(items.radarrURLRoot)
			performRadarrTest(items.radarrQualityProfileId, items.radarrStoragePath, true);
        if(items.sonarrURLRoot)
			performSonarrTest(items.sonarrQualityProfileId, items.sonarrStoragePath, true);
	}

	storage.get(null, items => {
		// Sigh... This is a workaround for Firefox; newer versions have support for the `chrome.storage.sync` API,
		// BUT, it will throw an error if you haven't enabled it...
		if(chrome.runtime.lastError)
			chrome.storage.local.get(null, setOptions);
        else
			setOptions(items);
	});
}

// Plugins and their links
let plugins = {
    'Toloka': 'https://toloka.to/',
    'Shana Project': 'https://www.shanaproject.com/',
    'My Anime List': 'https://myanimelist.net/',

    // Dont' forget to add to the __options__ array!
}, array = [], sites = {}, pluginElement = $$('#plugins');

for(let plugin in plugins)
    array.push(plugin);
array = array.sort();

for(let index = 0, length = array.length; pluginElement && index < length; index++) {
    let title = array[index],
        name  = 'plugin_' + title.toLowerCase().replace(/\s+/g, ''),
        url   = new URL(plugins[title]),
        js    = name.replace(/^plugin_/i, ''),
        o     = url.origin,
        r     = url.host.replace(/^(ww\w+\.)/, '');

    sites[r] = o;

    pluginElement.innerHTML +=
`
<h3>${ title }</h3>
<div class="checkbox">
    <input id="${ name }" type="checkbox" data-option="${ name }" pid="${ r }" js="${ js }">
    <label for="${ name }"></label>
</div>
<div>
    Allows the ${ title } plugin to run on <a href="${ url.href }" title="${ o }" target="_blank">${ r }</a>
</div>

<hr>
`;
}

save('optional.sites', sites);

$$('[id^="plugin_"]', true)
    .forEach(element => element.addEventListener('click', event => {
        let self = event.target,
            pid = self.getAttribute('pid'),
            js = self.getAttribute('js');

        if(self.checked) {
            terminal.log(pid, sites[pid])
            requestURLPermissions(sites[pid].replace(/https?:\/\/(ww\w+\.)?/i, '*://*.').replace(/\/?$/, '/*'), granted => {
                save(`permission:${ pid }`, granted);
                save(`script:${ pid }`, granted? js: null);
            });
        } else {
            save(`permission:${ pid }`, false);
            save(`script:${ pid }`, null);
        }
    })
);

let empty = () => {};

document.addEventListener('DOMContentLoaded', restoreOptions);
__save__.addEventListener('click', saveOptions);

$$('#plex_test')
	.addEventListener('click', event => {
        let t = $$('#plex_token');

        if(t && t.value)
            performPlexTest(ServerID);
        else
            performPlexLogin();
    });
$$('#watcher_test', true).forEach(element => element.addEventListener('click', event => performWatcherTest()));
$$('#radarr_test', true).forEach(element => element.addEventListener('click', event => performRadarrTest()));
$$('#sonarr_test', true).forEach(element => element.addEventListener('click', event => performSonarrTest()));

$$('#version')
    .innerHTML = `Version ${ chrome.manifest.version }`;
$$('[type="range"]', true)
    .forEach((element, index, array) => {
        element.nextElementSibling.value = element.value + '%';

        element.oninput = (event, self) => (self = event.target).nextElementSibling.value = self.value + '%';
    });
