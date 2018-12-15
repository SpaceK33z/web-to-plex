/* global parseXML */
/* Notes:
    #1: See https://github.com/SpaceK33z/web-to-plex/commit/db01d1a83d32e4d73f2ea671f634e6cc5b4c0fe7
    #2: See https://github.com/SpaceK33z/web-to-plex/commit/27506b9a4c12496bd7aad6ee09deb8a5b9418cac
    #3: See https://github.com/SpaceK33z/web-to-plex/issues/21
*/

let NO_DEBUGGER = false;

if(chrome.runtime.lastError)
    /* Always causes errors on *nix machines, so just "poke" the errors here */
    chrome.runtime.lastError.message;

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
            'UseOmbi',
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
            'ombiURLRoot',
            'ombiToken',

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

// create and/or queue a notification
// state = "error" - red
// state = "update" - blue
// state = "info" - grey
// anything else for state will show as orange
class Notification {
    constructor(state, text, timeout = 7000, callback, requiresClick = true) {
        let queue = (Notification.queue = Notification.queue || { list: [] }),
            last = queue.list[queue.list.length - 1];

        if (last && last.done === false)
            return (last => setTimeout(() => new Notification(state, text, timeout, callback), +(new Date) - last.start))(last);

        callback = callback || (() => {});

        let element = document.createElement('div');

        element.classList.add('notification', state);
        element.addEventListener('onclick', element.onclick = event => {
            let notification = Notification.queue[event.target.id],
                element = notification.element;

            notification.done = true;
            Notification.queue.list.splice(notification.index, 1);
            clearTimeout(notification.job);
            element.remove();

            let removed = delete Notification.queue[notification.id];

            return (event.requiresClick)? null: notification.callback(removed);
        });

        element.innerHTML = text;
        queue[element.id = +(new Date)] = {
            start: +element.id,
            stop:  +element.id + timeout,
            span:  +timeout,
            done:  false,
            index: queue.list.length,
            job:   setTimeout(() => element.onclick({ target: element, requiresClick }), timeout),
            id:    +element.id,
            callback, element
        };
        queue.list.push(queue[element.id]);

        document.body.appendChild(element);

        return queue[element.id];
    }
}

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

    s.title = '';
    __servers__.innerHTML = '';
    __save__.disabled = true;

    tryPlexLogin(u, p)
        .then(response => {
            if(response.error)
                return s.title = 'Invalid login information', null;

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
                options[option] = element.checked || element.getAttribute('checked');
            else
                options[option] = element.value;
        }
	});

	return options;
}

