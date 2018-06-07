/* global findPlexMedia, parseOptions, modifyPlexButton */
function isMovie() {
	return /^(\/\w+)?\/movie\//.test(window.location.pathname);
}

function isShow() {
	return /^(\/\w+)?\/tv-season\//.test(window.location.pathname);
}

function renderPlexButton($parent) {
	if (!$parent) return;

	let existingButton = document.querySelector('a.web-to-plex-button');
	if (existingButton)
		existingButton.remove();

	let el = document.createElement('a');

    el.textContent = 'Web to Plex+';
    el.title = 'Loading...';
	el.classList.add('web-to-plex-button');

	$parent.insertBefore(el, $parent.querySelector('.view-in-itunes ~ *'));
	return el;
}

async function initPlexThingy(type) {
	let $parent = document.querySelector('#left-stack > div'),
        $button = renderPlexButton($parent);

	if (!$button)
		return;

	let meta = [document.querySelector('h1[itemprop="name"], h1'), document.querySelector('.release-date > *:last-child')],
        title = meta[0].textContent.replace(/\s*\((\d+)\)\s*/, '').trim(),
        year = meta[1].textContent.replace(/[^]*(\d{4})[^]*?$/g, '$1').trim();

    let Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

	findPlexMedia({ type, title, year, button: $button, IMDbID, TMDbID, TVDbID });
}

if (isMovie() || isShow()) {
	parseOptions().then(async() => await initPlexThingy(isMovie()? 'movie': 'tv'));
}
