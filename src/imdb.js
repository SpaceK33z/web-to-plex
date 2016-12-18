/* global handlePlex, getOptions, showNotification, modifyPlexButton */
function isMovie() {
	const tag = document.querySelector('meta[property="og:type"]');
	return tag && tag.content === 'video.movie';
}

function isShow() {
	const tag = document.querySelector('meta[property="og:type"]');
	return tag && tag.content === 'video.tv_show';
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
		return null;
	}
	const el = document.createElement('a');
	el.classList.add('web-to-plex-button');
	$plotSummary.appendChild(el);
	return el;
}

function initPlexMovie() {
	const $button = renderPlexButton();
	if (!$button) {
		return;
	}
	const $title = document.querySelector('.title_wrapper h1');
	const $year = document.querySelector('.title_wrapper #titleYear');
	// TODO: Hmm there should be a less risky way...
	const title = $title.childNodes[0].textContent.trim();
	// The year element contains `()`, so we need to strip it out.
	const year = parseInt($year.textContent.trim().replace(/\(|\)/g, ''));

	handlePlex(config, { type: 'movie', title, year, button: $button, imdbId });
}

function initPlexShow() {
	const $button = renderPlexButton();
	if (!$button) {
		return;
	}
	const $title = document.querySelector('.title_wrapper h1');
	const date = document.querySelector('title').textContent;
	const dateMatch = date.match(/Series (\d{4})/);
	if (!$title || !dateMatch) {
		modifyPlexButton($button, 'error', 'Could not extract title or year');
		return;
	}
	const title = $title.textContent.trim();
	const year = parseInt(dateMatch[1]);

	handlePlex(config, { type: 'show', title, year, button: $button, imdbId });
}

let config;
if ((isMovie() || isShow()) && imdbId) {
	getOptions().then((options) => {
		config = options;
		if (isMovie()) {
			initPlexMovie();
		// TODO: Legacy configs may not have TV show sections set.
		} else if (config.server.showSections) {
			initPlexShow();
		}
	}, () => {
		showNotification('warning', 'Not all options for the Web to Plex extension are filled in.');
	});
}
