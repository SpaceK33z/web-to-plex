/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
function init() {
	wait(
		() => document.querySelector('.media-body .clearfix') && document.querySelector('.media-body .clearfix').children.length > 1,
		() => initPlexThingy(isMovie()? 'movie': isShow()? 'show': null)
	);
}

function isMovie() {
	return /^\/movies?\//.test(window.location.pathname);
}

function isShow() {
	return /^\/shows?\//.test(window.location.pathname);
}

function initPlexThingy(type) {
	let button = renderPlexButton();

	if (!button || !type)
		return /* Fatal Error: Fail Silently */;

	let $title = document.querySelector('[itemprop="description"]'),
        $date = $title.previousElementSibling,
        $image = document.querySelector('img[src*="wp-content"]');

	if (!$title || !$date)
		return modifyPlexButton(
			$button,
			'error',
			'Could not extract title or year from CouchPotato'
		);

	let title = $title.textContent.trim(),
        year = $date.textContent.trim(),
        image = ($image || {}).src,
        IMDbID = getIMDbID();

	findPlexMedia({ title, year, image, button, type, IMDbID });
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
