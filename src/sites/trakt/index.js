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

function getIMDbID() {
	let $link = document.querySelector(
        // HTTPS and HTTP
		'[href*="imdb.com/title/tt"]'
	);

	if ($link)
		return $link.href.replace(/^.*?imdb\.com\/title\/(tt\d+)/, '$1');
}

function getTVDbID() {
	let $link = document.querySelector(
        // HTTPS and HTTP
		'[href*="thetvdb.com/"]'
	);

	if ($link)
		return $link.href.replace(/^.*?thetvdb.com\/.+(?:(?:series)?id=(\d+)).*?$/, '$1');
}

function getTMDbID() {
	let $link = document.querySelector(
        // HTTPS and HTTP
		'[href*="themoviedb.org/"]'
	);

	if ($link)
		return $link.href.replace(/^.*?themoviedb.org\/(?:movie|tv)\/(\d+).*?$/, '$1');
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
    el.title = 'Loading...';
	el.classList.add('web-to-plex-button');
	$actions.insertBefore(el, $actions.childNodes[0]);

	return el;
}

async function initPlexThingy(type) {
	let $button = renderPlexButton();

	if (!$button)
		return;

	let $title = document.querySelector('.mobile-title'),
        $year = document.querySelector('.mobile-title .year');

	if (!$title || !$year)
		return modifyPlexButton($button, 'error',  `Could not extract ${ !$title? 'title': 'year' } from Trakt`);

	let title = $title.textContent.replace(/(.+)(\d{4}).*?$/, '$1').replace(/\s*\:\s*Season.*$/i, '').trim(),
        year = (RegExp.$2 || $year.textContent).trim(),
        IMDbID = getIMDbID(),
        TMDbID = getTMDbID(),
        TVDbID = getTVDbID();

    if((!IMDbID && !TMDbID) || !TVDbID) {
        let Db = await getIDs({ title, year, type, IMDbID, TMDbID, TVDbID });

        IMDbID = IMDbID || Db.imdb,
        TMDbID = TMDbID || Db.tmdb,
        TVDbID = TVDbID || Db.tvdb;
        title = Db.title;
        year = Db.year;
    }

	findPlexMedia({ type, title, year, button: $button, IMDbID, TMDbID, TVDbID });
}

parseOptions().then(() => {
	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	init();
});
