/* global findPlexMedia, parseOptions, modifyPlexButton */
function isShowPage() {
	// An example movie page: /series/gravity-falls
	return window.location.pathname.startsWith('/series/');
}

function isShowPageReady() {
	return !!document.querySelector('#series_basic_info');
}

function init() {
	if (isShowPage())
		if (isShowPageReady())
			initPlexThingy();
		else
			// This almost never happens, but sometimes the page is too slow so we need to wait a bit.
			setTimeout(init, 1000);
}

parseOptions().then(() => {
	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	init();
});

function initPlexThingy() {
<<<<<<< HEAD
<<<<<<< HEAD
	let button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

	let $title = document.querySelector('#series_title'),
        $image = document.querySelector('img[src*="/posters/"]');

	if (!$title)
		return modifyPlexButton(
			button,
=======
=======
>>>>>>> SpaceK33z/master
	let $button = renderPlexButton();
	if (!$button)
		return;

	let $title = document.querySelector('#series_title');

	if (!$title)
		return modifyPlexButton(
			$button,
<<<<<<< HEAD
>>>>>>> Upgrade to v4 (rebased) (#55)
=======
>>>>>>> SpaceK33z/master
			'error',
			 `Could not extract title from TheTVDb`
		),
          null;

	let title = $title.innerText.trim(),
<<<<<<< HEAD
<<<<<<< HEAD
        year,
        image = ($image || {}).src,
=======
>>>>>>> Upgrade to v4 (rebased) (#55)
=======
>>>>>>> SpaceK33z/master
        d = '<!---->', o = {},
	    Db = document.querySelector('#series_basic_info')
            .textContent
            .replace(/^\s+|\s+$/g, '')
            .replace(/^\s+$/gm, d)
            .replace(/^\s+(\S)/gm, '$1')
            .split(RegExp(`\\n*${d}\\n*`))
            .forEach(value => {
                value = value.split(/\n+/, 2);

                let n = value[0], v = value[1];

                n = n.replace(/^([\w\s]+).*$/, '$1').replace(/\s+/g, '_').toLowerCase();

                o[n] = /,/.test(v)? v.split(/\s*,\s*/): v;
            });

<<<<<<< HEAD
<<<<<<< HEAD
    year = ((o.first_aired || YEAR) + "").slice(0, 4);

    let savename = title.toLowerCase();

    save(`${savename} (${year}).tvdb`, { title, year, tvdb: o.thetvdb, imdb: o.imdb });
    save(`${savename}.tvdb`, +year);
    terminal.log(`Saved as "${savename} (${year}).tvdb"`);

	findPlexMedia({ title, year, image, button, type: 'show', IMDbID: o.imdb, TVDbID: o.thetvdb });
=======
=======
>>>>>>> SpaceK33z/master
	findPlexMedia({ title, year: ((o.first_aired || YEAR) + "").slice(0, 4), button: $button, type: 'show', IMDbID: o.imdb, TVDbID: o.thetvdb });
}

function renderPlexButton() {
	// The "download" button
	let $actions = document.querySelector(
            '#series_basic_info > ul'
    );

	if (!$actions)
		return;

	let $existingButton = document.querySelector('a.web-to-plex-button');
	if ($existingButton)
		$existingButton.remove();

    let pa = document.createElement('li'),
        el = document.createElement('strong'),
        ch = document.createElement('a');

    pa.classList.add('web-to-plex-wrapper', 'list-group-item', 'clearfix');
    pa.appendChild(el);
    el.appendChild(ch);
    ch.classList.add('web-to-plex-button');
    ch.textContent = 'Web to Plex';
    ch.title = 'Loading...';

    $actions.insertBefore(pa, $actions.firstChild);

	return ch;
<<<<<<< HEAD
>>>>>>> Upgrade to v4 (rebased) (#55)
=======
>>>>>>> SpaceK33z/master
}
