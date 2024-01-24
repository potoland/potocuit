import { PermissionFlagsBits } from 'discord-api-types/v10';
import { BitField } from './BitField';

export class PermissionsBitField extends BitField {
	has(...bits: (keyof typeof PermissionFlagsBits)[]) {
		return super.has(...bits.map(bit => PermissionFlagsBits[bit]));
	}
}
