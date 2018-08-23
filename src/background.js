/* global chrome */
let external = {},
    parentItem,
    terminal =
//                { error: m => m, info: m => m, log: m => m, warn: m => m } ||
                console;

// Object{username, password} => Object
function generateHeaders(auth) {
    let headers = { Accept: 'application/json' };

    if (!auth)
        return headers;

    return {
        Authorization: `Basic ${ btoa(`${ auth.username }:${ auth.password }`) }`,
        ...headers
    };
}

// Object{MovieOrShowID, MovieOrShowTitle, MovieOrShowType, MovieOrShowIDProvider, MovieOrShowYear} => undefined
function changeStatus({ id, tt, ty, pv, yr }) {

    let tl = tt.replace(/\-/g, ' ').replace(/[\s\:]{2,}/g, ' - ');
    // File friendly title

    id = id && !/^tt-?$/i.test(id)? id: null;
    tt = tt.replace(/[\-\s]+/g, '-').replace(/[^\w\-]+/g, '');

    external = { P: pv, Q: id, T: tt, Y: ty };

    chrome.browserAction.setBadgeText({
        text: pv
    });

    chrome.browserAction.setBadgeBackgroundColor({
       color: (id? '#f45a26': '#666666')
    });

    chrome.contextMenus.update('W2P', {
        title: `"${ tl } (${ yr || 'N/A' })"`
    });

    for(let array = 'IM TM TV'.split(' '), length = array.length, index = 0, item; index < length; index++)
        chrome.contextMenus.update('W2P-' + (item = array[index]), {
            title: (
                ((pv == (item += 'Db')) && id)?
                    `Open in ${ item } (${ (+id? '#': '') }${ id })`:
                `Find in ${ item }`
            ),
            checked: false
        });
}

// At this point you might want to think, WHY would you want to do
// these requests in a background page instead of the content script?
// This is because Movieo is served over HTTPS, so it won't accept requests to
// HTTP servers. Unfortunately, many people use CouchPotato over HTTP.
function viewCouchPotato(request, sendResponse) {
	fetch(`${ request.url }?id=${ request.imdbId }`, {
		headers: generateHeaders(request.basicAuth)
	})
		.then(response => response.json())
		.then(json => {
			sendResponse({ success, status: success ? json.media.status : null });
		})
		.catch(error => {
			sendResponse({ error: String(error), location: 'viewCouchPotato' });
		});
}

function addCouchpotato(request, sendResponse) {
	fetch(`${ request.url }?identifier=${ request.imdbId }`, {
		headers: generateHeaders(request.basicAuth)
	})
		.then(response => response.json())
		.then(response => {
			sendResponse({ success: response.success });
		})
		.catch(error => {
			sendResponse({ error: String(error) , location: 'addCouchPotato'});
		});
}

function addWatcher(request, sendResponse) {
    let headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': request.token,
            ...generateHeaders(request.basicAuth)
        },
        id = (/^(tt-?)?$/.test(request.imdbId)? request.tmdbId: request.imdbId),
        query = (/^tt-?\d+$/i.test(id)? 'imdbid': /^\d+$/.test(id)? 'tmdbid': (id = encodeURI(`${request.title} ${request.year}`), 'term')),
        debug = { headers, query, request };

    fetch(debug.url = `${ request.url }?apikey=${ request.token }&mode=addmovie&${ query }=${ id }`)
        .then(response => response.json())
        .then(response => {
            if((response.response + "") == "true")
                return sendResponse({
                    success: `Added to Watcher (${ request.StoragePath })`
                });

            throw new Error(response.error);
        })
        .catch(error => {
            sendResponse({
                error: String(error),
                location: `addWatcher => fetch("${ request.url }", { headers }).catch(error => { sendResponse })`,
                debug
            });
        });
}

