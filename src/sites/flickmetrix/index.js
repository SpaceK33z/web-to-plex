/* global wait, modifyPlexButton, parseOptions, findPlexMedia */
function isMovie() {
	return !!document.querySelector('#singleFilm') || /\bid=\d+\b/i.test(window.location.search);
}

function isList() {
	return !isMovie();
}

let START = +(new Date);

function init() {
    if(/\/(?=((?:watchlist|seen|favourites|trash)\b|$))/i.test(window.location.pathname))
        wait(
            () => (!document.querySelector('#loadingOverlay > *')),
            () => (isList()? initList: initPlexThingy)()
        );
}

function initPlexThingy() {
	let button = renderPlexButton();

	if (!button)
		return /* Fatal Error: Fail Silently */;

	let $element = document.querySelector('#singleFilm'),
		$title = $element.querySelector('.title'),
        $date = $element.querySelector('.title + *'),
        $image = $element.querySelector('img');

	if (!$title || !$date)
		return modifyPlexButton(
			button,
			'error',
			'Could not extract title or year from Flickmetrix'
		);

	let title = $title.textContent.trim(),
        year = $date.textContent.replace(/^\(|\)$/g, '').trim(),
        image = ($image || {}).src,
        IMDbID = getIMDbID($element);

	findPlexMedia({ title, year, button, type: 'movie', IMDbID });
}

function getIMDbID(element) {
	let $link = element.querySelector(
		'[href*="imdb.com/title/tt"]'
	);
	if ($link) {
		let link = $link.href.replace(/^.*imdb\.com\/title\//, '');
		return link.replace(/\/(?:maindetails\/?)?$/, '');
	}
}

async function addInListItem(element) {
	let $title = element.querySelector('.title'),
		$date = element.querySelector('.title + *'),
        $image = element.querySelector('img');

	if (!$title)
		return;

	let title = $title.textContent.trim(),
        year = +$date.textContent.replace(/^\(|\)$/g, '').trim(),
        image = $image.src,
        type = 'movie',
		IMDbID = getIMDbID(element);

    let Db = await getIDs({ type, title, year, IMDbID }),
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = title || Db.title;
    year = year || Db.year;
	IMDbID = IMDbID || Db.IMDbID;

	return { type, title, year, image, IMDbID, TMDbID, TVDbID };
}

function initList() {
	let $listItems = document.querySelectorAll('.film'),
        button = renderPlexButton(),
        options = [], length = $listItems.length - 1;

	if (!button)
		return /* Fatal Error: Fail Silently */;

	$listItems.forEach(async(element, index, array) => {
        let option = await addInListItem(element);

        if(option)
            options.push(option);

        if(index == length)
            setTimeout(() => {
                terminal.log(options)
                if (!options.length)
                    new Notification('error', 'Failed to process list');
                else
                    squabblePlex(options, button);
            }, 50);
    });
}

parseOptions().then(window.onlocationchange = init);
