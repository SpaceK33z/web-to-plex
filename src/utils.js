/* eslint-disable no-unused-vars */
/* global config */
function wait(check, then) {
	if (check()) {
		then();
	} else {
		setTimeout(() => wait(check, then), 50);
	}
}

function getPlexMediaRequest({ button, ...mediaOptions }) {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage(
			{
				type: 'SEARCH_PLEX',
				options: mediaOptions,
				serverConfig: config.server,
			},
			res => {
				if (res.err) {
					reject(res.err);
				}
				resolve(res);
			}
		);
	});
}

function _getOptions() {
	const storage = chrome.storage.sync || chrome.storage.local;

	return new Promise((resolve, reject) => {
		function handleOptions(items) {
			if (!items.plexToken || !items.servers) {
				reject(new Error('Options are undefined'));
				return;
			}

			// For now we support only one Plex server, but the options already
			// allow multiple for easy migration in the future.
			const server = items.servers[0];
			const options = {
				server: {
					...server,
					// Compatibility for users who have not updated their settings yet.
					connections: server.connections || [{ uri: server.url }],
				},
			};
//			if (items.couchpotatoBasicAuthUsername) {
//				options.couchpotatoBasicAuth = {
//					username: items.couchpotatoBasicAuthUsername,
//					password: items.couchpotatoBasicAuthPassword,
//				};
//			}
			// TODO: stupid copy/pasta
			if (items.radarrBasicAuthUsername) {
				options.radarrBasicAuth = {
					username: items.radarrBasicAuthUsername,
					password: items.radarrBasicAuthPassword,
				};
			}
			if (items.sonarrBasicAuthUsername) {
				options.sonarrBasicAuth = {
					username: items.sonarrBasicAuthUsername,
					password: items.sonarrBasicAuthPassword,
				};
			}
//			if (items.couchpotatoUrlRoot && items.couchpotatoToken) {
//				options.couchpotatoUrl = `${
//					items.couchpotatoUrlRoot
//				}/api/${encodeURIComponent(items.couchpotatoToken)}`;
//			}
			if (items.radarrUrlRoot && items.radarrToken) {
				options.radarrUrl = items.radarrUrlRoot;
				options.radarrToken = items.radarrToken;
			}
			if (items.sonarrUrlRoot && items.sonarrToken) {
				options.sonarrUrl = items.sonarrUrlRoot;
				options.sonarrToken = items.sonarrToken;
			}
			options.radarrStoragePath = items.radarrStoragePath;
			options.radarrQualityProfileId = items.radarrQualityProfileId;
			options.sonarrStoragePath = items.sonarrStoragePath;
			options.sonarrQualityProfileId = items.sonarrQualityProfileId;

			resolve(options);
		}
		storage.get(null, items => {
			if (chrome.runtime.lastError) {
				chrome.storage.local.get(null, handleOptions);
			} else {
				handleOptions(items);
			}
		});
	});
}

function openOptionsPage() {
	chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
}

let config;
function parseOptions() {
	return _getOptions().then(
		options => {
			config = options;
		},
		err => {
			showNotification(
				'warning',
				'Fill in missing Web to Plex+ options',
				15000,
				openOptionsPage
			);
			throw err;
		}
	);
}

function getPlexMediaUrl(plexMachineId, key) {
	return `https://app.plex.tv/web/app#!/server/${plexMachineId}/details?key=${encodeURIComponent(
		key
	)}`;
}

let notificationTimeout;
function showNotification(state, text, timeout, callback) {
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
	function close() {
		document.body.removeChild(el);
	}
	el.onclick = () => {
		close();
		callback && callback();
	};
	if (state === 'warning') {
		el.classList.add('web-to-plex-warning');
	}
	el.textContent = text;
	document.body.appendChild(el);
	notificationTimeout = setTimeout(close, timeout || 5000);
}

//function _maybeAddToCouchpotato(options) {
//	// TODO: this does not work anymore!
//	if (!options.imdbId) {
//		showNotification(
//			'warning',
//			'Cancelled adding to CouchPotato since there is no IMDB ID.'
//		);
//		return;
//	}
//	chrome.runtime.sendMessage(
//		{
//			type: 'VIEW_COUCHPOTATO',
//			url: config.couchpotatoUrl + '/media.get',
//			imdbId: options.imdbId,
//			basicAuth: config.couchpotatoBasicAuth,
//		},
//		res => {
//			const movieExists = res.success;
//			if (res.err) {
//				showNotification(
//					'warning',
//					'CouchPotato request failed (look in DevTools for more info)'
//				);
//				console.error('Error with viewing on CouchPotato:', res.err);
//				return;
//			}
//			if (!movieExists) {
//				_addToCouchPotatoRequest(options);
//				return;
//			}
//			showNotification(
//				'info',
//				`Movie is already in CouchPotato (status: ${res.status})`
//			);
//		}
//	);
//}

//function _addToCouchPotatoRequest(options) {
//	chrome.runtime.sendMessage(
//		{
//			type: 'ADD_COUCHPOTATO',
//			url: `${config.couchpotatoUrl}/movie.add`,
//			imdbId: options.imdbId,
//			basicAuth: config.couchpotatoBasicAuth,
//		},
//		res => {
//			if (res.err) {
//				showNotification(
//					'warning',
//					'Could not add to CouchPotato (look in DevTools for more info)'
//				);
//				console.error('Error with adding on CouchPotato:', res.err);
//				return;
//			}
//			if (res.success) {
//				showNotification('info', 'Added movie on CouchPotato.');
//			} else {
//				showNotification('warning', 'Could not add to CouchPotato.');
//			}
//		}
//	);
//}

