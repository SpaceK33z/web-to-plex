let script = {
    "url": "*://*.hulu.com/watch/*",

    "ready": () => !$('[class$="__meta"]').empty,

    "init": (ready) => {
        let _title, _year, _image, R = RegExp;

        let title = $('[class$="__second-line"]').first,
            year  = (new Date).getFullYear(),
            image,
            type  = script.getType();

        title = title.textContent;

        if(!title)
            return 5000;

        return { type, title, year, image };
    },

    "getType": () => {
        let tl = $('[class$="__third-line"]').first;

        return /^\s*$/.test(tl.textContent)?
            'movie':
        'show';
    },
};
