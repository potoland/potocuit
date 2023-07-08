export interface Adapter {
	get(keys: string[]): RPV<any[]>;
	get(keys: string): RPV<any | null>;
	get(keys: string | string[]): RPV<any | null>;

	set(keyValue: [string, any][]): RPV<void>;
	set(id: string, data: any): RPV<void>;
	set(id: string | [string, any][], data?: any): RPV<void>;

	items(to: string, options?: any): RPV<any[]>;

	keys(to: string, options?: any): RPV<string[]>;

	count(to: string): RPV<number>;

	remove(keys: string | string[]): RPV<void>;

	// contains(to: string, keys: string[]): RPV<boolean[]>;
	contains(to: string, keys: string): RPV<boolean>;
	// contains(to: string, keys: string | string[]): RPV<boolean | boolean[]>;

	getToRelationship(to: string): RPV<string[]>;

	bulkAddToRelationShip(data: Record<string, string[]>): RPV<void>;

	addToRelationship(to: string, keys: string | string[]): RPV<void>;

	removeToRelationship(to: string, keys: string | string[]): RPV<void>;

	removeRelationship(to: string | string[]): RPV<void>;

}

export type RPV<V> = Promise<V> | V;
