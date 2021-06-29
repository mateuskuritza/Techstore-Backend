import supertest from 'supertest';
import app from '../app.js';
import connection from '../database/database.js';

beforeAll(async () => {
    await connection.query(
        `INSERT INTO users (id, name, cpf, email, password) values (1, 'teste', 11984536132, 'teste@teste3.com', 123456)`
    );
    await connection.query(
        `INSERT INTO sessions ("customerId", token) values (1, 1)`
    );
});

afterAll(async () => {
    await connection.query('DELETE FROM users');
    await connection.query(`DELETE FROM sessions`);
    connection.end();
});

describe('POST sign-up', () => {
    it('returns status 201 with valids parameters', async () => {
        const body = {
            name: 'teste',
            email: 'teste@teste.com',
            cpf: '01234567892',
            password: '123456',
        };
        const request = await supertest(app).post('/sign-up').send(body);
        expect(request.status).toEqual(201);
    });

    it('returns status 400 with invalids parameters', async () => {
        const body = {
            name: '',
            email: 'teste@teste2.com',
            cpf: '04925029780',
            password: '123456',
        };
        const request = await supertest(app).post('/sign-up').send(body);
        expect(request.status).toEqual(400);
    });

    it('returns status 409 with existing email', async () => {
        const body = {
            name: 'teste',
            email: 'teste@teste3.com',
            cpf: '01984536131',
            password: '123456',
        };
        const request = await supertest(app).post('/sign-up').send(body);
        expect(request.status).toEqual(409);
    });

    it('returns status 409 with existing cpf', async () => {
        const body = {
            name: 'teste',
            email: 'teste@teste0.com',
            cpf: '11984536132',
            password: '123456',
        };
        const request = await supertest(app).post('/sign-up').send(body);
        expect(request.status).toEqual(409);
    });
});
