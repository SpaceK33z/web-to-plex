/* global findPlexMedia, parseOptions, modifyPlexButton */
function isMovie() {
	let tag = $$('meta[property="og:type"]');
	return tag && tag.content === 'video.movie';
}

function isShow() {
	let tag = $$('meta[property="og:type"]');
	return tag && tag.content === 'video.tv_show';
}

function isList() {
	return window.location.pathname.startsWith('/list/');
}

function getIMDbID() {
	let tag = $$('meta[property="pageId"]');
	return tag ? tag.content : undefined;
}

let $$ = (selector, index = 0) => document.queryBy(selector)[index],
    IMDbID = getIMDbID(),
    usa = /\b(USA?|United\s+States)\b/i;

function cleanYear(year) {
	// The year can contain `()`, so we need to strip it out.
	return parseInt(year.trim().replace(/^\(|\)$/g, ''));
}

async function initPlexMovie() {
	let $parent = $$('.plot_summary'),
        button = renderPlexButton(),
        type = 'movie';

	if (!button)
		return /* Fatal Error: Fail Silently */;

	let $title = $$('.originalTitle, .title_wrapper h1'),
        $altname = $$('.title_wrapper h1'),
        $date = $$('.title_wrapper [href*="/releaseinfo"]'),
	    $year = $$('.title_wrapper #titleYear'),
        $image = $$('img[alt$="poster" i]'),
	// TODO: Hmm there should be a less risky way...
        title = $title.childNodes[0].textContent.trim(),
        altname = ($altname == $title? title: $altname.childNodes[0].textContent.trim()),
        country = $date.innerText.replace(/[^]+\((\w+)\)[^]*?$/, '$1'),
        year = cleanYear($year.textContent),
        image = $image.src;
    title = usa.test(country)? title: altname;

    let Db = await getIDs({ title, year, type, IMDbID }),
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    IMDbID = IMDbID || Db.imdb;
    title = Db.title;
    year = Db.year;

	findPlexMedia({ type, title, year, image, button, IMDbID, TMDbID, TVDbID });
}

async function initPlexShow() {
	let $parent = $$('.plot_summary'),
        button = renderPlexButton(),
        type = 'show';

	if (!button)
		return /* Fatal Error: Fail Silently */;
  
	let $title = $$('.originalTitle, .title_wrapper h1'),
        $altname = $$('.title_wrapper h1'),
        $date = $$('.title_wrapper [href*="/releaseinfo"]'),
        date = $$('title').textContent,
        dateMatch = date.match(/Series\s+(\d{4})/i),
        $image = $$('img[alt$="poster" i]');

	if (!($title || $altname) || !dateMatch)
		return modifyPlexButton(button, 'error', `Could not extract ${ !($title || $altname)? 'title': 'year' } from IMDb`);

	let title = $title.textContent.trim(),
        altname = ($altname == $title? title: $altname.childNodes[0].textContent.trim()),
        country = $date.innerText.replace(/[^]+\((\w+)\)[^]*?$/, '$1'),
        year = dateMatch[1],
        image = $image.src;
    title = usa.test(country)? title: altname;

    let Db = await getIDs({ title, year, type, IMDbID }),
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    IMDbID = IMDbID || Db.imdb;
    title = Db.title;
    year = Db.year;

	findPlexMedia({ type, title, year, button, IMDbID, TMDbID, TVDbID });
}

function addInListItem(el) {
	let button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

	let $IMDbID = el.querySelector('.wlb_lite'),
        $title = el.querySelector('.info b a'),
        $date = el.querySelector('.info .year_type');

	if (!$IMDbID || !$title || !$date)
		return modifyPlexButton(button, 'error', 'Could not extract title or year'), showNotification('warning', 'Failed to process list');

	let type = ($date.textContent.includes('TV Series') ? 'show' : 'movie'),
        title = $title.textContent.trim(),
        year = cleanYear($date.textContent),
        IMDbID = $IMDbID.dataset.tconst;

	findPlexMedia({ type, title, year, button, IMDbID });
}

function initList() {
	let $listItems = document.querySelectorAll('#main [class*="list"][class*="item"]');

	$listItems.forEach(addInListItem);
}

let init = () => {
    if (((isMovie() || isShow()) && IMDbID) || isList()) {
        parseOptions().then(async() => {
            if (isMovie())
                await initPlexMovie();
            else if (isShow())
                await initPlexShow();
            else
                initList();
        });
    }
}

init();
