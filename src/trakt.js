/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
function isMoviePage() {
	return window.location.pathname.startsWith('/movies/');
}

function isShowPage() {
	let path = window.location.pathname;
	if (!path.startsWith('/shows/'))
		return false;

	// TODO: e.g. /shows/trending is not really a show page...
	return !/\btrending$/.test(path);
}

function getImdbId() {
	let $link = document.querySelector(
		'ul.external [href^="http://www.imdb.com/title/tt"]'
	);
	if ($link)
		return $link.href.replace('http://www.imdb.com/title/', '');
}

function init() {
	if (isMoviePage() || isShowPage()) {
		wait(
			() => document.querySelector('#info-wrapper ul.external'),
			() => initPlexThingy(isMoviePage() ? 'movie' : 'show')
		);
	}
}

function renderPlexButton() {
	let $actions = document.querySelector('ul.external li:first-child');
	if (!$actions)
		return;

	let existingButton = $actions.querySelector('a.web-to-plex-button');
	if (existingButton)
		return;

	let el = document.createElement('a');
    el.textContent = 'Web to Plex+';
	el.classList.add('web-to-plex-button');
	$actions.insertBefore(el, $actions.childNodes[0]);
	return el;
}

function initPlexThingy(type) {
	let $button = renderPlexButton();
	if (!$button)
		return;

	let $title = document.querySelector('.btn-checkin'),
        $year = document.querySelector('.summary .mobile-title .year');
	if (!$title || !$year)
		return modifyPlexButton($button, 'error', 'Could not extract title or year');

	let title = $title.dataset.topTitle,
        year = parseInt($year.textContent.trim()),
        imdbId = getImdbId();

	findPlexMedia({ type, title, year, button: $button, imdbId });
}

parseOptions().then(() => {
	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	init();
});
