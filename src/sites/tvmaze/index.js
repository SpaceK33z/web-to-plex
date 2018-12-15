/* global findPlexMedia, parseOptions, modifyPlexButton */
function isShowPage() {
	// An example movie page: /shows/2757/colony
	return window.location.pathname.startsWith('/shows/');
}

function isShowPageReady() {
	return !!document.querySelector('#general-info-panel .rateit');
}

async function init() {
	if (isShowPage())
		if (isShowPageReady())
			await initPlexThingy();
		else
			// This almost never happens, but sometimes the page is too slow so we need to wait a bit.
			setTimeout(init, 1000);
}

parseOptions().then(async() => {
	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	await init();
});

async function initPlexThingy() {
	let button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

	let $title = document.querySelector('header.columns > h1'),
        $date = document.querySelector('#year'),
        $image = document.querySelector('figure img'),
        $apid = window.location.pathname.replace(/\/shows\/(\d+).*/, '$1');

	if (!$title || !$date)
		return modifyPlexButton(
			button,
			'error',
			 `Could not extract ${ !$title? 'title': 'year' } from TV Maze`
		),
          null;

	let title = $title.innerText.trim(),
	    year = $date.innerText.replace(/\((\d+).+\)/, '$1'),
        image = ($image || {}).src,
        Db = await getIDs({ title, year, type: 'tv', APIID: $apid }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

	findPlexMedia({ title, year, button, type: 'tv', IMDbID, TMDbID, TVDbID });
}
