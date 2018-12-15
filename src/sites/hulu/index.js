/* global findPlexMedia, parseOptions, modifyPlexButton */
function isReady() {
    return $$('#content [class$="__meta"]');
}

function isMovie() {
	return window.location.pathname.startsWith('/movie/'); // /movies/ is STRICTLY for a collection of movies (e.g. the line-up)
}

function isShow() {
	return window.location.pathname.startsWith('/series/'); // /tv/ is STRICTLY for a collection of movies (e.g. the line-up)
}

let $$ = selector => document.querySelector(selector);

<<<<<<< HEAD
<<<<<<< HEAD
async function initPlexThingy(type) {
	let button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;
=======
=======
>>>>>>> SpaceK33z/master
function renderPlexButton($parent) {
	if (!$parent) return;

	let existingButton = $$('a.web-to-plex-button');
	if (existingButton)
		existingButton.remove();

	let el = document.createElement('a');

    el.classList.add('Nav__item', 'web-to-plex-button');

    el.innerHTML = `<img src="${ chrome.extension.getURL('img/o48.png') }"/>`;
    el.title = 'Loading...';

	$parent.insertBefore(el, $parent.lastChild);
	return el;
}

async function initPlexThingy(type) {
	let $button = renderPlexButton($$('#content .Nav .Nav__container'));

	if (!$button)
		return;
<<<<<<< HEAD
>>>>>>> Upgrade to v4 (rebased) (#55)
=======
>>>>>>> SpaceK33z/master

	let $title = $$('#content [class$="__name"]'),
        $year = $$('#content [class$="__meta"] [class$="segment"]:last-child'),
        title = $title.innerText.replace(/^\s+|\s+$/g, '').toCaps(),
        year = +$year.textContent.replace(/.*\((\d{4})\).*/, '$1'),
        Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

<<<<<<< HEAD
<<<<<<< HEAD
	findPlexMedia({ type, title, year, button, IMDbID, TMDbID, TVDbID });
=======
	findPlexMedia({ type, title, year, button: $button, IMDbID, TMDbID, TVDbID, txt: 'title', hov: 'null' });
>>>>>>> Upgrade to v4 (rebased) (#55)
=======
	findPlexMedia({ type, title, year, button: $button, IMDbID, TMDbID, TVDbID, txt: 'title', hov: 'null' });
>>>>>>> SpaceK33z/master
}

(window.onlocationchange = () =>
    wait(isReady, () => parseOptions().then(async() => await initPlexThingy(isMovie()? 'movie': 'tv')))
)();