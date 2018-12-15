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

async function initPlexThingy(type) {
	let button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

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

	findPlexMedia({ type, title, year, button, IMDbID, TMDbID, TVDbID });
}

(window.onlocationchange = () =>
    wait(isReady, () => parseOptions().then(async() => await initPlexThingy(isMovie()? 'movie': 'tv')))
)();