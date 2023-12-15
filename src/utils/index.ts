export function isObject(o: any) {
	return o && typeof o === 'object' && !Array.isArray(o);
}

export function Options<T>(defaults: any, ...options: any[]): T {
	const option = options.shift();
	if (!option) { return defaults; }

	return Options(
		{
			...option,
			...Object.fromEntries(
				Object.entries(defaults).map(([key, value]) => [
					key,
					isObject(value) ? Options(value, option?.[key] || {}) : option?.[key] ?? value
				])
			)
		},
		...options
	);
}
