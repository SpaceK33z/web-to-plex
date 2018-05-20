/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
function isMoviePage() {
	return window.location.pathname.startsWith('/movie/');
}

function isShowPage() {
	return window.location.pathname.startsWith('/series/');
}

function init() {
	if (isMoviePage() || isShowPage()) {
		wait(
			() => document.querySelector('.container .btn-with-play'),
			() => initPlexThingy(isMoviePage() ? 'movie' : 'tv')
		);
	}
}

function renderPlexButton() {
	let $actions = document.querySelector('.container .content-holder');
	if (!$actions)
		return;

	let existingButton = $actions.querySelector('a.web-to-plex-button');
	if (existingButton)
		return;

	let el = document.createElement('a');

    el.textContent = 'Web to Plex+';
    el.title = 'Loading...';
	el.classList.add('web-to-plex-button', 'btn');
	$actions.appendChild(el);

	return el;
}

async function initPlexThingy(type) {
	let $button = renderPlexButton();

	if (!$button)
		return;

	let $title = document.querySelector('.copy > .title'),
        $year = (type === 'movie')?
            document.querySelector('.copy > .details'):
        document.querySelector('.summary ~ .title ~ *');

	if (!$title || !$year)
		return modifyPlexButton($button, 'error', `Could not extract ${ !$title? 'title': 'year' } from Verizon`);

	let title = $title.textContent.trim(),
        year = $year.textContent.slice(0, 4).trim();

    let Db = await getIDs({ title, year, APIType: type }),
        IMDbID = Db.imdb,
        TVDbID = Db.thetvdb;

	findPlexMedia({ type, title, year, button: $button, IMDbID, TVDbID });
}

parseOptions().then(() => {
	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	init();
});
