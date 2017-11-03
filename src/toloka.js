function getImdbId() {
	const tags = document.querySelectorAll('.postlink');
	const reg = /^http\:\/\/www\.imdb\.com\/title\/(tt\d+)/;
	for (var id in tags) {
		const urlMatch = reg.exec(tags[id]);
		if (urlMatch) {
			return urlMatch[1];
		}
	}
	return false;
}

const imdbId = getImdbId();

function renderPlexButton($parent) {
	if (!$parent) {
		console.log('Could not add Plex button.');
		return null;
	}
	const el = document.createElement('a');
	el.classList.add('web-to-plex-button');
	el.style.display = 'none';
	$parent.appendChild(el);
	return el;
}

function initPlexMovie() {
	const $parent = document.querySelector('#overlay-background');
	const $button = renderPlexButton($parent);

	if (!$button) {
		return;
	}

	const name = document.querySelector('.maintitle').textContent;
	const reg = /^[^\/]+\/\s+([^\(]+)\(([\d]{4})/;
	const parts = reg.exec(name);
	const title = parts[1].trim();
	const year = parseInt(parts[2]);

	findPlexMedia({ type: 'movie', title, year, button: $button, imdbId });
}

if (imdbId) {
	parseOptions().then(() => {
		initPlexMovie();
	});
}
