let script = {
	"url": "*://*.couchpotato.life/(movies|shows)/*",

	"ready": () => !$('.media-body .clearfix').empty && $('.media-body .clearfix').first.children.length,

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title  = $('[itemprop="description"]').first,
			year   = title.previousElementSibling,
			image  = $('img[src*="wp-content"]'),
			type   = script.getType(),
			IMDbID = script.getIMDbID();

		title = title.textContent.trim();
		year  = +year.textContent.trim();
		image = image.empty? '': image.first.src;

		return { type, title, year, image, IMDbID };
	},

	"getType": () => {
		let pathname = window.location.pathname;

		return /^\/movies?\//.test(pathname)?
			'movie':
		/^\/shows?\//.test(pathname)?
			'show':
		null
	},

	"getIMDbID": () => {
		let link = $('[href*="imdb.com/title/tt"]');

		if(!link.empty)
			return link.first.href
				.replace(/^.*imdb\.com\/title\//, '')
				.replace(/\/(?:maindetails\/?)?$/, '');
	},

	"minions": () => {
		let actions = $('[href*="imdb.com/title/tt"] < *');

		if(actions.empty)
			return;

		actions.forEach(element => {
			let minion;
			let parent = furnish('span', {},
				furnish('img', { src: IMAGES.icon_16 }),
				minion = furnish('a.web-to-plex-minion', {}, 'Web to Plex')
			);

			addMinions(minion);
			element.appendChild(parent);
		});
	},
};
