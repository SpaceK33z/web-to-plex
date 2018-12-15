/* global findPlexMedia, parseOptions, modifyPlexButton */
function isMovie() {
	return /\/movie-overview\/?$/.test(window.location.pathname);
}

<<<<<<< HEAD
<<<<<<< HEAD
async function initPlexThingy(type) {
	let $parent = document.querySelector('.subnav ul'),
        button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

    let $title = document.querySelector('.subnav__title'),
        $year = document.querySelector('.movie-details__release-date'),
        $image = document.querySelector('.movie-details__movie-img');

    if (!$title || !$year)
		return modifyPlexButton(
			button,
=======
=======
>>>>>>> SpaceK33z/master
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
<<<<<<< HEAD
>>>>>>> Upgrade to v4 (rebased) (#55)
=======
>>>>>>> SpaceK33z/master
			'error',
			'Could not extract title or year from Fandango'
		),
          null;

	let title = $title.textContent.trim().split(/\n+/)[0].trim(),
<<<<<<< HEAD
<<<<<<< HEAD
        year = $year.textContent.replace(/.*(\d{4}).*/, '$1').trim(),
        image = ($image || {}).src;
=======
        year = $year.textContent.replace(/.*(\d{4}).*/, '$1').trim();
>>>>>>> Upgrade to v4 (rebased) (#55)
=======
        year = $year.textContent.replace(/.*(\d{4}).*/, '$1').trim();
>>>>>>> SpaceK33z/master

    let Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

<<<<<<< HEAD
<<<<<<< HEAD
	findPlexMedia({ type, title, year, image, button, IMDbID, TMDbID, TVDbID });
=======
	findPlexMedia({ type, title, year, button: $button, IMDbID, TMDbID, TVDbID });
>>>>>>> Upgrade to v4 (rebased) (#55)
=======
	findPlexMedia({ type, title, year, button: $button, IMDbID, TMDbID, TVDbID });
>>>>>>> SpaceK33z/master
}

if (isMovie()) {
	parseOptions().then(async() => await initPlexThingy('movie'));
}
