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

function renderPlexButton($parent) {
	if (!$parent) return;

	let existingButton = $$('a.web-to-plex-button');
	if (existingButton)
		existingButton.remove();

	let el = document.createElement('a'),
        ch = document.createElement('img'),
        gc = document.createElement('span');

    el.setAttribute('class', 'web-to-plex-button touchable PlayerControls--control-element nfp-button-control default-control-button button-nfplayerFullscreen PlayerControls--control-element--with-label');
    el.setAttribute('role', 'button');
    ch.src = chrome.extension.getURL('img/o48.png');
    ch.height = ch.width = 28;
    gc.classList.add('PlayerControls__button-label');
    gc.textContent = 'Web to Plex';

    el.appendChild(ch);
    el.appendChild(gc);

    $parent.insertBefore(el, $parent.lastChild);

	return el;
}

async function initPlexThingy(type) {
	let $button = renderPlexButton($$('[class$="button-control-row"]'));

	if (!$button)
		return;

    terminal.log(type);

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

	findPlexMedia({ type, title, year, button: $button, IMDbID, TMDbID, TVDbID, txt: 'title', hov: 'null' });
}

(window.onlocationchange = () =>
    wait(isReady, () => parseOptions().then(async() => await initPlexThingy(isMovie()? 'movie': 'tv')))
)();