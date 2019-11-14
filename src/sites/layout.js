/* Your file should look something similar to this */
/* required: function init */
function init( type ) {
    if ( PageReady() )
        startWebtoPlex( type );
    else
        setTimeout(init, 1000);
}

function PageReady() {
    // should return a boolen/object to indicate the page is finished loading
    return document.readyState == 'complete';
}

async function startWebtoPlex(type) {
    let button = renderButton();
    if (!button)
        return /* Silent error */;

    let title = document.querySelector('#title').textContent,
        year  = document.querySelector('#year').textContent,
        image = document.querySelector('#poster').textContent;

    let Db = await getIDs({ title, year, type }),
        IMDbID = Db.imdb,
        TMDbID = Db.tmdb,
        TVDbID = Db.tvdb;

    findPlexMedia({ title, year, image, button, IMDbID, TMDbID, TVDbID, type });
}

parseOptions().then(() => {
   init( location.pathname.startsWith('/movie')? 'movie': 'show' ) 
});
