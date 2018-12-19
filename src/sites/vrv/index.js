/* global findPlexMedia, parseOptions, modifyPlexButton */
function isShowPage() {
	// An example movie page: /series/GR75MN7ZY/Deep-Space-69-Unrated
	return /^\/(?:series|watch)\//.test(window.location.pathname);
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
		if (isShowPage())
			initPlexThingy();
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

async function initPlexThingy() {
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
	    Db = await getIDs({ title, year, APIType: 'tv' }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = title || Db.title;
    year = year || Db.year;

	findPlexMedia({ title, year, image, button, type: 'show', IMDbID, TMDbID, TVDbID });
}

async function addInListItem(element) {
	let $title = element.querySelector('.info > *'),
        $image = element.querySelector('.poster-image img');

	if (!$title)
		return;

	let title = $title.textContent.trim(),
        image = $image.src,
		type = 'show', /* there are a few movies, but f*ck figuring that out here */
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
                    squabblePlex(options, button);
            }, 50);
    });
}
