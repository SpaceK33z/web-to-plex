/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
function init() {
	wait(
		() => document.querySelector('.js-watch-panel'),
		() => {
			initPlexThingy();
		}
	);
}

function initPlexThingy() {
	const $button = renderPlexButton();
	if (!$button) {
		return;
	}
	const $title = document.querySelector('.headline-1[itemprop="name"]');
	const $date = document.querySelector('small[itemprop="datePublished"]');

	if (!$title || !$date) {
		modifyPlexButton(
			$button,
			'error',
			'Could not extract title or year from Movieo'
		);
		return;
	}
	const title = $title.textContent.trim();
	const year = parseInt($date.textContent.trim());
	const imdbId = getImdbId();

	findPlexMedia({ title, year, button: $button, imdbId });
}

function renderPlexButton() {
	const $actions = document.querySelector('.js-watch-panel .services');
	if (!$actions) {
		console.log('Could not add Plex button.');
		return null;
	}
	const parentEl = document.createElement('p');
	const el = document.createElement('a');
	parentEl.appendChild(el);
	el.classList.add('label', 'web-to-plex-button');

	$actions.appendChild(parentEl);
	return el;
}

function getImdbId() {
	const $link = document.querySelector(
		'.track-event[href^="http://www.imdb.com/title/tt"]'
	);
	if ($link) {
		const link = $link.href.replace('http://www.imdb.com/title/', '');
		return link.replace('/maindetails', '');
	}
	return null;
}

parseOptions().then(() => {
	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	init();
});
