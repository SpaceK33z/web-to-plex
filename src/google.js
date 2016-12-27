function isMovie() {
	if (document.getElementById('media_result_group')) {
		return true;
	}
	return false;
}

function init() {
	if (isMovie()) {
		initPlexThingy();	
	}
}

function initPlexThingy() {
	const $button = renderPlexButton();
	if (!$button) {
		return;
	}
	const $title = document.querySelector('.kno-ecr-pt');
	const $date  = document.querySelector('.kno-fb-ctx span');

	if (!$title || !$date) {
		modifyPlexButton($button, 'error', 'Could not extract title or year from Movieo');
		return;
	}

	date = $date.textContent;
	const yearRegex = /(\d{4})/;
	date = date.match(yearRegex);

	const title  = $title.textContent.trim();
	const year   = parseInt(date);
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

	const $actions = document.querySelector('._FJf');
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
	const $link = document.querySelector('a._hvg[href^="http://www.imdb.com/title/tt"]');
	if ($link) {
		return link = $link.href.replace('http://www.imdb.com/title/', '');
	}
	return null;
}

parseOptions().then(() => {
	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	init();
});
