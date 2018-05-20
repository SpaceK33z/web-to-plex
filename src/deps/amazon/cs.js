/* global findPlexMedia, parseOptions, modifyPlexButton */
function isMovie() {
	return !isShow();
}

function isShow() {
	return document.querySelector('[data-automation-id="num-of-seasons-badge"]');
}

function isPageReady() {
    return document.querySelector('[data-automation-id="imdb-rating-badge"]');
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
	el.classList.add('web-to-plex-button', 'av-button', 'av-button--default');

	$parent.appendChild(el);
	return el;
}

async function initPlexThingy(type) {
	let $parent = document.querySelector('#dv-action-box .av-action-button-box'),
        $button = renderPlexButton($parent);

	if (!$button)
		return;

    let $title = document.querySelector('[data-automation-id="title"]'),
        $year = document.querySelector('[data-automation-id="release-year-badge"]');

    if (!$title)
		return modifyPlexButton(
			$button,
			'error',
			'Could not extract title from Amazon'
		),
          null;

	let title = $title.textContent.replace(/\(.+?\)$/, '').trim(),
        year = $year? $year.textContent.trim(): YEAR;

    console.log({ title, year });

    let Db = await getIDs({ title, year, APIType: type }),
        IMDbID = Db.imdb,
        TVDbID = Db.thetvdb;

	findPlexMedia({ type, title, year, button: $button, IMDbID, TVDbID });
}

if (isMovie() || isShow()) {
	parseOptions().then(async() => await init());
}
