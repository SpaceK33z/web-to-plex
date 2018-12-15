/* global findPlexMedia, parseOptions, modifyPlexButton */
function isMovie() {
	return /^(\/\w+)?\/movie\//.test(window.location.pathname);
}

function isShow() {
	return /^(\/\w+)?\/tv-season\//.test(window.location.pathname);
}

let $$ = selector => document.querySelector(selector);

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
    }

    let Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

	findPlexMedia({ type, title, year, image, button, IMDbID, TMDbID, TVDbID });
}

if (isMovie() || isShow()) {
	parseOptions().then(async() => await initPlexThingy(isMovie()? 'movie': 'tv'));
}
