/* global Update(type:string, details:object) */
if(init && typeof init == 'function')
	/* Do nothing */;
else
	(init = () => Update('PLUGIN', { instance_type: 'PLUGIN', plugin: location.hostname.replace(/(?:[\w\-]+\.)?([^\.]+)(?:\.[^\\\/]+)/, '$1') }))();
