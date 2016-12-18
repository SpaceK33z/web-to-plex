function wait(check, then) {
	if (check()) {
		then();
	} else {
		setTimeout(() => wait(check, then), 50);
	}
}

function doPlexRequest(config, options) {
	// TODO: it is possible that there are multiple movie sections in Plex, so optimally we'd loop through all of them.
	let sectionId;
	if (options.type === 'show') {
		sectionId = config.server.showSections[0];
	} else {
		sectionId = config.server.movieSections[0];
	}
	const url = `${config.server.url}/library/sections/${sectionId}/all`;
	return fetch(`${url}?title=${options.title}&year=${options.year}`, {
		headers: {
			'X-Plex-Token': config.server.token,
			'Accept': 'application/json',
		}
	})
	.then((res) => res.json())
	.then((res) => {
		const size = res.MediaContainer && res.MediaContainer.size;
		let key = null;
		if (size) {
			// With TV shows, the API returns a pathname with `/children` after it.
			// We don't need that part.
			key = res.MediaContainer.Metadata[0].key.replace('/children', '');
		}
		return { size, key };
	});
}

function plexRequest(config, options) {
	return doPlexRequest(config, options)
	.then(({ size, key }) => {
		if (!size) {
			// This is fucked up, but Plex' definition of a year is year when it was available,
			// not when it was released (which is Movieo's definition).
			// For examples, see Bone Tomahawk, The Big Short, The Hateful Eight.
			const newOptions = Object.assign({}, options, {
				year: options.year + 1
			});
			return doPlexRequest(config, newOptions);
		}
		return { size, key };
	});
}

function getOptions() {
	const storage = chrome.storage.sync || chrome.storage.local;
	return new Promise(function (resolve, reject) {
		storage.get(null, function (items) {
			if (!items.plexToken || !items.server) {
				reject(new Error('Unset options.'));
				return;
			}

			// TODO: This is all a bit fucked up at the moment because of backwards compatibility.
			const options = {
				server: {
					id: items.plexMachineId || items.server.id,
					url: items.plexUrlRoot || items.server.url,
					token: items.server && items.server.token || items.plexToken,
					movieSections: items.plexLibraryId || items.server.movieSections,
					showSections: items.server && items.server.showSections,
				},
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
		});
	});
}

function getPlexMediaUrl(plexMachineId, key) {
	return `https://app.plex.tv/web/app#!/server/${plexMachineId}/details/${encodeURIComponent(key)}`;
}

let notificationTimeout;
function showNotification(state, text) {
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
	}, 5000);
}

function addToCouchpotato(options, imdbId) {
	if (!imdbId) {
		console.log('Cancelled adding to CouchPotato since there is no IMDB ID');
		return;
	}
	chrome.runtime.sendMessage({
		type: 'VIEW_COUCHPOTATO',
		url: `${options.couchpotatoUrl}/media.get`,
		imdbId,
		basicAuth: options.couchpotatoBasicAuth,
	}, function(res) {
		const movieExists = res.success;
		if (res.err) {
			showNotification('warning', 'CouchPotato request failed (look in DevTools for more info)');
			console.error('Error with viewing on CouchPotato:', res.err);
			return;
		}
		if (!movieExists) {
			addToCouchPotatoRequest(imdbId);
			return;
		}
		showNotification('info', `Movie is already in CouchPotato (status: ${res.status})`);
	});
}

function addToCouchPotatoRequest(imdbId) {
	chrome.runtime.sendMessage({
		type: 'ADD_COUCHPOTATO',
		url: `${config.couchpotatoUrl}/movie.add`,
		imdbId,
		basicAuth: config.couchpotatoBasicAuth,
	}, function(res) {
		if (res.err) {
			showNotification('warning', 'Could not add to CouchPotato (look in DevTools for more info)');
			console.error('Error with adding on CouchPotato:', err);
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
			addToCouchpotato(config, key);
		});
	}

	if (title) {
		el.title = title;
	}
}

function handlePlex(config, options) {
	plexRequest(config, options)
	.then(({ size, key }) => {
		if (size) {
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
