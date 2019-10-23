let script = {
	"url": "*://*.netflix.com/watch/\\d+",

	"ready": () => {
		let element = $('[class$="__time"]').first;

		return element && !/^([0:]+|null|undefined)?$/.test(element.textContent);
	},

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title  = $('.video-title h4').first,
			year   = 0,
			image  = '',
			type   = script.getType();

		title = title.textContent;

		return { type, title, year, image };
	},

	"getType": () => {
		let element = $('[class*="playerEpisodes"]').first;

		return !!element? 'show': 'movie';
	},
};
