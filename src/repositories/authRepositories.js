import { connection } from "../database/database.js";

async function signUp(name, email, password, pictureUrl) {
    const query = `INSERT INTO users (name, email, password, "pictureUrl") VALUES ($1, $2, $3, $4);`;
    return connection.query(query, [name, email, password, pictureUrl]);
}

async function signIn(id, token) {
    const query = `INSERT INTO sessions ("userId", token) VALUES ($1, $2);`;
    return connection.query(query, [id, token]);
}

async function getUserByEmail(email) {
    const query = `SELECT * FROM users WHERE email = $1;`;
    return connection.query(query, [email])
}

async function signOut(userId, token) {
    const query = `UPDATE sessions SET "isValid" = false WHERE "userId" = $1 AND token = $2;`;
    return connection.query(query, [userId, token]);
}


const authRepository = {
	signUp,
    getUserByEmail,
    signIn
};

export { authRepository };