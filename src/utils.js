/* eslint-disable no-unused-vars */
/* global config */
function wait(check, then) {
	if (check()) {
		then();
	} else {
		setTimeout(() => wait(check, then), 50);
	}
}

function getPlexMediaRequest(options) {
	const type = options.type || 'movie';

	const headers = {
		'X-Plex-Token': config.server.token,
		Accept: 'application/json',
	};
	const url = `${config.server.url}/hubs/search`;
	const field = options.field || 'title';

	// i.e. Letterboxd can contain special white-space characters. Plex doesn't like this.
	const title = encodeURIComponent(options.title.replace(/\s/g, ' '));
	return fetch(`${url}?query=${field}:${title}`, {
		headers,
	})
	.then(res => res.json())
	.then((data) => {
		const hub = data.MediaContainer.Hub.find(myHub => myHub.type === type);
		if (!hub || !hub.Metadata) {
			return { found: false };
		}

		// This is fucked up, but Plex' definition of a year is year when it was available,
		// not when it was released (which is Movieo's definition).
		// For examples, see Bone Tomahawk, The Big Short, The Hateful Eight.
		// So we'll first try to find the movie with the given year, and then + 1 it.
		let media = hub.Metadata.find(meta => meta.year === options.year);
		if (!media) {
			media = hub.Metadata.find(meta => meta.year === options.year + 1);
		}
		let key = null;
		if (media) {
			key = media.key.replace('/children', '');
		}

		return { found: !!media, key };
	});
}

function _getOptions() {
	const storage = chrome.storage.sync || chrome.storage.local;

	return new Promise((resolve, reject) => {
		function handleOptions(items) {
			if (!items.plexToken || !items.servers) {
				reject(new Error('Unset options.'));
				return;
			}

			// For now we support only one Plex server, but the options already
			// allow multiple for easy migration in the future.
			const options = {
				server: items.servers[0],
			};
			if (items.couchpotatoBasicAuthUsername) {
				options.couchpotatoBasicAuth = {
					username: items.couchpotatoBasicAuthUsername,
					password: items.couchpotatoBasicAuthPassword,
				};
			}
			if (items.couchpotatoUrlRoot && items.couchpotatoToken) {
				options.couchpotatoUrl = `${items.couchpotatoUrlRoot}/api/${encodeURIComponent(items.couchpotatoToken)}`;
			}

			resolve(options);
		}
		storage.get(null, (items) => {
			if (chrome.runtime.lastError) {
				chrome.storage.local.get(null, handleOptions);
			} else {
				handleOptions(items);
			}
		});
	});
}

let config;
function parseOptions() {
	return _getOptions().then((options) => {
		config = options;
	}, (err) => {
		showNotification(
			'warning',
			'Not all options for the Web to Plex extension are filled in.',
			15000
		);
		throw err;
	});
}

function getPlexMediaUrl(plexMachineId, key) {
	return `https://app.plex.tv/web/app#!/server/${plexMachineId}/details?key=${encodeURIComponent(key)}`;
}

let notificationTimeout;
function showNotification(state, text, timeout) {
	if (notificationTimeout) {
		clearTimeout(notificationTimeout);
		notificationTimeout = null;
	}
	const existingEl = document.querySelector('.web-to-plex-notification');
	if (existingEl) {
		document.body.removeChild(existingEl);
	}

	const el = document.createElement('div');
	el.classList.add('web-to-plex-notification');
	if (state === 'warning') {
		el.classList.add('web-to-plex-warning');
	}
	el.textContent = text;
	document.body.appendChild(el);
	notificationTimeout = setTimeout(() => {
		document.body.removeChild(el);
	}, timeout || 5000);
}

function _maybeAddToCouchpotato(imdbId) {
	if (!imdbId) {
		console.log('Cancelled adding to CouchPotato since there is no IMDB ID');
		return;
	}
	chrome.runtime.sendMessage({
		type: 'VIEW_COUCHPOTATO',
		url: `${config.couchpotatoUrl}/media.get`,
		imdbId,
		basicAuth: config.couchpotatoBasicAuth,
	}, (res) => {
		const movieExists = res.success;
		if (res.err) {
			showNotification('warning', 'CouchPotato request failed (look in DevTools for more info)');
			console.error('Error with viewing on CouchPotato:', res.err);
			return;
		}
		if (!movieExists) {
			_addToCouchPotatoRequest(imdbId);
			return;
		}
		showNotification('info', `Movie is already in CouchPotato (status: ${res.status})`);
	});
}

function _addToCouchPotatoRequest(imdbId) {
	chrome.runtime.sendMessage({
		type: 'ADD_COUCHPOTATO',
		url: `${config.couchpotatoUrl}/movie.add`,
		imdbId,
		basicAuth: config.couchpotatoBasicAuth,
	}, (res) => {
		if (res.err) {
			showNotification('warning', 'Could not add to CouchPotato (look in DevTools for more info)');
			console.error('Error with adding on CouchPotato:', res.err);
			return;
		}
		if (res.success) {
			showNotification('info', 'Added movie on CouchPotato.');
		} else {
			showNotification('warning', 'Could not add to CouchPotato.');
		}
	});
}

function modifyPlexButton(el, action, title, key) {
	el.style.removeProperty('display');
	if (action === 'found') {
		el.href = getPlexMediaUrl(config.server.id, key);
		el.textContent = 'On Plex';
		el.classList.add('web-to-plex-button--found');
	}
	if (action === 'notfound' || action === 'error') {
		el.removeAttribute('href');
		el.textContent = action === 'notfound' ? 'Not on Plex' : 'Plex error';
		el.classList.remove('web-to-plex-button--found');
	}
	if (action === 'couchpotato') {
		el.href = '#';
		el.textContent = 'Download';
		el.classList.add('web-to-plex-button--couchpotato');
		el.addEventListener('click', (e) => {
			e.preventDefault();
			_maybeAddToCouchpotato(key);
		});
	}

	if (title) {
		el.title = title;
	}
}

function findPlexMedia(options) {
	getPlexMediaRequest(options)
	.then(({ found, key }) => {
		if (found) {
			modifyPlexButton(options.button, 'found', 'Found on Plex', key);
		} else {
      options.field = 'original_title';
      getPlexMediaRequest(options)
			.then(({ found, key }) => {
        if (found) {
          modifyPlexButton(options.button, 'found', 'Found on Plex', key);
        } else {
          const showCouchpotato = config.couchpotatoUrl && options.type !== 'show';
          const action = showCouchpotato ? 'couchpotato' : 'notfound';
          const title = showCouchpotato ? 'Could not find, add on Couchpotato?' : 'Could not find on Plex';
          modifyPlexButton(options.button, action, title, options.imdbId);
        }
      })
      .catch((err) => {
        modifyPlexButton(options.button, 'error', 'Request to your Plex Media Server failed.');
        console.error('Request to Plex failed', err);
      });
		}
	})
	.catch((err) => {
		modifyPlexButton(options.button, 'error', 'Request to your Plex Media Server failed.');
		console.error('Request to Plex failed', err);
	});
}