function addRadarr(request, sendResponse) {
    let headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': request.token,
            ...generateHeaders(request.basicAuth)
        },
        id = (/^(tt-?)?$/.test(request.imdbId)? request.tmdbId: request.imdbId),
        query = (/^tt-?\d+$/i.test(id)? 'imdb?imdbid': /^\d+$/.test(id)? 'tmdb?tmdbid': (id = encodeURI(`${request.title} ${request.year}`), 'term')),
        debug = { headers, query, request };

    fetch(debug.url = `${ request.url }lookup/${ query }=${ id }&apikey=${ request.token }`)
        .then(response => response.json())
        .then(data => {
            let body,
                props = {
                    monitored: true,
                    minimumAvailability: 'preDB',
                    qualityProfileId: request.QualityProfileId,
                    rootFolderPath: request.StoragePath,
                    addOptions: {
                        searchForMovie: true
                    }
                };

            if (!data instanceof Array && !data.length && !data.title) {
                throw new Error('Movie not found');
            } else if(data.length) {
                body = {
                    ...data[0],
                    ...props
                };
            } else if(data.title) {
                body = {
                    ...data,
                    ...props
                };
            }

            terminal.group('Generated URL');
              terminal.log('URL', request.url);
              terminal.log('Head', headers);
              terminal.log('Body', body);
            terminal.groupEnd();

            return debug.body = body;
        })
        .then(body => {
            return fetch(`${ request.url }?apikey=${ request.token }`, debug.request = {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(body),
                headers
            });
        })
        .then(response => response.text())
        .then(data => {
            debug.data =
            data = JSON.parse(data || `{"path":"${ request.StoragePath.replace(/\\/g, '\\\\') }${ request.title } (${ request.year })"}`);

            if (data && data[0] && data[0].errorMessage) {
                sendResponse({
                    error: data[0].errorMessage,
                    location: `addRadarr => fetch("${ request.url }", { headers }).then(data => { if })`,
                    debug
                });
            } else if (data && data.path) {
                sendResponse({
                    success: 'Added to ' + data.path
                });
            } else {
                sendResponse({
                    error: 'Unknown error',
                    location: `addRadarr => fetch("${ request.url }", { headers }).then(data => { else })`,
                    debug
                });
            }
        })
        .catch(error => {
            sendResponse({
                error: String(error),
                location: `addRadarr => fetch("${ request.url }", { headers }).catch(error => { sendResponse })`,
                debug
            });
        });
}

function addSonarr(request, sendResponse) {
    let headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': request.token,
            ...generateHeaders(request.basicAuth)
        },
        id = request.tvdbId,
        query = encodeURIComponent(`tvdb:${ id }`),
        debug = { headers, query, request };

    fetch(debug.url = `${ request.url }lookup?apikey=${ request.token }&term=${ query }`)
        .then(response => response.json())
        .then(data => {
            if (!data instanceof Array || !data.length) {
                throw new Error('TV Show not found');
            }

            let body = {
                ...data[0],
                monitored: true,
                minimumAvailability: 'preDB',
                qualityProfileId: request.QualityProfileId,
                rootFolderPath: request.StoragePath,
                addOptions: {
                    searchForMissingEpisodes: true
                }
            };

            terminal.group('Generated URL');
              terminal.log('URL', request.url);
              terminal.log('Head', headers);
              terminal.log('Body', body);
            terminal.groupEnd();

            return debug.body = body;
        })
        .then(body => {
            return fetch(`${ request.url }?apikey=${ request.token }`, debug.request = {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(body),
                headers
            });
        })
        .then(response => response.text())
        .then(data => {
            debug.data =
            data = JSON.parse(data || `{"path":"${ request.StoragePath.replace(/\\/g, '\\\\') }${ request.title } (${ request.year })"}`);

            if (data && data[0] && data[0].errorMessage) {
                sendResponse({
                    error: data[0].errorMessage,
                    location: `addSonarr => fetch("${ request.url }", { headers }).then(data => { if })`,
                    debug
                });
            } else if (data && data.path) {
                sendResponse({
                    success: 'Added to ' + data.path
                });
            } else {
                sendResponse({
                    error: 'Unknown error',
                    location: `addSonarr => fetch("${ request.url }", { headers }).then(data => { else })`,
                    debug
                });
            }
        })
        .catch(error => {
            sendResponse({
                error: String(error),
                location: `addSonarr => fetch("${ request.url }", { headers }).catch(error => { sendResponse })`,
                debug
            });
        });
}

// Unfortunately the native Promise.race does not work as you would suspect.
// If one promise (Plex request) fails, we still want the other requests to continue racing.
// See https://www.jcore.com/2016/12/18/promise-me-you-wont-use-promise-race/ for an explanation
function promiseRace(promises) {
    if (!~promises.length) {
        return Promise.reject('Cannot start a race without promises!');
    }

    // There is no way to know which promise is rejected.
    // So we map it to a new promise to return the index when it fails
    let Promises = promises.map((promise, index) =>
        promise.catch(() => {
            throw index;
        })
    );

    return Promise.race(Promises)
        .catch(index => {
            // The promise has rejected, remove it from the list of promises and just continue the race.
            let promise = promises.splice(index, 1)[0];

            promise.catch(error => terminal.log(`Plex request #${ index } failed:`, error));
            return promiseRace(promises);
        });
}

