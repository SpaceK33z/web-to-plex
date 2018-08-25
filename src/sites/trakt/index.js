/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
let $$ = (element, all = false) => (element = document.querySelectorAll(element)).length > 1 && all? element: element[0];

function isMoviePage() {
	return !isDash() && window.location.pathname.startsWith('/movies/');
}

function isShowPage() {
	return !isDash() && window.location.pathname.startsWith('/shows/');
}

function isDash() {
    return /^\/(dashboard|calendars|search|(?:movies|shows)\/(?:trending|popular|watched|collected|anticipated|boxoffice)|$)/i.test(window.location.pathname);
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

function renderPlexButton() {
	let $actions = $$('#info-wrapper .action-buttons');
	if (!$actions)
		return;

	let existingButton = $actions.querySelector('a.web-to-plex-button');
	if (existingButton)
		return;

	let pa = document.createElement('a'),
        ma = document.createElement('div'),
        ch = document.createElement('div'),
        el = document.createElement('div');

	pa.classList.add('btn', 'btn-block', 'btn-summary', 'btn-w2p');
    ma.classList.add('fa', 'fa-fw', 'fa-download');
    ch.classList.add('text');
    el.textContent = 'Web to Plex';
    el.classList.add('web-to-plex-button', 'main-info');
    pa.appendChild(ma);
    pa.appendChild(ch);
    ch.appendChild(el);
	$actions.insertBefore(pa, $actions.childNodes[3]);

	return pa;
}

async function initPlexThingy(type) {
	let $button = renderPlexButton();

	if (!$button)
		return;

	let $title = $$('.mobile-title'),
        $year = $$('.mobile-title .year');

	if (!$title || !$year)
		return modifyPlexButton($button, 'error',  `Could not extract ${ !$title? 'title': 'year' } from Trakt`);

	let title = $title.textContent.replace(/(.+)(\d{4}).*?$/, '$1').replace(/\s*\:\s*Season.*$/i, '').trim(),
        year = (RegExp.$2 || $year.textContent).trim(),
        IMDbID = getIMDbID(),
        TMDbID = getTMDbID(),
        TVDbID = getTVDbID();

    if((!IMDbID && !TMDbID) || !TVDbID) {
        let Db = await getIDs({ title, year, type, IMDbID, TMDbID, TVDbID });

        IMDbID = IMDbID || Db.imdb,
        TMDbID = TMDbID || Db.tmdb,
        TVDbID = TVDbID || Db.tvdb;
        title = Db.title;
        year = Db.year;
    }

	findPlexMedia({ type, title, year, button: $button, IMDbID, TMDbID, TVDbID, txt: 'title', hov: 'null' });
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
    <a class="w2p-channel web-to-plex-button" href="#" title>
      <div class="icon btn-amazon">
        <img class="lazy" src="${ chrome.extension.getURL('img/_48.png') }" style="height: 45px; width: auto;" alt="Plugin">
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
