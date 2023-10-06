import { Command } from "./classes"

export function methodDecorator(target: Command, context: string, value: TypedPropertyDescriptor<() => void>) {
	console.log('method', { target, context, value })
}

export function getterDecorator(target: Command, context: string, value: TypedPropertyDescriptor<number | undefined>) {
	console.log('getter', { target, context, value })
}

export function setterDecorator(target: Command, context: string, value: TypedPropertyDescriptor<number>) {
	console.log('setter', { target, context, value })
}

export function propertyDecorator(target: Command, context: string) {
	console.log('property', { target, context })
}
