import {
	APIEmbed,
	APIEmbedAuthor,
	APIEmbedField,
	APIEmbedFooter,
	ObjectToLower, RestOrArray,
	toSnakeCase
} from '../../common';

export class MessageEmbed {
	constructor(public data: Partial<APIEmbed> = {}) {
		if (!data.fields) this.data.fields = [];
	}

	setAuthor(author: ObjectToLower<APIEmbedAuthor>): this {
		this.data.author = toSnakeCase(author);
		return this;
	}

	// TODO: Color resolve
	setColor(color: number): this {
		this.data.color = color;
		return this;
	}

	setDescription(desc: string): this {
		this.data.description = desc;
		return this;
	}

	addFields(...fields: RestOrArray<APIEmbedField>): this {
		this.data.fields = this.data.fields!.concat(fields.flat());
		return this;
	}

	setFields(fields: APIEmbedField[]): this {
		this.data.fields = fields;
		return this;
	}

	setFooter(footer: ObjectToLower<Omit<APIEmbedFooter, 'proxy_icon_url'>>): this {
		this.data.footer = toSnakeCase(footer);
		return this;
	}

	setImage(url: string): this {
		this.data.image = { url };
		return this;
	}

	setTimestamp(time: string | number | Date = Date.now()): this {
		this.data.timestamp = new Date(time).toISOString();
		return this;
	}

	setTitle(title: string): this {
		this.data.title = title;
		return this;
	}

	setURL(url: string): this {
		this.data.url = url;
		return this;
	}

	setThumbnail(url?: string) {
		this.data.thumbnail = url ? { url } : undefined;
		return this;
	}

	toJSON(): APIEmbed {
		return { ...this.data };
	}
}
