import supertest from "supertest";
import app from "../app.js";
import connection from "../database/database.js";

beforeEach(async () => {
	await connection.query("DELETE FROM users");
	await connection.query(`DELETE FROM sessions`);
	await connection.query(`DELETE FROM products`);
	await connection.query(`DELETE FROM sales`);
	await connection.query(`INSERT INTO users (id, name, cpf, email, password) values (1, 'teste', 123, 'teste', 123)`);
	await connection.query(`INSERT INTO sessions ("customerId", token) values (1, 1)`);
	await connection.query(
		`INSERT INTO products (title, description, image, "categoryId", price) values ('ssdteste', 'ssd super legal de teste', 'https://images-na.ssl-images-amazon.com/images/I/61U7T1koQqL._AC_SY450_.jpg', 6, 60)`
	);
});

afterAll(async () => {
	await connection.query("DELETE FROM users");
	await connection.query(`DELETE FROM sessions`);
	await connection.query(`DELETE FROM products`);
	await connection.query(`DELETE FROM sales`);
	connection.end();
});
/*
beforeAll( async () => {
	await connection.query(`INSERT INTO categories (id,title) values (1,'mouse')`);
	await connection.query(`INSERT INTO categories (id,title) values (2,'teclado')`);
	await connection.query(`INSERT INTO categories (id,title) values (3,'memoria_ram')`);
	await connection.query(`INSERT INTO categories (id,title) values (4,'placa_de_video')`);
	await connection.query(`INSERT INTO categories (id,title) values (5,'processador')`);
	await connection.query(`INSERT INTO categories (id,title) values (6,'ssd')`);

})*/
describe("GET products by category", () => {
	it("return status 400 with invalid category name", async () => {
		const result = await supertest(app).get(`/products/teste`);
		expect(result.status).toEqual(400);
	});
	it("return category products", async () => {
		await connection.query(
			`INSERT INTO products (title, description, image, price, "categoryId") values ('mouselegal', 'mouse super legal', 'https://images-na.ssl-images-amazon.com/images/I/71OrygkkeOL._AC_SY450_.jpg', 10, 1)`
		);
		await connection.query(
			`INSERT INTO products (title, description, image, price, "categoryId") values ('tecladolegal', 'teclado super legal', 'https://http2.mlstatic.com/D_NQ_NP_826537-MLA43977268687_112020-O.jpg', 20, 2)`
		);
		const result = await supertest(app).get("/products/mouse");
		expect(result.body).toEqual([
			{
				categoryId: 1,
				categoryName: "mouse",
				description: "mouse super legal",
				id: expect.any(Number),
				image: "https://images-na.ssl-images-amazon.com/images/I/71OrygkkeOL._AC_SY450_.jpg",
				price: 10,
				title: "mouselegal",
			},
		]);
	});
});

describe("GET products", () => {
	it("return products query search", async () => {
		await connection.query(
			`INSERT INTO products (title, description, image, price, "categoryId") values ('mouselegal', 'mouse super legal', 'https://images-na.ssl-images-amazon.com/images/I/71OrygkkeOL._AC_SY450_.jpg', 10, 1)`
		);
		await connection.query(
			`INSERT INTO products (title, description, image, price, "categoryId") values ('tecladolegal', 'teclado super legal', 'https://http2.mlstatic.com/D_NQ_NP_826537-MLA43977268687_112020-O.jpg', 20, 2)`
		);
		const result = await supertest(app).get("/products?search=mouse");
		expect(result.body.length).toEqual(1);
	});
	it("return products", async () => {
		const result = await supertest(app).get("/products");
		expect(typeof result.body).toEqual("object");
	});
});

describe("GET product by ID", () => {
	let id;
	beforeEach(async () => {
		const result = await connection.query("SELECT id FROM products");
		id = result.rows[0].id;
	});
	it("return correct product", async () => {
		const result = await supertest(app).get(`/product/${id}`);
		expect(result.body.id).toEqual(id);
	});
});
