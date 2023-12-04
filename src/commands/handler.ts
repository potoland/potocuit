import type { LocaleString, Logger } from '@biscuitland/common';
import { SubCommand } from './commands';
import { Command } from './commands';
import { readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { BaseClient } from '../client/base';

// type Interaction = Extract<GatewayInteractionCreateDispatchData, APIChatInputApplicationCommandInteraction>;

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
				name: basename(path).split('.')[0],
				file: file.default ?? file,
				path
			};
		})));
	}
}

export class PotoCommandHandler extends PotoHandler {
	commands: Command[] = [];

	constructor(protected logger: Logger, private client: BaseClient) {
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
			const commandInstancie = new command.file(this.client);
			if (!(commandInstancie instanceof Command)) { continue; }
			commandInstancie.client = this.client;
			for (const option of commandInstancie.options ?? []) {
				if (option instanceof SubCommand) {
					option.client = this.client;
				}
			}
			commandInstancie.__filePath = command.path;
			this.commands.push(commandInstancie);
			if (commandInstancie.__t) {
				commandInstancie.name_localizations = {};
				commandInstancie.description_localizations = {};
				for (const locale of Object.keys(client.langs.record)) {
					const valueName = client.langs.getKey(locale, commandInstancie.__t.name);
					if (valueName) {
						commandInstancie.name_localizations[locale as LocaleString] = valueName;
					}
					const valueKey = client.langs.getKey(locale, commandInstancie.__t.description);
					if (valueKey) {
						commandInstancie.description_localizations[locale as LocaleString] = valueKey;
					}
				}
			}

			if (commandInstancie.__tGroups) {
				commandInstancie.groups = {};
				for (const locale of Object.keys(client.langs.record)) {
					for (const group in commandInstancie.__tGroups) {
						commandInstancie.groups[group] ??= {
							defaultDescription: commandInstancie.__tGroups[group].defaultDescription,
							description: [],
							name: []
						};

						const valueName = client.langs.getKey(locale, commandInstancie.__tGroups[group].name);
						if (valueName) {
							commandInstancie.groups[group].name!.push([locale as LocaleString, valueName]);
						}

						const valueKey = client.langs.getKey(locale, commandInstancie.__tGroups[group].description);
						if (valueKey) {
							commandInstancie.groups[group].description!.push([locale as LocaleString, valueKey]);
						}
					}
				}
			}
		}

		return this.commands;
	}
}
