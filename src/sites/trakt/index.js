/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
let $$ = (element, all = false) => (element = document.querySelectorAll(element)).length > 1 && all? element: element[0];

function isMoviePage() {
	return !isDash() && window.location.pathname.startsWith('/movies/');
}

function isShowPage() {
	return !isDash() && window.location.pathname.startsWith('/shows/');
}

function isDash() {
    return /^\/(dashboard|calendars|people|search|(?:movies|shows)\/(?:trending|popular|watched|collected|anticipated|boxoffice)|$)/i.test(window.location.pathname);
}

function getIMDbID() {
    let $link = $$(
        // HTTPS and HTTP
        '[href*="imdb.com/title/tt"]'
    );

    if ($link)
        return $link.href.replace(/^.*?imdb\.com\/.+\b(tt\d+)\b/, '$1');
}

function getTVDbID() {
    let $link = $$(
        // HTTPS and HTTP
        '[href*="thetvdb.com/"]'
    );

    if ($link)
        return $link.href.replace(/^.*?thetvdb.com\/.+(?:(?:series\/?(?:\?id=)?)(\d+)\b).*?$/, '$1');
}

function getTMDbID() {
    let $link = $$(
        // HTTPS and HTTP
        '[href*="themoviedb.org/"]'
    );

    if ($link)
        return $link.href.replace(/^.*?themoviedb.org\/(?:movie|tv|shows?|series)\/(\d+).*?$/, '$1');
}

function init() {
	if (isMoviePage() || isShowPage() || isDash()) {
		wait(
			() => ($$('#info-wrapper ul.external, .format-date') || document.readyState == 'complete'),
			() => (isDash()? initDash(): initPlexThingy(isMoviePage() ? 'movie' : 'show'))
		);
	}
}

async function initPlexThingy(type) {
	let button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

	let $title = $$('.mobile-title'),
        $year = $$('.mobile-title .year'),
        $image = $$('.poster img.real[alt="poster" i]');

	if (!$title || !$year)
		return modifyPlexButton(button, 'error', `Could not extract ${ !$title? 'title': 'year' } from Trakt`);

	let title = $title.textContent.replace(/(.+)(\d{4}).*?$/, '$1').replace(/\s*\:\s*Season.*$/i, '').trim(),
        year = +(RegExp.$2 || $year.textContent).trim(),
        image = $image.src,
        IMDbID = getIMDbID(),
        TMDbID = getTMDbID(),
        TVDbID = getTVDbID(),
        o = (type == 'movie')? { im: IMDbID, tm: TMDbID }: { im: IMDbID, tm: TMDbID, tv: TVDbID };

    /* use Trakt as a caching service when applicable */
    if(type == 'movie') {
        save(`${title} (${year}).tmdb`, { title, year, imdb: o.im, tmdb: o.tm });
        save(`${title}.tmdb`, year);

        save(`${title} (${year}).imdb`, { title, year, imdb: o.im });
        save(`${title}.imdb`, year);
    } else {
        save(`${title} (${year}).tvdb`, { title, year, tvdb: o.tv, tmdb: o.tm, imdb: o.im });
        save(`${title}.tvdb`, year);

        save(`${title} (${year}).tmdb`, { title, year, tmdb: o.tm });
        save(`${title}.tmdb`, year);

        save(`${title} (${year}).imdb`, { title, year, imdb: o.im });
        save(`${title}.imdb`, year);
    }

    if((!IMDbID && !TMDbID) || !TVDbID) {
        let Db = await getIDs({ title, year, type, IMDbID, TMDbID, TVDbID });

        IMDbID = IMDbID || Db.imdb,
        TMDbID = TMDbID || Db.tmdb,
        TVDbID = TVDbID || Db.tvdb;
        title = Db.title;
        year = Db.year;
    }

	findPlexMedia({ type, title, year, image, button, IMDbID, TMDbID, TVDbID });
}

async function initDash() {
    let buttons = $$(".btn-watch-now, .quick-icons .watch-now", true);

    buttons.forEach((element, index, array) => {
        element.preclick = element.preclick || element.onclick || (() => {});

        element.onclick = async(event, rerun) => {
            event.path.filter((v, i, a) => !!~[].slice.call(buttons).indexOf(v)).forEach((e, i, a) => e.preclick(event));

            let ready = /^[^]+$/.test($$('#watch-now-content').innerText);

            if(!ready || !rerun)
                return setTimeout( () => element.onclick(event, true), 5 );

            let title = $$("#watch-now-content h3").innerText.replace(/^\s*where\s+to\s+watch\s*/i, ''),
                image = $$('.poster img.real[alt="poster" i]'),
                type = 'show',
                year = YEAR,
                button = $$(".w2p-channel");

            if(title == '')
                title = $$("#watch-now-content h1").innerText.replace(/^\s*(.+)\s+(\d+)\s*$/, '$1'),
                year = RegExp.$2,
                type = 'movie';

            title = title.toCaps();

            if(!button) {
                $$("#watch-now-content .streaming-links").innerHTML +=
`
<div class="title">ondemand</div>
<div class="section">
    <a class="w2p-channel w2p-action" href="#" title>
      <div class="icon btn-amazon">
        <img class="lazy" src="${ IMG_URL._48 }" style="height: 45px; width: auto;" alt="Plugin">
      </div>
      <div class="price">Free</div>
    </a>
</div>
`;
                wait(() => button = $$(".w2p-channel"), () => {});
            }

            let Db = await getIDs({ title, year, type }),
                IMDbID = Db.imdb,
                TMDbID = Db.tmdb,
                TVDbID = Db.tvdb;

            title = Db.title;
            year = Db.year;

            findPlexMedia({ type, title, year, button, IMDbID, TMDbID, TVDbID, txt: 'title', hov: 'null' });
        };
    });
}

parseOptions().then(() => {
	window.addEventListener('popstate', init);
	window.addEventListener('pushstate-changed', init);
	init();
});

window.onlocationchange = (event) => {
    init();
};
