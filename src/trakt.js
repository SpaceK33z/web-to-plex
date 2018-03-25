/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
function isMoviePage() {
	const path = window.location.pathname;
	if (!path.startsWith('/movies/')) {
		return false;
	}
	// TODO: e.g. /movies/trending is not really a movie page...
	return true;
}

function isShowPage() {
	const path = window.location.pathname;
	if (!path.startsWith('/shows/')) {
		return false;
	}
	// TODO: e.g. /shows/trending is not really a show page...
	return true;
}

function getImdbId() {
	const $link = document.querySelector(
		'ul.external [href^="http://www.imdb.com/title/tt"]'
	);
	if ($link) {
		return $link.href.replace('http://www.imdb.com/title/', '');
	}
	return null;
}

function init() {
	if (isMoviePage() || isShowPage()) {
		wait(
			() => {
				// Tricky hack; Trakt uses TurboLinks and the body content is not replaced immediately when navigating to another URL.
				// So we wait on the loading div to stop being displayed.
				const loadDiv = document.querySelector('#loading-bg');
				const hasWrapper = document.querySelector('#info-wrapper ul.external');
				if (loadDiv) {
					return loadDiv.style.display !== 'block' && hasWrapper;
				}
				return hasWrapper;
			},
			() => {
				initPlexThingy(isMoviePage() ? 'movie' : 'show');
			}
		);
	}
}

function renderPlexButton() {
	const $actions = document.querySelector('ul.external li:first-child');
	if (!$actions) {
		console.log('Could not add Plex button.');
		return null;
	}
	const $existingEl = $actions.querySelector('a.web-to-plex-button');
	if ($existingEl) {
		return null;
	}
	const el = document.createElement('a');
	el.classList.add('web-to-plex-button');
	$actions.insertBefore(el, $actions.childNodes[0]);
	return el;
}

function initPlexThingy(type) {
	const $button = renderPlexButton();
	if (!$button) {
		return;
	}
	const $title = document.querySelector('.summary .mobile-title');
	const $year = document.querySelector('.summary .mobile-title .year'); // <-- THIS DOES NOT EXIST FOR TV SHOWS
	if (!$title || !$year) {
		modifyPlexButton($button, 'error', 'Could not extract title or year');
		return;
	}
	const title = $title.firstChild.childNodes[0].textContent.trim();
	const year = parseInt($year.textContent.trim());
	const imdbId = getImdbId();

	findPlexMedia({ type, title, year, button: $button, imdbId });
}

parseOptions().then(() => {
	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	init();
});
