/* global findPlexMedia, parseOptions, modifyPlexButton */
function isMovie() {
	return !isShow();
}

function isShow() {
	return document.querySelector('[data-automation-id="num-of-seasons"], .num-of-seasons, [class^="season"]');
}

function isPageReady() {
    return document.querySelector('[data-automation-id="imdb-rating-badge"], #most-recent-reviews-content > *:first-child');
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
	el.classList.add('web-to-plex-button', 'av-button', 'av-button--default', 'dv-sub-btn-content');

	$parent.appendChild(el);
	return el;
}

async function initPlexThingy(type) {
	let $parent = document.querySelector('#dv-action-box .av-action-button-box, #dv-action-box'),
        $button = renderPlexButton($parent),
        R = RegExp;

	if (!$button)
		return;

    let $title = document.querySelector('[data-automation-id="title"], #aiv-content-title'),
        $year = document.querySelector('[data-automation-id="release-year-badge"], .release-year');

    if (!$title)
		return modifyPlexButton(
			$button,
			'error',
			'Could not extract title from Amazon'
		),
          null;

	let title = $title.textContent.replace(/(?:\(.+?\)|(\d+)|\d+\s+seasons?\s+(\d+))\s*$/gi, '').trim(),
        year = $year? $year.textContent.trim(): R.$1 || R.$2 || YEAR;

    let Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

	findPlexMedia({ type, title, year, button: $button, IMDbID, TMDbID, TVDbID });
}

if (isMovie() || isShow()) {
	parseOptions().then(async() => await init());
}
