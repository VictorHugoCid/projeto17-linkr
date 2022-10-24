import { connection } from "../database/database.js";

async function insertPost(email) {
    const query = `INSERT INTO posts ("userId", text, link) VALUES ($1, $2, $3)`
    return connection.query(query, [email])
}

async function getHashtagByName(email) {
    const query = `INSERT INTO posts ("userId", text, link) VALUES ($1, $2, $3)`
    return connection.query(query, [email])
}

async function deletePost(id){
    const query = `DELETE FROM posts WHERE id = $1`
    return connection.query(query, [id])
}

const postRepository = {
    insertPost,
    getHashtagByName,
    deletePost
}

export { postRepository }