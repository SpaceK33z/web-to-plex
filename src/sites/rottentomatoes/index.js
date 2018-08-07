/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
function init() {
	wait(
		() => document.querySelector('#reviews'),
		() => initPlexThingy(isMovie()? 'movie': 'show')
	);
}

function isMovie() {
	return /^\/m/.test(window.location.pathname);
}

function isShow() {
	return /^\/t/.test(window.location.pathname);
}

async function initPlexThingy(type) {
	let $button = renderPlexButton(type);
	if (!$button)
		return;

	let $title = document.querySelector('.playButton + .title, [itemprop="name"]'),
        $year = (type == 'movie'? $title.nextElementSibling: $title.querySelector('.subtle'));

	if (!$title || !$year)
		return modifyPlexButton(
			$button,
			'error',
			'Could not extract title or year from Rotten Tomatoes'
		);

	let title = $title.textContent.trim().replace(/(.+)\:[^]*$/, type == 'movie'? '$&': '$1'),
        year = $year.textContent.replace(/\D+/g, '').trim(),
        Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    if($button.ch)
        $button.ch.querySelector('em').innerText = `${ title } (${ year })`;

	findPlexMedia({ title, year, button: $button.el, type, IMDbID, TMDbID, TVDbID });
}

function renderPlexButton(type) {
	let $actions = document.querySelector('.franchiseLink, #topSection > *');
	if (!$actions)
		return;

    if(type == 'movie') {
        let pa = document.createElement('a'),
            ma = document.createElement('div'),
            el = document.createElement('button'),
            ch = document.createElement('div');

        ch.setAttribute('style', 'line-height:34px');

        el.classList.add('web-to-plex-button');
        ma.classList.add('pull-right', 'hidden-xs');
        pa.classList.add('white', 'web-to-plex--container');

        ch.innerHTML =
`
<span class="hidden-xs-inline">
    <strong>Web to Plex:</strong>
</span>
<em>Loading...</em>
`;
        el.textContent = 'Web to Plex+';
        el.title = 'Loading...';

        ma.appendChild(el);
        pa.appendChild(ma);
        pa.appendChild(ch);
        $actions.appendChild(pa);

        return { el, ch };
    } else {
        let pa = document.createElement('div'),
            el = document.createElement('a');

        el.classList.add('fullWidth', 'web-to-plex-button');
        pa.classList.add('poster_button', 'hidden-xs');

        el.textContent = 'Web to Plex+';
        el.title = 'Loading...';

        pa.appendChild(el);
        $actions.appendChild(pa);

        return { el };
    }
}

parseOptions().then(init);
