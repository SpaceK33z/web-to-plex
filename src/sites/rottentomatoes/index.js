/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
function init() {
	wait(
		() => (isList()? document.readyState === 'complete': document.querySelector('#reviews')),
		() => (initPlexThingy(isMovie()? 'movie': isShow()? 'show': null) || isList()? initList(): null)
	);
}

function isMovie() {
	return /^\/m/.test(window.location.pathname);
}

function isShow() {
	return /^\/t/.test(window.location.pathname);
}

function isList() {
	return /^\/browse\//i.test(window.location.pathname);
}

async function initPlexThingy(type) {
	let button = renderPlexButton();

	if (!button || !type)
		return /* Fatal Error: Fail Silently */;

	let $title = document.querySelector('.playButton + .title, [itemprop="name"]'),
        $year = (type == 'movie'? $title.nextElementSibling: $title.querySelector('.subtle')),
        $image = document.querySelector('[class*="posterimage" i]');

	if (!$title || !$year)
		return modifyPlexButton(
			button,
			'error',
			'Could not extract title or year from Rotten Tomatoes'
		);

	let title = $title.textContent.trim().replace(/(.+)\:[^]*$/, type == 'movie'? '$&': '$1'),
        year = $year.textContent.replace(/\D+/g, '').trim(),
        image = ($image || {}).srcset,
        Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

	if (image)
		image = image.replace(/([^\s]+)[^]*/, '$1');

	findPlexMedia({ title, year, image, button, type, IMDbID, TMDbID, TVDbID });
}

async function addInListItem(element) {
	let $title = element.querySelector('.movieTitle'),
        $image = element.querySelector('.poster'),
		$type  = element.querySelector('[href^="/m/"], [href^="/t/"]');

	if (!$title)
		return;

	let title = $title.textContent.trim(),
        image = $image.src,
		type  = /\/([mt])\//i.test($type.href)? RegExp.$1 == 'm'? 'movie': 'show': null;

	if(!type)
		return {};
	if(type == 'show')
		title = title.replace(/\s*\:\s*seasons?\s+\d+\s*/i, '');

    let Db = await getIDs({ type, title }),
		IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb,
		year = Db.year;

    title = title || Db.title;

	return { type, title, year, image, IMDbID, TMDbID, TVDbID };
}

function initList() {
	let $listItems = document.querySelectorAll('.mb-movie'),
        button = renderPlexButton(true),
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

parseOptions().then(init);
