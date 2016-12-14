function isMovie() {
	const tag = document.querySelector('meta[property="og:type"]');
	return tag && tag.content === 'video.movie';
}

function getImdbId() {
	const tag = document.querySelector('meta[property="pageId"]');
	return tag && tag.content;
}

const imdbId = getImdbId();

function renderPlexButton() {
	const $plotSummary = document.querySelector('.plot_summary');
	if (!$plotSummary) {
		console.log('Could not add Plex button.');
		return;
	}
	const el = document.createElement('a');
	el.classList.add('imdb-to-plex-button');
	$plotSummary.appendChild(el);
	return el;
}

function modifyPlexButton(el, action, title, key) {
	if (action === 'found') {
		el.href = getPlexMediaUrl(config.plexMachineId, key);
		el.textContent = 'On Plex';
		el.classList.add('imdb-to-plex-button--found');
	}
	if (action === 'error') {
		el.removeAttribute('href');
		el.textContent = 'Not on Plex';
		el.classList.remove('imdb-to-plex-button--found');
	}
	if (action === 'couchpotato') {
		el.href = '#';
		el.textContent = 'Download';
		el.classList.add('imdb-to-plex-button--couchpotato');
		el.addEventListener('click', (e) => {
			e.preventDefault();
			addToCouchpotato();
		});
	}

	if (title) {
		el.title = title;
	}
}

function initPlexThingy() {
	$button = renderPlexButton();
	if (!$button) {
		return;
	}
	const $title = document.querySelector('.title_wrapper h1');
	const $year = document.querySelector('.title_wrapper #titleYear');
	// TODO: Hmm there should be a less risky way...
	const title = $title.childNodes[0].textContent.trim();
	// The year element contains `()`, so we need to strip it out.
	const year = $year.textContent.trim().replace(/\(|\)/g, '');

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

function addToCouchpotato(action) {
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


let config;
if (isMovie() && imdbId) {
	getOptions().then((options) => {
		config = options;
		initPlexThingy();
	}, () => {
		showNotification('warning', 'Not all options for the Movieo to Plex extension are filled in.');
	});
}
