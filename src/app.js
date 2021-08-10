import express from 'express';
import cors from 'cors';
import connection from './database/database.js';
import bcrypt from 'bcrypt';
import joi from 'joi';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import sendEmail from './functions/sendEmail.js';
dotenv.config('../.env');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/sign-up', async (req, res) => {
    const { name, email, password, cpf } = req.body;
    const userSchema = joi.object({
        name: joi.string().alphanum().min(3).max(30).required(),
        email: joi.string().email().required(),
        password: joi.string().min(6).required(),
        cpf: joi
            .string()
            .length(11)
            .pattern(/^[0-9]+$/)
            .required(),
    });
    const validation = userSchema.validate(req.body);
    try {
        if (await hasEmailOrCpf(email, cpf)) {
            res.sendStatus(409);
        } else if ('error' in validation) {
            res.sendStatus(400);
        } else {
            const hash = bcrypt.hashSync(password, 10);
            await connection.query(
                'INSERT INTO users (name, cpf, email, password) VALUES ($1, $2, $3, $4)',
                [name, cpf, email, hash]
            );
            res.sendStatus(201);
        }
    } catch (e) {
        res.sendStatus(500);
    }
});

async function hasEmailOrCpf(email, cpf) {
    const requestEmail = await connection.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
    );

    if (requestEmail.rows.length !== 0) {
        return true;
    } else {
        const requestCpf = await connection.query(
            'SELECT * FROM users WHERE cpf = $1',
            [cpf]
        );

        if (requestCpf.rows.length !== 0) {
            return true;
        } else {
            return false;
        }
    }
}

app.post('/sign-in', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.sendStatus(400);
    } else {
        try {
            const request = await connection.query(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );
            const customer = request.rows[0];
            if (customer && bcrypt.compareSync(password, customer.password)) {
                const secretKey = process.env.JWT_SECRET;
                const data = { name: customer.name };
                const token = jwt.sign(data, secretKey);
                await connection.query(
                    `
              INSERT INTO sessions ("customerId", token)
              VALUES ($1, $2)
            `,
                    [customer.id, token]
                );
                res.send({ name: customer.name, token, cpf: customer.cpf });
            } else {
                res.sendStatus(401);
            }
        } catch (e) {
            console.log(e);
            res.sendStatus(500);
        }
    }
});

app.post('/sales', async (req, res) => {
    try {
        const auth = req.headers.authorization;
        const user = await authUser(auth);
        const { cart, email } = req.body;
        if (user && cart) {
            const customerId = user.id;
            cart.forEach(async (p) => {
                await connection.query(
                    'INSERT INTO sales ("customerId", quantity, cep) VALUES ($1, $2, $3)',
                    [customerId, p.quantity, p.name]
                );
            });
            sendEmail(email, cart);
            res.sendStatus(201);
        } else {
            res.sendStatus(400);
        }
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

async function authUser(authorization) {
    const token = authorization.replace('Bearer ', '');
    const user = await connection.query(
        `SELECT * FROM sessions WHERE token = $1`,
        [token]
    );
    return user.rows[0];
}

app.get('/products/:category', async (req, res) => {
    try {
        const { category } = req.params;

        if (
            ![
                'mouse',
                'teclado',
                'memoria_ram',
                'placa_de_video',
                'processador',
                'ssd',
            ].includes(category)
        ) {
            return res.sendStatus(400);
        }

        const requestedData = await connection.query(
            `
    SELECT products.*, categories.title AS "categoryName", categories.id AS "categoryId" FROM products
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

app.get('/products', async (req, res) => {
    try {
        const search = req.query.search ? '%' + req.query.search + '%' : '%%';
        const requestedData = await connection.query(
            `
    SELECT products.*, categories.title AS "categoryName" FROM products
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

app.get("/product/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (isNaN(id)) return res.sendStatus(400);
        const requestedData = await connection.query(
            `
                SELECT products.*, categories.title AS "categoryName" FROM products
                JOIN categories
                ON products."categoryId" = categories.id
                WHERE products.id = $1
            `,
            [id]
        );
        if (requestedData.rows[0] === undefined) return res.sendStatus(404);
        res.send(requestedData.rows[0]);
    } catch {
        res.sendStatus(500);
    }
});

export default app;