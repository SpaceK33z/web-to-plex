let plexUrl = '';
let plexToken = '';
let plexMachineId;

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

chrome.storage.sync.get(null, function(items) {
	plexUrl = `${items.plexUrlRoot}/library/sections/${items.plexLibraryId}/all`;
	plexToken = items.plexToken;
	plexMachineId = items.plexMachineId;

	if (!plexToken || !plexMachineId || !items.plexLibraryId || !items.plexUrlRoot) {
		const warning = document.createElement('div')
		warning.classList.add('movieo-to-plex-warning');
		warning.innerHTML = 'Not all options for the Movieo to Plex extension are filled in.';
		document.body.appendChild(warning);
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
		if (size) {
			key = res.data.MediaContainer.Metadata[0].key;
			modifyPlexIcon($icon, 'Found on Plex', key);
		} else {
			modifyPlexIcon($icon, 'Could not find on Plex');
		}
		return size;
	});
}


function initPlexThingy() {
	const $icon = renderPlexIcon();
	const $title = document.getElementById('doc_title');
	const $date = document.querySelector('meta[itemprop="datePublished"]');
	if (!$title || !$date) {
		modifyPlexIcon($icon, 'Could not extract title or year from Movieo');
		return;
	}
	const title = $title.dataset.title.trim();
	const year = parseInt($date.content.slice(0, 4));

	doPlexRequest($icon, title, year)
	.then((size) => {
		if (!size) {
			// This is fucked up, but Plex' definition of a year is year when it was available,
			// not when it was released (which is Movieo's definition).
			// For examples, see Bone Tomahawk, The Big Short, The Hateful Eight.
			return doPlexRequest($icon, title, year + 1);
		}
		return null;
	})
	.catch((err) => {
		modifyPlexIcon($icon, 'Request to Plex failed');
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

function modifyPlexIcon(el, title, key) {
	if (key) {
		el.href = `https://app.plex.tv/web/app#!/server/${plexMachineId}/details/${encodeURIComponent(key)}`;
		el.classList.add('plex-found');
	} else {
		el.removeAttribute('href');
		el.classList.remove('plex-found');
	}

	if (title) {
		el.title = title;
	}
}
