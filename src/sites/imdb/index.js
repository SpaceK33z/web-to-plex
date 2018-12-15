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
<<<<<<< HEAD
	return year.replace(/^\(|\)$/g, '').trim();
=======
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
>>>>>>> Upgrade to v4 (rebased) (#55)
}

async function initPlexMovie() {
	let $parent = $$('.plot_summary'),
<<<<<<< HEAD
        button = renderPlexButton(),
        type = 'movie';

	if (!button)
		return /* Fatal Error: Fail Silently */;
=======
        $button = renderPlexButton($parent),
        type = 'movie';

	if (!$button)
		return;
>>>>>>> Upgrade to v4 (rebased) (#55)

	let $title = $$('.originalTitle, .title_wrapper h1'),
        $altname = $$('.title_wrapper h1'),
        $date = $$('.title_wrapper [href*="/releaseinfo"]'),
	    $year = $$('.title_wrapper #titleYear'),
<<<<<<< HEAD
        $image = $$('img[alt$="poster" i]'),
	// TODO: Hmm there should be a less risky way...
        title = $title.childNodes[0].textContent.trim(),
        altname = ($altname == $title? title: $altname.childNodes[0].textContent.trim()),
        country = $date.innerText.replace(/[^]+\((\w+)\)[^]*?$/, '$1'),
        year = +cleanYear($year.textContent),
        image = ($image || {}).src;
=======
	// TODO: Hmm there should be a less risky way...
        title = $title.childNodes[0].textContent.trim(),
        altname = ($altname == $title? null: $altname.childNodes[0].textContent.trim()),
        country = $date.innerText.replace(/[^]+\((\w+)\)[^]*?$/, '$1'),
        year = cleanYear($year.textContent);
>>>>>>> Upgrade to v4 (rebased) (#55)
    title = usa.test(country)? title: altname;

    let Db = await getIDs({ title, year, type, IMDbID }),
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    IMDbID = IMDbID || Db.imdb;
    title = Db.title;
    year = Db.year;

<<<<<<< HEAD
	findPlexMedia({ type, title, year, image, button, IMDbID, TMDbID, TVDbID });
=======
	findPlexMedia({ type, title, year, button: $button, IMDbID, TMDbID, TVDbID });
>>>>>>> Upgrade to v4 (rebased) (#55)
}

async function initPlexShow() {
	let $parent = $$('.plot_summary'),
<<<<<<< HEAD
        button = renderPlexButton(),
        type = 'show';

	if (!button)
		return /* Fatal Error: Fail Silently */;
=======
        $button = renderPlexButton($parent),
        type = 'show';

	if (!$button)
		return;
>>>>>>> Upgrade to v4 (rebased) (#55)
  
	let $title = $$('.originalTitle, .title_wrapper h1'),
        $altname = $$('.title_wrapper h1'),
        $date = $$('.title_wrapper [href*="/releaseinfo"]'),
        date = $$('title').textContent,
<<<<<<< HEAD
        dateMatch = date.match(/Series\s*\(?(\d{4})(?:[^\)]+\))?/i),
        $image = $$('img[alt$="poster" i]');

	if (!($title || $altname) || !dateMatch)
		return modifyPlexButton(button, 'error', `Could not extract ${ !($title || $altname)? 'title': 'year' } from IMDb`);

	let title = $title.textContent.trim(),
        altname = ($altname == $title? title: $altname.childNodes[0].textContent.trim()),
        country = $date.innerText.replace(/[^]+\((\w+)\)[^]*?$/, '$1'),
        year = parseInt(dateMatch[1]),
        image = ($image || {}).src;
=======
        dateMatch = date.match(/Series\s+(\d{4})/);

	if (!($title || $altname) || !dateMatch)
		return modifyPlexButton($button, 'error', `Could not extract ${ !($title || $altname)? 'title': 'year' } from IMDb`);

	let title = $title.textContent.trim(),
        altname = ($altname == $title? null: $altname.childNodes[0].textContent.trim()),
        country = $date.innerText.replace(/[^]+\((\w+)\)[^]*?$/, '$1'),
        year = dateMatch[1];
>>>>>>> Upgrade to v4 (rebased) (#55)
    title = usa.test(country)? title: altname;

    let Db = await getIDs({ title, year, type, IMDbID }),
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    IMDbID = IMDbID || Db.imdb;
    title = Db.title;
    year = Db.year;

<<<<<<< HEAD
    let savename = title.toLowerCase();

    save(`${savename} (${year}).imdb`, { type, title, year, imdb: IMDbID, tmdb: TMDbID, tvdb: TVDbID });
    save(`${savename}.imdb`, +year);
    terminal.log(`Saved as "${savename} (${year}).imdb"`);

	findPlexMedia({ type, title, year, button, IMDbID, TMDbID, TVDbID });
}

async function addInListItem(element) {
	let $title = element.querySelector('.col-title a'),
        $date = element.querySelector('.col-title a + *'),
        $image = element.querySelector('img.loadlate, img[data-tconst]'),
        $IMDbID = $title;

	if (!$title || !$date)
		return;

	let title = $title.textContent.trim(),
        year = cleanYear($date.textContent),
        image = $image.src,
        IMDbID = $IMDbID.href.replace(/.*\/(tt\d+)\b.*$/, '$1'),
        type = (/[\-\u2013]$/.test(year) ? 'show' : 'movie');
    year = parseInt(year);

    let Db = await getIDs({ type, title, year, IMDbID }),
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = title || Db.title;
    year = year || Db.year;

    let savename = title.toLowerCase();

    save(`${savename} (${year}).imdb`, { type, title, year, imdb: IMDbID, tmdb: TMDbID, tvdb: TVDbID });
    save(`${savename}.imdb`, +year);
    terminal.log(`Saved as "${savename} (${year}).imdb"`);

	return { type, title, year, image, IMDbID, TMDbID, TVDbID };
}

function initList() {
	let $listItems = document.querySelectorAll('#main .lister-item'),
        button = renderPlexButton(),
        options = [], length = $listItems.length - 1;

    if (!/&mode=simple/i.test(location.search))
        return location.search = location.search.replace(/&mode=\w+/, '&mode=simple');

	if (!button)
		return /* Fatal Error: Fail Silently */;

	$listItems.forEach(async(element, index, array) => {
        let option = await addInListItem(element);

        if(option)
            options.push(option);

        if(index == length)
            setTimeout(() => {
                if (!options.length)
                    new Notification('error', 'Failed to process list');
                else
                    squabblePlex(options, button);
            }, 50);
    });
}

let init = () => {
    if (((isMovie() || isShow()) && IMDbID) || isList()) {
        parseOptions().then(async() => {
            if (isMovie())
                await initPlexMovie();
            else if (isShow())
                await initPlexShow();
            else
                await initList();
        });
    }
}

init();
=======
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
>>>>>>> Upgrade to v4 (rebased) (#55)
