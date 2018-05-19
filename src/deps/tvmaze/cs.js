/* global findPlexMedia, parseOptions, modifyPlexButton */
function isShowPage() {
	// An example movie page: /shows/2757/colony
	return window.location.pathname.startsWith('/shows/');
}

function isShowPageReady() {
	return !!document.querySelector('#general-info-panel .rateit');
}

async function init() {
	if (isShowPage())
		if (isShowPageReady())
			await initPlexThingy();
		else
			// This almost never happens, but sometimes the page is too slow so we need to wait a bit.
			setTimeout(init, 1000);
}

parseOptions().then(async() => {
	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	await init();
});

async function initPlexThingy() {
	let $button = renderPlexButton();
	if (!$button)
		return;

	let $title = document.querySelector('header.columns > h1'),
        $date = document.querySelector('#year'),
        $apid = window.location.pathname.replace(/\/shows\/(\d+).*/, '$1');

	if (!$title || !$date)
		return modifyPlexButton(
			$button,
			'error',
			'Could not extract title or year from TV Maze'
		),
          null;

	let title = $title.innerText.trim(),
	    year = $date.innerText.replace(/\((\d+).+\)/, '$1'),
        Db = await getIDs({ APIID: $apid }),
        IMDbID = Db.imdb,
        TVDbID = Db.thetvdb;

	findPlexMedia({ title, year, button: $button, type: 'show', IMDbID, TVDbID });
}

function renderPlexButton() {
	// The "download" buttons
	let $actions = document.querySelectorAll(
            'nav.page-subnav > ul'
    );

	if (!$actions)
		return;

	let $existingButton = document.querySelectorAll('a.web-to-plex-button');
	if ($existingButton)
		$existingButton.forEach(e => e.remove());

    let els = [];
	$actions.forEach((e, i) => {
        let pa = document.createElement('li'),
            el = document.createElement('a'),
            li = /^[ou]l$/i.test(e.tagName);

        pa.classList.add('web-to-plex-wrapper');
        el.textContent = 'Web to Plex+';
        el.title = 'Loading...';
	    el.classList.add((li? 'flatButton': 'roundButton'), 'web-to-plex-button');
        e.appendChild(li? (pa.appendChild(el), pa): el);
        return els.push(el);
    });

	return els;
}
