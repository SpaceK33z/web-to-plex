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
    el.style.display = 'none';

	$parent.insertBefore(el, $parent.querySelector('.view-in-itunes ~ *'));
	return el;
}

async function initPlexThingy(type) {
	let $parent = document.querySelector('#left-stack > div'),
        $button = renderPlexButton($parent);

	if (!$button)
		return;

	let meta = document.querySelector('h1[itemprop="name"]'),
        title = meta.textContent.replace(/\s*\((\d+)\)\s*/, '').trim(),
        year = +RegExp.$1;

    let Db = await getIDs({ title, year, APIType: type }),
        IMDbID = Db.imdb,
        TVDbID = Db.thetvdb;

	findPlexMedia({ type, title, year, button: $button, IMDbID, TVDbID });
}

if (isMovie() || isShow()) {
	parseOptions().then(async() => await initPlexThingy(isMovie()? 'movie': 'tv'));
}