function $searchPlex(connection, headers, options) {
    let type = options.type || 'movie',
        url = `${ connection.uri }/hubs/search`,
        field = options.field || 'title';

    if(type === 'tv')
        type = 'show';

    // Letterboxd can contain special white-space characters. Plex doesn't like this.
    let title = encodeURIComponent(options.title.replace(/\s+/g, ' ')),
        finalURL = `${ url }?query=${ field }:${ title }`;

    return fetch(finalURL, { headers })
        .then(response => response.json())
        .then(data => {
            let Hub = data.MediaContainer.Hub.find(hub => hub.type === type);

            if (!Hub || !Hub.Metadata) {
                return { found: false };
            }

            // We only want to search in Plex libraries with the type "Movie", i.e. not the type "Other Videos".
            // Weirdly enough Plex doesn't seem to have an easy way to filter those libraries so we invent our own hack.
            let movies = Hub.Metadata.filter(
                meta =>
                    meta.Directory ||
                    meta.Genre ||
                    meta.Country ||
                    meta.Role ||
                    meta.Writer
            ),
                strip = (string) => string.replace(/\W+/g, '').toLowerCase();

            // This is messed up, but Plex's definition of a year is year when it was available,
            // not when it was released (which is Movieo's definition).
            // For examples, see Bone Tomahawk, The Big Short, The Hateful Eight.
            // So we'll first try to find the movie with the given year, and then + 1 it.
            // Added [strip] to prevent mix-ups, see: "Kingsman: The Golden Circle" v. "The Circle"
            let media = movies.find(meta => ((meta.year === +options.year) && strip(meta.title) === strip(options.title))),
                key = null;

            if (!media) {
                media = movies.find(meta => ((meta.year === +options.year + 1) && strip(meta.title) === strip(options.title)));
            } else {
                key = media.key.replace('/children', '');
            }

            return {
                found: !!media,
                key
            };
        });
}

async function searchPlex(request, sendResponse) {
    let { options, serverConfig } = request,
        headers = {
            'X-Plex-Token': serverConfig.token,
            'Accept': 'application/json'
        };

    // Try all Plex connection URLs
    let requests = serverConfig.connections.map(connection =>
        $searchPlex(connection, headers, options)
    );

    try {
        // See what connection URL finishes the request first and pick that one.
        // TODO: optimally, as soon as the first request is finished, all other requests would be cancelled using AbortController.
        let result = await promiseRace(requests);

        sendResponse(result);
    } catch (error) {
        sendResponse({ error: String(error), location: 'searchPlex' });
    }
}

// Chrome is f**king retarted...
// Instead of having an object returned (for the context-menu)
// You have to make API calls on ALL clicks...

chrome.contextMenus.onClicked.addListener((item) => {
    if(!/^W2P/i.test(item.menuItemId)) return;

    let url = "",
        db = item.menuItemId.slice(-2).toLowerCase(),
        pv = external.P.slice(0, 2).toLowerCase();

    switch(db) {
        case 'im':
            url = (external.Q && pv == 'im')?
                `imdb.com/title/${ external.Q }/`:
            `imdb.com/find?ref_=nv_sr_fn&s=all&q=${ external.T }`;
            break;
        case 'tm':
            url = (external.Q && pv == 'tm')?
                `themoviedb.org/${ external.Y == 'show'? 'tv': 'movie' }/${ external.Q }`:
            `themoviedb.org/search?query=${ external.T }`;
            break;
        case 'tv':
            url = (external.Q && pv == 'tv')?
                `thetvdb.com/series/${ external.T }`:
            `thetvdb.com/search?q=${ external.T.replace(/-/g, '+') }`;
            break;
        default:
            url = external.U[db];
            break;
    }

    window.open(`https://${ url }`, '_blank');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    terminal.log('From:', sender);

    let id = (request? request.options || request: {}),
        tt = id.title,
        yr = id.year,
        ty = id.type,
        pv = (id.TVDbID || id.tvdbId? 'TVDb': id.TMDbID || id.tmdbId? 'TMDb': 'IMDb'),
        tv = pv[1] == 'V';
    id = id[pv + 'ID'] || id[pv.toLowerCase() + 'Id'];

    changeStatus({ id, tt, ty, tv, pv, yr });

    switch (request.type) {
        case 'SEARCH_PLEX':
            searchPlex(request, sendResponse);
            return true;
        case 'VIEW_COUCHPOTATO':
            viewCouchPotato(request, sendResponse);
            return true;
        case 'ADD_COUCHPOTATO':
            addCouchpotato(request, sendResponse);
            return true;
        case 'ADD_RADARR':
            addRadarr(request, sendResponse);
            return true;
        case 'ADD_SONARR':
            addSonarr(request, sendResponse);
            return true;
        case 'ADD_WATCHER':
            addWatcher(request, sendResponse);
            return true;
        case 'OPEN_OPTIONS':
            chrome.runtime.openOptionsPage();
            return true;
        default:
            return false;
    }
});

parentItem = chrome.contextMenus.create({
    id: 'W2P',
    title: 'Web to Plex'
});

for(let array = 'IM TM TV'.split(' '), DL = {}, length = array.length, index = 0, item; index < length; index++)
    chrome.contextMenus.create({
        id: 'W2P-' + (item = array[index]),
        parentId: parentItem,
        title: `Using ${ item }Db`,
        type: 'checkbox',
        checked: true // implement a way to use the checkboxes?
    });
