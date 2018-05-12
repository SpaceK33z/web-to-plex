/* global chrome */
function generateHeaders(auth) {
    let headers = { Accept: 'application/json' };

    if (!auth) {
        return headers;
    }

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
	fetch(`${ request.url }?id=${ request.IMDbID }`, {
		headers: generateHeaders(request.basicAuth),
	})
		.then(response => response.json())
		.then(response => {
			let success = response.success;
			sendResponse({ success, status: success ? response.media.status : null });
		})
		.catch(error => {
			sendResponse({ error: String(error), location: 'view CouchPotato' });
		});
}

function addCouchpotato(request, sendResponse) {
	fetch(`${ request.url }?identifier=${ request.IMDbID }`, {
		headers: generateHeaders(request.basicAuth),
	})
		.then(response => response.json())
		.then(response => {
            console.log('%cAdded to CouchPotato', 'color: #0f0');

			sendResponse({ success: response.success });
		})
		.catch(error => {
			sendResponse({ error: String(error) , location: '+CouchPotato'});
		});
}

function addRadarr(request, sendResponse) {
    let headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': request.token,
            ...generateHeaders(request.basicAuth)
        },
        query = encodeURIComponent(`imdb:${ request.IMDbID }`);

    fetch(`${ request.url }/lookup?term=${ query }`, { headers })
        .then(response => response.json())
        .then(data => {
            if (!data instanceof Array || !~data.length) {
                throw new Error('Movie not found');
            }

            let body = {
                ...data[0],
                monitored: true,
                minimumAvailability: 'preDB',
                qualityProfileId: request.QualityProfileId,
                rootFolderPath: request.StoragePath,
                imdbId: request.IMDbID,
                addOptions: {
                    searchForMovie: true,
                },
            };

            console.group('Generated URL');
            console.log('Generated URL', request.url, headers);
            console.log('Body', body);
            console.groupEnd();

            return body;
        })
        .then(body => {
            return fetch(request.url, {
                method: 'post',
                headers,
                body: JSON.stringify(body),
            });
        })
        .then(response => response.json())
        .then(data => {
            if (data && data[0] && data[0].errorMessage) {
                sendResponse({
                    error: data[0].errorMessage,
                    location: '+Radarr'
                });
            } else if (data && data.path) {
                console.log(`%cAdded to Radarr [${data.path}]`, 'color: #0f0');

                sendResponse({
                    success: 'Added to ' + data.path
                });
            } else {
                sendResponse({
                    error: 'Unknown error',
                    location: '+Radarr'
                });
            }
        })
        .catch(error => {
            sendResponse({
                error: String(error),
                ...error
            });
        });
}

function addSonarr(request, sendResponse) {
    let headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': request.token,
            ...generateHeaders(request.basicAuth)
        },
        query = encodeURIComponent(`imdb:${ request.IMDbID }`);

    fetch(`${ request.url }/lookup?term=${ query }`, { headers })
        .then(response => response.json())
        .then(data => {
            if (!data instanceof Array || !~data.length) {
                throw new Error('TV Show not found');
            }

            let body = {
                ...data[0],
                monitored: true,
                minimumAvailability: 'preDB',
                qualityProfileId: request.QualityProfileId,
                rootFolderPath: request.StoragePath,
                imdbId: request.IMDbID,
                tvdbId: request.TVDbID,
                addOptions: {
                    searchForMissingEpisodes: true,
                },
            };

            console.group('Generated URL');
            console.log('Generated URL', request.url, headers);
            console.log('Body', body);
            console.groupEnd();

            return body;
        })
        .then(body => {
            return fetch(request.url, {
                method: 'post',
                headers,
                body: JSON.stringify(body),
            });
        })
        .then(response => response.json())
        .then(data => {
            if (data && data[0] && data[0].errorMessage) {
                sendResponse({
                    error: data[0].errorMessage,
                    location: '+Sonarr'
                });
            } else if (data && data.path) {
                console.log(`%cAdded to Sonarr [${data.path}]`, 'color: #0f0');

                sendResponse({
                    success: 'Added to ' + data.path
                });
            } else {
                sendResponse({
                    error: 'Unknown error',
                    location: '+Sonarr'
                });
            }
        })
        .catch(error => {
            sendResponse({
                error: String(error),
                ...error
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

function $serachPlex(connection, headers, options) {
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
            let hub = data.MediaContainer.Hub.find(hub => hub.type === type);

            if (!hub || !hub.Metadata) {
                return {
                    found: false
                };
            }

            // We only want to search in Plex libraries with the type "Movie", i.e. not the type "Other Videos".
            // Weirdly enough Plex doesn't seem to have an easy way to filter those libraries so we invent our own hack.
            let movies = hub.Metadata.filter(
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
        'Accept': 'application/json',
    };

    // Try all Plex connection URLs
    let requests = serverConfig.connections.map(connection =>
        $serachPlex(connection, headers, options)
    );

    try {
        // See what connection URL finishes the request first and pick that one.
        // TODO: optimally, as soon as the first request is finished, all other requests would be cancelled using AbortController.
        let result = await promiseRace(requests);

        sendResponse(result);
    } catch (error) {
        sendResponse({
            error: String(error),
            location: '?Plex'
        });
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
