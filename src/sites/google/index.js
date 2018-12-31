function isMovie() {
    return document.querySelector('#media_result_group, [href*="themoviedb.org/tv/"], [href*="imdb.com/title/tt"]');
}

function isShow() {
    return document.queryBy('[href*="thetvdb.com/"][href*="id="], [href*="thetvdb.com/series/"], [href*="themoviedb.org/tv/"], [href*="imdb.com/title/tt"][href$="externalsites"]').first;
}

function init() {
    if(isMovie() || isShow())
        initPlexThingy(isMovie()? 'movie': isShow()? 'show': null);
}

async function initPlexThingy(type) {
    let $title, $type, $date, $image;

    let button = renderPlexButton();
    if(!button || !type)
        return /* Fail silently */;

    if(type == 'movie') {
        $title = document.querySelector('.kno-ecr-pt');
        $type  = document.querySelector('.kno-ecr-pt + *'); // in case a tv show is incorrectly identified
        $date  = document.querySelector('.kno-fb-ctx:not([data-local-attribute]) span');
        $image = document.querySelector('#media_result_group img');
    } else {
        $title = isShow().querySelector('*');
        $date = { textContent: '' };
        $image = { src: '' };
    }

    if(!$title || !$date)
        return modifyPlexButton(button, 'error', 'Could not extract title or year from Google');

    if($type) {
        type = $type.textContent;

        type = /\b(tv|show|series)\b/i.test(type)? 'show': /\b(movie|film|cinema|(?:\d+h\s+)?\d+m)\b/i.test(type)? 'movie': 'error';
        $date = (type == 'show'? document.querySelector('.kno-fv') || $date: $date) || { textContent: '' };
    }

    if(type == 'error')
        return;

    let date = $date.textContent.replace(/(\d{4})/),
        year = +RegExp.$1,
        title = $title.textContent.replace((type == 'movie'? /^(.+)$/: /(.+)(?:(?:\:\s*series\s+info|\-\s*(?:all\s+episodes|season)).+)$/i), '$1').trim(),
        image = ($image || {}).src;

    year = year > 999? year: 0;

    let IMDbID = getIMDbID(),
        Db = await getIDs({ title, year, type, IMDbID }),
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    IMDbID = IMDbID || Db.imdb;

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
