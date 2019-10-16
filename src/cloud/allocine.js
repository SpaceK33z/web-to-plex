let script = {
	"url": "*://*.allocine.fr/(film|series)/*",

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title = $('.titlebar-title').first,
			year  = $('.date, .meta-body font').first,
			image = $('.thumbnail-img').first,
			type  = script.getType();

		if(!title || !year)
			return 1000;

		title = title.textContent.trim();
		image = image.src;

		year.textContent.replace(/(\d{4})/, '');
		year = +R.$1;

		return { type, title, year, image };
	},

	"getType": () => {
		let { pathname } = top.location;

		return /\/(film)\//.test(pathname)? 'film': 'show';
	},
};
