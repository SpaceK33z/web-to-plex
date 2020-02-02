let plugin = {
	"url": "*://*.indomovietv.*/(?!tag|$)",
	// TLD changes often: net, org

	"ready": () => !$('[itemprop="name"i]:not(meta), [itemprop="datePublished"i]').empty,

	"timeout": 1000,

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title = $('[itemprop="name"i]:not(meta)').first,
			year  = $('[itemprop="datePublished"i]').first,
			image = $('[itemprop="image"i]').first,
			type  = 'movie';

		title = title.textContent;
		year  = +year.textContent.replace(/[^]*(\d{4})[^]*/, '$1');
		image = image.src;

		// auto-prompt downloading for the user
		let links = $('[class~="idtabs"i] [href^="#div"i]');

		if(links.length > 1) {
			OLOAD_EVENTS.push(setTimeout(
				() => Notify('update', 'Finding download links...', 3000),
				500
			));

			links.forEach((link, index, array) => OLOAD_EVENTS.push(setTimeout(
				() => {
					link.click();

					if(index == links.length -1)
						OLOAD_EVENTS.push(setTimeout(
							() => Notify('update', 'No download links found'),
							7000
						));
				},
				index * 4500
			)));
		}

		return { type, title, year, image };
	},
},
	OLOAD_EVENTS = [];

top.addEventListener('message', request => {
	try {
		request = request.data;

		if(request)
			if(request.from || request.found)
				OLOAD_EVENTS.forEach(timeout => clearTimeout(timeout));
	} catch(error) {
		throw error;
	}
});
