/* global parseOptions, modifyPlexButton, findPlexMedia */
function isMoviePage() {
	// An example movie page: /movies/3030-the-1517-to-paris.html
	return /\/(movies?|views?)\//.test(window.location.pathname);
}
function isMoviePageReady() {
	return !!document.querySelector('#videoplayer video').getAttribute('onplay') != '';
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
		return /* Fatal Error: Fail Silently */;
	let $title = document.querySelector('#dle-content .about > h1'),
        $date = document.querySelector('.features > .reset:nth-child(2) a');
	if (!$title || !$date)
		return modifyPlexButton(
			button,
			'error',
			'Could not extract title or year from Flenix'
		),
          null;
    let meta = {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        mode: 'no-cors'
    };
	let title = $title.innerText.trim(),
	    year = $date.innerText,
        type = 'movie';
    let Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;
    title = Db.title;
    year = Db.year;
	findPlexMedia({ title, year, button, IMDbID, TMDbID, TVDbID, type, remote: '/engine/ajax/get.php', locale: 'flenix' });
}