let plugin = {
	"url": "*://freeform.go.com/(movies|shows)/*",

	"ready": () => !$('.container h1').empty,

	"timeout": 1000,

	"init": (ready) => {
		let R = RegExp;

		let title, year, image,
			type = plugin.getType();

		if(type == 'movie') {
			title = $('.container h1').first;
			year  = $('.panel-meta-data').first;

			title = title.textContent;
			year = +(year.textContent.split(/\s*-\s*/).filter(y => /^\d+$/.test(y))[0])
		} else if(type == 'show') {
			title = $('img.hero').first;

			title = title.getAttribute('alt');
		}

		return { type, title, year, image };
	},

	"getType": () => {
		return /\bmovies\b/.test(location.pathname)?
			'movie':
		'show';
	},
};
