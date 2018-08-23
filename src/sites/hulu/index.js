/* global findPlexMedia, parseOptions, modifyPlexButton */
function isMovie() {
	return window.location.pathname.startsWith('/watch/');
}

function isShow() {
	return !isMovie();
}

function renderPlexButton($parent) {
	if (!$parent) return;

	let existingButton = document.querySelector('a.web-to-plex-button');
	if (existingButton)
		existingButton.remove();

	let el = document.createElement('a'),
        ma = el, pa;

    if(isShow()) {
        pa = document.createElement('span');
        pa.appendChild(el);
        pa.classList.add('details-action');
        ma = pa;
    }

    el.textContent = 'Web to Plex';
    el.title = 'Loading...';
	el.classList.add('web-to-plex-button');

	$parent.insertBefore(ma, $parent.lastElementChild);
	return el;
}

async function initPlexThingy(type) {
	let $parent = document.querySelector('.functional-bar, .show-details'),
        $button = renderPlexButton($parent);

	if (!$button)
		return;

	let meta = document.querySelector('.video-meta'),
        title, year = 0;

	// TODO: Hmm there should be a less risky way...
    if(type === 'movie' && !!meta) {
        title = meta.textContent.replace(/\s*\((\d+)\)\s*/, '').trim();
        year = +RegExp.$1;
    } else {
        title = window.location.pathname
            .replace(/^\/(.+?)(\/.*)?/, '$1')
            .replace(/-+/g, ' ');
    }

    title = title.toCaps();

    let Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

	findPlexMedia({ type, title, year, button: $button, IMDbID, TMDbID, TVDbID });
}

if (isMovie() || isShow()) {
	parseOptions().then(async() => await initPlexThingy(isMovie()? 'movie': 'tv'));
}
