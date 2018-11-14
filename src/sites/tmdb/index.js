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
	let button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

	let $title = document.querySelector('.title > span > *:not(.release_date)'),
        $date = document.querySelector('.title .release_date'),
        $image = document.querySelector('img.poster');

	if (!$title || !$date)
		return modifyPlexButton(
			button,
			'error',
			 `Could not extract ${ !$title? 'title': 'year' } from TheMovieDb`
		);

	let title = $title.textContent.trim(),
        year = $date.textContent.trim(),
        apid = window.location.pathname.replace(/\/(?:movie|tv)\/(\d+).*/, '$1');

    let Db = await getIDs({ title, year, TMDbID: apid, APIType: type, APIID: apid }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

    type = type === 'tv'? 'show': type;

	findPlexMedia({ title, year, button, type, IMDbID, TMDbID, TVDbID });
}

parseOptions().then(() => {
	init();
});
