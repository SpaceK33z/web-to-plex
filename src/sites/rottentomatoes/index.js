/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
function init() {
	wait(
		() => document.querySelector('#reviews'),
		() => initPlexThingy(isMovie()? 'movie': 'show')
	);
}

function isMovie() {
	return /^\/m/.test(window.location.pathname);
}

function isShow() {
	return /^\/t/.test(window.location.pathname);
}

async function initPlexThingy(type) {
	let button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

	let $title = document.querySelector('.playButton + .title, [itemprop="name"]'),
        $year = (type == 'movie'? $title.nextElementSibling: $title.querySelector('.subtle')),
        $image = document.querySelector('[class*="posterimage" i]');

	if (!$title || !$year)
		return modifyPlexButton(
			button,
			'error',
			'Could not extract title or year from Rotten Tomatoes'
		);

	let title = $title.textContent.trim().replace(/(.+)\:[^]*$/, type == 'movie'? '$&': '$1'),
        year = $year.textContent.replace(/\D+/g, '').trim(),
        image = ($image || {}).src,
        Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

	findPlexMedia({ title, year, image, button, type, IMDbID, TMDbID, TVDbID });
}

parseOptions().then(init);