function performOmbiLogin() {
    let l = $$('#ombi_url').value,
        a = $$('#ombi_api').value,
        s = $$('#plex_test_status'),
        e = ($0, $1, $$, $_) => ($1 + (/\\/.test($_)? '\\': '/'));

    l = l
        .replace(/([^\\\/])$/, e)
        .replace(/^(?!^http(s)?:\/\/)(.+)/, 'http$1://$2');
    s.title = '';
    __servers__.innerHTML = '';
    __save__.disabled = true;

    let APIURL = `${ l }api/v1/`,
        headers = { headers: { apikey: a, accept: 'application/json' } };

    fetch(`${ APIURL }Settings/plex`, headers)
        .then( response => response.json() )
        .then( json => {
            /* Get Plex's details first. If it's disabled, or non-existent, then exit */
            /* Swagger API says "enable", but we'll go with "enabled" */
            if(json && (json.enable || json.enabled)) {
                let t = $$('#plex_token'),
                    s = $$('#plex_servers'),
                    u = $$('[data-option="UseOmbi"]');

                json = (json && json.servers.length? json.servers[0]: {});

                let name  = json.name,              // people friendly server name
                    token = json.plexAuthToken,     // the auth token
                    uuid  = json.machineIdentifier, // the machine ID
                    url   = json.ip;                // the Plex URL used

                url = url.replace(/(?:[^\/]+\/\/)?([^\/]+)\/?/, `http${ json.ssl? 's': '' }://$1:${ json.port }/`);

                ClientID = t.value = t.textContent = token;
                ServerID = s.value = uuid;
                s.innerHTML = `<option value="${ uuid }">${ name }</option>`;

                /* Now we can fill in the other details */
                if(u.checked) {
                    // Ombi
                    let L = $$('[data-option="ombiURLRoot"]'),
                        A = $$('[data-option="ombiToken"]');

                    L.value = L.textContent = l;
                    A.value = A.textContent = a;

                    new Notification('update', 'Filled in Ombi', 3000);

                    // CouchPotato
                    fetch(`${ APIURL }Settings/CouchPotato`, headers)
                        .then( data => data.json() )
                        .then( json => {
                            if(!json || (!json.enabled && !json.enable)) return;

                            let k = $$('[data-option="couchpotatoToken"]'),
                                K = $$('[data-option="couchpotatoURLRoot"]');

                            k.value = k.textContent = json.apiKey;
                            K.value = K.textContent = json.ip.replace(/(?:[^\/]+\/\/)?([^\/]+)\/?/, `http${ json.ssl? 's': '' }://$1:${ json.port }/`);

                            new Notification('update', 'Filled in CouchPotato', 3000);
                        } )
                        .catch( error => { new Notification('error', 'Error getting CouchPotato details from Ombi'); throw error } );

                    // Radarr
                    fetch(`${ APIURL }Settings/radarr`, headers)
                        .then( data => data.json() )
                        .then( json => {
                            if(!json || (!json.enabled && !json.enable)) return;

                            let k = $$('[data-option="radarrToken"]'),
                                K = $$('[data-option="radarrURLRoot"]'),
                                q = $$('[data-option="radarrQualityProfileId"]'),
                                Q = $$('[data-option="radarrStoragePath"]'),
                                _q, _Q;

                            k.value = k.textContent = json.apiKey;
                            K.value = K.textContent = json.ip.replace(/(?:[^\/]+\/\/)?([^\/]+)\/?/, `http${ json.ssl? 's': '' }://$1:${ json.port }/`);
                            q.value = _q = json.defaultQualityProfile;
                            Q.value = _Q = json.defaultRootPath;

                            q.innerHTML = `<option value="${ _q }">[Ombi]: ${ _q }</option>`;
                            Q.innerHTML = `<option value="${ _Q }">[Ombi]: ${ _Q }</option>`;

                            new Notification('update', 'Filled in Radarr', 3000);
                        } )
                        .catch( error => { new Notification('error', 'Error getting Radarr details from Ombi'); throw error } );

                    // Sonarr
                    fetch(`${ APIURL }Settings/sonarr`, headers)
                        .then( data => data.json() )
                        .then( json => {
                            if(!json || (!json.enabled && !json.enable)) return;

                            let k = $$('[data-option="sonarrToken"]'),
                                K = $$('[data-option="sonarrURLRoot"]'),
                                q = $$('[data-option="sonarrQualityProfileId"]'),
                                Q = $$('[data-option="sonarrStoragePath"]'),
                                _q, _Q;

                            k.value = k.textContent = json.apiKey;
                            K.value = K.textContent = json.ip.replace(/(?:[^\/]+\/\/)?([^\/]+)\/?/, `http${ json.ssl? 's': '' }://$1:${ json.port }/`);
                            q.value = _q = json.qualityProfile;
                            Q.value = _Q = json.rootPath;

                            q.innerHTML = `<option value="${ _q }">[Ombi]: ${ _q }</option>`;
                            Q.innerHTML = `<option value="${ _Q }">[Ombi]: ${ _Q }</option>`;

                            new Notification('update', 'Filled in Sonarr', 3000);
                        } )
                        .catch( error => { new Notification('error', 'Error getting Sonarr details from Ombi'); throw error } );
                }

                __save__.disabled = false;
            } else {
                /* Plex either doesn't exist, or is disabled */
                new Notification('error', 'Error getting Plex details from Ombi');
            }
        } )
        .catch( error => { new Notification('error', error); throw error } );
}

function performOmbiTest(refreshing = false) {
    let options = getOptionValues(),
        teststatus = $$('#ombi_test_status'),
        url,
        headers = { headers: { apikey: options.ombiToken, accept: 'text/html' } };

    teststatus.textContent = '?';
    options.ombiURLRoot = url = options.ombiURLRoot.replace(/^(\:\d+)/, 'localhost$1').replace(/^(?!^http(s)?:)/, 'http$1://').replace(/\/+$/, '');

    let Get = () =>
        fetch(`${ url }/api/v1/Status`, headers)
            .then( response => response.text() )
            .then( status => {
                if (!status || !status.length) throw new Error('Unable to communicate with Ombi');

                if ((status = +status) >= 200 && status < 400) {
                    teststatus.textContent = '!';
                    teststatus.classList = 'true';
                } else {
                    teststatus.textContent = '!';
                    teststatus.classList = 'false';

                    throw new Error(`Ombi error [${ status }]`);
                }
            } )
            .catch( error => { new Notification('error', error) } );

    if(refreshing)
        Get();
    else if(url && url.length)
        requestURLPermissions(url + '/*', allowed =>
            (allowed)?
                Get():
            new Notification('error', 'The user refused permission to access Ombi')
        );
}

