import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { MikroORM } from "@mikro-orm/postgresql";
import { User } from "./entities/User";
import { POSTGRES_PASSWORD } from "./endpoints.config";
// import path from "path";

export default {
	// allowGlobalContext: true,
	migrations: {
		path: "./dist/migrations", // path to the folder with migrations
		pathTs: "./src/migrations", // path to the folder with TS migrations (if used, we should put path to compiled files in `path`)
		glob: "!(*.d).{js,ts}", // how to match migration files (all .js and .ts files, but not .d.ts)
	},
	entities: [Post, User],
	dbName: "lireddit",
	type: "postgresql",
	debug: !__prod__,
	user: "postgres",
	password: POSTGRES_PASSWORD,
} as Parameters<typeof MikroORM.init>[0];
