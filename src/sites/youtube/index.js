let $$ = selector => document.querySelector(selector);

function isMovie(owner) {
    return /\byoutube movies\b/i.test(owner);
}

function isShow() {
    let __title__ = $$('.super-title');

    return __title__ && /\bs\d+\b.+\be\d+\b/i.test(__title__.textContent);
}

async function init() {
    let owner = $$('#owner-container').textContent.replace(/^\s+|\s+$/g, '');

    $$('.more-button').click(); // show the year and other information, fails otherwise

    if(isMovie(owner) || isShow())
        await initPlexThingy(isMovie(owner)? 'movie': isShow()? 'show': null);

    $$('.less-button').click(); // close the meta-information
}

async function initPlexThingy(type) {
    let button = renderPlexButton();
    if(!button || !type)
        return /* Fail silently */;

    let $title = (type == 'movie'? $$('.title'): $$('#owner-container')),
        $date = $$('#content ytd-expander');

    if(!$title || !$date)
        return modifyPlexButton(button, 'error', 'Could not extract title or year from YouTube');

    let title = $title.textContent.trim(),
        year  = +$date.textContent.replace(/[^]*(?:release|air) date\s+(?:(?:\d+\/\d+\/)?(\d{2,4}))[^]*/i, ($0, $1, $$, $_) => +$1 < 1000? 2000 + +$1: $1);

    let Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    title = Db.title;
    year = Db.year;

    findPlexMedia({ type, title, year, button, IMDbID, TMDbID, TVDbID });
}

parseOptions()
    .then(() => {
        window.addEventListener('popstate', init);
        window.addEventListener('pushstate-changed', init);
        wait(() => $$('#owner-container'), init)
    });
