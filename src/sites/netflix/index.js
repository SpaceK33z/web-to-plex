/* global findPlexMedia, parseOptions, modifyPlexButton */
function isReady() {
    let element = $$('[class$="__time"]');

    return document.readyState == 'complete' && element && !/^([0:]+|null|undefined)?$/.test(element.textContent);
}

function isMovie() {
	return !isShow();
}

function isShow() {
	return $$('[class*="playerEpisodes"]');
}

let $$ = selector => document.querySelector(selector);

async function initPlexThingy(type) {
	let button = renderPlexButton();

	if (!button || !type)
		return /* Fatal Error: Fail Silently */;

	let $title = $$('.video-title h4'),
        title = $title.innerText.replace(/^\s+|\s+$/g, '').toCaps() || sessionStorage.getItem(`last-${type}-title`),
        year = 0,
        Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

    sessionStorage.setItem(`last-${type}-title`, title);

	findPlexMedia({ type, title, year, button, IMDbID, TMDbID, TVDbID });
}

(window.onlocationchange = () =>
    wait(isReady, () => parseOptions().then(async() => await initPlexThingy(isMovie()? 'movie': isShow()? 'tv': null)))
)();
