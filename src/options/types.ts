export interface InputValues {
	plexToken: string;
	radarrToken: string;
	radarrBasicAuthUsername: string;
	radarrBasicAuthPassword: string;
	radarrQualityProfileId: string;
	radarrStoragePath: string;
	radarrUrlRoot: string;
	couchpotatoUrlRoot: string;
	couchpotatoToken: string;
	couchpotatoBasicAuthUsername: string;
	couchpotatoBasicAuthPassword: string;
}

export interface StoredItems extends InputValues {
	plexClientId: string;
	servers: {
		id: string;
		token: string;
		url?: string; // deprecated
		connections: { uri: string }[];
	}[];
}

export interface FormattedOptions {
	server: StoredItems['servers'][0];
	couchpotatoBasicAuth?: { username: string; password: string };
	couchpotatoUrl?: string;
	radarrBasicAuth?: { username: string; password: string };
	radarrUrl?: string;
	radarrToken?: string;
	radarrStoragePath?: string;
	radarrQualityProfileId?: string;
}
