/* global findPlexMedia, parseOptions, modifyPlexButton */
function isShow() {
	// An example movie page: /series/GR75MN7ZY/Deep-Space-69-Unrated
	return /^\/(?:series)\//.test(window.location.pathname) || (/^\/(?:watch)\//.test(window.location.pathname) && document.querySelector('.content .series'));
}

function isMovie() {
	return /^\/(?:watch)\//.test(window.location.pathname) && !document.querySelector('.content .series');
}

function isPageReady() {
    let img = document.querySelector('.h-thumbnail > img'),
		pre = document.querySelector('#content .content .card');
	return isList()? pre && pre.textContent: img && img.src;
}

function isList() {
	return /\/(watchlist)\b/i.test(window.location.pathname);
}

function init() {
	if (isPageReady()) {
		if (isShow())
			initPlexThingy('show');
		else if (isMovie())
			initPlexThingy('movie');
		else if(isList())
			initList();
	} else {
		// This almost never happens, but sometimes the page is too slow so we need to wait a bit.
		setTimeout(init, 1000);
	}
}

parseOptions().then(() => {
	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	(window.onlocationchange = init)();
});

async function initPlexThingy(type) {
	let button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

	let $title = document.querySelector('.series, [class*="video"] .title, [class*="series"] .title'),
        $year = document.querySelector('.additional-information-item'),
        $image = document.querySelector('[class*="poster"][class*="wrapper"] img');

	if (!$title)
		return modifyPlexButton(
			button,
			'error',
			 `Could not extract title from VRV`
		),
          null;

	let title = $title.innerText.replace(/(unrated|mature|tv-?\d{1,2})\s*$/i, '').trim(),
        year = $year? $year.textContent.replace(/.+(\d{4}).*/, '$1').trim(): 0,
        image = ($image || {}).src,
	    Db = await getIDs({ type, title, year }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = title || Db.title;
    year = year || Db.year;

	findPlexMedia({ type, title, year, image, button, IMDbID, TMDbID, TVDbID });
}

async function addInListItem(element) {
	let $title = element.querySelector('.info > *'),
        $image = element.querySelector('.poster-image img'),
		$type = element.querySelector('.info [class*="series"], .info [class*="movie"]');

	if (!$title || !$type)
		return;

	let title = $title.textContent.trim(),
        image = $image.src,
		type  = $type.getAttribute('class').replace(/[^]*(movie|series)[^]*/, '$1'),
		year;

    let Db = await getIDs({ type, title }),
		IMDbID = Db.imdb,
		TMDbID = Db.tmdb,
        TVDbID = +Db.tvdb;

    title = title || Db.title;
    year = Db.year;

	return { type, title, year, image, IMDbID, TMDbID, TVDbID };
}

function initList() {
	let $listItems = document.querySelectorAll('#content .content .card'),
        button = renderPlexButton(),
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
