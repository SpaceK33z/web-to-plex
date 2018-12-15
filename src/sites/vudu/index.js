/* global findPlexMedia, parseOptions, modifyPlexButton */
function isMovie() {
	return !isShow();
}

function isShow() {
	return /(?:Season-\d+\/\d+)$/i.test(window.location.pathname);
}

function isPageReady() {
    return !!document.querySelector('img[src*="poster" i]');
}

async function init() {
	if (isPageReady())
        await initPlexThingy(isMovie()? 'movie': 'tv');
	else
		// This almost never happens, but sometimes the page is too slow so we need to wait a bit.
		setTimeout(init, 1000);
}

async function initPlexThingy(type) {
	let button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

	let $title = document.querySelector('.head-big'),
        $date = document.querySelector('.container .row:first-child .row ~ * > .row span'),
        $image = document.querySelector('img[src*="poster" i]');

	if (!$title)
		return modifyPlexButton(
			button,
			'error',
			 `Could not extract title from Vudu`
		);

	let title = $title.textContent.replace(/\((\d{4})\)/, '').trim(),
        year = $date? $date.textContent.split(/\s*\|\s*/): RegExp.$1,
        image = ($image || {}).src;

    year = +year[year.length - 1].slice(0, 4);
    year |= 0;

    let Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

	findPlexMedia({ type, title, year, image, button, IMDbID, TMDbID, TVDbID });
}

if (isMovie() || isShow()) {
	parseOptions().then(async() => await (window.onlocationchange = init)());
}
