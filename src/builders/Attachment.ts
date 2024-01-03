import { randomBytes } from 'crypto';
import path from 'node:path';
import { readFile, stat } from 'fs/promises';
import { RESTAPIAttachment, RawFile, throwError } from '..';

export interface AttachmentResolvableMap {
	url: string;
	buffer: Buffer;
	path: string;
}
export type AttachmentResolvable = AttachmentResolvableMap[keyof AttachmentResolvableMap];
export type AttachmentDataType = keyof AttachmentResolvableMap;
export interface AttachmentData {
	name: string;
	description: string;
	resolvable: AttachmentResolvable;
	type: AttachmentDataType;
}

export class Attachment {
	constructor(public data: Partial<AttachmentData> = { name: `${randomBytes(8).toString('base64url')}.jpg` }) { }

	setName(name: string) {
		this.data.name = name;
		return this;
	}

	setDescription(desc: string) {
		this.data.description = desc;
		return this;
	}

	setFile<T extends AttachmentDataType = AttachmentDataType>(type: T, data: AttachmentResolvableMap[T]) {
		this.data.type = type;
		this.data.resolvable = data;
	}

	setSpoiler(spoiler: boolean) {
		if (spoiler === this.spoiler) return this;
		if (spoiler) {
			this.data.name = this.data.name!.slice('SPOILER_'.length);
			return this;
		}
		this.data.name = `SPOILER_${this.data.name}`;
		return this;
	}

	get spoiler() {
		return this.data.name?.startsWith('SPOILER_') ?? false;
	}

	toJSON() {
		return this.data as AttachmentData;
	}
}

export function resolveAttachment(
	resolve: Attachment | AttachmentData | RESTAPIAttachment,
): Omit<RESTAPIAttachment, 'id'> {
	if ('id' in resolve) return resolve;

	if (resolve instanceof Attachment) {
		const data = resolve.toJSON();
		return { filename: data.name, description: data.description };
	}

	return { filename: resolve.name, description: resolve.description };
}

export async function resolveFiles(resources: Attachment[]): Promise<RawFile[]> {
	const data = await Promise.all(
		resources.map(async (resource, i) => {
			const { type, resolvable, name } = resource.toJSON();
			const resolve = await resolveAttachmentData(resolvable, type);
			return { ...resolve, key: `files[${i}]`, name } as RawFile;
		}),
	);

	return data;
}

export async function resolveAttachmentData(data: AttachmentResolvable, type: AttachmentDataType) {
	switch (type) {
		case 'url': {
			if (!/^https?:\/\//.test(data as string))
				return throwError(
					`The attachment type has been expressed as ${type.toUpperCase()} but cannot be resolved as one.`,
				);
			const res = await fetch(data as string);
			return { data: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get('content-type') };
		}
		case 'path': {
			const file = path.resolve(data as string);
			const stats = await stat(file);
			if (!stats.isFile())
				return throwError(
					`The attachment type has been expressed as ${type.toUpperCase()} but cannot be resolved as one.`,
				);
			return { data: await readFile(file) };
		}
		case 'buffer': {
			if (Buffer.isBuffer(data)) return { data };
			// @ts-expect-error
			if (typeof data[Symbol.asyncIterator] === 'function') {
				const buffers = [];
				for await (const resource of data) buffers.push(Buffer.from(resource));
				return { data: Buffer.concat(buffers) };
			}
			return throwError(
				`The attachment type has been expressed as ${type.toUpperCase()} but cannot be resolved as one.`,
			);
		}
		default: {
			return throwError(`The attachment type has been expressed as ${type} but cannot be resolved as one.`);
		}
	}
}

export function resolveBase64(data: string | Buffer) {
	if (Buffer.isBuffer(data)) return `data:image/jpg;base64,${data.toString('base64')}`;
	return data;
}

export async function resolveImage(image: AttachmentResolvable, type: AttachmentDataType) {
	if (!image) return null;
	if (typeof image === 'string' && image.startsWith('data:')) {
		return image;
	}
	const file = await resolveAttachmentData(image, type);
	return resolveBase64(file.data);
}
