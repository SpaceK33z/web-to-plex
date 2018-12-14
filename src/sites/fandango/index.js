/* global findPlexMedia, parseOptions, modifyPlexButton */
function isMovie() {
	return /\/movie-overview\/?$/.test(window.location.pathname);
}

async function initPlexThingy(type) {
	let $parent = document.querySelector('.subnav ul'),
        button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

    let $title = document.querySelector('.subnav__title'),
        $year = document.querySelector('.movie-details__release-date'),
        $image = document.querySelector('.movie-details__movie-img');

    if (!$title || !$year)
		return modifyPlexButton(
			button,
			'error',
			'Could not extract title or year from Fandango'
		),
          null;

	let title = $title.textContent.trim().split(/\n+/)[0].trim(),
        year = $year.textContent.replace(/.*(\d{4}).*/, '$1').trim(),
        image = ($image || {}).src;

    let Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

	findPlexMedia({ type, title, year, image, button, IMDbID, TMDbID, TVDbID });
}

if (isMovie()) {
	parseOptions().then(async() => await initPlexThingy('movie'));
}
