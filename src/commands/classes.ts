export class Command {
	__xdd?: number;

	testMethod() { }

	set testSetter(value: number) {
		this.__xdd = value;
	}

	get testGetter() {
		return this.__xdd;
	}

	propertyTest = () => { }

}
