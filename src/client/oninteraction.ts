import { ApplicationCommandType, InteractionType, type APIInteraction } from '@biscuitland/common';
import { CommandContext } from '../commands';
import { OptionResolver } from '../commands/handler';
import type { ChatInputCommandInteraction } from '../structures/Interaction';
import { AutocompleteInteraction, BaseInteraction } from '../structures/Interaction';
import type { BaseClient } from './base';

export async function onInteraction(body: APIInteraction, self: BaseClient) {
	switch (body.type) {
		case InteractionType.ApplicationCommandAutocomplete: {
			const packetData = body.data;
			const parentCommand = self.commands.commands.find(x => x.name === packetData.name)!;
			const optionsResolver = new OptionResolver(self.rest, self.cache, packetData.options ?? [], parentCommand, body.data.guild_id, body.data.resolved);
			const interaction = new AutocompleteInteraction(self.rest, self.cache, body);
			const command = optionsResolver.getAutocomplete();
			if (command?.autocomplete) {
				await command.autocomplete(interaction);
			}
		} break;
		case InteractionType.ApplicationCommand: {
			switch (body.data.type) {
				case ApplicationCommandType.ChatInput: {
					const packetData = body.data;
					const parentCommand = self.commands.commands.find(x => x.name === (packetData).name)!;
					const optionsResolver = new OptionResolver(self.rest, self.cache, packetData.options ?? [], parentCommand, packetData.guild_id, packetData.resolved);
					const interaction = BaseInteraction.from(self.rest, self.cache, body) as ChatInputCommandInteraction;
					const command = optionsResolver.getCommand();
					if (command?.run) {
						const context = new CommandContext(self, interaction, {}, {}, optionsResolver);
						const [erroredOptions, result] = await command.runOptions(context, optionsResolver);
						if (erroredOptions) { return await command.onRunOptionsError(context, result); }

						const [_, erroredMiddlewares] = await command.runMiddlewares(context);
						if (erroredMiddlewares) { return command.onStop(context, erroredMiddlewares); }

						await command.run(context);
					}
				} break;
			}
		} break;
	}
}
