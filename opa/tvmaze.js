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

	"minions": () => {
		let actions = $('nav.page-subnav > ul');

		if(actions.empty)
			return;

		actions.forEach(element => {
			let li = /^[ou]l$/i.test(element.tagName);

			let parent = furnish('li.web-to-plex-wrapper', {}),
				minion = furnish(`a.web-to-plex-minion.${ li? 'flatButton': 'roundButton' }`, {}, 'Web to Plex');

			if(li) {
				parent.appendChild(minion);
				element.appendChild(parent);
			} else {
				element.appendChild(minion);
			}

			addMinions(minion);
		});

	},
};
