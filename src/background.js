/* global chrome */
function generateHeaders(auth) {
	const headers = { Accept: 'application/json' };
	if (!auth) {
		return headers;
	}
	const hash = btoa(`${auth.username}:${auth.password}`);
	return {
		...headers,
		Authorization: `Basic ${hash}`,
	};
}

// At this point you might want to think, WHY would you want to do
// these requests in a background page instead of the content script?
// This is because Movieo is served over HTTPS, so it won't accept requests to
// HTTP servers. Unfortunately, many people use CouchPotato over HTTP.
function viewCouchpotato(request, sendResponse) {
	fetch(`${request.url}?id=${request.imdbId}`, {
		headers: generateHeaders(request.basicAuth),
	})
		.then(res => res.json())
		.then(res => {
			const success = res.success;
			sendResponse({ success, status: success ? res.media.status : null });
		})
		.catch(err => {
			sendResponse({ err: String(err) });
		});
}

function addCouchpotato(request, sendResponse) {
	fetch(`${request.url}?identifier=${request.imdbId}`, {
		headers: generateHeaders(request.basicAuth),
	})
		.then(res => res.json())
		.then(res => {
			sendResponse({ success: res.success });
		})
		.catch(err => {
			sendResponse({ err: String(err) });
		});
}

function addRadarr(request, sendResponse) {
	const headers = {
		...generateHeaders(request.basicAuth),
		'Content-Type': 'application/json',
		'X-Api-Key': request.radarrToken,
	};
	const lookupQuery = encodeURIComponent(`imdb:${request.imdbId}`);

	fetch(`${request.url}/lookup?term=${lookupQuery}`, { headers })
		.then(res => res.json())
		.then(data => {
			if (!Array.isArray(data) || data.length < 1) {
				throw new Error('Movie was not found.');
			}
			const body = {
				...data[0],
				monitored: true,
				minimumAvailability: 'preDB',
				qualityProfileId: request.radarrQualityProfileId,
				rootFolderPath: request.radarrStoragePath,
				addOptions: {
					searchForMovie: true,
				},
			};
			console.log('generated URL', request.url, headers);
			console.log('body', body);
			return body;
		})
		.then(body => {
			return fetch(request.url, {
				method: 'post',
				headers,
				body: JSON.stringify(body),
			});
		})
		.then(res => res.json())
		.then(res => {
			if (res && res[0] && res[0].errorMessage) {
				sendResponse({ err: res[0].errorMessage });
			} else if (res && res.path) {
				sendResponse({ success: 'Added to ' + res.path });
			} else {
				sendResponse({ err: 'unknown error' });
			}
		})
		.catch(err => {
			sendResponse({ err: String(err) });
		});
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.type === 'VIEW_COUCHPOTATO') {
		viewCouchpotato(request, sendResponse);
		return true;
	}

	if (request.type === 'ADD_COUCHPOTATO') {
		addCouchpotato(request, sendResponse);
		return true;
	}

	if (request.type === 'ADD_RADARR') {
		addRadarr(request, sendResponse);
		return true;
	}

	return false;
});
