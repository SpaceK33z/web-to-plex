/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
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
			'error',
			'Could not extract title or year from Movieo'
		);

	let title = $title.textContent.trim(),
        year = parseInt($date.textContent.trim()),
        IMDbID = getIMDbID();

	findPlexMedia({ title, year, button: $button, type: 'movie', IMDbID });
}

function renderPlexButton() {
	let $actions = document.querySelector('.js-watch-panel .services');
	if (!$actions)
		return;

	let parentEl = document.createElement('p'),
        el = document.createElement('a');

	parentEl.appendChild(el);
    el.textContent = 'Web to Plex+';
    el.title = 'Loading...';
	el.classList.add('label', 'web-to-plex-button');
	$actions.appendChild(parentEl);
	return el;
}

function getIMDbID() {
	let $link = document.querySelector(
		'.track-event[href^="http://www.imdb.com/title/tt"]'
	);
	if ($link) {
		let link = $link.href.replace('http://www.imdb.com/title/', '');
		return link.replace('/maindetails', '');
	}
}

parseOptions().then(() => {
	init();
});
