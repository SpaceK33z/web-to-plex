/* global findPlexMedia, parseOptions, modifyPlexButton */
function isMovie() {
	return /\/movie-overview\/?$/.test(window.location.pathname);
}

function renderPlexButton($parent) {
	if (!$parent) return;

	let existingButton = document.querySelector('a.web-to-plex-button');
	if (existingButton)
		existingButton.remove();

	let pa = document.createElement('li'),
        el = document.createElement('a');

    pa.classList.add('web-to-plex--wrapper', 'subnav__link-item');

    el.textContent = 'Web to Plex+';
    el.title = 'Loading...';
	el.classList.add('web-to-plex-button', 'subnav__link');
    el.style.display = 'none';

    pa.appendChild(el);
	$parent.insertBefore(pa, $parent.lastElementChild);
	return el;
}

async function initPlexThingy(type) {
	let $parent = document.querySelector('.subnav ul'),
        $button = renderPlexButton($parent);

	if (!$button)
		return;

    let $title = document.querySelector('.subnav__title'),
        $year = document.querySelector('.movie-details__release-date');

    if (!$title || !$year)
		return modifyPlexButton(
			$button,
			'error',
			'Could not extract title or year from Fandango'
		),
          null;

	let title = $title.textContent.trim().split(/\n+/)[0].trim(),
        year = $year.textContent.replace(/.*(\d{4}).*/, '$1').trim();

    let Db = await getIDs({ title, year }),
        IMDbID = Db.imdb,
        TVDbID = Db.thetvdb;

	findPlexMedia({ type, title, year, button: $button, IMDbID, TVDbID });
}

if (isMovie()) {
	parseOptions().then(async() => await initPlexThingy('movie'));
}
