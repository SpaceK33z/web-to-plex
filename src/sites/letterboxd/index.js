/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
function init() {
	wait(
		() => document.querySelector('.js-watch-panel'),
		initPlexThingy
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

parseOptions().then(() => {
	init();
});
