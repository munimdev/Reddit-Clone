import { Entity, Property, PrimaryKey } from "@mikro-orm/core";
import { Field, ObjectType, Int } from "type-graphql";

@ObjectType()
@Entity()
export class Post {
	@Field(() => Int)
	@PrimaryKey()
	id!: number;

	@Field(() => String)
	@Property({ type: "text" })
	title!: string;

	@Field(() => String)
	@Property({ type: "date" })
	createdAt = new Date();

	@Field(() => String)
	@Property({ type: "date", onUpdate: () => new Date() })
	updatedAt = new Date();

	constructor(title: string) {
		this.title = title;
	}
}
