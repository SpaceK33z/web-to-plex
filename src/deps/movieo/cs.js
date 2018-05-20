/* global parseOptions, modifyPlexButton, findPlexMedia */
function isMoviePage() {
	let path = window.location.pathname;

	if (!path.startsWith('/movies/'))
		return false;

	// An example movie page: /movies/juno-hpsgt (can also have trailing slash!)
	// Example non-movie page: /movies/watchlist/gbdx
	// So if there is one slash extra (trailing slash not included), it's not a movie page.
	let jup = path.replace('/movies/', '').slice(0, -1);
	return !jup.includes('/');
}

function isMoviePageReady() {
	return !!document.querySelector('.share-box');
}

function init() {
	if (isMoviePage()) {
		if (isMoviePageReady()) {
			initPlexThingy();
		} else {
			// This almost never happens, but sometimes the page is too slow so we need to wait a bit.
			// I could reproduce this by clicking on a movie in the movie watchlist,
			// going back in history and then going forward in history.
			setTimeout(init, 1000);
		}
	}
}

parseOptions().then(() => {
	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	init();
});

function initPlexThingy() {
	let $button = renderPlexButton();
	if (!$button)
		return;

	let $title = document.getElementById('doc_title'),
        $date = document.querySelector('meta[itemprop="datePublished"]');

	if (!$title || !$date)
		return modifyPlexButton(
			$button,
			'error',
			 `Could not extract ${ !$title? 'title': 'year' } from Movieo`
		);

	let title = $title.dataset.title.trim(),
        year = $date.content.slice(0, 4),
        IMDbID = getIMDbID();

	findPlexMedia({ title, year, button: $button, type: 'movie', IMDbID });
}

function renderPlexButton() {
	// The button text in the "Comments" button takes too much place, so we hide it.
	// It's very clear that it's about comments even without the text.
	let $commentText = document.querySelector(
		'.mid-top-actions .comments-link .txt'
	);
	if ($commentText)
		$commentText.remove();

	let $actions = document.querySelector('.mid-top-actions');
	if (!$actions)
		return;

	let $existingEl = document.querySelector('a.web-to-plex-button');
	if ($existingEl)
		$existingEl.remove();

	let el = document.createElement('a');
    el.textContent = 'Web to Plex+';
    el.title = 'Loading...';
	el.classList.add('button', 'comments-link', 'web-to-plex-button');

	$actions.appendChild(el);
	return el;
}

function getIMDbID() {
	let $link = document.querySelector(
		'.tt-parent[href^="http://www.imdb.com/title/tt"]'
	);
	if ($link)
		return $link.href.replace('http://www.imdb.com/title/', '');
}
