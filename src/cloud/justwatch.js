let script = {
	"url": "*://*.justwatch.com/(\\w{2})/(tv(?:-show)|movie)/*",

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title = $('.title-block').first,
			year  = $('.title-block .text-muted').first,
			image = $('.title-poster__image').first,
			type  = script.getType();

		if(!title || !year)
			return 1000;

		year  = year.textContent;
		title = title.firstElementChild.firstChild.textContent.trim();
		year  = +year.replace(/\D+/g, '');
		image = image.src;

		return { type, title, year, image };
	},

	"getType": () => {
		let { pathname } = top.location;

		if(/^\/tv(-show)?\//.test(pathname))
			return 'show';
		else
			return 'movie';
	},
};
