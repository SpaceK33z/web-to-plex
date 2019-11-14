/* global findPlexMedia, parseOptions, modifyPlexButton */
function isMovie() {
	return !isShow();
}

function isShow() {
	return document.querySelector('[data-automation-id*="seasons"], [class*="seasons"], [class*="episodes"], [class*="series"]');
}

function isPageReady() {
    return document.querySelector('[data-automation-id="imdb-rating-badge"], #most-recent-reviews-content > *:first-child');
}

async function init() {
	if (isPageReady())
        await initPlexThingy(isShow()? 'tv': 'movie');
	else
		// This almost never happens, but sometimes the page is too slow so we need to wait a bit.
		setTimeout(init, 1000);
}

async function initPlexThingy(type) {
	let button = renderPlexButton(),
        R = RegExp;

	if (!button)
		return /* Fatal Error: Fail Silently */;

    let $title = document.querySelector('[data-automation-id="title"], #aiv-content-title, .dv-node-dp-title'),
        $year = document.querySelector('[data-automation-id="release-year-badge"], .release-year'),
        $image = document.querySelector('.av-bgimg__div, div[style*="sgp-catalog-images"]');

    if (!$title)
		return modifyPlexButton(
			button,
			'error',
			'Could not extract title from Amazon'
		),
          null;

	let title = $title.textContent.replace(/(?:\(.+?\)|(\d+)|\d+\s+seasons?\s+(\d+))\s*$/gi, '').trim(),
        year = $year? $year.textContent.trim(): R.$1 || R.$2 || YEAR,
        image = getComputedStyle($image).backgroundImage;

    let Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

	findPlexMedia({ type, title, year, image, button, IMDbID, TMDbID, TVDbID });
}

if (isMovie() || isShow()) {
	parseOptions().then(async() => await init());
}
