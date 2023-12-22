import { basename, join } from "node:path";
import type { Logger } from "@biscuitland/common";
import { readdir } from "fs/promises";

export function isObject(o: any) {
    return o && typeof o === "object" && !Array.isArray(o);
}

export function Options<T>(defaults: any, ...options: any[]): T {
    const option = options.shift();
    if (!option) {
        return defaults;
    }

    return Options(
        {
            ...option,
            ...Object.fromEntries(
                Object.entries(defaults).map(([key, value]) => [
                    key,
                    isObject(value) ? Options(value, option?.[key] || {}) : option?.[key] ?? value,
                ]),
            ),
        },
        ...options,
    );
}

export class PotoHandler {
    constructor(protected logger: Logger) {}

    protected filter = (path: string) => !!path;

    protected async getFiles(dir: string) {
        const files: string[] = [];

        for (const i of await readdir(dir, { withFileTypes: true })) {
            if (i.isDirectory()) {
                files.push(...(await this.getFiles(join(dir, i.name))));
            } else {
                if (this.filter(join(dir, i.name))) {
                    files.push(join(dir, i.name));
                }
            }
        }

        return files;
    }

    protected async loadFiles<T extends NonNullable<unknown>>(paths: string[]): Promise<T[]> {
        return await Promise.all(paths.map((path) => import(path).then((file) => file.default ?? file)));
    }

    protected async loadFilesK<T>(paths: string[]): Promise<{ name: string; file: T; path: string }[]> {
        return await Promise.all(
            paths.map((path) =>
                import(path).then((file) => {
                    return {
                        name: basename(path), // .split('.')[0],
                        file: file.default ?? file,
                        path,
                    };
                }),
            ),
        );
    }
}
