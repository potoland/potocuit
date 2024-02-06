import type { RESTAPIAttachment } from 'discord-api-types/v10';
import { randomBytes } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { throwError } from '..';
import type { RawFile } from '../api';

export interface AttachmentResolvableMap {
	url: string;
	buffer: Buffer;
	path: string;
}
export type AttachmentResolvable = AttachmentResolvableMap[keyof AttachmentResolvableMap] | Attachment;
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
		return this;
	}

	setSpoiler(spoiler: boolean) {
		if (spoiler === this.spoiler) return this;
		if (!spoiler) {
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

export async function resolveFiles(resources: (Attachment | RawFile)[]): Promise<RawFile[]> {
	const data = await Promise.all(
		resources.map(async (resource, i) => {
			if (resource instanceof Attachment) {
				const { type, resolvable, name } = resource.toJSON();
				const resolve = await resolveAttachmentData(resolvable, type);
				return { ...resolve, key: `files[${i}]`, name } as RawFile;
			}
			return {
				data: resource.data,
				contentType: resource.contentType,
				key: `files[${i}]`,
				name: resource.name,
			} as RawFile;
		}),
	);

	return data;
}

export async function resolveAttachmentData(data: AttachmentResolvable, type: AttachmentDataType) {
	if (data instanceof Attachment) {
		if (!data.data.resolvable)
			return throwError('The attachment type has been expressed as attachment but cannot be resolved as one.');
		return { data: data.data.resolvable! };
	}

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

export type ImageResolvable = { data: AttachmentResolvable; type: AttachmentDataType } | Attachment;

export async function resolveImage(image: ImageResolvable): Promise<string> {
	if (image instanceof Attachment) {
		const {
			data: { type, resolvable },
		} = image;
		if (type && resolvable) return resolveBase64((await resolveAttachmentData(resolvable, type)).data as Buffer);
		return throwError(
			`The attachment type has been expressed as ${(
				type ?? 'Attachment'
			).toUpperCase()} but cannot be resolved as one.`,
		);
	}

	const file = await resolveAttachmentData(image.data, image.type);
	return resolveBase64(file.data as Buffer);
}
