/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
function init() {
	wait(
		() => document.readyState === 'complete',
		() => initPlexThingy(isMoviePage() ? 'movie' : 'tv')
	);
}

function isMoviePage() {
	return window.location.pathname.startsWith('/movie/');
}

function isShowPage() {
	return window.location.pathname.startsWith('/tv/');
}

async function initPlexThingy(type) {
	let $button = renderPlexButton();
	if (!$button)
		return;

	let $title = document.querySelector('.title > span > *:not(.release_date)'),
        $date = document.querySelector('.title .release_date');

	if (!$title || !$date)
		return modifyPlexButton(
			$button,
			'error',
			 `Could not extract ${ !$title? 'title': 'year' } from TheMovieDb`
		);

	let title = $title.textContent.trim(),
        year = $date.textContent.trim(),
        apid = window.location.pathname.replace(/\/(?:movie|tv)\/(\d+).*/, '$1');

    let Db = await getIDs({ title, year, APIType: type, APIID: apid }),
        IMDbID = Db.imdb,
        TVDbID = Db.thetvdb;

    type = type === 'tv'? 'show': type;

	findPlexMedia({ title, year, button: $button, type, IMDbID, TVDbID, txt: 'title', hov: 'null' });
}

function renderPlexButton() {
	let $actions = document.querySelector('.header .actions');
	if (!$actions)
		return;

	let pa = document.createElement('li'),
        el = document.createElement('a'),
        ch = document.createElement('span');

    ch.classList.add('glyphicons', 'glyphicons-download');

    el.classList.add('web-to-plex-button');

	pa.classList.add('tooltip', 'use_tooltip');
    pa.title = 'Web to Plex+';

    el.appendChild(ch);
    pa.appendChild(el);
	$actions.insertBefore(pa, $actions.lastElementChild);

	return el;
}

parseOptions().then(() => {
	init();
});