function _addToRadarrRequest(options) {
	if (!options.imdbId) {
		showNotification(
			'warning',
			'Stopped adding to Radarr: No IMDB ID'
		);
		return;
	}
	chrome.runtime.sendMessage(
		{
			type: 'ADD_RADARR',
			url: `${config.radarrUrl}/api/movie`,
			imdbId: options.imdbId,
			radarrToken: config.radarrToken,
			radarrStoragePath: config.radarrStoragePath,
			radarrQualityProfileId: config.radarrQualityProfileId,
			basicAuth: config.radarrBasicAuth,
		},
		res => {
			if (res && res.err) {
				showNotification('warning', 'Could not add to Radarr\n' + res.err);
				console.error('Error adding to Radarr:', res.err);
				return;
			} else if (res && res.success) {
				showNotification('info', 'Added movie to Radarr');
			} else {
				showNotification('warning', 'Could not add to Radarr: Unknown Error');
			}
		}
	);
}

function _addToSonarrRequest(options) {
	if (!options.imdbId) {
		showNotification(
			'warning',
			'Stopped adding to Sonarr: No IMDB ID'
		);
		return;
	}
	chrome.runtime.sendMessage(
		{
			type: 'ADD_SONARR',
			url: `${config.sonarrUrl}/api/series`,
			imdbId: options.imdbId,
			sonarrToken: config.sonarrToken,
			sonarrStoragePath: config.sonarrStoragePath,
			sonarrQualityProfileId: config.sonarrQualityProfileId,
			basicAuth: config.sonarrBasicAuth,
		},
		res => {
			if (res && res.err) {
				showNotification('warning', 'Could not add to Sonarr\n' + res.err);
				console.error('Error adding to Sonarr:', res.err);
				return;
			} else if (res && res.success) {
				showNotification('info', 'Added movie to Sonarr');
			} else {
				showNotification('warning', 'Could not add to Sonarr: Unknown Error');
			}
		}
	);
}

function modifyPlexButton(el, action, title, options) {
	el.style.removeProperty('display');
	if (action === 'found') {
		el.href = getPlexMediaUrl(config.server.id, options.key);
		el.textContent = 'On Plex';
		el.classList.add('web-to-plex-button--found');
	}
	if (action === 'notfound' || action === 'error') {
		el.removeAttribute('href');
		el.textContent = action === 'notfound' ? 'Not on Plex' : 'Plex error';
		el.classList.remove('web-to-plex-button--found');
	}
    if(options.locale === 'flenix' && options.remote) {
		el.href = '#';
		el.textContent = 'Download File (0/0)';
		el.classList.add('web-to-plex-button--downloader');

		const $data = document.querySelector('#videoplayer ~ script').innerText;

		let data = $data
			.replace(/[^]*\{(hash.+?)\}[^]+/, '$1')
			.replace(/\s+/g, '')
			.replace(/(?:^|,)(\w+)\:/g, '&$1=')
			.replace(/^&|["']/g, '');

		let xhr = new XMLHttpRequest();
		xhr.open('POST', options.remote);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.onload = function() {
			if(xhr.status !== 200) {
				return modifyPlexButton(el, action, title, {...options, locale: null, remote: null})
			}

		  el.hrefs = xhr.responseText.split(',http').join('<!---->http').split('<!---->');
		  el.download = `${options.title} (${options.year})`;
		  el.href = el.hrefs.slice(0, el.index = 1);
		  el.textContent = el.textContent.replace(/\d+\/\d+/, `${el.index}/${el.hrefs.length}`);
		  el.hrefs = el.hrefs.join('<!---->');
        }

        xhr.send(data);

        el.addEventListener('click', e => {
        	e.preventDefault();
            let el = e.target, hs = el.hrefs.split('<!---->');
			if(hs.length == 1 || el.index == hs.length)
                el.index = 0;
            el.href = hs.slice(el.index, 1);
		    el.textContent = el.textContent.replace(/\d+\/\d+/, `${++el.index}/${hs.length}`);
        });
    } else if (action === 'downloader') {
		el.href = '#';
		el.textContent = 'Download';
		el.classList.add('web-to-plex-button--downloader');
		el.addEventListener('click', e => {
			e.preventDefault();
		    if (config.radarrUrl) {
				_addToRadarrRequest(options);
			} else if (config.sonarrUrl) {
				_addToSonarrRequest(options);
			}
//          else {
//				_maybeAddToCouchpotato(options);
//			}
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
				modifyPlexButton(options.button, 'found', 'Found on Plex', { key });
			} else {
				options.field = 'original_title';
				return getPlexMediaRequest(options).then(({ found, key }) => {
					if (found) {
						modifyPlexButton(options.button, 'found', 'Found on Plex', key);
					} else {
						const showDownloader =
							(config.radarrUrl /* || config.couchpotatoUrl */ || config.sonarrUrl) &&
							options.type !== 'show';
						const action = showDownloader ? 'downloader' : 'notfound';
						const title = showDownloader
							? 'Not on Plex, download available'
							: 'Not on Plex, download unavailable';
						modifyPlexButton(options.button, action, title, options);
					}
				});
			}
		})
		.catch(err => {
			modifyPlexButton(
				options.button,
				'error',
				'Request to Plex Media Server failed'
			);
			console.error('Request to Plex failed', err);
		});
}
