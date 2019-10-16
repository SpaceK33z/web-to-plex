let script = {
	"url": "*://*.vudu.com/*",

	"ready": () => !$('img[src*="poster" i]').empty,

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title = $('.head-big').first,
			year  = $('.container .row:first-child .row ~ * > .row span').first,
			image = $('img[src*="poster" i]').first,
			type  = script.getType();

		title = title.textContent.replace(/\((\d{4})\)/, '').trim();
		year  = year? year.textContent.split(/\s*\|\s*/): R.$1;
		image = (image || {}).src;

		if(!title)
			return 5000;

		year = +year[year.length - 1].slice(0, 4);
		year |= 0;

		return { type, title, year, image };
	},

	"getType": () => {
		return /(?:Season-\d+\/\d+)$/i.test(window.location.pathname)?
			'show':
		'movie';
	},
};
