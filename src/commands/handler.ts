import type { LocaleString, Logger } from '@biscuitland/common';
import { SubCommand } from './commands';
import { Command } from './commands';
import { readdir } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import type { BaseClient } from '../client/base';

export class PotoHandler {
	constructor(protected logger: Logger) { }

	protected async getFiles(dir: string) {
		const files: string[] = [];

		for (const i of await readdir(dir, { withFileTypes: true })) {
			if (i.isDirectory()) {
				files.push(...await this.getFiles(join(dir, i.name)));
			} else { files.push(join(dir, i.name)); }
		}

		return files;
	}

	protected async loadFiles<T extends NonNullable<unknown>>(paths: string[]): Promise<T[]> {
		return await Promise.all(paths.map(path => import(path).then(file => file.default ?? file)));
	}

	protected async loadFilesK<T>(paths: string[]): Promise<{ name: string; file: T; path: string }[]> {
		return await Promise.all(paths.map(path => import(path).then(file => {
			return {
				name: basename(path),// .split('.')[0],
				file: file.default ?? file,
				path
			};
		})));
	}
}

export class PotoCommandHandler extends PotoHandler {
	commands: Command[] = [];

	constructor(protected logger: Logger) {
		super(logger);
	}

	async reload(resolve: string | Command) {
		if (typeof resolve === 'string') {
			return this.commands.find(x => x.name === resolve)?.reload();
		}
		return resolve.reload();
	}

	async reloadAll(stopIfFail = true) {
		for (const command of this.commands) {
			try {
				await this.reload(command.name);
			} catch (e) {
				if (stopIfFail) { throw e; }
			}
		}
	}

	async load(commandsDir: string, client: BaseClient) {
		const result = (await this.loadFilesK<typeof Command>(await this.getFiles(commandsDir))).filter(x => x.file);
		this.commands = [];

		for (const command of result) {
			const commandInstance = new command.file();
			if (!(commandInstance instanceof Command)) { continue; }
			commandInstance.options ??= [] as NonNullable<Command['options']>;
			if (commandInstance.__d) {
				const options = await this.getFiles(dirname(command.path));
				for (const option of options) {
					if (command.name === basename(option)) { continue; }
					const subCommand = result.find(x => x.path === option);
					if (subCommand instanceof SubCommand) {
						commandInstance.options.push(subCommand as never);
					}
				}
			}

			for (const option of commandInstance.options ?? []) {
				if (option instanceof SubCommand) {
					option.middlewares = (commandInstance.middlewares ?? []).concat(option.middlewares ?? []);
					option.onMiddlewaresError = option.onMiddlewaresError?.bind(option) ?? commandInstance.onMiddlewaresError?.bind(commandInstance);
					option.onRunError = option.onRunError?.bind(option) ?? commandInstance.onRunError?.bind(commandInstance);
					option.onOptionsError = option.onOptionsError?.bind(option) ?? commandInstance.onOptionsError?.bind(commandInstance);
					option.onInternalError = option.onInternalError?.bind(option) ?? commandInstance.onInternalError?.bind(commandInstance);
				}
			}

			commandInstance.__filePath = command.path;
			this.commands.push(commandInstance);
			if (commandInstance.__t) {
				commandInstance.name_localizations = {};
				commandInstance.description_localizations = {};
				for (const locale of Object.keys(client.langs.record)) {
					const valueName = client.langs.getKey(locale, commandInstance.__t.name);
					if (valueName) {
						commandInstance.name_localizations[locale as LocaleString] = valueName;
					}
					const valueKey = client.langs.getKey(locale, commandInstance.__t.description);
					if (valueKey) {
						commandInstance.description_localizations[locale as LocaleString] = valueKey;
					}
				}
			}

			if (commandInstance.__tGroups) {
				commandInstance.groups = {};
				for (const locale of Object.keys(client.langs.record)) {
					for (const group in commandInstance.__tGroups) {
						commandInstance.groups[group] ??= {
							defaultDescription: commandInstance.__tGroups[group].defaultDescription,
							description: [],
							name: []
						};

						const valueName = client.langs.getKey(locale, commandInstance.__tGroups[group].name);
						if (valueName) {
							commandInstance.groups[group].name!.push([locale as LocaleString, valueName]);
						}

						const valueKey = client.langs.getKey(locale, commandInstance.__tGroups[group].description);
						if (valueKey) {
							commandInstance.groups[group].description!.push([locale as LocaleString, valueKey]);
						}
					}
				}
			}
		}

		return this.commands;
	}
}
