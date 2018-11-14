function isMovie() {
    return document.querySelector('#media_result_group');
}

function init() {
    if(isMovie())
        initPlexThingy();
}

async function initPlexThingy() {
    let button = renderPlexButton(), type = 'movie';
    if(!button)
        return /* Fail silently */;

    let $title = document.querySelector('.kno-ecr-pt'),
        $date  = document.querySelector('.kno-fb-ctx:not([data-local-attribute]) span'),
        $image = document.querySelector('#media_result_group img');

    if(!$title || !$date)
        return modifyPlexButton(button, 'error', 'Could not extract title or year from Google');

    let date = $date.textContent.replace(/(\d{4})/),
        year = +RegExp.$1,
        title = $title.textContent.trim(),
        image = $image.src;

    let IMDbID = getIMDbID(),
        Db = await getIDs({ title, year, type, IMDbID }),
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    findPlexMedia({ type, title, year, image, button, IMDbID, TMDbID, TVDbID });
}

function getIMDbID() {
    let link = document.querySelector('a._hvg[href*="imdb.com/title/tt"]');

    if(link)
        return link.href.replace(/.*(tt\d+).*/, '$1');
}

parseOptions()
    .then(() => {
        window.addEventListener('popstate', init);
        window.addEventListener('pushstate-changed', init);
        init();
    });
