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
	el.classList.add('movieo-to-plex-button');
	$plotSummary.appendChild(el);
	return el;
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

	handlePlex(config, { title, year, button: $button, imdbId });
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
