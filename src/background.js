/* global chrome */
<<<<<<< HEAD
let NO_DEBUGGER = false;

let external = {},
    parentItem,
    saveItem,
    terminal =
        NO_DEBUGGER?
            { error: m => m, info: m => m, log: m => m, warn: m => m, group: m => m, groupEnd: m => m }:
        console;

let date  = (new Date),
    YEAR  = date.getFullYear(),
    MONTH = date.getMonth() + 1,
    DATE  = date.getDate();

// returns the proper CORS mode of the URL
let cors = url => ((/^(https|sftp)\b/i.test(url) || /\:(443|22)\b/? '': 'no-') + 'cors');

// Create a Crypto-Key
// new Key(number:integer, string) -> string
=======
let external = {},
    parentItem,
    terminal =
//                { error: m => m, info: m => m, log: m => m, warn: m => m } ||
                console;

let date = new Date(),
    YEAR = date.getFullYear(),
    MONTH = date.getMonth() + 1,
    DATE = date.getDate();

>>>>>>> Upgrade to v4 (rebased) (#55)
class Key {
    constructor(length = 8, symbol = '') {
        let values = [];

        window.crypto.getRandomValues(new Uint32Array(16)).forEach((value, index, array) => values.push(value.toString(36)));

<<<<<<< HEAD
        return this.length = length, this.value = values.join(symbol);
    }

    rehash(length, symbol) {
        if(length)
            /* Do nothing */;
        else
            length = this.length;

        return this.value = new Key(length, symbol);
    }
}

// Session instances
let SessionKey = new Key(16), // create a session key
    SessionState = false;     // has this been run already?

// Generate request headers (for fetches)
// new Headers({username, password}) -> object
class Headers {
    constructor(Authorization) {
        let headers = { Accept: 'application/json' };

        if (!Authorization)
            return headers;

        return {
            Authorization: `Basic ${ btoa(`${ Authorization.username }:${ Authorization.password }`) }`,
            ...headers
        };
    }
}

// Change the badge status
// ChangeStatus({ MovieOrShowID, MovieOrShowTitle, MovieOrShowType, MovieOrShowIDProvider, MovieOrShowYear, LinkURL, FileType, FilePath }) -> undefined
function ChangeStatus({ ITEM_ID, ITEM_TITLE, ITEM_TYPE, ID_PROVIDER, ITEM_YEAR, ITEM_URL = '', FILE_TYPE = '', FILE_PATH }) {

    let FILE_TITLE = ITEM_TITLE.replace(/\-/g, ' ').replace(/[\s\:]{2,}/g, ' - ').replace(/[^\w\s\-\']+/g, ''),
    // File friendly title
        SEARCH_TITLE = ITEM_TITLE.replace(/[\-\s]+/g, '-').replace(/[^\w\-]+/g, ''),
    // Search friendly title
        SEARCH_PROVIDER = /[it]m/i.test(ID_PROVIDER)? 'GX': 'GG';

    ITEM_ID = (ITEM_ID && !/^tt-?$/i.test(ITEM_ID)? ITEM_ID: '') + '';
    ITEM_ID = ITEM_ID.replace(/^.*\b(tt\d+)\b.*$/, '$1').replace(/^.*\bid=(\d+)\b.*$/, '$1').replace(/^.*(?:movie|tv|(?:tv-?)?(?:shows?|series|episodes?))\/(\d+).*$/, '$1');

    external = { ...external, ID_PROVIDER, ITEM_ID, ITEM_TITLE, ITEM_YEAR, ITEM_URL, ITEM_TYPE, SEARCH_PROVIDER, SEARCH_TITLE, FILE_PATH, FILE_TITLE, FILE_TYPE };

    chrome.browserAction.setBadgeText({
        text: ID_PROVIDER
    });

    chrome.browserAction.setBadgeBackgroundColor({
       color: (ITEM_ID? '#f45a26': '#666666')
    });

    chrome.contextMenus.update('W2P', {
        title: `Find "${ ITEM_TITLE } (${ ITEM_YEAR || YEAR })"`
=======
        return this.value = values.join(symbol);
    }

    rehash(length) {
        return this.value = new Key(length);
    }
}

// Session key
let SessionKey = new Key(16);

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

// Object{MovieOrShowID, MovieOrShowTitle, MovieOrShowType, MovieOrShowIDProvider, MovieOrShowYear, LinkURL, FileType} => undefined
function changeStatus({ id, tt, ty, pv, yr, ur = '', ft = '' }) {

    let tl = tt.replace(/\-/g, ' ').replace(/[\s\:]{2,}/g, ' - ').replace(/[^\w\s\-\']+/g, ''),
    // File friendly title
        st = tt.replace(/[\-\s]+/g, '-').replace(/[^\w\-]+/g, ''),
    // Search friendly title
        xx = /[it]m/i.test(pv)? 'FX': 'GG';

    id = (id && !/^tt-?$/i.test(id)? id: '') + '';
    id = id.replace(/^.*\b(tt\d+)\b.*$/, '$1').replace(/^.*\bid=(\d+)\b.*$/, '$1').replace(/^.*(?:movie|tv|(?:tv-?)?(?:shows?|series|episodes?))\/(\d+).*$/, '$1');

    external = { ...external, F: tl, P: pv, Q: id, S: tt, T: st, U: ur, V: ty, X: xx, Y: yr, Z: ft };

    chrome.browserAction.setBadgeText({
        text: pv
    });

    chrome.browserAction.setBadgeBackgroundColor({
       color: (id? '#f45a26': '#666666')
    });

    chrome.contextMenus.update('W2P', {
        title: `Find "${ tt } (${ yr || YEAR })"`
>>>>>>> Upgrade to v4 (rebased) (#55)
    });

    for(let array = 'IM TM TV'.split(' '), length = array.length, index = 0, item; index < length; index++)
        chrome.contextMenus.update('W2P-' + (item = array[index]), {
            title: (
<<<<<<< HEAD
                ((ID_PROVIDER == (item += 'Db')) && ITEM_ID)?
                    `Open in ${ item } (${ (+ITEM_ID? '#': '') + ITEM_ID })`:
=======
                ((pv == (item += 'Db')) && id)?
                    `Open in ${ item } (${ (+id? '#': '') + id })`:
>>>>>>> Upgrade to v4 (rebased) (#55)
                `Find in ${ item }`
            ),
            checked: false
        });

    chrome.contextMenus.update('W2P-XX', {
<<<<<<< HEAD
        title: `Find on ${ (SEARCH_PROVIDER == 'GX'? 'GoStream': 'Google') }`,
=======
        title: `Find on ${ (xx == 'FX'? 'Flenix': 'Google') }`,
>>>>>>> Upgrade to v4 (rebased) (#55)
        checked: false
    });
}

// At this point you might want to think, WHY would you want to do
// these requests in a background page instead of the content script?
// This is because Movieo is served over HTTPS, so it won't accept requests to
// HTTP servers. Unfortunately, many people use CouchPotato over HTTP.
function viewCouchPotato(request, sendResponse) {
	fetch(`${ request.url }?id=${ request.imdbId }`, {
<<<<<<< HEAD
		headers: new Headers(request.basicAuth),
        mode: cors(request.url)
	})
    .then(response => response.json())
    .then(json => {
        sendResponse({ success, status: (success? json.media.status: null) });
    })
    .catch(error => {
        sendResponse({ error: String(error), location: 'viewCouchPotato' });
    });
=======
		headers: generateHeaders(request.basicAuth)
	})
		.then(response => response.json())
		.then(json => {
			sendResponse({ success, status: success ? json.media.status : null });
		})
		.catch(error => {
			sendResponse({ error: String(error), location: 'viewCouchPotato' });
		});
>>>>>>> Upgrade to v4 (rebased) (#55)
}

function addCouchpotato(request, sendResponse) {
	fetch(`${ request.url }?identifier=${ request.imdbId }`, {
<<<<<<< HEAD
		headers: new Headers(request.basicAuth),
        mode: cors(request.url)
	})
    .then(response => response.json())
    .catch(error => sendResponse({ error: 'Item not found', location: 'addCouchpotato => fetch.then.catch', silent: true }))
    .then(response => {
        sendResponse({ success: response.success });
    })
    .catch(error => {
        sendResponse({ error: String(error) , location: 'addCouchPotato'});
    });
=======
		headers: generateHeaders(request.basicAuth)
	})
		.then(response => response.json())
		.then(response => {
			sendResponse({ success: response.success });
		})
		.catch(error => {
			sendResponse({ error: String(error) , location: 'addCouchPotato'});
		});
>>>>>>> Upgrade to v4 (rebased) (#55)
}

function addWatcher(request, sendResponse) {
    let headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': request.token,
<<<<<<< HEAD
            ...(new Headers(request.basicAuth))
        },
        id = (/^(tt-?)?$/.test(request.imdbId)? request.tmdbId: request.imdbId),
            // if the IMDbID is empty, jump to the TMDbID
        query = (/^tt-?\d+$/i.test(id)? 'imdbid': /^\d+$/.test(id)? 'tmdbid': (id = encodeURI(`${request.title} ${request.year}`), 'term')),
            // if the IMDbID is empty, use "&tmdbid={ id }"
            // if the IMDbID isn't empty, use "&imdbid={ id }"
            // otherwise, use "&term={ title } { year }"
        debug = { headers, query, request };
            // setup a stack trace for debugging

    fetch(debug.url = `${ request.url }?apikey=${ request.token }&mode=addmovie&${ query }=${ id }`)
        .then(response => response.json())
        .catch(error => sendResponse({ error: 'Movie not found', location: 'addWatcher => fetch.then.catch', silent: true }))
=======
            ...generateHeaders(request.basicAuth)
        },
        id = (/^(tt-?)?$/.test(request.imdbId)? request.tmdbId: request.imdbId),
        query = (/^tt-?\d+$/i.test(id)? 'imdbid': /^\d+$/.test(id)? 'tmdbid': (id = encodeURI(`${request.title} ${request.year}`), 'term')),
        debug = { headers, query, request };

    fetch(debug.url = `${ request.url }?apikey=${ request.token }&mode=addmovie&${ query }=${ id }`)
        .then(response => response.json())
>>>>>>> Upgrade to v4 (rebased) (#55)
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
<<<<<<< HEAD
            ...(new Headers(request.basicAuth))
        },
        id = (/^(tt-?)?$/.test(request.imdbId)? request.tmdbId: request.imdbId),
            // if the IMDbID is empty, jump to the TMDbID
        query = (/^tt-?\d+$/i.test(id)? 'imdb?imdbid': /^\d+$/.test(id)? 'tmdb?tmdbid': (id = encodeURI(`${request.title} ${request.year}`), 'term')),
            // if the IMDbID is empty, use "/tmdb?tmdbid={ id }"
            // if the IMDbID isn't empty, use "/imdb?imdbid={ id }"
            // otherwise, use "&term={ title } { year }"
        debug = { headers, query, request };
            // setup a stack trace for debugging

    fetch(debug.url = `${ request.url }lookup/${ query }=${ id }&apikey=${ request.token }`)
        .then(response => response.json())
        .catch(error => sendResponse({ error: 'Movie not found', location: 'addRadarr => fetch.then.catch', silent: true }))
        .then(data => {
            let body,
                // Monitor, search, and download movie ASAP
                props = {
                    monitored: true,
                    minimumAvailability: 'preDB',
                    qualityProfileId: request.QualityID,
=======
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
>>>>>>> Upgrade to v4 (rebased) (#55)
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
<<<<<<< HEAD
            return fetch(`${ request.url }?apikey=${ request.token }`, debug.requestHeaders = {
                method: 'POST',
                mode: cors(request.url),
=======
            return fetch(`${ request.url }?apikey=${ request.token }`, debug.request = {
                method: 'POST',
                mode: 'no-cors',
>>>>>>> Upgrade to v4 (rebased) (#55)
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
<<<<<<< HEAD
            ...(new Headers(request.basicAuth))
=======
            ...generateHeaders(request.basicAuth)
>>>>>>> Upgrade to v4 (rebased) (#55)
        },
        id = request.tvdbId,
        query = encodeURIComponent(`tvdb:${ id }`),
        debug = { headers, query, request };
<<<<<<< HEAD
            // setup stack trace for debugging

    fetch(debug.url = `${ request.url }lookup?apikey=${ request.token }&term=${ query }`)
        .then(response => response.json())
        .catch(error => sendResponse({ error: 'TV Show not found', location: 'addSonarr => fetch.then.catch', silent: true }))
        .then(data => {
            if (!data instanceof Array || !data.length)
                throw new Error('TV Show not found');

            // Monitor, search, and download series ASAP
=======

    fetch(debug.url = `${ request.url }lookup?apikey=${ request.token }&term=${ query }`)
        .then(response => response.json())
        .then(data => {
            if (!data instanceof Array || !data.length) {
                throw new Error('TV Show not found');
            }

>>>>>>> Upgrade to v4 (rebased) (#55)
            let body = {
                ...data[0],
                monitored: true,
                minimumAvailability: 'preDB',
<<<<<<< HEAD
                qualityProfileId: request.QualityID,
=======
                qualityProfileId: request.QualityProfileId,
>>>>>>> Upgrade to v4 (rebased) (#55)
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
<<<<<<< HEAD
            return fetch(`${ request.url }?apikey=${ request.token }`, debug.requestHeaders = {
                method: 'POST',
                mode: cors(request.url),
=======
            return fetch(`${ request.url }?apikey=${ request.token }`, debug.request = {
                method: 'POST',
                mode: 'no-cors',
>>>>>>> Upgrade to v4 (rebased) (#55)
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

<<<<<<< HEAD
function addOmbi(request, sendResponse) {
    let headers = {
            'Content-Type': 'application/json',
            'ApiKey': request.token,
            ...(new Headers)
        },
        type = request.contentType,
        id = (type == 'movie'? request.tmdbId: request.tvdbId),
        body = ({ [type == 'movie'? 'theMovieDbId': 'theTvDbId']: id }),
        debug = { headers, request };
            // setup stack trace for debugging

    if(request.contentType == 'movie' && (id || null) === null)
        sendResponse({ error: 'Invalid TMDbID', location: 'addOmbi => if', silent: true });
    else if((id || null) === null)
        sendResponse({ error: 'Invalid TVDbID', location: 'addOmbi => else if', silent: true });

    fetch(debug.url = request.url, {
            method: 'POST',
            mode: cors(request.url),
            body: JSON.stringify(body),
            headers
        })
        .catch(error => sendResponse({ error: `${ type } not found`, location: 'addOmbi => fetch.then.catch', silent: true }))
        .then(response => response.text())
        .then(data => {
            debug.data =
            data = JSON.parse(data);

            if (data && data.isError) {
                if(/already +been +requested/i.test(data.errorMessage))
                    sendResponse({
                        success: 'Already requested on Ombi'
                    });
                else
                    sendResponse({
                        error: data.errorMessage,
                        location: `addOmbi => fetch("${ request.url }", { headers }).then(data => { if })`,
                        debug
                    });
            } else if (data && data.path) {
                sendResponse({
                    success: 'Added to Ombi'
                });
            } else {
                sendResponse({
                    error: 'Unknown error',
                    location: `addOmbi => fetch("${ request.url }", { headers }).then(data => { else })`,
                    debug
                });
            }
        })
        .catch(error => {
            sendResponse({
                error: String(error),
                location: `addOmbi => fetch("${ request.url }", { headers }).catch(error => { sendResponse })`,
                debug
            });
        });
}

=======
>>>>>>> Upgrade to v4 (rebased) (#55)
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

<<<<<<< HEAD
    if(!options.title)
        return {};

=======
>>>>>>> Upgrade to v4 (rebased) (#55)
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
            let media = movies.find(meta => ((meta.year == +options.year) && strip(meta.title) == strip(options.title))),
                key = null;

            if (!media) {
                media = movies.find(meta => ((meta.year == +options.year + 1) && strip(meta.title) == strip(options.title)));
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
<<<<<<< HEAD
chrome.contextMenus.onClicked.addListener(item => {
=======

chrome.contextMenus.onClicked.addListener((item) => {
>>>>>>> Upgrade to v4 (rebased) (#55)
    if(!/^W2P/i.test(item.menuItemId)) return;

    let url = "", dnl = false,
        db = item.menuItemId.slice(-2).toLowerCase(),
<<<<<<< HEAD
        pv = external.ID_PROVIDER.slice(0, 2).toLowerCase(),
        qu = external.ITEM_ID,
        tl = external.SEARCH_TITLE,
        yr = external.ITEM_YEAR,
        tt = external.ITEM_TITLE,
        lt = external.FILE_TITLE,
        ft = external.FILE_TYPE,
        fp = external.FILE_PATH,
=======
        pv = external.P.slice(0, 2).toLowerCase(),
        qu = external.Q,
        tl = external.T,
        yr = external.Y,
        tt = external.S,
        lt = external.F,
        ft = external.Z,
>>>>>>> Upgrade to v4 (rebased) (#55)
        p = (s, r = '+') => s.replace(/-/g, r);

    switch(db) {
        case 'im':
            url = (qu && pv == 'im')?
                `imdb.com/title/${ qu }/`:
            `imdb.com/find?ref_=nv_sr_fn&s=all&q=${ tl }`;
            break;
        case 'tm':
            url = (qu && pv == 'tm')?
<<<<<<< HEAD
                `themoviedb.org/${ external.ITEM_TYPE == 'show'? 'tv': 'movie' }/${ qu }`:
=======
                `themoviedb.org/${ external.V == 'show'? 'tv': 'movie' }/${ qu }`:
>>>>>>> Upgrade to v4 (rebased) (#55)
            `themoviedb.org/search?query=${ tl }`;
            break;
        case 'tv':
            url = (qu && pv == 'tv')?
                `thetvdb.com/series/${ tl }#${ qu }`: // TVDb accepts either: a title, or a series number... but only one
            `thetvdb.com/search?q=${ p(tl) }`;
            break;
        case 'xx':
<<<<<<< HEAD
            url = external.SEARCH_PROVIDER == 'GX'?
                `gostream.site/?s=${ p(tl) }`:
=======
            url = external.X == 'FX'?
                `flenix.tv/?do=search&story=${ p(tt) }&min_year=${ yr || 1990 }&filter=true&max_year=${ yr }&min_imdb=0&max_imdb=10&cat=1&order=date&g-recaptcha-response=${ SessionKey.value }`:
>>>>>>> Upgrade to v4 (rebased) (#55)
            `google.com/search?q="${ p(tl, ' ') } ${ yr }"+${ pv }db`;
            break;
        case 'dl':
            dnl = true;
<<<<<<< HEAD
            url = external.ITEM_URL;
            break;
        default: return; break;
=======
            url = external.U;
            break;
        default: return;
>>>>>>> Upgrade to v4 (rebased) (#55)
    }

    if(!dnl)
        window.open(`https://${ url }`, '_blank');
<<<<<<< HEAD
    else if (dnl)
        // try/catch won't work here, so use the first download's callback as an error catcher
        chrome.downloads.download({
          url: item.href,
          filename: `${ fp }${ lt } (${ yr }).${ ft }`,
          saveAs: true
        }, id => {
            if(id == undefined || id == null)
                chrome.downloads.download({
                  url: item.href,
                  saveAs: true
                });
        });
});

chrome.runtime.onMessage.addListener((request, sender, callback) => {
    terminal.log('From: ' + sender);

    let item = (request? request.options || request: {}),
        ITEM_TITLE = item.title,
        ITEM_YEAR = item.year,
        ITEM_TYPE = item.type,
        ID_PROVIDER = (i=>{for(let p in i)if(/^TVDb/i.test(p)&&i[p])return'TVDb';else if(/^TMDb/i.test(p)&&i[p])return'TMDb';return'IMDb'})(item),
        ITEM_URL = item.href || '',
        FILE_TYPE = (item.tail || 'mp4'),
        FILE_PATH = item.path || '',
        ITEM_ID = ((i, I)=>{for(let p in i)if(RegExp('^'+I,'i').test(p))return i[p]})(item, ID_PROVIDER);
=======
    else
        chrome.downloads.download({
          url,
          filename: `${ lt } (${ yr }).${ ft }`,
          saveAs: true
        });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    terminal.log('From:', sender);

    let id = (request? request.options || request: {}),
        tt = id.title,
        yr = id.year,
        ty = id.type,
        pv = (id.TVDbID || id.tvdbId? 'TVDb': id.TMDbID || id.tmdbId? 'TMDb': 'IMDb'),
        ur = id.href || '',
        ft = id.tail || '';
    id = id[pv + 'ID'] || id[pv.toLowerCase() + 'Id'];

    changeStatus({ id, tt, yr, ty, pv, ur, ft });
>>>>>>> Upgrade to v4 (rebased) (#55)

    try {
        switch (request.type) {
            case 'SEARCH_PLEX':
<<<<<<< HEAD
                searchPlex(request, callback);
                return true;
            case 'VIEW_COUCHPOTATO':
                viewCouchPotato(request, callback);
                return true;
            case 'ADD_COUCHPOTATO':
                addCouchpotato(request, callback);
                return true;
            case 'ADD_RADARR':
                addRadarr(request, callback);
                return true;
            case 'ADD_SONARR':
                addSonarr(request, callback);
                return true;
            case 'ADD_WATCHER':
                addWatcher(request, callback);
                return true;
            case 'ADD_OMBI':
                addOmbi(request, callback);
=======
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
>>>>>>> Upgrade to v4 (rebased) (#55)
                return true;
            case 'OPEN_OPTIONS':
                chrome.runtime.openOptionsPage();
                return true;
<<<<<<< HEAD
            case 'SEARCH_FOR':
                if(ITEM_TITLE && ITEM_TYPE)
                    ChangeStatus({ ITEM_ID, ITEM_TITLE, ITEM_TYPE, ID_PROVIDER, ITEM_YEAR, ITEM_URL, FILE_TYPE, FILE_PATH });
                return true;
            case 'SAVE_AS':
                chrome.contextMenus.update('W2P-DL', {
                    title: `Save as "${ ITEM_TITLE } (${ ITEM_YEAR })" (${ FILE_TYPE })`
                });
                return true;
            case 'DOWNLOAD_FILE':

                let FILE_TITLE = ITEM_TITLE.replace(/\-/g, ' ').replace(/[\s\:]{2,}/g, ' - ').replace(/[^\w\s\-\']+/g, '');

                // no try/catch, use callback for that
                chrome.downloads.download({
                    url: item.href,
                    filename: `${ FILE_TITLE } (${ ITEM_YEAR }).${ FILE_TYPE }`,
                    saveAs: true
                }, id => {
                    // Error Occured
                   if(id == undefined || id == null)
                       chrome.downloads.download({
                        url: item.href,
                        filename: `${ FILE_TITLE } (${ ITEM_YEAR })`,
                        saveAs: true
                    }); 
                });
                return true;
            default:
                terminal.warn(`Unknown event [${ request.type }]`);
                return false;
        }   
    } catch (error) {
        return callback(String(error));
    }
});

// If background.js is already running, ignore the new state
// otherwise, use the following to start up
if(SessionState === false) {
    SessionState = true;

    parentItem = chrome.contextMenus.create({
        id: 'W2P',
        title: 'Web to Plex'
    });

    saveItem = chrome.contextMenus.create({
        id: 'W2P-DL',
        title: 'Nothing to Save'
    });

    // Standard search engines
    for(let array = 'IM TM TV'.split(' '), DL = {}, length = array.length, index = 0, item; index < length; index++)
        chrome.contextMenus.create({
            id: 'W2P-' + (item = array[index]),
            parentId: parentItem,
            title: `Using ${ item }Db`,
            type: 'checkbox',
            checked: true // implement a way to use the checkboxes?
        });

    // Non-standard search engines
    chrome.contextMenus.create({
        id: 'W2P-XX',
        parentId: parentItem,
        title: `Using best guess`,
=======
            case 'SAVE_AS':
                chrome.contextMenus.update('W2P-DL', {
                    title: `Save as "${ tt } (${ yr })"`
                });
                return true;
            default:
                return false;
        }   
    } catch (error) {
        return sendResonpse(String(error));
    }
});

parentItem = chrome.contextMenus.create({
    id: 'W2P',
    title: 'Web to Plex'
});

saveItem = chrome.contextMenus.create({
    id: 'W2P-DL',
    title: 'Nothing to Save'
});

// Standard search engines
for(let array = 'IM TM TV'.split(' '), DL = {}, length = array.length, index = 0, item; index < length; index++)
    chrome.contextMenus.create({
        id: 'W2P-' + (item = array[index]),
        parentId: parentItem,
        title: `Using ${ item }Db`,
>>>>>>> Upgrade to v4 (rebased) (#55)
        type: 'checkbox',
        checked: true // implement a way to use the checkboxes?
    });

<<<<<<< HEAD
}

if(chrome.runtime.lastError)
    /* Attempt Error Suppression */;
=======
// Non-standard search engines
chrome.contextMenus.create({
    id: 'W2P-XX',
    parentId: parentItem,
    title: `Using best guess`,
    type: 'checkbox',
    checked: true // implement a way to use the checkboxes?
});
>>>>>>> Upgrade to v4 (rebased) (#55)
