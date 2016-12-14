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

let config;
getOptions().then((options) => {
	config = options;
	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	init();
}, () => {
	showNotification('warning', 'Not all options for the Movieo to Plex extension are filled in.');
});

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

	plexRequest({ url: config.plexUrl, token: config.plexToken, title, year })
	.then(({ size, key }) => {
		if (size) {
			modifyPlexButton($button, 'found', 'Found on Plex', key);
		} else {
			const action = config.couchpotatoUrl ? 'couchpotato' : 'error';
			const title = config.couchpotatoUrl ? 'Could not find, add on Couchpotato?' : 'Could not find on Plex';
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
		el.href = getPlexMediaUrl(config.plexMachineId, key);
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
	const imdbId = getImdbId();
	if (!imdbId) {
		console.log('Cancelled adding to CouchPotato since there is no IMDB ID');
		return;
	}
	chrome.runtime.sendMessage({
		type: 'VIEW_COUCHPOTATO',
		url: `${config.couchpotatoUrl}/media.get`,
		imdbId,
		basicAuth: config.couchpotatoBasicAuth,
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
