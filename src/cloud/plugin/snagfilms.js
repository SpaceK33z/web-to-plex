let plugin = {
	"url": "*://*.snagfilms.com/(films?|shows?)/*",

	"ready": () => !$('[itemprop~="genre"i], .show .title').empty,

	"timeout": 1000,

	"init": (ready) => {
		let R = RegExp;

		let title, year, image,
			type = plugin.getType();

		if(type == 'movie') {
			title = $('.header-title').first;
			year  = $('[itemprop~="genre"i]').first.previousElementSibling;

			title = title.textContent;
			year = +(year.textContent.replace(/\W+/g, ''))
		} else if(type == 'show') {
			title = $('.title').first;

			title = title.textContent;
		}

		return { type, title, year, image };
	},

	"getType": () => {
		return /\bfilms?\b/.test(location.pathname)?
			'movie':
		'show';
	},
};
