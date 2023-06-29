import "reflect-metadata";
import { MikroORM, RequestContext } from "@mikro-orm/core";
import { __prod__ } from "./constants";
// import { Post } from "./entities/Post";
import microConfig from "./mikro-orm.config";
// import { EntityManager, EntityRepository } from "@mikro-orm/postgresql";
import express from "express";
// import { ApolloServer } from "apollo-server-express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import http from "http";
import cors from "cors";
import { json } from "body-parser";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import RedisStore from "connect-redis";
import session from "express-session";
import { createClient } from "redis";
import { SESSION_SECRET } from "./endpoints.config";
import { MyContext } from "./types";

const main = async () => {
	const orm = await MikroORM.init(microConfig); // connect to the database

	await RequestContext.createAsync(orm.em, async () => {
		await orm.getMigrator().up(); // run migrations

		const app = express(); // create an express app
		const httpServer = http.createServer(app);

		let redisClient = createClient();
		redisClient.connect().catch(console.error);

		let redisStore = new RedisStore({
			client: redisClient,
			disableTouch: true,
			prefix: "myapp:",
		});

		app.use(
			session({
				name: "qid",
				store: redisStore,
				resave: false, // required: force lightweight session keep alive (touch)
				saveUninitialized: false, // recommended: only save session when data exists
				secret: SESSION_SECRET,
				cookie: {
					maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
					httpOnly: true, // recommended: don't allow client JS access to cookie
					secure: __prod__, // only send cookie over https
					sameSite: "lax", // CSRF
				},
			})
		);

		// const apolloServer = new ApolloServer({
		// 	schema: await buildSchema({
		// 		resolvers: [HelloResolver, PostResolver, UserResolver],
		// 		validate: false, // this is for the class-validator package
		// 	}),
		// 	context: ({ req, res }): MyContext => ({ em: orm.em, req, res }), // this is a special object that is accessible by all resolvers
		// });
		const apolloServer = new ApolloServer<MyContext>({
			schema: await buildSchema({
				resolvers: [HelloResolver, PostResolver, UserResolver],
				validate: false, // this is for the class-validator package
			}),
			plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
		});

		await apolloServer.start();
		app.use(
			"/graphql",
			cors<cors.CorsRequest>(),
			json(),
			expressMiddleware(apolloServer, {
				context: async ({ req, res }): Promise<MyContext> => ({
					// token: req.headers.token,
					em: orm.em,
					req,
					res,
				}),
			})
		);
		// apolloServer.applyMiddleware({ app, cors }); // create a graphql endpoint on express
		await new Promise<void>((resolve) =>
			httpServer.listen({ port: 4000 }, resolve)
		);
		// app.listen(4000, () => {
		// 	console.log("server started on localhost:4000");
		// });
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
