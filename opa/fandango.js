let script = {
	"url": "*://*.fandango.com/[\\w\\-]+/movie-overview",

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title  = $('.subnav__title').first,
			year   = $('.movie-details__release-date').first,
			image  = $('.movie-details__movie-img').first,
			type   = 'movie';

		title = title.textContent.trim().split(/\n+/)[0].trim();
		year  = +year.textContent.replace(/.*(\d{4}).*/, '$1').trim();
		image = image.empty? '': image.src;

		title = title.replace(RegExp(`\\s*\\((${ year })\\)`), '');

		return { type, title, year, image };
	},

	"minions": () => {
		let actions = $('.subnav ul');

		if(actions.empty)
			return;

		actions.forEach(element => {
			let minion;
			let parent = furnish('li.web-to-plex-wrapper.subnav__link-item', {},
				minion = furnish('a.web-to-plex-minion.subnav__link', {}, 'Web to Plex')
			);

			addMinions(minion);
			element.appendChild(parent);
		});
	},
};
