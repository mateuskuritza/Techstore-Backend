import express from 'express';
import cors from 'cors';
import connection from './database/database.js';
import bcrypt from 'bcrypt';
import joi from 'joi';

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
        if (!('error' in validation)) {
            const hash = bcrypt.hashSync(password, 10);
            await connection.query(
                'INSERT INTO users (name, cpf, email, password) VALUES ($1, $2, $3, $4)',
                [name, cpf, email, hash]
            );
            res.sendStatus(201);
        } else {
            res.sendStatus(400);
        }
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

export default app;
