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
	let button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

	let $title = document.querySelector('#series_title'),
        $image = document.querySelector('img[src*="/posters/"]');

	if (!$title)
		return modifyPlexButton(
			button,
			'error',
			 `Could not extract title from TheTVDb`
		),
          null;

	let title = $title.innerText.trim(),
        year,
        image = ($image || {}).src,
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

    year = +(((o.first_aired || YEAR) + "").slice(0, 4));

	let savename = title.toLowerCase(),
		cached = await load(`${savename}.tvdb`);

	if(!cached) {
		save(`${savename} (${year}).tvdb`, { title, year, tvdb: +o.thetvdb, imdb: o.imdb });
	    save(`${savename}.tvdb`, +year);
	    terminal.log(`Saved as "${savename} (${year}).tvdb"`);
	}

	findPlexMedia({ title, year, image, button, type: 'show', IMDbID: o.imdb, TVDbID: +o.thetvdb });
}
