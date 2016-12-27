function init() {
	initPlexThingy();
}

function initPlexThingy() {
	const $button = renderPlexButton();
	if (!$button) {
		return;
	}
	const $title = document.querySelector('.headline-1[itemprop="name"]');
	const $date  = document.querySelector('small[itemprop="datePublished"] a');

	if (!$title || !$date) {
		modifyPlexButton($button, 'error', 'Could not extract title or year from Movieo');
		return;
	}
	const title  = $title.textContent.trim();
	const year   = parseInt($date.textContent.trim());
	const imdbId = getImdbId();

	findPlexMedia({ title, year, button: $button, imdbId });
}

function renderPlexButton() {
	// The button text in the "Comments" button takes too much place, so we hide it.
	// It's very clear that it's about comments even without the text.
	const $commentText = document.querySelector('.mid-top-actions .comments-link .txt');
	if ($commentText) {
		$commentText.remove();
	}

	const $actions = document.querySelector('.js-watch-panel');
	if (!$actions) {
		console.log('Could not add Plex button.');
		return null;
	}
	const el = document.createElement('a');
	el.classList.add('button', 'comments-link', 'web-to-plex-button');
	$actions.appendChild(el);
	return el;
}

function getImdbId() {
	const $link = document.querySelector('.track-event[href^="http://www.imdb.com/title/tt"]');
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
