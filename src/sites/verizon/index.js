/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
function isMoviePage() {
	return /\bmovies?\b/i.test(window.location.pathname);
}

function isShowPage() {
	return /\bseries\b/i.test(window.location.pathname);
}

function isOnDemand() {
    return /ondemand/i.test(window.location.pathname);
}

function init() {
	if (isMoviePage() || isShowPage()) {
		wait(
			() => document.querySelector('.container .btn-with-play, .moredetails, .more-like'),
			() => initPlexThingy(isMoviePage() ? 'movie' : 'tv')
		);
	}
}

<<<<<<< HEAD
<<<<<<< HEAD
async function initPlexThingy(type) {
	let button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

    let $title, $year, $image = document.querySelector('.cover img');
=======
=======
>>>>>>> SpaceK33z/master
function renderPlexButton() {
	let $actions = document.querySelector('.container .content-holder, .detail .fl');
	if (!$actions)
		return;

	let existingButton = $actions.querySelector('a.web-to-plex-button');
	if (existingButton)
		return;

	let el = document.createElement('a');

    el.textContent = 'Web to Plex';
    el.title = 'Loading...';
	el.classList.add('web-to-plex-button', 'button', 'btn', 'detail-btn');
	$actions.appendChild(el);

	return el;
}

async function initPlexThingy(type) {
	let $button = renderPlexButton();

	if (!$button)
		return;

    let $title, $year;
<<<<<<< HEAD
>>>>>>> Upgrade to v4 (rebased) (#55)
=======
>>>>>>> SpaceK33z/master

    if(isOnDemand()) {
        if(isMoviePage()) {
            $title = document.querySelector('.detail *');
            $year = document.querySelector('.rating *');
        } else {
            $title = {textContent: window.location.pathname.replace(/\/ondemand\/tvshows?\/([^\/]+?)\/.*/i)};
            $year = document.querySelector('#showDetails > * > *:nth-child(4) *:last-child');

            $title.textContent = decodeURL($title.textContent).toCpas();
        }
    } else {
        $title = document.querySelector('.copy > .title');
        $year = (type === 'movie')?
            document.querySelector('.copy > .details'):
        document.querySelector('.summary ~ .title ~ *');
    }

	if (!$title || !$year)
<<<<<<< HEAD
<<<<<<< HEAD
		return modifyPlexButton(button, 'error', `Could not extract ${ !$title? 'title': 'year' } from Verizon`);

	let title = $title.textContent.trim(),
        year = $year.textContent.slice(0, 4).trim(),
        image = ($image || {}).src;
=======
=======
>>>>>>> SpaceK33z/master
		return modifyPlexButton($button, 'error', `Could not extract ${ !$title? 'title': 'year' } from Verizon`);

	let title = $title.textContent.trim(),
        year = $year.textContent.slice(0, 4).trim();
<<<<<<< HEAD
>>>>>>> Upgrade to v4 (rebased) (#55)
=======
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

parseOptions().then(() => {
	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	init();
});
