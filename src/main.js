let plexUrl = '';
let plexToken = '';
let plexMachineId;
let couchpotatoUrlRoot = '';
let couchpotatoToken = '';

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

function init() {
	if(isMoviePage()) {
		initPlexThingy();
	}
}

function showNotification(state, text) {
	const el = document.createElement('div')
	el.classList.add('movieo-to-plex-notification');
	if (state === 'warning') {
		el.classList.add('movieo-to-plex-warning');
	}
	el.innerHTML = text;
	document.body.appendChild(el);
	setTimeout(() => {
		document.body.removeChild(el);
	}, 5000);
}

chrome.storage.sync.get(null, function(items) {
	plexUrl = `${items.plexUrlRoot}/library/sections/${items.plexLibraryId}/all`;
	plexToken = items.plexToken;
	plexMachineId = items.plexMachineId;
	couchpotatoUrlRoot = items.couchpotatoUrlRoot;
	couchpotatoToken = items.couchpotatoToken;

	if (!plexToken || !plexMachineId || !items.plexLibraryId || !items.plexUrlRoot) {
		showNotification('warning', 'Not all options for the Movieo to Plex extension are filled in.');
		return;
	}

	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	init();
});

function doPlexRequest($icon, title, year) {
	return axios.get(plexUrl, {
		params: { title, year },
		headers: {
			'X-Plex-Token': plexToken,
			'Accept': 'application/json',
		}
	})
	.then((res) => {
		const size = res.data.MediaContainer && res.data.MediaContainer.size;
		let key = null;
		if (size) {
			key = res.data.MediaContainer.Metadata[0].key;
		}
		return { size, key };
	});
}


function initPlexThingy() {
	const $icon = renderPlexIcon();
	const $title = document.getElementById('doc_title');
	const $date = document.querySelector('meta[itemprop="datePublished"]');
	if (!$title || !$date) {
		modifyPlexIcon($icon, 'error', 'Could not extract title or year from Movieo');
		return;
	}
	const title = $title.dataset.title.trim();
	const year = parseInt($date.content.slice(0, 4));

	doPlexRequest($icon, title, year)
	.then(({ size, key }) => {
		if (!size) {
			// This is fucked up, but Plex' definition of a year is year when it was available,
			// not when it was released (which is Movieo's definition).
			// For examples, see Bone Tomahawk, The Big Short, The Hateful Eight.
			return doPlexRequest($icon, title, year + 1);
		}
		return { size, key };
	})
	.then(({ size, key }) => {
		if (size) {
			modifyPlexIcon($icon, 'found', 'Found on Plex', key);
		} else {
			const action = couchpotatoUrlRoot ? 'couchpotato' : 'error';
			const title = couchpotatoUrlRoot ? 'Could not find, add on Couchpotato?' : 'Could not find on Plex';
			modifyPlexIcon($icon, action, title);
		}
	})
	.catch((err) => {
		modifyPlexIcon($icon, 'error', 'Request to Plex failed');
		console.error('Request to Plex failed', err);
	});
}

function renderPlexIcon() {
	const $share = document.querySelector('.share-box')
	if (!$share) {
		console.log('Could not add Plex icon to .share-box');
	}
	const el = document.createElement('a');
	el.classList.add('i-plex-movieo-icon');
	$share.appendChild(el);
	return el;
}

function modifyPlexIcon(el, action, title, key) {
	if (action === 'found') {
		el.href = `https://app.plex.tv/web/app#!/server/${plexMachineId}/details/${encodeURIComponent(key)}`;
		el.classList.add('plex-found');
	}
	if (action === 'error') {
		el.removeAttribute('href');
		el.classList.remove('plex-found');
	}
	if (action === 'couchpotato') {
		el.href = '#';
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
	const url = `${couchpotatoUrlRoot}/api/${encodeURIComponent(couchpotatoToken)}/movie.add`;
	const imdbId = getImdbId();
	if (!imdbId) {
		console.log('Cancelled adding to CouchPotato since there is no IMDB ID');
		return;
	}
	axios.get(url, {
		params: { identifier: imdbId },
		headers: {
			Authorization: 'Basic a2Vlczpib25rZXJzdGVpbg==',
		},
	})
	.then((res) => {
		showNotification('info', 'Added movie on CouchPotato.');
	})
	.catch((err) => {
		showNotification('warning', 'Could not add to CouchPotato (look in DevTools for more info)');
		console.error('Error with adding on CouchPotato:', err);
	});
}
