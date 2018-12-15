/* global findPlexMedia, parseOptions, modifyPlexButton */
function isMovie() {
	return !isShow();
}

function isShow() {
<<<<<<< HEAD
	return document.querySelector('[data-automation-id*="seasons"], [class*="seasons"], [class*="episodes"], [class*="series"]');
=======
	return document.querySelector('[data-automation-id*="seasons"], [class*="num-of-seasons"]');
>>>>>>> Upgrade to v4 (rebased) (#55)
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

<<<<<<< HEAD
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
=======
function renderPlexButton($parent) {
	if (!$parent) return;

	let existingButton = document.querySelector('a.web-to-plex-button');
	if (existingButton)
		existingButton.remove();

	let el = document.createElement('a');

    el.textContent = 'Web to Plex';
    el.title = 'Loading...';
	el.classList.add('web-to-plex-button', 'av-button', 'av-button--default', 'dv-sub-btn-content');

	$parent.appendChild(el);
	return el;
}

async function initPlexThingy(type) {
	let $parent = document.querySelector(type == 'tv'? '#dv-action-box .av-action-button-box': '#dv-action-box'),
        $button = renderPlexButton($parent),
        R = RegExp;

	if (!$button)
		return;

    let $title = document.querySelector('[data-automation-id="title"], #aiv-content-title'),
        $year = document.querySelector('[data-automation-id="release-year-badge"], .release-year');

    if (!$title)
		return modifyPlexButton(
			$button,
>>>>>>> Upgrade to v4 (rebased) (#55)
			'error',
			'Could not extract title from Amazon'
		),
          null;

	let title = $title.textContent.replace(/(?:\(.+?\)|(\d+)|\d+\s+seasons?\s+(\d+))\s*$/gi, '').trim(),
<<<<<<< HEAD
        year = $year? $year.textContent.trim(): R.$1 || R.$2 || YEAR,
        image = getComputedStyle($image).backgroundImage;
=======
        year = $year? $year.textContent.trim(): R.$1 || R.$2 || YEAR;
>>>>>>> Upgrade to v4 (rebased) (#55)

    let Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

<<<<<<< HEAD
	findPlexMedia({ type, title, year, image, button, IMDbID, TMDbID, TVDbID });
=======
	findPlexMedia({ type, title, year, button: $button, IMDbID, TMDbID, TVDbID });
>>>>>>> Upgrade to v4 (rebased) (#55)
}

if (isMovie() || isShow()) {
	parseOptions().then(async() => await init());
}
