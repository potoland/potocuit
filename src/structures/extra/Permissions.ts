import { PermissionFlagsBits } from 'discord-api-types/v10';
import { BitField } from './BitField';

export class PermissionsBitField extends BitField<typeof PermissionFlagsBits> {
	Flags = PermissionFlagsBits;
}
