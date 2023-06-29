import { Entity, Property, PrimaryKey } from "@mikro-orm/core";
import { Field, ObjectType, Int } from "type-graphql";

@ObjectType()
@Entity()
export class User {
	@Field(() => Int)
	@PrimaryKey()
	id!: number;

	@Field(() => String)
	@Property({ type: "date" })
	createdAt = new Date();

	@Field(() => String)
	@Property({ type: "date", onUpdate: () => new Date() })
	updatedAt = new Date();

	@Field(() => String)
	@Property({ type: "text", unique: true })
	username!: string;

	// We don't want to expose the password to the client, so we don't add a @Field() here.
	@Property({ type: "text" })
	password!: string;
}
