/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
function isList() {
	return /\/list\//i.test(window.location.pathname);
}

let START = +(new Date);

function init() {
    if(/\/(film|list)\//i.test(window.location.pathname))
        wait(
            () => (isList()? +(new Date) - START > 500: document.querySelector('.js-watch-panel')),
            () => ((isList()? initList: initPlexThingy)())
        );
}

function initPlexThingy() {
	let button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

	let $title = document.querySelector('.headline-1[itemprop="name"]'),
        $date = document.querySelector('small[itemprop="datePublished"]'),
        $image = document.querySelector('.image');

	if (!$title || !$date)
		return modifyPlexButton(
			button,
			'error',
			'Could not extract title or year from Movieo'
		);

	let title = $title.textContent.trim(),
        year = $date.textContent.trim(),
        image = $image.src,
        IMDbID = getIMDbID();

	findPlexMedia({ title, year, button, type: 'movie', IMDbID });
}

function getIMDbID() {
	let $link = document.querySelector(
		'.track-event[href*="imdb.com/title/tt"]'
	);
	if ($link) {
		let link = $link.href.replace(/^.*imdb\.com\/title\//, '');
		return link.replace(/\/(?:maindetails\/?)?$/, '');
	}
}

async function addInListItem(element) {
	let $title = element.querySelector('.frame-title'),
        $image = element.querySelector('img');

	if (!$title)
		return;

	let title = $title.textContent.replace(/\((\d+)\)/, '').trim(),
        year = +RegExp.$1,
        image = $image.src,
        type = 'movie';

    let Db = await getIDs({ type, title, year }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = title || Db.title;
    year = year || Db.year;

	return { type, title, year, image, IMDbID, TMDbID, TVDbID };
}

function initList() {
	let $listItems = document.querySelectorAll('.poster-list .poster-container'),
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
                terminal.log(options)
                if (!options.length)
                    new Notification('error', 'Failed to process list');
                else
                    squabblePlex(options, button);
            }, 50);
    });
}

parseOptions().then(init);
