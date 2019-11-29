let plugin = {
	"url": "*://*.redbox.com/(ondemand-)?(movies|tvshows)/(?!featured|$)",

	"ready": () => !$('[data-test-id$="-name"i]').empty,

	"timeout": 1000,

	"init": (ready) => {
		let R = RegExp;

		let title = $('[data-test-id$="-name"i]').first,
			year  = $('[data-test-id$="-info"i]').first,
			image = $('[data-test-id$="-img"i]').first,
			type  = plugin.getType();

		title = title.textContent.replace(/\s*\((\d{4})\)/, '');
		year  = +(R.$1 || year.textContent.split(/\s*\|\s*/)[1]);
		image = image.src;

		return { type, title, year, image };
	},

	"getType": () => {
		return /\bmovies\b/.test(location.pathname)?
			'movie':
		'show';
	},
};
