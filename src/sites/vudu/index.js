/* global findPlexMedia, parseOptions, modifyPlexButton */
function isMovie() {
	return !isShow();
}

function isShow() {
	return /(?:Season-\d+\/\d+)$/i.test(window.location.pathname);
}

function isPageReady() {
<<<<<<< HEAD
<<<<<<< HEAD
    return !!document.querySelector('img[src*="poster" i]');
=======
    return !document.querySelector('.loadingScreenViewport');
>>>>>>> Upgrade to v4 (rebased) (#55)
=======
    return !document.querySelector('.loadingScreenViewport');
>>>>>>> SpaceK33z/master
}

async function init() {
	if (isPageReady())
        await initPlexThingy(isMovie()? 'movie': 'tv');
	else
		// This almost never happens, but sometimes the page is too slow so we need to wait a bit.
		setTimeout(init, 1000);
}

<<<<<<< HEAD
<<<<<<< HEAD
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
=======
=======
>>>>>>> SpaceK33z/master
function renderPlexButton($parent) {
	if (!$parent) return;

	let existingButton = document.querySelector('a.web-to-plex-button');
	if (existingButton)
		existingButton.remove();

	let el = document.createElement('a');

    el.textContent = 'Web to Plex';
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
<<<<<<< HEAD
>>>>>>> Upgrade to v4 (rebased) (#55)
=======
>>>>>>> SpaceK33z/master
			'error',
			 `Could not extract title from Vudu`
		);

	let title = $title.textContent.replace(/\((\d{4})\)/, '').trim(),
<<<<<<< HEAD
<<<<<<< HEAD
        year = $date? $date.textContent.split(/\s*\|\s*/): RegExp.$1,
        image = ($image || {}).src;
=======
        year = $date? $date.textContent.split(/\s*\|\s*/): RegExp.$1;
>>>>>>> Upgrade to v4 (rebased) (#55)
=======
        year = $date? $date.textContent.split(/\s*\|\s*/): RegExp.$1;
>>>>>>> SpaceK33z/master

    year = +year[year.length - 1].slice(0, 4);
    year |= 0;

    let Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

<<<<<<< HEAD
<<<<<<< HEAD
	findPlexMedia({ type, title, year, image, button, IMDbID, TMDbID, TVDbID });
=======
    console.log(title, year, Db);

	findPlexMedia({ type, title, year, button: $button, IMDbID, TMDbID, TVDbID });
>>>>>>> Upgrade to v4 (rebased) (#55)
=======
    console.log(title, year, Db);

	findPlexMedia({ type, title, year, button: $button, IMDbID, TMDbID, TVDbID });
>>>>>>> SpaceK33z/master
}

if (isMovie() || isShow()) {
	parseOptions().then(async() => await (window.onlocationchange = init)());
}
