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
};
