let script = {
    // required
    "url": "< URL RegExp >",
    // Example: *://*.amazon.com/*/video/(detail|buy)/*
    // *://         - match any protocol (http, https, etc.)
    // *.amazon.com - match any sub-domain (www, ww5, etc.)
    // /*           - match any path
    // (detail|buy) - match one of the items

    // optional
    "ready": () => { /* return a boolean to describe if the page is ready */ },

    // optional
    "timeout": 1000, // if the script fails to complete, retry after ... milliseconds

    // required
    "init": (ready) => {
        let _title, _year, _image, R = RegExp;

        let title = $('#title').first,
            year  = $('#year').first,
            image = $('#image').first,
            type  = script.getType(); // described below

        return { type, title, year, image };
    },

    // optional | functioanlity only
    "getType": () => 'movie' || 'show',
};
