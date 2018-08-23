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
        year = $date.textContent.trim(),
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
