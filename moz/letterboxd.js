let script = {
	"url": "*://*.letterboxd.com/(film|list)/",

	"ready": () => (script.getType('list')? true: !$('.js-watch-panel').empty),

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title, year, image, type = script.getType(), IMDbID;

		switch(type) {
			case 'movie':
				title  = $('.headline-1[itemprop="name"]').first.textContent.trim();
				year   = +$('small[itemprop="datePublished"]').first.textContent.trim();
				image  = ($('.image').first || {}).src;
				IMDbID = script.getIMDbID(type);

				return { type, title, year, image, IMDbID };
				break;

			case 'list':
				let items = $('.poster-list .poster-container'),
					options = [];

				items.forEach((element, index, array) => {
					let option = script.process(element);

					if(option)
						options.push(option);
				});

				return options;
				break;

			default:
				/* Error */
				return {};
		}
	},

	"getType": (suspectedType) => {
		let type = /^\/(film)\//i.test(top.location.pathname)? 'movie': 'list';

		if(suspectedType)
			return type == suspectedType;

		return type;
	},

	"getIMDbID": (type) => {
		if(type == 'movie') {
			let link = $(
				'.track-event[href*="imdb.com/title/tt"i]'
			);

			if(!link.empty) {
				link = link.first.href.replace(/^.*imdb\.com\/title\//i, '');

				return link.replace(/\/(?:maindetails\/?)?$/, '');
			}
		}
	},

	"process": (element) => {
		let title = $('.frame-title', element).first,
			image = $('img', element).first,
			type = 'movie',
			year;

		title = title.textContent.replace(/\((\d+)\)/, '').trim();
		year  = +RegExp.$1;
		image = image.src;

		return { type, title, year, image };
	},
};
