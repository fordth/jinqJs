declare module jinqJsSafe {
	export interface jinqJs {
		from<T>(collection: FromCollection<T>, ...collections: FromCollection<T>[]): jinqJs;
		from(url: string, callback?: (self: jinqJs) => void): void;

		select<T>(): T[];
		select<T>(predicate: Predicate<T>): T[];
		select<T>(field: string, ...fields: string[]): T[];
		select<T>(selectParameters: selectParameter<T>[]): T[]

		where(condition: string, ...conditions: string[]): jinqJs;
		where<T>(predicate: PredicateCondition<T>): jinqJs;

		filter(condition: string, ...conditions: string[]): jinqJs;
		filter<T>(predicate: PredicateCondition<T>): jinqJs;

		concat<T>(collection: Collection<T>, ...collections: Collection<T>[]): jinqJs;

		union<T>(collection: Collection<T>, ...collections: Collection<T>[]): jinqJs;

		join<T>(collection: Collection<T>, ...collections: Collection<T>[]): jinqJs;
		leftJoin<T>(collection: Collection<T>, ...collections: Collection<T>[]): jinqJs;
		fullJoin<T>(collection: Collection<T>, ...collections: Collection<T>[]): jinqJs;

		on(field: string, ...fields: string[]): jinqJs;
		on<I, O>(predicate: (inner: I, outer: O) => boolean): jinqJs;

		not(): jinqJs;
		in<T>(collect: Collection<T>, ...fields: string[]): jinqJs;

		groupBy(field: string, ...fields: string[]): jinqJs;
		sum(...fields: string[]): jinqJs;
		count(...fields: string[]): jinqJs;
		avg(...fields: string[]): jinqJs;
		min(...fields: string[]): jinqJs;
		max(...fields: string[]): jinqJs;

		distinct(...fields: string[]): jinqJs;
		distinct(fields: string[]): jinqJs;

		orderBy(field: string, ...fields: string[]): jinqJs;
		orderBy(orderByParams: orderByParameter[]): jinqJs;

		identity(): jinqJs;
		identity(fieldName: string): jinqJs;

		skip(amount: number): jinqJs;
		top(amount: number): jinqJs;
		bottom(amount: number): jinqJs;

		update<T>(predicate: PredicateCollection<T>): IAt;
		delete(): IAt;
	}

	export interface IAt {
		at(): jinqJs;
		at(...fields: string[]): jinqJs;
		at<T>(predicate: PredicateCollection<T>): jinqJs;
	}


	export interface jinqJsSettings {
		includeIdentity: boolean;
	}


	export interface jinqJsConstructor {
		new (): jinqJs;
		new (settings: jinqJsSettings): jinqJs;
		addPlugin(pluginName: string, predicate: PredicatePlugin): void;		//Adds static like member
	}

	export interface orderByParameter {
		field?: number | string;
		sort?: string;
	}

	export interface selectParameter<T> {
		field?: number | string;
		text?: string;
		value?: any | PredicateSelect<T>;
	}

	export type FromCollection<T> = string | any[] | T[];
	export type Collection<T> = T[];
	export type Predicate<T> = (row: T, index: number) => T;
	export type PredicateCondition<T> = (row: T, index: number) => boolean;
	export type PredicateSelect<T> = (row: T) => T;
	export type PredicatePlugin = (result: any[], args: any[], store: any) => void;
	export type PredicateCollection<T> = (collection: Collection<T>, index: number) => boolean;
}

//Declarations
declare var jinqJs: jinqJsSafe.jinqJsConstructor;

