// Web to Plex - Shana Project Plugin
// Aurthor(s) - @ephellon (2018)
let plugin = {
	"url": "*://*.shanaproject.com/series/\\d+",

	"init": () => {
		let title = $('.overview i, #header_big .header_info_block')
				.first.textContent.trim(),
			year = +($('#header_big .header_info_block + *')
				.first.textContent.trim()
				.replace(/[^]*(\d{4})[^]*/m, '$1')),
			image = $('#header_big .header_display_box')
				.first.style['background-image'].trim()
				.replace(/url\((.+)\)/i, '$1');

		title = title.replace(RegExp(`\\s*\\(${ year }\\)`), '');

		return {
			type: 'show',
			title,
			year,
			image
		};
	},
};
