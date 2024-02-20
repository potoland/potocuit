import { PermissionFlagsBits } from 'discord-api-types/v10';
import { PermissionStrings } from '../../common';
import { BitField, BitFieldResolvable } from './BitField';

export class PermissionsBitField extends BitField<typeof PermissionFlagsBits> {
	Flags = PermissionFlagsBits;

	declare keys: (...bits: BitFieldResolvable<typeof PermissionFlagsBits>[]) => PermissionStrings
}
