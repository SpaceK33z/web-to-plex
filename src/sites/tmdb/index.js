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
<<<<<<< HEAD
<<<<<<< HEAD
	let button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

	let $title = document.querySelector('.title > span > *:not(.release_date)'),
        $date = document.querySelector('.title .release_date'),
        $image = document.querySelector('img.poster');

	if (!$title || !$date)
		return modifyPlexButton(
			button,
=======
=======
>>>>>>> SpaceK33z/master
	let $button = renderPlexButton();
	if (!$button)
		return;

	let $title = document.querySelector('.title > span > *:not(.release_date)'),
        $date = document.querySelector('.title .release_date');

	if (!$title || !$date)
		return modifyPlexButton(
			$button,
<<<<<<< HEAD
>>>>>>> Upgrade to v4 (rebased) (#55)
=======
>>>>>>> SpaceK33z/master
			'error',
			 `Could not extract ${ !$title? 'title': 'year' } from TheMovieDb`
		);

	let title = $title.textContent.trim(),
        year = $date.textContent.trim(),
<<<<<<< HEAD
<<<<<<< HEAD
        image = ($image || {}).src,
=======
>>>>>>> Upgrade to v4 (rebased) (#55)
=======
>>>>>>> SpaceK33z/master
        apid = window.location.pathname.replace(/\/(?:movie|tv)\/(\d+).*/, '$1');

    let Db = await getIDs({ title, year, TMDbID: apid, APIType: type, APIID: apid }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

<<<<<<< HEAD
<<<<<<< HEAD
    let savename = title.toLowerCase();

    save(`${savename} (${year}).tmdb`, Db);
    save(`${savename}.tmdb`, +year);
    terminal.log(`Saved as "${savename} (${year}).tmdb"`);

    type = type === 'tv'? 'show': type;

	findPlexMedia({ title, year, image, button, type, IMDbID, TMDbID, TVDbID });
=======
=======
>>>>>>> SpaceK33z/master
    type = type === 'tv'? 'show': type;

	findPlexMedia({ title, year, button: $button, type, IMDbID, TMDbID, TVDbID, txt: 'title', hov: 'null' });
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
    pa.title = 'Web to Plex';

    el.appendChild(ch);
    pa.appendChild(el);
	$actions.insertBefore(pa, $actions.lastElementChild);

	return el;
<<<<<<< HEAD
>>>>>>> Upgrade to v4 (rebased) (#55)
=======
>>>>>>> SpaceK33z/master
}

parseOptions().then(() => {
	init();
});
