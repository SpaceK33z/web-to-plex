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

function renderPlexButton($parent) {
	if (!$parent) return;

	let existingButton = $$('a.web-to-plex-button');
	if (existingButton)
		existingButton.remove();

	let el = document.createElement('a');

    el.textContent = 'Web to Plex';
    el.title = 'Loading...';
	el.classList.add('web-to-plex-button');

	$parent.appendChild(el);
	return el;
}

async function initPlexMovie() {
	let $parent = $$('.plot_summary'),
        $button = renderPlexButton($parent),
        type = 'movie';

	if (!$button)
		return;

	let $title = $$('.originalTitle, .title_wrapper h1'),
        $altname = $$('.title_wrapper h1'),
        $date = $$('.title_wrapper [href*="/releaseinfo"]'),
	    $year = $$('.title_wrapper #titleYear'),
	// TODO: Hmm there should be a less risky way...
        title = $title.childNodes[0].textContent.trim(),
        altname = ($altname == $title? null: $altname.childNodes[0].textContent.trim()),
        country = $date.innerText.replace(/[^]+\((\w+)\)[^]*?$/, '$1'),
        year = cleanYear($year.textContent);
    title = usa.test(country)? title: altname;

    let Db = await getIDs({ title, year, type, IMDbID }),
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    IMDbID = IMDbID || Db.imdb;
    title = Db.title;
    year = Db.year;

	findPlexMedia({ type, title, year, button: $button, IMDbID, TMDbID, TVDbID });
}

async function initPlexShow() {
	let $parent = $$('.plot_summary'),
        $button = renderPlexButton($parent),
        type = 'show';

	if (!$button)
		return;
  
	let $title = $$('.originalTitle, .title_wrapper h1'),
        $altname = $$('.title_wrapper h1'),
        $date = $$('.title_wrapper [href*="/releaseinfo"]'),
        date = $$('title').textContent,
        dateMatch = date.match(/Series\s+(\d{4})/);

	if (!($title || $altname) || !dateMatch)
		return modifyPlexButton($button, 'error', `Could not extract ${ !($title || $altname)? 'title': 'year' } from IMDb`);

	let title = $title.textContent.trim(),
        altname = ($altname == $title? null: $altname.childNodes[0].textContent.trim()),
        country = $date.innerText.replace(/[^]+\((\w+)\)[^]*?$/, '$1'),
        year = dateMatch[1];
    title = usa.test(country)? title: altname;

    let Db = await getIDs({ title, year, type, IMDbID }),
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    IMDbID = IMDbID || Db.imdb;
    title = Db.title;
    year = Db.year;

	findPlexMedia({ type, title, year, button: $button, IMDbID, TMDbID, TVDbID });
}

function addInListItem(el) {
	let $parent = el.querySelector('.button_strip'),
        $button = renderPlexButton($parent);

	if (!$button)
		return;

	let $IMDbID = el.querySelector('.wlb_lite'),
        $title = el.querySelector('.info b a'),
        $date = el.querySelector('.info .year_type');

	if (!$IMDbID || !$title || !$date)
		return modifyPlexButton($button, 'error', 'Could not extract title or year');

	let type = ($date.textContent.includes('TV Series') ? 'show' : 'movie'),
        title = $title.textContent.trim(),
        year = cleanYear($date.textContent),
        IMDbID = $IMDbID.dataset.tconst;

	findPlexMedia({ type, title, year, button: $button, IMDbID });
}

function initList() {
	let $listItem = document.querySelectorAll('#main .list_item');

	$listItem.forEach(addInListItem);
}

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
