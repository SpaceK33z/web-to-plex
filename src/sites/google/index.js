/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
function isMoviePage() {
	return window.location.pathname.startsWith('/store/movies/');
}

function isShowPage() {
	return window.location.pathname.startsWith('/store/tv/');
}

function init() {
	if (isMoviePage() || isShowPage()) {
		wait(
			() => document.querySelector('c-wiz span > button.id-track-click'),
			() => initPlexThingy(isMoviePage() ? 'movie' : 'tv')
		);
	}
}

function renderPlexButton(type) {
    let __, _0, _1, _2;

    _0 = document.querySelector('wishlist-add, wishlist-added');

	if (!_0) return;

    while(/c-wiz/i.test( _0.parentElement.tagName ))
        _0 = _0.parentElement;
    __ = _0 = _0.parentElement;

    if(type === 'movie') {
        _0 = _0.nextElementSibling.firstElementChild;
        _1 = _0.firstChild;
        _2 = _1.firstChild;
    } else {
        _0 = document.createElement('div');
        _1 = document.createElement('span');
        _2 = document.createElement('button');

        _1.classList.add('w2p-w');
        _2.classList.add('w2p-b');

        __.appendChild(_0);
        _0.appendChild(_1);
        _1.appendChild(_2);
    }

	let eb = _0.querySelector('a.web-to-plex-button');
	if (eb) return eb;

	let pa = document.createElement('span'),
        ma = document.createElement('button'),
        el = document.createElement('a');

    el.textContent = 'Web to Plex+';
    el.title = 'Loading...';

    pa.classList = _1.classList;
	ma.classList = _2.classList;
    ma.classList.add('web-to-plex-wrapper');
    el.classList.add('web-to-plex-button');

    pa.appendChild(ma);
    ma.appendChild(el);

	_0.insertBefore(pa, _1);

	return el;
}

async function initPlexThingy(type) {
	let $button = renderPlexButton(type);

	if (!$button)
		return;

	let $title = document.querySelector('h1'),
        $year = document.querySelector(`h1 ~ div span:${ type === 'movie'? 'first': 'last' }-of-type`);

	if (!$title || !$year)
		return modifyPlexButton($button, 'error', `Could not extract ${ !$title? 'title': 'year' } from Google`);

	let title = $title.textContent.replace(/\(\s*(\d{4})\s*\).*?$/, '').trim(),
        year = (RegExp.$1 || $year.textContent).replace(/^.*?(\d+)/, '$1').trim(),
        Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

	findPlexMedia({ type, title, year, button: $button, IMDbID, TMDbID, TVDbID });
}

parseOptions().then(() => {
	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	init();
});
