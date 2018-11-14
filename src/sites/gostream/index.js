/* global parseOptions, modifyPlexButton, findPlexMedia */
function isMoviePage() {
	// An example movie page: /movies/3030-the-1517-to-paris.html
	return /\/(?!genre|most-viewed|top-imdb|contact)\b/.test(window.location.pathname);
}

function isMoviePageReady() {
    let e = document.querySelector('.movieplay iframe, .desc iframe');
	return !!e && e.src != '' && document.readyState == 'complete';
}

function init() {
	if (isMoviePage())
		if (isMoviePageReady())
			initPlexThingy();
		else
			// This almost never happens, but sometimes the page is too slow so we need to wait a bit.
			setTimeout(init, 1000);
}

parseOptions().then(() => {
	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	init();
});

async function initPlexThingy() {

	let button = renderPlexButton();
	if (!button)
		return /* an error occurred, fail silently */;

	let $title = document.querySelector('[itemprop="name"]:not(meta)'),
        $year = document.querySelector('.mvic-desc [href*="year/"]'),
        $image, start = +(new Date);

    wait(() => (+(new Date) - start > 10000) || ($image = document.querySelector('.hiddenz, [itemprop="image"]')));

	if (!$title || !$year)
		return modifyPlexButton(
			button,
			'error',
			'Could not extract title or year from GoStream'
		),
          null;

	let title = $title.innerText.trim(),
	    year = $year.innerText.trim(),
        image = $image.src,
        type = 'movie';

    let Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

	findPlexMedia({ title, year, image, button, IMDbID, TMDbID, TVDbID, type });
}
