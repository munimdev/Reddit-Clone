import { User } from "../entities/User";
import { MyContext } from "src/types";
import {
	Resolver,
	Ctx,
	Arg,
	Mutation,
	InputType,
	Field,
	ObjectType,
} from "type-graphql";
import argon2 from "argon2";
import { Query } from "type-graphql";

@InputType()
class UsernamePasswordInput {
	@Field()
	username: string;
	@Field()
	password: string;
}

@ObjectType()
class FieldError {
	@Field()
	field: string;
	@Field()
	message: string;
}

@ObjectType()
class UserResponse {
	@Field(() => [FieldError], { nullable: true }) // need to specify type here because we've allowed it to be undefined (with ?)
	errors?: FieldError[];

	@Field(() => User, { nullable: true })
	user?: User;
}

@Resolver()
export class UserResolver {
	@Query(() => User, { nullable: true })
	async me(@Ctx() { em, req }: MyContext) {
		if (!req.session!.userId) {
			// not logged in
			return null;
		}

		const user = await em.findOne(User, { id: req.session!.userId });
		return user;
	}

	@Mutation(() => UserResponse, { nullable: true })
	async register(
		@Arg("options", () => UsernamePasswordInput)
		options: UsernamePasswordInput,
		@Ctx() { em, req }: MyContext
	): Promise<UserResponse> {
		const existingUser = await em.findOne(User, {
			username: options.username,
		});
		if (existingUser) {
			return {
				errors: [
					{
						field: "username",
						message: "Username already exists",
					},
				],
			};
		}

		if (options.username.length <= 2) {
			return {
				errors: [
					{
						field: "username",
						message: "Username must be at least 3 characters long",
					},
				],
			};
		}

		if (options.password.length <= 3) {
			return {
				errors: [
					{
						field: "password",
						message: "Password must be at least 4 characters long",
					},
				],
			};
		}

		const hashedPassword = await argon2.hash(options.password);
		const user = em.create(User, {
			username: options.username,
			password: hashedPassword,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		await em.persistAndFlush(user);
		req.session!.userId = user.id;
		return { user };
	}

	@Mutation(() => UserResponse, { nullable: true })
	async login(
		@Arg("options", () => UsernamePasswordInput)
		options: UsernamePasswordInput,
		@Ctx() { em, req }: MyContext
	): Promise<UserResponse> {
		const user = await em.findOne(User, { username: options.username });
		if (!user) {
			return {
				errors: [
					{
						field: "username",
						message: "That username doesn't exist",
					},
				],
			};
		}
		const valid = await argon2.verify(user.password, options.password);
		if (!valid) {
			return {
				errors: [
					{
						field: "password",
						message: "Incorrect password",
					},
				],
			};
		}

		req.session!.userId = user.id; // store user id session, logging them in with a cookie

		return { user };
	}
}
