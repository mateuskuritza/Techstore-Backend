import pg from "pg";

const { Pool } = pg;
const config = {
	user: "postgres",
	password: "123456",
	host: "localhost",
	port: 5432,
	database: process.env.NODE_ENV === "test" ? "techstore_test" : "techstore",
};
const connection = new Pool(config);

export default connection;
