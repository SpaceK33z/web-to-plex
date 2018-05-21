/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
function init() {
	wait(
		() => document.readyState === 'complete',
		() => initPlexThingy(isMoviePage() ? 'movie' : 'tv')
	);
}

function isMoviePage() {
	return window.location.pathname.startsWith('/movie/');
}

function isShowPage() {
	return window.location.pathname.startsWith('/tv/');
}

async function initPlexThingy(type) {
	let $button = renderPlexButton();
	if (!$button)
		return;

	let $title = document.querySelector('.product_page_title > *, .product_title'),
        $date = document.querySelector('.product_page_title > .release_year, .product_data .release_data');

	if (!$title || !$date)
		return console.log('failed'), modifyPlexButton(
			$button,
			'error',
			 `Could not extract ${ !$title? 'title': 'year' } from Metacritic`
		);

	let title = $title.textContent.replace(/\s+/g, ' ').trim(),
        year = $date.textContent.replace(/\s+/g, ' ').replace(/.*(\d{4}).*$/, '$1').trim();

    let Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

    type = type === 'tv'? 'show': type;

	findPlexMedia({ title, year, button: $button, type, IMDbID, TMDbID, TVDbID, txt: 'title', hov: 'null' });
}

function renderPlexButton() {
	let $actions = document.querySelector('#mantle_skin .sharing, #main .sharing');
	if (!$actions)
		return;

	let el = document.createElement('a'),
        ch = document.createElement('span');

    ch.classList.add('fa', 'fa-fw', 'fa-arrow-down');

    el.classList.add('web-to-plex-button');
    el.title = 'Web to Plex+';
    el.appendChild(ch);
	$actions.appendChild(el);

	return el;
}

parseOptions().then(() => {
	init();
});
