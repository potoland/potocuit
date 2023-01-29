interface EmbedFooter {
	text: string;
	icon_url?: string;
}

interface EmbedImage {
	url: string;
}

interface EmbedThumbnail {
	url: string;
}

interface EmbedAuthor {
	name: string;
	url?: string;
	icon_url?: string;
}

interface EmbedField {
	name: string;
	value: string;
	inline?: boolean;
}

export interface Embed {
	title?: string;
	description?: string;
	url?: string;
	timestamp?: string;
	color?: number;
	footer?: EmbedFooter;
	image?: EmbedImage;
	thumbnail?: EmbedThumbnail;
	author?: EmbedAuthor;
	fields?: EmbedField[];
}
