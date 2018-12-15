/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
<<<<<<< HEAD
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
=======
function init() {
	wait(
		() => document.querySelector('.js-watch-panel'),
		initPlexThingy
	);
}

function initPlexThingy() {
	let $button = renderPlexButton();
	if (!$button)
		return;

	let $title = document.querySelector('.headline-1[itemprop="name"]'),
        $date = document.querySelector('small[itemprop="datePublished"]');

	if (!$title || !$date)
		return modifyPlexButton(
			$button,
>>>>>>> Upgrade to v4 (rebased) (#55)
			'error',
			'Could not extract title or year from Movieo'
		);

	let title = $title.textContent.trim(),
        year = $date.textContent.trim(),
<<<<<<< HEAD
        image = ($image || {}).src,
        IMDbID = getIMDbID();

	findPlexMedia({ title, year, button, type: 'movie', IMDbID });
=======
        IMDbID = getIMDbID();

	findPlexMedia({ title, year, button: $button, type: 'movie', IMDbID });
}

function renderPlexButton() {
	let $actions = document.querySelector('.js-watch-panel .services');
	if (!$actions)
		return;

	let parentEl = document.createElement('p'),
        el = document.createElement('a'),
        ch = document.createElement('span');

    ch.classList.add('icon', '-web-to-plex');
    ch.setAttribute('style', `background: url("${ chrome.extension.getURL('img/16.png') }") no-repeat !important`);

    el.textContent = 'Web to Plex';
    el.title = 'Loading...';
	el.classList.add('label', 'web-to-plex-button');

    parentEl.appendChild(ch);
    parentEl.appendChild(el);
	$actions.appendChild(parentEl);

	return el;
>>>>>>> Upgrade to v4 (rebased) (#55)
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

<<<<<<< HEAD
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
=======
parseOptions().then(() => {
	init();
});
>>>>>>> Upgrade to v4 (rebased) (#55)
