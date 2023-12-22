export type BitFieldResolvable = number | bigint | (number | bigint)[];

export class BitField {
  static None = 0;

  private bit: number;

  constructor(bitfields?: BitFieldResolvable) {
    this.bit = BitField.resolve(bitfields);
  }

  set bits(bits: BitFieldResolvable) {
    this.bit = BitField.resolve(bits);
  }

  get bits() {
    return this.bit;
  }

  add(...bits: BitFieldResolvable[]): number {
    let reduced = BitField.None;

    for (const bit of bits) {
      reduced |= BitField.resolve(bit);
    }

    return (this.bit |= reduced);
  }

  remove(...bits: BitFieldResolvable[]): number {
    let reduced = BitField.None;

    for (const bit of bits) {
      reduced |= BitField.resolve(bit);
    }

    return (this.bit &= ~reduced);
  }

  equals(bits: BitFieldResolvable): boolean {
    return BitField.equals(this.bits, bits);
  }

  static equals(main: BitFieldResolvable, other: BitFieldResolvable) {
    return !!(BitField.resolve(main) & BitField.resolve(other));
  }

  static resolve(bits?: BitFieldResolvable): number {
    switch (typeof bits) {
      case "number":
        return bits;
      case "bigint":
        return Number(bits);
      case "object":
        if (!Array.isArray(bits)) {
          throw new TypeError(`Cannot resolve permission: ${bits}`);
        }
        return bits.map(BitField.resolve).reduce((acc, cur) => acc | cur, BitField.None);
      default:
        throw new TypeError(`Cannot resolve permission: ${bits}`);
    }
  }
}
