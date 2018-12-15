/* global findPlexMedia, parseOptions, modifyPlexButton */
function isMovie() {
	return /^(\/\w+)?\/movie\//.test(window.location.pathname);
}

function isShow() {
	return /^(\/\w+)?\/tv-season\//.test(window.location.pathname);
}

let $$ = selector => document.querySelector(selector);

<<<<<<< HEAD
async function initPlexThingy(type) {
    let title, year, image, button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

    if(type == 'movie') {
        let $title = $$('[class*="movie-header__title"]'),
            $year = $$('[datetime]'),
            $image = $$('[class*="product"] ~ * picture img');

        title = $title.textContent;
        year = +$year.textContent;
        image = ($image || {}).src;
    } else {
        let meta = [$$('h1[itemprop="name"], h1'), $$('.release-date > *:last-child'), $$('[class*="product"] ~ * picture img')];

        title = meta[0].textContent.replace(/\s*\((\d+)\)\s*/, '').trim();
        year = meta[1].textContent.replace(/[^]*(\d{4})[^]*?$/g, '$1').trim();
        image = meta[2].src;
=======
function renderPlexButton($parent, type) {
	if (!$parent) return;

	let existingButton = $$('a.web-to-plex-button');
	if (existingButton)
		existingButton.remove();

	let el = document.createElement('a'),
        pa = document.createElement('p'),
        ma = document.createElement('div');

    el.textContent = 'Web to Plex';
    el.title = 'Loading...';
	el.classList.add('web-to-plex-button', type);

    if(type == 'movie') {
        $parent.appendChild(pa);
        pa.classList.add('product-header__routes__cta');
        pa.appendChild(ma);
        ma.classList.add('we-button', 'we-button--outlined', 'we-button--external', 'we-button-fade-in', 'ember-view', 'web-to-plex-container');
        ma.appendChild(el);
    } else {
        $parent.insertBefore(el, $parent.querySelector('.view-in-itunes ~ *'));
    }

	return el;
}

async function initPlexThingy(type) {
    let title, year, button;

    if(type == 'movie') {
        let $parent = $$('.product-header'),
            $button = renderPlexButton($parent, type),
            $title = $$('[class*="movie-header__title"]'),
            $year = $$('[datetime]');

        if (!$button)
            return;

        button = $button;
        title = $title.textContent;
        year = +$year.textContent;
    } else {
        let $parent = $$('#left-stack > div'),
            $button = renderPlexButton($parent, type);

        if (!$button)
            return;

        let meta = [$$('h1[itemprop="name"], h1'), $$('.release-date > *:last-child')];

        button = $button;
        title = meta[0].textContent.replace(/\s*\((\d+)\)\s*/, '').trim();
        year = meta[1].textContent.replace(/[^]*(\d{4})[^]*?$/g, '$1').trim();
>>>>>>> Upgrade to v4 (rebased) (#55)
    }

    let Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

<<<<<<< HEAD
	findPlexMedia({ type, title, year, image, button, IMDbID, TMDbID, TVDbID });
=======
	findPlexMedia({ type, title, year, button, IMDbID, TMDbID, TVDbID });
>>>>>>> Upgrade to v4 (rebased) (#55)
}

if (isMovie() || isShow()) {
	parseOptions().then(async() => await initPlexThingy(isMovie()? 'movie': 'tv'));
}
