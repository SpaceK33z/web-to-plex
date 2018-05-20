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

	let pa = document.createElement('div'),
        el = document.createElement('a');

    pa.classList.add('web-to-plex-wrapper', 'cols-xs-4', 'nr-pr-0', 'nr-pl-15');

    el.textContent = 'Web to Plex+';
    el.title = 'Loading...';
	el.classList.add('web-to-plex-button');

    pa.appendChild(el);
	$parent.appendChild(pa);
	return el;
}

async function initPlexThingy(type) {
	let $parent = document.querySelector('.container .row:nth-child(3) .row'),
        $button = renderPlexButton($parent);

	if (!$button)
		return;

	let $title = document.querySelector('.head-big'),
        $date = document.querySelector('.container .row:first-child .row ~ * > .row span');

	if (!$title || !$date)
		return modifyPlexButton(
			$button,
			'error',
			 `Could not extract ${ !$title? 'title': 'year' } from Vudu`
		);

	let title = $title.textContent.trim(),
        year = $date.textContent.split(/\s*\|\s*/);

    year = +year[year.length - 1].slice(0, 4);
    year |= 0;
    year = year || YEAR;

    let Db = await getIDs({ title, year, APIType: type }),
        IMDbID = Db.imdb,
        TVDbID = Db.thetvdb;

	findPlexMedia({ type, title, year, button: $button, IMDbID, TVDbID });
}

if (isMovie() || isShow()) {
	parseOptions().then(async() => await (window.onlocationchange = init)());
}
