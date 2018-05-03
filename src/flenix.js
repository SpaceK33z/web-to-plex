/* global parseOptions, modifyPlexButton, findPlexMedia */
function isMoviePage() {
	const path = window.location.pathname;
	if (!path.startsWith('/movies/')) {
		return false;
	}
	// An example movie page: /movies/juno-hpsgt (can also have trailing slash!)
	// Example non-movie page: /movies/watchlist/gbdx
	// So if there is one slash extra (trailing slash not included), it's not a movie page.
	const jup = path.replace('/movies/', '').slice(0, -1);
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
			setTimeout(() => {
				initPlexThingy();
			}, 1000);
		}
	}
}

parseOptions().then(() => {
	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	init();
});

function initPlexThingy() {
	const $button = renderPlexButton();
	if (!$button) {
		return;
	}
	const $title = document.querySelector('#dle-content .about > h1');
	const $date = document.querySelector('.features > .reset:nth-child(2) a');
	if (!$title || !$date) {
		modifyPlexButton(
			$button,
			'error',
			'Could not extract title or year from Flenix'
		);
		return;
	}
	const title = $title.innerText.trim();
	const year = parseInt($date.innerText);
	const imdbId = getImdbId(title, year);

	findPlexMedia({ title, year, button: $button, imdbId });
}

function renderPlexButton() {
	// The "download" button, which doesn't actually work
	const $downloadButton = document.querySelector(
		'#dle-content .about > .buttons > a[target="_blank"]'
	);
	if ($downloadButton) {
		$downloadButton.remove();
	}

	const $actions = document.querySelector('.about > .buttons');
	if (!$actions) {
		console.log('Could not add Plex button.');
		return null;
	}
	const $existingEl = document.querySelector('a.web-to-plex-button');
	if ($existingEl) {
		$existingEl.remove();
	}
	const el = document.createElement('a');
	el.classList.add('roundButton', 'web-to-plex-button');
	$actions.appendChild(el);
	return el;
}

async function getImdbId(_title, _year) {
    let title = null,
        year = null;

	if(!_title || !_year){
        const $title = document.querySelector('#dle-content .about > h1');
        const $date = document.querySelector('.features > .reset:nth-child(2) a');
        if(!$title || !$date) {
            return null;
        }
        title = $title.innerText.trim();
        year = parseInt($date.innerText);
    } else {
      title = _title;
      year = _year;
    }
  
    let json = {};

    await fetch(`https://www.theimdbapi.org/api/find/movie?title=${ title }&year=${ year }`)
        .then(function(response) {
            return response.json();
        })
        .catch(function(error) {
            throw error;
        })
        .then(function(data) {
            return json = data[0];
        });

    return json.imdb_id || null;
}
