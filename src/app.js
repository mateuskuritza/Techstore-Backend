import express from "express";
import cors from "cors";
import connection from "./database/database.js";
const app = express();
app.use(cors());
app.use(express.json());

async function authUser(authorization) {
	const token = authorization.replace("Bearer ", "");
	const user = await connection.query(`SELECT * FROM sessions WHERE token = $1`, [token]);
	return user.rows[0];
}

app.get("/products/:category", async (req, res) => {
	try {
		const authorization = req.headers["authorization"];
		const { category } = req.params;

		if (!["mouse", "teclado", "memoria_ram", "placa_de_video", "processador", "ssd"].includes(category) || !authorization) {
			return res.sendStatus(400);
		}
		const user = await authUser(authorization);
		if (!user) return res.sendStatus(401);

		const requestedData = await connection.query(
			`
    SELECT products.*, categories.title AS "categoryTitle", categories.id AS "categoryId" FROM products
    JOIN categories
    ON products."categoryId" = categories.id
    WHERE categories.title = $1`,
			[category]
		);
		res.send(requestedData.rows);
	} catch {
		res.sendStatus(500);
	}
});

app.get("/products", async (req, res) => {
	try {
		const authorization = req.headers["authorization"];
		if (!authorization) return res.sendStatus(400);
		const user = await authUser(authorization);
		if (!user) return res.sendStatus(401);

		const search = req.query.search ? "%" + req.query.search + "%" : "%%";
		const requestedData = await connection.query(
			`
    SELECT * FROM products
    JOIN categories
    ON products."categoryId" = categories.id
    WHERE products.title iLIKE $1
    `,
			[search]
		);
		res.send(requestedData.rows);
	} catch {
		res.sendStatus(500);
	}
});

export default app;

/*
await connection.query(
	`INSERT INTO products (title, description, image, "categoryId", price) values ('mouselegal', 'mouse super legal', 'https://images-na.ssl-images-amazon.com/images/I/71OrygkkeOL._AC_SY450_.jpg', 1, 10)`
);
await connection.query(
	`INSERT INTO products (title, description, image, "categoryId", price) values ('tecladolegal', 'teclado super legal', 'https://http2.mlstatic.com/D_NQ_NP_826537-MLA43977268687_112020-O.jpg', 2, 20)`
);
await connection.query(
	`INSERT INTO products (title, description, image, "categoryId", price) values ('memorialegal', 'memoria super legal', 'https://http2.mlstatic.com/D_NQ_NP_964396-MLA32170094202_092019-O.jpg', 3, 30)`
);
await connection.query(
	`INSERT INTO products (title, description, image, "categoryId", price) values ('placalegal', 'placa super legal', 'https://http2.mlstatic.com/D_NQ_NP_695979-MLA40023007473_122019-O.jpg', 4, 40)`
);
await connection.query(
	`INSERT INTO products (title, description, image, "categoryId", price) values ('processadorlegal', 'processador super legal', 'https://i.zst.com.br/images/os-8-melhores-processadores-intel-em-2019-photo760663649-44-17-13.jpg', 5, 50)`
);
await connection.query(
	`INSERT INTO products (title, description, image, "categoryId", price) values ('ssdlegal', 'ssd super legal', 'https://images-na.ssl-images-amazon.com/images/I/61U7T1koQqL._AC_SY450_.jpg', 6, 60)`
);*/
