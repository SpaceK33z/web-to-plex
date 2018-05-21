/* global findPlexMedia, parseOptions, modifyPlexButton */
function isMovie() {
	return !isShow();
}

function isShow() {
	return /(?:Season-\d+\/\d+)$/i.test(window.location.pathname);
}

function isPageReady() {
    return !document.querySelector('.loadingScreenViewport');
}

async function init() {
	if (isPageReady())
        await initPlexThingy(isMovie()? 'movie': 'tv');
	else
		// This almost never happens, but sometimes the page is too slow so we need to wait a bit.
		setTimeout(init, 1000);
}

function renderPlexButton($parent) {
	if (!$parent) return;

	let existingButton = document.querySelector('a.web-to-plex-button');
	if (existingButton)
		existingButton.remove();

	let el = document.createElement('a');

    el.textContent = 'Web to Plex+';
    el.title = 'Loading...';
	el.classList.add('web-to-plex-button');

	$parent.appendChild(el);
	return el;
}

async function initPlexThingy(type) {
	let $parent = document.querySelector('.container .row:nth-child(3) .row > *, .container .row:nth-child(3) ~ * .row > *'),
        $button = renderPlexButton($parent);

	if (!$button)
		return;

	let $title = document.querySelector('.head-big'),
        $date = document.querySelector('.container .row:first-child .row ~ * > .row span');

	if (!$title)
		return modifyPlexButton(
			$button,
			'error',
			 `Could not extract title from Vudu`
		);

	let title = $title.textContent.replace(/\((\d{4})\)/, '').trim(),
        year = $date? $date.textContent.split(/\s*\|\s*/): RegExp.$1;

    year = +year[year.length - 1].slice(0, 4);
    year |= 0;

    let Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

	findPlexMedia({ type, title, year, button: $button, IMDbID, TMDbID, TVDbID });
}

if (isMovie() || isShow()) {
	parseOptions().then(async() => await (window.onlocationchange = init)());
}
