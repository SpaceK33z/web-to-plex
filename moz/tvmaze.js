let script = {
	"url": "*://*.tvmaze.com/shows/*",

	"ready": () => !$('#general-info-panel .rateit').empty,

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title  = $('header.columns > h1').first,
			year   = $('#year').first,
			image  = $('figure img').first,
			type   = 'show',
			TVDbID = script.getTVDbID();

		title = title.textContent.trim();
		year  = +year.textContent.replace(/\((\d+).+\)/, '$1');
		image = (image || {}).src;

		return { type, title, year, image, TVDbID };
	},

	"getTVDbID": () => {
		let { pathname } = top.location;

		return pathname.replace(/\/shows\/(\d+).*/, '$1');
	},
};