function getWatcher(options, api = "getconfig") {
    if(!options.watcherToken)
        return new Notification('error', 'Invalid Watcher token');

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
            return new Notification('error', 'Watcher failed to connect with error:' + String(error)),
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
            if(!config || !config.config) return new Notification('error', 'Failed to get Watcher configuration');

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
            new Notification('error', 'The user refused permission to access Watcher')
        );
}

function getRadarr(options, api = "profile") {
    if(!options.radarrToken)
        return new Notification('error', 'Invalid Radarr token');

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
			return new Notification('error', 'Radarr failed to connect with error:' + String(error)),
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
            if(!profiles) return new Notification('error', 'Failed to get Radarr configuration');

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

                option.value = option.textContent = path.path;
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
            new Notification('error', 'The user refused permission to access Radarr')
        );
}

function getSonarr(options, api = "profile") {
    if(!options.sonarrToken)
        return new Notification('error', 'Invalid Sonarr token');

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
			return new Notification('error', 'Sonarr failed to connect with error:' + String(error)),
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
            if(!profiles) return new Notification('error', 'Failed to get Sonarr configuration');

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

                option.value = option.textContent = path.path;
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
            new Notification('error', 'The user refused permission to access Sonarr')
        );
}

function saveOptions() {
    ServerID = __servers__.options[__servers__.selectedIndex].value;

	if(!ServerID) {
		return new Notification('error', 'Select a server!'),
            null;
    }

	let server = PlexServers.find(ID => ID.clientIdentifier === ServerID);

    // This should never happen, but can be useful for debugging.
	if(!server)
		return new Notification('error', `Could not find Plex server ${ ServerID }`),
            null;

	terminal.log('Selected server information:', server);

	// Important detail: we get the token from the selected server, NOT the token the user has entered before.
	let serverToken = server.accessToken,
        serverConnections = getPlexConnections(server);
    ClientID = server.clientIdentifier;

	if(!serverConnections.length)
		return new Notification('error', 'Could not locate Plex server URL'),
            null;
	terminal.log('Plex Server connections:', serverConnections);

	// With a "user token" you can access multiple servers. A "normal" token is just for one server.
	let options = getOptionValues(),
        endingSlash = ($0, $1, $$, $_) => ($1 + (/\\/.test($_)? '\\': '/'));

    let r, R = 'Radarr',
        s, S = 'Sonarr',
        w, W = 'Watcher',
        c, C = 'CouchPotato',
        o, O = 'Ombi';

    let who = () => (r? R: s? S: w? W: c? C: o? O: 'manager');

    // Instead of having the user be so wordy, complete the URL ourselves here
    if((r = !options.radarrURLRoot && options.radarrToken) || (s = !options.sonarrURLRoot && options.sonarrToken) || (w = !options.watcherURLRoot && options.watcherToken) || (o = !options.ombiURLRoot && options.ombiToken)) {
      return new Notification('error', `Please enter a valid URL for ${ who() }`),
          null;
    } if((options.radarrURLRoot && !options.radarrStoragePath) && (options.sonarrURLRoot && !options.sonarrStoragePath)) {
      return new Notification('error', `Please enter a valid storage path for ${ who() }`),
          null;
    } if(options.watcherURLRoot && !options.watcherQualityProfileId) {
        return new Notification('error', 'Select a quality profile for Watcher'),
            null;
    } if(options.radarrURLRoot && !options.radarrQualityProfileId) {
        return new Notification('error', 'Select a quality profile for Radarr'),
            null;
    } if(options.sonarrURLRoot && !options.sonarrQualityProfileId) {
        return new Notification('error', 'Select a quality profile for Sonarr'),
            null;
    } if(!ClientID) {
        ClientID = window.crypto.getRandomValues(new Uint32Array(5))
            .join('-');
        storage.set({ ClientID });
    }

    options.plexURL = options.plexURLRoot = (options.plexURL || "https://app.plex.tv/")
        .replace(/([^\\\/])$/, endingSlash)
        .replace(/^(?!^http(s)?:\/\/)(.+)/, 'http$1://$2');

    options.ombiURLRoot = (options.ombiURLRoot || "")
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

    for(let index = 0, array = 'plex ombi watcher radarr sonarr couchpotato'.split(' '), item = save('URLs', array); index < array.length; index++)
        save(`${ item = array[index] }.url`, options[`${ item }URLRoot`]);

	// Dynamically asking permissions
	requestURLPermissions(options.couchpotatoURLRoot);
	requestURLPermissions(options.watcherURLRoot);
	requestURLPermissions(options.radarrURLRoot);
	requestURLPermissions(options.sonarrURLRoot);
	requestURLPermissions(options.ombiURLRoot);

	function OptionsSavedMessage() {
		// Update status to let the user know the options were saved
		new Notification('update', 'Saved', 3000);
	}
	new Notification('update', 'Saving...', 3000);

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
			new Notification('error', 'Error with saving: ' + chrome.runtime.lastError.message);
			storage.set(data, OptionsSavedMessage);
		} else {
            terminal.log('Saved Options: ' + JSON.stringify(options));
			OptionsSavedMessage();
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

    /* DEAD CODE - DEAD CODE - DEAD CODE - DEAD CODE - DEAD CODE */
    /* DEAD CODE - DEAD CODE - DEAD CODE - DEAD CODE - DEAD CODE */
    /* DEAD CODE - DEAD CODE - BANANA ,; - DEAD CODE - DEAD CODE */
    /* DEAD CODE - DEAD CODE - DEAD CODE - DEAD CODE - DEAD CODE */
    /* DEAD CODE - DEAD CODE - DEAD CODE - DEAD CODE - DEAD CODE */

    /* Obsolete, but may be useful later? */
    if(!url || /https?\:\/\/\*/.test(url))
        return;

    // TODO: Firefox doesn't have support for chrome.permissions API.
    if(chrome.permissions) {
        // When asking permissions the URL needs to have a trailing slash.
        chrome.permissions.request({ origins: [`${ url }`] }, callback);
    }
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.*
function restoreOptions(OPTIONS) {
	function setOptions(items) {
    if(!items) return;

		__options__.forEach(option => {
            let el = $$(`[data-option="${ option }"]`);

            if(!el) return;

            if(el.type == 'checkbox')
                el.setAttribute('checked', el.checked = (typeof items[option] == 'boolean'? items[option]: el.getAttribute('checked') === 'true'));
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
        if(items.ombiURLRoot)
            performOmbiTest(true);
        if(items.radarrURLRoot)
			performRadarrTest(items.radarrQualityProfileId, items.radarrStoragePath, true);
        if(items.sonarrURLRoot)
			performSonarrTest(items.sonarrQualityProfileId, items.sonarrStoragePath, true);
	}


    if (OPTIONS && typeof OPTIONS == 'string') {
        OPTIONS = JSON.parse(OPTIONS);

        setOptions(OPTIONS);
    } else {
        storage.get(null, items => {
            // Sigh... This is a workaround for Firefox; newer versions have support for the `chrome.storage.sync` API,
            // BUT, it will throw an error if you haven't enabled it...
            if(chrome.runtime.lastError)
                storage.get(null, setOptions);
            else
                setOptions(items);
        });
    }
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
        let pt = $$('#plex_token').value,
            pu = $$('#plex_username').value,
            pp = $$('#plex_password').value,
            ou = $$('#ombi_url').value,
            oa = $$('#ombi_api').value;

        if(pt)
            performPlexTest(ServerID);
        else if(pu && pp)
            performPlexLogin();
        else if(ou && oa)
            performOmbiLogin();
    });
$$('#watcher_test', true).forEach(element => element.addEventListener('click', event => performWatcherTest()));
$$('#radarr_test', true).forEach(element => element.addEventListener('click', event => performRadarrTest()));
$$('#sonarr_test', true).forEach(element => element.addEventListener('click', event => performSonarrTest()));
$$('#ombi_test', true).forEach(element => element.addEventListener('click', event => performOmbiTest()));

/* INPUT | Get the JSON data */
$$('#json_get').addEventListener('click', event => {
    let data_container = $$('#json_data'),
        data = atob((data_container.value || data_container.textContent).replace(/\s*\[.+\]\s*/, ''));

    if(!data) return new Notification('warning', 'The data cannot be blank, null, or undefined');

    try {
        restoreOptions(data);

        new Notification('update', 'Restored configuration data', 3000);
    } catch(error) {
        new Notification('error', `Error restoring configuration data: ${ error }`);
    }
});

/* OUTPUT | Set the JSON data */
$$('#json_set').addEventListener('click', event => {
    let data_container = $$('#json_data'),
        data = getOptionValues();

    data_container.value = data_container.textContent = `[${ (new Date).toString().slice(0, 24) }]${ btoa(JSON.stringify(data)) }`;

    new Notification('info', 'Copy the configuration data somewhere safe, use it to restore your options');
});

/* Erase Cached Searches */
$$('#erase_cache').addEventListener('click', event => {
    let options = JSON.stringify(getOptionValues());

    storage.clear();

    restoreOptions(options);

    new Notification('info', 'Clearing...', 3000);

    setTimeout(saveOptions, 1000); // requires at least 1s for proper functioning
});

$$('#version')
    .innerHTML = `Version ${ chrome.manifest.version }`;
$$('[type="range"]', true)
    .forEach((element, index, array) => {
        element.nextElementSibling.value = element.value + '%';

        element.oninput = (event, self) => (self = event.target).nextElementSibling.value = self.value + '%';
    });
