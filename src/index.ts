import "reflect-metadata";
import { MikroORM, RequestContext } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import microConfig from "./mikro-orm.config";
// import { EntityManager, EntityRepository } from "@mikro-orm/postgresql";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";

const main = async () => {
	const orm = await MikroORM.init(microConfig); // connect to the database

	await RequestContext.createAsync(orm.em, async () => {
		await orm.getMigrator().up(); // run migrations

		const app = express(); // create an express app

		const apolloServer = new ApolloServer({
			schema: await buildSchema({
				resolvers: [HelloResolver, PostResolver],
				validate: false, // this is for the class-validator package
			}),
			context: () => ({ em: orm.em }), // this is a special object that is accessible by all resolvers
		});

		await apolloServer.start();
		apolloServer.applyMiddleware({ app }); // create a graphql endpoint on express

		app.listen(4000, () => {
			console.log("server started on localhost:4000");
		});
		// const post = orm.em.create(Post, {
		// 	title: "my first post",
		// 	createdAt: new Date(),
		// 	updatedAt: new Date(),
		// });
		// await orm.em.persistAndFlush(post);
		// console.log(post);
		// const em = orm.em as EntityManager;
		// const qb = em.createQueryBuilder(Post);
		// const posts = await qb.getKnexQuery().select("*");
		// const posts = await orm.em.find(Post, {});
		// const deletePosts = await orm.em.nativeDelete(Post, {});
		// console.log(deletePosts);
		// console.log(posts);
		// await orm.em.nativeInsert(Post, { title: "my first post 2" }); // deprecated
	});
};

main().catch((err) => {
	console.error(err);
});
