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
	return year.replace(/^\(|\)$/g, '').trim();
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
        year = +cleanYear($year.textContent),
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
        year = parseInt(dateMatch[1]),
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

    save(`${title} (${year}).imdb`, { type, title, year, imdb: IMDbID, tmdb: TMDbID, tvdb: TVDbID });
    save(`${title}.imdb`, +year);
    terminal.log(`Saved as "${title} (${year}).imdb"`);

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
