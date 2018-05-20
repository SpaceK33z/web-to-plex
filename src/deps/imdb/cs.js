/* global findPlexMedia, parseOptions, modifyPlexButton */
function isMovie() {
	let tag = document.querySelector('meta[property="og:type"]');
	return tag && tag.content === 'video.movie';
}

function isShow() {
	let tag = document.querySelector('meta[property="og:type"]');
	return tag && tag.content === 'video.tv_show';
}

function isList() {
	return window.location.pathname.startsWith('/list/');
}

function getIMDbID() {
	let tag = document.querySelector('meta[property="pageId"]');
	return tag ? tag.content : undefined;
}

let IMDbID = getIMDbID();

function cleanYear(year) {
	// The year can contain `()`, so we need to strip it out.
	return parseInt(year.trim().replace(/^\(|\)$/g, ''));
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

	$parent.appendChild(el);
	return el;
}

function initPlexMovie() {
	let $parent = document.querySelector('.plot_summary'),
        $button = renderPlexButton($parent);

	if (!$button)
		return;

	let $title = document.querySelector('.title_wrapper h1'),
	    $year = document.querySelector('.title_wrapper #titleYear'),
	// TODO: Hmm there should be a less risky way...
        title = $title.childNodes[0].textContent.trim(),
        year = cleanYear($year.textContent);

	findPlexMedia({ type: 'movie', title, year, button: $button, IMDbID });
}

async function initPlexShow() {
	let $parent = document.querySelector('.plot_summary'),
        $button = renderPlexButton($parent);

	if (!$button)
		return;
  
	let $title = document.querySelector('.title_wrapper h1'),
        date = document.querySelector('title').textContent,
        dateMatch = date.match(/Series\s+(\d{4})/);

	if (!$title || !dateMatch)
		return modifyPlexButton($button, 'error', `Could not extract ${ !$title? 'title': 'year' } from IMDb`);

	let title = $title.textContent.trim(),
        year = dateMatch[1],
        Db = await getIDs({ title, year, IMDbID }),
        TVDbID = Db.thetvdb;

    IMDbID = IMDbID || Db.imdb;

	findPlexMedia({ type: 'show', title, year, button: $button, IMDbID, TVDbID });
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
