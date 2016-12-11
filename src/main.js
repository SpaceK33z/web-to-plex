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
	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	init();
});


function initPlexThingy() {
	const $icon = renderPlexIcon();
	const $title = document.getElementById('doc_title');
	const $date = document.querySelector('meta[itemprop="datePublished"]');
	if (!$title || !$date) {
		modifyPlexIcon($icon, 'Could not extract title or year from Movieo');
		return;
	}
	const title = $title.dataset.title.trim();
	const year = $date.content.slice(0, 4);

	axios.get(plexUrl, {
		params: {
			title,
			year,
		},
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
