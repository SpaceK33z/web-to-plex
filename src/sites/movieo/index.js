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
	let button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

	let $title = document.querySelector('#doc_title'),
        $date = document.querySelector('meta[itemprop="datePublished"]'),
        $image = document.querySelector('img.poster');

	if (!$title || !$date)
		return modifyPlexButton(
			button,
			'error',
			 `Could not extract ${ !$title? 'title': 'year' } from Movieo`
		);

	let title = $title.dataset.title.trim(),
        year = $date.content.slice(0, 4),
        image = $image.src,
        IMDbID = getIMDbID();

	findPlexMedia({ title, year, button, image, type: 'movie', IMDbID });
}

function getIMDbID() {
	let $link = document.querySelector(
		'.tt-parent[href*="imdb.com/title/tt"]'
	);
	if ($link)
		return $link.href.replace(/^.*imdb\.com\/title\//, '');
}
