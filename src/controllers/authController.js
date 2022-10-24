import { connection } from '../database/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import { authRepository } from '../repositories/authRepositories.js'

dotenv.config();

export async function signUp(req, res) {

    try {
        const { email, password, name, pictureUrl } = req.body;
        const user = await authRepository.getUserByEmail(email)

        if (user.rows.length !== 0) { 
            return res.status(401).send('Email inserido já cadastrado ou inválido.')
        }

        const hashPass = bcrypt.hashSync(password, 10);
        await authRepository.signUp(name, email, hashPass, pictureUrl);

        res.sendStatus(201);

    } catch (error) {
        return res.sendStatus(500);
    }
};

export async function signIn(req, res) {

    try {
        const { email, password } = req.body;
        const user = await authRepository.getUserByEmail(email)

        if (user.rows.length === 0) { return res.sendStatus(401); }

        const validPass = bcrypt.compareSync(password, user.rows[0].password);

        if (!validPass) { return res.sendStatus(401) }

        const secretKey = process.env.TOKEN_SECRET;
        const config = { expiresIn: 60 * 60 };
        const token = jwt.sign({ userId: user.rows[0].id }, secretKey, config);
        const userId = user.rows[0].id
        await authRepository.signIn(userId, token, true)
        res.status(201).send( {token, userId} );

    } catch (error) {
        console.log('ERROR CATCH :' , error)
        return res.sendStatus(500);
    }
};

export async function signOut(req, res) {
    const userId = res.locals.userId;
    const token = res.locals.token;

    try {
        await sessionsRepository.signOut(userId, token)

        return res.redirect('/login');
    } catch (error) {
        console.log(error.message)
        return res.sendStatus(500);
    }
};