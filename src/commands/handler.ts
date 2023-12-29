import { basename, dirname } from 'node:path';
import type { LocaleString, Logger } from '@biscuitland/common';
import type { BaseClient } from '../client/base';
import { PotoHandler } from '../utils';
import { Command, SubCommand } from './commands';

export class PotoCommandHandler extends PotoHandler {
	values: Command[] = [];
	protected filter = (path: string) => path.endsWith('.js');

	constructor(protected logger: Logger) {
		super(logger);
	}

	async reload(resolve: string | Command) {
		if (typeof resolve === 'string') {
			return this.values.find((x) => x.name === resolve)?.reload();
		}
		return resolve.reload();
	}

	async reloadAll(stopIfFail = true) {
		for (const command of this.values) {
			try {
				await this.reload(command.name);
			} catch (e) {
				if (stopIfFail) {
					throw e;
				}
			}
		}
	}

	async load(commandsDir: string, client: BaseClient) {
		const result = (await this.loadFilesK<typeof Command>(await this.getFiles(commandsDir))).filter((x) => x.file);
		this.values = [];

		for (const command of result) {
			const commandInstance = new command.file();
			if (!(commandInstance instanceof Command)) {
				continue;
			}
			commandInstance.options ??= [] as NonNullable<Command['options']>;
			if (commandInstance.__d) {
				const options = await this.getFiles(dirname(command.path));
				for (const option of options) {
					if (command.name === basename(option)) {
						continue;
					}
					try {
						const subCommand = new (result.find((x) => x.path === option)!.file)();
						if (subCommand instanceof SubCommand) {
							commandInstance.options.push(subCommand);
						}
					} catch {
						//pass
					}
				}
			}

			for (const option of commandInstance.options ?? []) {
				if (option instanceof SubCommand) {
					option.middlewares = (commandInstance.middlewares ?? []).concat(option.middlewares ?? []);
					option.onMiddlewaresError =
						option.onMiddlewaresError?.bind(option) ?? commandInstance.onMiddlewaresError?.bind(commandInstance);
					option.onRunError = option.onRunError?.bind(option) ?? commandInstance.onRunError?.bind(commandInstance);
					option.onOptionsError =
						option.onOptionsError?.bind(option) ?? commandInstance.onOptionsError?.bind(commandInstance);
					option.onInternalError =
						option.onInternalError?.bind(option) ?? commandInstance.onInternalError?.bind(commandInstance);
				}
			}

			commandInstance.__filePath = command.path;
			this.values.push(commandInstance);
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
							name: [],
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

		return this.values;
	}
}
