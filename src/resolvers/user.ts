import { User } from "../entities/User";
import { MyContext } from "src/types";
import { Resolver, Query, Ctx, Arg, Int, Mutation } from "type-graphql";

@Resolver()
export class UserResolver {
	@Mutation(() => User, { nullable: true })
	async register(
		@Arg("username", () => String) username: string,
		@Arg("password", () => String) password: string,
		@Ctx() { em }: MyContext
	): Promise<User | null> {
		const user = em.create(User, {
			username,
			password,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		await em.persistAndFlush(user);
		return user;
	}
}
