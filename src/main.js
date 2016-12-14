const storage = chrome.storage.sync || chrome.storage.local;
let plexUrl = '';
let plexToken = '';
let plexMachineId;
let couchpotatoUrlRoot = '';
let couchpotatoToken = '';
let couchpotatoBasicAuth = null;

function isMoviePage() {
	const path = window.location.pathname;
	if (!path.startsWith('/movies/')) {
		return false;
	}
	// An example movie page: /movies/juno-hpsgt (can also have trailing slash!)
	// Example non-movie page: /movies/watchlist/gbdx
	// So if there is one slash extra (trailing slash not included), it's not a movie page.
	const jup = path.replace('/movies/', '').slice(0, -1);
	return !jup.includes('/');
}

function isMoviePageReady() {
	return !!document.querySelector('.share-box');
}

function init() {
	if(isMoviePage()) {
		if (isMoviePageReady()) {
			initPlexThingy();
		} else {
			// This almost never happens, but sometimes the page is too slow so we need to wait a bit.
			// I could reproduce this by clicking on a movie in the movie watchlist,
			// going back in history and then going forward in history.
			setTimeout(() => {
				initPlexThingy();
			}, 1000);
		}
	}
}

let notificationTimeout;

function showNotification(state, text) {
	if (notificationTimeout) {
		clearTimeout(notificationTimeout);
		notificationTimeout = null;
	}
	const existingEl = document.querySelector('.movieo-to-plex-notification');
	if (existingEl) {
		document.body.removeChild(existingEl);
	}

	const el = document.createElement('div');
	el.classList.add('movieo-to-plex-notification');
	if (state === 'warning') {
		el.classList.add('movieo-to-plex-warning');
	}
	el.textContent = text;
	document.body.appendChild(el);
	notificationTimeout = setTimeout(() => {
		document.body.removeChild(el);
	}, 5000);
}

storage.get(null, function(items) {
	plexUrl = `${items.plexUrlRoot}/library/sections/${items.plexLibraryId}/all`;
	plexToken = items.plexToken;
	plexMachineId = items.plexMachineId;
	couchpotatoUrlRoot = items.couchpotatoUrlRoot;
	couchpotatoToken = items.couchpotatoToken;
	if (items.couchpotatoBasicAuthUsername) {
		couchpotatoBasicAuth = {
			username: items.couchpotatoBasicAuthUsername,
			password: items.couchpotatoBasicAuthPassword,
		};
	}

	if (!plexToken || !plexMachineId || !items.plexLibraryId || !items.plexUrlRoot) {
		showNotification('warning', 'Not all options for the Movieo to Plex extension are filled in.');
		return;
	}

	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	init();
});

function doPlexRequest($button, title, year) {
	return fetch(`${plexUrl}?title=${title}&year=${year}`, {
		headers: {
			'X-Plex-Token': plexToken,
			'Accept': 'application/json',
		}
	})
	.then((res) => res.json())
	.then((res) => {
		const size = res.MediaContainer && res.MediaContainer.size;
		let key = null;
		if (size) {
			key = res.MediaContainer.Metadata[0].key;
		}
		return { size, key };
	});
}


function initPlexThingy() {
	const $button = renderPlexButton();
	if (!$button) {
		return;
	}
	const $title = document.getElementById('doc_title');
	const $date = document.querySelector('meta[itemprop="datePublished"]');
	if (!$title || !$date) {
		modifyPlexButton($button, 'error', 'Could not extract title or year from Movieo');
		return;
	}
	const title = $title.dataset.title.trim();
	const year = parseInt($date.content.slice(0, 4));

	doPlexRequest($button, title, year)
	.then(({ size, key }) => {
		if (!size) {
			// This is fucked up, but Plex' definition of a year is year when it was available,
			// not when it was released (which is Movieo's definition).
			// For examples, see Bone Tomahawk, The Big Short, The Hateful Eight.
			return doPlexRequest($button, title, year + 1);
		}
		return { size, key };
	})
	.then(({ size, key }) => {
		if (size) {
			modifyPlexButton($button, 'found', 'Found on Plex', key);
		} else {
			const action = couchpotatoUrlRoot ? 'couchpotato' : 'error';
			const title = couchpotatoUrlRoot ? 'Could not find, add on Couchpotato?' : 'Could not find on Plex';
			modifyPlexButton($button, action, title);
		}
	})
	.catch((err) => {
		modifyPlexButton($button, 'error', 'Request to Plex failed');
		console.error('Request to Plex failed', err);
	});
}

function renderPlexButton() {
	// The button text in the "Comments" button takes too much place, so we hide it.
	// It's very clear that it's about comments even without the text.
	const $commentText = document.querySelector('.mid-top-actions .comments-link .txt');
	if ($commentText) {
		$commentText.remove();
	}

	const $actions = document.querySelector('.mid-top-actions');
	if (!$actions) {
		console.log('Could not add Plex button.');
		return;
	}
	const el = document.createElement('a');
	el.classList.add('button', 'comments-link', 'movieo-to-plex-button');
	$actions.appendChild(el);
	return el;
}

function modifyPlexButton(el, action, title, key) {
	if (action === 'found') {
		el.href = `https://app.plex.tv/web/app#!/server/${plexMachineId}/details/${encodeURIComponent(key)}`;
		el.textContent = 'On Plex';
		el.classList.add('movieo-to-plex-button--found');
	}
	if (action === 'error') {
		el.removeAttribute('href');
		el.textContent = 'Not on Plex';
		el.classList.remove('movieo-to-plex-button--found');
	}
	if (action === 'couchpotato') {
		el.href = '#';
		el.textContent = 'Download';
		el.classList.add('movieo-to-plex-button--couchpotato');
		el.addEventListener('click', (e) => {
			e.preventDefault();
			addToCouchpotato();
		});
	}

	if (title) {
		el.title = title;
	}
}

function getImdbId() {
	const $link = document.querySelector('.tt-parent[href^="http://www.imdb.com/title/tt"]');
	if ($link) {
		return $link.href.replace('http://www.imdb.com/title/', '');
	}
	return null;
}

function addToCouchpotato(action) {
	const url = `${couchpotatoUrlRoot}/api/${encodeURIComponent(couchpotatoToken)}`;
	const imdbId = getImdbId();
	if (!imdbId) {
		console.log('Cancelled adding to CouchPotato since there is no IMDB ID');
		return;
	}
	chrome.runtime.sendMessage({
		type: 'VIEW_COUCHPOTATO',
		url: `${url}/media.get`,
		imdbId,
		couchpotatoBasicAuth,
	}, function(res) {
		const movieExists = res.success;
		if (res.err) {
			showNotification('warning', 'CouchPotato request failed (look in DevTools for more info)');
			console.error('Error with viewing on CouchPotato:', res.err);
			return;
		}
		if (!movieExists) {
			addToCouchPotatoRequest(url, imdbId);
			return;
		}
		showNotification('info', `Movie is already in CouchPotato (status: ${res.status})`);
	});
}

function addToCouchPotatoRequest(url, imdbId) {
	chrome.runtime.sendMessage({
		type: 'ADD_COUCHPOTATO',
		url: `${url}/movie.add`,
		imdbId,
		couchpotatoBasicAuth,
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
