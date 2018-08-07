/* global findPlexMedia, parseOptions, modifyPlexButton */
function isShowPage() {
	// An example movie page: /series/GR75MN7ZY/Deep-Space-69-Unrated
	return /^\/(?:series|watch)\//.test(window.location.pathname);
}

function isShowPageReady() {
    let img = document.querySelector('.h-thumbnail > img');
	return img && img.src;
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
	(window.onlocationchange = init)();
});

async function initPlexThingy() {
	let $button = renderPlexButton();
	if (!$button)
		return;

	let $title = document.querySelector('.series, .title'),
        $year = document.querySelector('.additional-information-item');

	if (!$title)
		return modifyPlexButton(
			$button,
			'error',
			 `Could not extract title from VRV`
		),
          null;

	let title = $title.innerText.replace(/(unrated|mature|tv-?\d{1,2})\s*$/i, '').trim(),
        year = $year? $year.textContent.replace(/.+(\d{4}).*/, '$1').trim(): 0,
	    Db = await getIDs({ title, year, APIType: 'tv' }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

	findPlexMedia({ title, year, button: $button, type: 'show', IMDbID, TMDbID, TVDbID });
}

function renderPlexButton() {
	// The "download" button
	let $actions = document.querySelector(
            '.action-buttons'
    );

	if (!$actions)
		return;

	let $existingButton = document.querySelector('a.web-to-plex-button');
	if ($existingButton)
		$existingButton.remove();

    let el = document.createElement('a');

    el.classList.add('web-to-plex-button', 'action-button', 'h-button');
    el.textContent = 'Web to Plex+';
    el.title = 'Loading...';

    $actions.appendChild(el);

	return el;
}
