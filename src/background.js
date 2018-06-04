/* global chrome */
function generateHeaders(auth) {
    let headers = { Accept: 'application/json' };

    if (!auth)
        return headers;

    return {
        Authorization: `Basic ${ btoa(`${ auth.username }:${ auth.password }`) }`,
        ...headers
    };
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
			let success = json.success;
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

function addRadarr(request, sendResponse) {
    let headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': request.token,
            ...generateHeaders(request.basicAuth)
        },
        id = (/^(tt-?)?$/.test(request.imdbId)? request.tmdbId: request.imdbId),
        query = encodeURIComponent(`${ (/tt-/.test(id)? ('imdb:' + id): request.title + request.year) }`),
        debug = { headers, query, ...request };

    fetch(debug.url = `${ request.url }lookup?apikey=${ request.token }&term=${ query }`)
        .then(response => response.json())
        .then(data => {
            if (!data instanceof Array || !data.length) {
                throw new Error('Movie not found');
            }

            let body = {
                ...data[0],
                monitored: true,
                minimumAvailability: 'preDB',
                qualityProfileId: request.QualityProfileId,
                rootFolderPath: request.StoragePath,
                addOptions: {
                    searchForMovie: true
                }
            };

//            console.group('Generated URL');
//              console.log('URL', request.url);
//              console.log('Head', headers);
//              console.log('Body', body);
//            console.groupEnd();

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
        query = encodeURIComponent(`tvdb:${ request.tvdbId }`),
        debug = { headers, query, ...request };

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

//            console.group('Generated URL');
//              console.log('URL', request.url);
//              console.log('Head', headers);
//              console.log('Body', body);
//            console.groupEnd();

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

            promise.catch(error => console.log(`Plex request #${ index } failed:`, error));
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
                return {
                    found: false
                };
            }

            // We only want to search in Plex libraries with the type "Movie", i.e. not the type "Other Videos".
            // Weirdly enough Plex doesn't seem to have an easy way to filter those libraries so we invent our own hack.
            let movies = Hub.Metadata.filter(
                meta =>
                    meta.Country ||
                    meta.Directory ||
                    meta.Genre ||
                    meta.Role ||
                    meta.Writer
            );

            // This is messed up, but Plex's definition of a year is year when it was available,
            // not when it was released (which is Movieo's definition).
            // For examples, see Bone Tomahawk, The Big Short, The Hateful Eight.
            // So we'll first try to find the movie with the given year, and then + 1 it.
            let media = movies.find(meta => meta.year === +options.year),
                key = null;

            if (!media) {
                media = movies.find(meta => meta.year === +options.year + 1);
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('From:', sender);

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
        case 'OPEN_OPTIONS':
            chrome.runtime.openOptionsPage();
            return true;
        default:
            return false;
    }
});
