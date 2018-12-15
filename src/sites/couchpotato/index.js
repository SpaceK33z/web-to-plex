/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
function init() {
	wait(
<<<<<<< HEAD
		() => document.querySelector('.media-body .clearfix') && document.querySelector('.media-body .clearfix').children.length > 1,
=======
		() => document.querySelector('.media-body .clearfix').children.length > 1,
>>>>>>> Upgrade to v4 (rebased) (#55)
		() => initPlexThingy(isMovie()? 'movie': 'show')
	);
}

function isMovie() {
	return /^\/movies?\//.test(window.location.pathname);
}

function isShow() {
	return /^\/shows?\//.test(window.location.pathname);
}

function initPlexThingy(type) {
<<<<<<< HEAD
	let button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

	let $title = document.querySelector('[itemprop="description"]'),
        $date = $title.previousElementSibling,
        $image = document.querySelector('img[src*="wp-content"]');
=======
	let $button = renderPlexButton();
	if (!$button)
		return;

	let $title = document.querySelector('[itemprop="description"]'),
        $date = $title.previousElementSibling;
>>>>>>> Upgrade to v4 (rebased) (#55)

	if (!$title || !$date)
		return modifyPlexButton(
			$button,
			'error',
			'Could not extract title or year from CouchPotato'
		);

	let title = $title.textContent.trim(),
        year = $date.textContent.trim(),
<<<<<<< HEAD
        image = ($image || {}).src,
        IMDbID = getIMDbID();

	findPlexMedia({ title, year, image, button, type, IMDbID });
=======
        IMDbID = getIMDbID();

	findPlexMedia({ title, year, button: $button, type, IMDbID });
}

function renderPlexButton() {
	let $actions = document.querySelector('[href*="imdb.com/title/tt"]').parentElement;
	if (!$actions)
		return;

	let pa = document.createElement('span'),
        el = document.createElement('a'),
        ch = document.createElement('img');

    ch.setAttribute('src', chrome.extension.getURL('img/16.png'));
    pa.classList.add('web-to-plex--container');

    el.textContent = 'W2P';
    el.title = 'Loading...';
	el.classList.add('web-to-plex-button');

    pa.appendChild(ch);
	pa.appendChild(el);
    $actions.appendChild(pa);

	return el;
>>>>>>> Upgrade to v4 (rebased) (#55)
}

function getIMDbID() {
	let $link = document.querySelector(
		'[href*="imdb.com/title/tt"]'
	);
	if ($link) {
		let link = $link.href.replace(/^.*imdb\.com\/title\//, '');
		return link.replace(/\/(?:maindetails\/?)?$/, '');
	}
}

parseOptions().then(init);
