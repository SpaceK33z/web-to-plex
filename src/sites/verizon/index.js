/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
function isMoviePage() {
	return /\bmovies?\b/i.test(window.location.pathname);
}

function isShowPage() {
	return /\bseries\b/i.test(window.location.pathname);
}

function isOnDemand() {
    return /ondemand/i.test(window.location.pathname);
}

function init() {
	if (isMoviePage() || isShowPage()) {
		wait(
			() => document.querySelector('.container .btn-with-play, .moredetails, .more-like'),
			() => initPlexThingy(isMoviePage() ? 'movie' : 'tv')
		);
	}
}

async function initPlexThingy(type) {
	let button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

    let $title, $year, $image = document.querySelector('.cover img');

    if(isOnDemand()) {
        if(isMoviePage()) {
            $title = document.querySelector('.detail *');
            $year = document.querySelector('.rating *');
        } else {
            $title = {textContent: window.location.pathname.replace(/\/ondemand\/tvshows?\/([^\/]+?)\/.*/i)};
            $year = document.querySelector('#showDetails > * > *:nth-child(4) *:last-child');

            $title.textContent = decodeURL($title.textContent).toCpas();
        }
    } else {
        $title = document.querySelector('.copy > .title');
        $year = (type === 'movie')?
            document.querySelector('.copy > .details'):
        document.querySelector('.summary ~ .title ~ *');
    }

	if (!$title || !$year)
		return modifyPlexButton(button, 'error', `Could not extract ${ !$title? 'title': 'year' } from Verizon`);

	let title = $title.textContent.trim(),
        year = $year.textContent.slice(0, 4).trim(),
        image = $image.src;

    let Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

	findPlexMedia({ type, title, year, image, button, IMDbID, TMDbID, TVDbID });
}

parseOptions().then(() => {
	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	init();
});
