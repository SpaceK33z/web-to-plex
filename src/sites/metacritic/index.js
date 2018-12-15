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
<<<<<<< HEAD
<<<<<<< HEAD
	let button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

	let $title = document.querySelector('.product_page_title > *, .product_title'),
        $date = document.querySelector('.product_page_title > .release_year, .product_data .release_data'),
        $image = document.querySelector('.summary_img');

	if (!$title || !$date)
		return console.log('failed'), modifyPlexButton(
			button,
=======
=======
>>>>>>> SpaceK33z/master
	let $button = renderPlexButton();
	if (!$button)
		return;

	let $title = document.querySelector('.product_page_title > *, .product_title'),
        $date = document.querySelector('.product_page_title > .release_year, .product_data .release_data');

	if (!$title || !$date)
		return console.log('failed'), modifyPlexButton(
			$button,
<<<<<<< HEAD
>>>>>>> Upgrade to v4 (rebased) (#55)
=======
>>>>>>> SpaceK33z/master
			'error',
			 `Could not extract ${ !$title? 'title': 'year' } from Metacritic`
		);

	let title = $title.textContent.replace(/\s+/g, ' ').trim(),
<<<<<<< HEAD
<<<<<<< HEAD
        year = $date.textContent.replace(/\s+/g, ' ').replace(/.*(\d{4}).*$/, '$1').trim(),
        image = ($image || {}).src;
=======
        year = $date.textContent.replace(/\s+/g, ' ').replace(/.*(\d{4}).*$/, '$1').trim();
>>>>>>> Upgrade to v4 (rebased) (#55)
=======
        year = $date.textContent.replace(/\s+/g, ' ').replace(/.*(\d{4}).*$/, '$1').trim();
>>>>>>> SpaceK33z/master

    let Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

    type = type === 'tv'? 'show': type;

<<<<<<< HEAD
<<<<<<< HEAD
	findPlexMedia({ title, year, button, type, IMDbID, TMDbID, TVDbID });
=======
=======
>>>>>>> SpaceK33z/master
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
    el.title = 'Web to Plex';
    el.appendChild(ch);
	$actions.appendChild(el);

	return el;
<<<<<<< HEAD
>>>>>>> Upgrade to v4 (rebased) (#55)
=======
>>>>>>> SpaceK33z/master
}

parseOptions().then(() => {
	init();
});
