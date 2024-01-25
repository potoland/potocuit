export type BitFieldResolvable<T extends object> = keyof T | number | bigint | (keyof T | number | bigint)[];

export class BitField<T extends object> {
	static None = 0;
	Flags: Record<string, any> = {};

	private bit: number;

	constructor(bitfields?: BitFieldResolvable<T>) {
		this.bit = this.resolve(bitfields);
	}

	set bits(bits: BitFieldResolvable<T>) {
		this.bit = this.resolve(bits);
	}

	get bits(): number {
		return this.bit;
	}

	add(...bits: BitFieldResolvable<T>[]): number {
		let reduced = BitField.None;

		for (const bit of bits) {
			reduced |= this.resolve(bit);
		}

		return (this.bit |= reduced);
	}

	remove(...bits: BitFieldResolvable<T>[]): number {
		let reduced = BitField.None;

		for (const bit of bits) {
			reduced |= this.resolve(bit);
		}

		return (this.bit &= ~reduced);
	}

	has(...bits: BitFieldResolvable<T>[]) {
		const bitsResolved = bits.map(bit => this.resolve(bit));
		return bitsResolved.every(bit => (this.bits & bit) === bit);
	}

	equals(other: BitFieldResolvable<T>) {
		return this.bits === this.resolve(other);
	}

	resolve(bits?: BitFieldResolvable<T>): number {
		switch (typeof bits) {
			case 'number':
				return bits;
			case 'string':
				return this.Flags[bits]
			case 'bigint':
				return Number(bits);
			case 'object':
				if (!Array.isArray(bits)) {
					throw new TypeError(`Cannot resolve permission: ${bits}`);
				}
				return bits.map(x => this.resolve(x))
					.reduce((acc, cur) => acc | cur, BitField.None);
			default:
				throw new TypeError(`Cannot resolve permission: ${typeof bits === 'symbol' ? String(bits) : bits as any}`);
		}
	}
}
