/** TODO
	- re-enable list functionality (fix it)
**/

let script = {
	"url": "*://*.trakt.tv/(movie|show)s/*",

	"ready": () => !$('#info-wrapper ul.external, .format-date').empty,

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let type = script.getType(),
			IMDbID, TMDbID, TVDbID,
			title, year, image, options;

		switch(type) {
			case 'movie':
			case 'show':
				title = $('.mobile-title').first;
				year  = $('.mobile-title .year').first;
				image = $('.poster img.real[alt="poster"i]').first;
				IMDbID = script.getIMDbID();
				TMDbID = script.getTMDbID();
				TVDbID = script.getTVDbID();

				if(!IMDbID && !TMDbID && !TVDbID)
					return 5000;

				title = title.textContent.replace(/(.+)(\d{4}).*?$/, '$1').replace(/\s*\:\s*Season.*$/i, '').trim();
				year  = +(R.$2 || year.textContent).trim();
				image = (image || {}).src;

				options = { type, title, year, image, IMDbID, TMDbID, TVDbID };
				break;

			case 'list':
				let items = $('*');

				options = [];

				items.forEach((element, index, array) => {
					let option = script.process(element, items);

					if(option)
						options.push(option);
				});
				break;

			default:
				return null;
		}

		return options;
	},

	"getType": () => {
		let { pathname } = top.location;

		return (
			// /^\/(dashboard|calendars|people|search|(?:movie|show)s?\/(?:trending|popular|watched|collected|anticipated|boxoffice)|$)/i.test(pathname)?
				// 'list':
			/^\/(movie|show)s\//i.test(pathname)?
				RegExp.$1:
			'error'
		)
	},

	"getIMDbID": () => {
		let link = $(
			// HTTPS and HTTP
			'[href*="imdb.com/title/tt"]'
		).first;

		if(link)
			return link.href.replace(/^.*?imdb\.com\/.+\b(tt\d+)\b/, '$1');
	},

	"getTMDbID": () => {
		let link = $(
			// HTTPS and HTTP
			'[href*="themoviedb.org/"]'
		).first;

		if(link)
			return link.href.replace(/^.*?themoviedb.org\/(?:movie|tv|shows?|series)\/(\d+).*?$/, '$1');
	},

	"getTVDbID": () => {
		let link = $(
			// HTTPS and HTTP
			'[href*="thetvdb.com/"]'
		).first;

		if(link)
			return link.href.replace(/^.*?thetvdb.com\/.+\/(\d+)\b.*?$/, '$1');
	},

	"process": (element, elements) => {
		let type, title, year;

		return { type, title, year };
	},
};
