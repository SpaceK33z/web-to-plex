/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
function isMoviePage() {
	return window.location.pathname.startsWith('/store/movies/');
}

function isShowPage() {
	return window.location.pathname.startsWith('/store/tv/');
}

function init() {
	if (isMoviePage() || isShowPage()) {
		wait(
			() => document.querySelector('c-wiz span > button.id-track-click'),
			() => initPlexThingy(isMoviePage() ? 'movie' : 'tv')
		);
	}
}

async function initPlexThingy(type) {
	let button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

	let $title = document.querySelector('h1'),
        $year = document.querySelector(`h1 ~ div span:${ type === 'movie'? 'first': 'last' }-of-type`),
        $image = document.querySelector('img[alt="cover art" i]');

	if (!$title || !$year)
		return modifyPlexButton(button, 'error', `Could not extract ${ !$title? 'title': 'year' } from Google`);

	let title = $title.textContent.replace(/\(\s*(\d{4})\s*\).*?$/, '').trim(),
        year = (RegExp.$1 || $year.textContent).replace(/^.*?(\d+)/, '$1').trim(),
        image = $image.src,
        Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

	findPlexMedia({ type, title, year, button, IMDbID, TMDbID, TVDbID });
}

parseOptions().then(() => {
	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	init();
});
