import { getterDecorator, methodDecorator, propertyDecorator, setterDecorator } from "./decorators";

export class Command {
	__xdd?: number;

	@methodDecorator
	testMethod() { }

	@setterDecorator
	set testSetter(value: number) {
		this.__xdd = value;
	}

	@getterDecorator
	get testGetter() {
		return this.__xdd;
	}

	@propertyDecorator
	propertyTest = () => { }

}
