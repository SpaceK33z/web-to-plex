/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
function init() {
	wait(
		() => document.readyState === 'complete',
		() => (initPlexThingy(isMovie()? 'movie': isShow()? 'tv': null) || isList()? initList(): null)
	);
}

function isMovie() {
	return /\/movie\/\d+/i.test(window.location.pathname);
}

function isShow() {
	return /\/tv\/\d+/i.test(window.location.pathname);
}

function isList() {
	return /(^\/discover\/|\/(movie|tv)\/([^\d]+|\B))/i.test(window.location.pathname);
}

async function initPlexThingy(type) {
	let button = renderPlexButton();

	if (!button || !type)
		return /* Fatal Error: Fail Silently */;

	let $title = document.querySelector('.title > span > *:not(.release_date)'),
        $date = document.querySelector('.title .release_date'),
        $image = document.querySelector('img.poster');

	if (!$title || !$date)
		return modifyPlexButton(
			button,
			'error',
			 `Could not extract ${ !$title? 'title': 'year' } from TheMovieDb`
		);

	let title = $title.textContent.trim(),
        year = $date.textContent.trim(),
        image = ($image || {}).src,
        apid = window.location.pathname.replace(/\/(?:movie|tv)\/(\d+).*/, '$1');

    type = type == 'movie'? 'movie': 'show';

    let Db = await getIDs({ title, year, TMDbID: apid, APIType: type, APIID: apid }),
        IMDbID = Db.imdb,
        TMDbID = +Db.tmdb,
        TVDbID = +Db.tvdb;

    title = Db.title;
    year = Db.year;

	let savename = title.toLowerCase(),
		cached = await load(`${savename}.tmdb`);

	if(!cached) {
	    save(`${savename} (${year}).tmdb`, { type, title, year, imdb: IMDbID, tmdb: TMDbID, tvdb: TVDbID });
	    save(`${savename}.tmdb`, +year);
	    terminal.log(`Saved as "${savename} (${year}).tmdb"`);
	}

	findPlexMedia({ title, year, image, button, type, IMDbID, TMDbID, TVDbID });
}

async function addInListItem(element) {
	let $title = element.querySelector('.title'),
        $date = element.querySelector('.title + *'),
        $image = element.querySelector('.poster'),
		$type = $title.id.split('_');

	if (!$title || !$date)
		return;

	let title = $title.textContent.trim(),
        year = $date.textContent,
        image = $image.src,
        type = ($type[0] == 'movie'? 'movie': 'show'),
		TMDbID = +$type[1];

    let Db = await getIDs({ type, title, year, TMDbID, APIType: type, APIID: TMDbID }),
		IMDbID = Db.imdb,
        TVDbID = +Db.tvdb;

    title = title || Db.title;
    year = +year || Db.year;

    let savename = title.toLowerCase(),
		cached = await load(`${savename}.tmdb`);

	if(!cached) {
	    save(`${savename} (${year}).tmdb`, { type, title, year, imdb: IMDbID, tmdb: TMDbID, tvdb: TVDbID });
	    save(`${savename}.tmdb`, +year);
	    terminal.log(`Saved as "${savename} (${year}).tmdb"`);
	}

	return { type, title, year, image, IMDbID, TMDbID, TVDbID };
}

function initList() {
	let $listItems = document.querySelectorAll('.item.card'),
        button = renderPlexButton(true), /* see if a button was already created */
        options = [], length = $listItems.length - 1;

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
                    squabblePlexMedia(options, button);
            }, 50);
    });
}

parseOptions().then(() => {
	init();
});
