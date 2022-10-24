import { connection } from '../database/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import { authRepository } from '../repositories/authRepositories.js'

dotenv.config();

export async function signUp(req, res) {
    console.log("entrei Aqui");
    try {
        const { email, password, name, pictureUrl } = req.body;
        // const user = await connection.query(`
        // SELECT * FROM users
        // WHERE email = $1`,
        //     [email]);

        const user = await authRepository.getUserByEmail(email)

        if (user.rows.length !== 0) {
            return res.status(401).send('Email inserido já cadastrado ou inválido.');
        }

        const hashPass = bcrypt.hashSync(password, 10);

        // await connection.query(`
        // INSERT INTO users (email, password, name, "pictureUrl")
        // VALUES ($1, $2, $3, $4)`,
        //     [email, hashPass, name, pictureUrl]);

        await authRepository.signUp(name, email, hashPass, pictureUrl);

        res.sendStatus(201);

    } catch (error) {
        console.log(error)
        return res.sendStatus(500);
    }
};

export async function signIn(req, res) {

    try {
        const { email, password } = req.body;

        // const user = await connection.query(`
        // SELECT * FROM users 
        // WHERE email = $1`,
        //     [email]);
        const user = await authRepository.getUserByEmail(email)


        if (user.rows.length === 0) {
            return res.sendStatus(401);
        }

        const validPass = bcrypt.compareSync(password, user.rows[0].password);

        if (!validPass) {
            return res.sendStatus(401);
        }

        const secretKey = process.env.TOKEN_SECRET;
        const config = { expiresIn: 60 * 60 };

        const token = jwt.sign({ userId: user.rows[0].id }, secretKey, config);

        const userId = user.rows[0].id
        console.log(userId)
        // await connection.query('INSERT INTO sessions ("userId", token, "isValid") values ($1, $2, $3) ', [user.id, tokenJWT, true])
        await authRepository.signIn(userId, token, true)

        res.status(201).send({userId, token});

    } catch (error) {
        console.log(error)
        return res.sendStatus(500);
    }
};

export async function signOut(req, res) {
    const userId = res.locals.userId;
    const token = res.locals.token;
    console.log(userId);

    try {

        // await connection.query(`
        //         UPDATE 
        //             sessions
        //         SET 
        //         "isValid"=false
        //         WHERE
        //         "userId" = $1 AND token =$2
        //         ;`, [userId, token]);

        await sessionsRepository.signOut(userId, token)


        return res.redirect('/login');
    } catch (error) {
        console.log(error.message)
        return res.sendStatus(500);
    }
};