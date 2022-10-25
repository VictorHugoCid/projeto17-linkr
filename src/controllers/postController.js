import dayjs from "dayjs";
import { connection } from "../database/database.js";
import { postRepository } from '../repositories/postRepositories.js'

async function CreatePost(req, res) {
  const { text, link } = req.body;
  const { userId } = res.locals

  const hashtagsArray = [];
  await text.split(" ").forEach((value) => {
    if (value[0] === "#") {
      hashtagsArray.push(value.replace("#", ""));
    }
  });

  try {
    // bloco insert post + like
    const liked = false
    await postRepository.insertPost(userId, text, link)
    const getPost = await connection.query(`
    SELECT * FROM posts 
    WHERE posts."userId" = $1`, [userId])
    const postId = (getPost.rows[(getPost.rows.length-1)].id)
    await postRepository.insertLike(userId, postId, liked)

    if (hashtagsArray.length !== 0) {
      for (let i = 0; i < hashtagsArray.length; i++) {
        const atual = hashtagsArray[i];
        const isHashtagExists = await postRepository.getHashtagIdByName(atual);
        let hashtagId;
        if (isHashtagExists.rowCount !== 0) {
          hashtagId = isHashtagExists.rows[0].id;
          await insertHashPost(hashtagId, userId, text, link);
          continue;
        }

        await postRepository.insertHashtag(atual);
        const newHashtagId = await postRepository.getHashtagIdByName(atual);
        hashtagId = newHashtagId.rows[0].id;
        await insertHashPost(hashtagId, userId, text, link)
      }
    }
    return res.sendStatus(201);
  } catch (error) {
    console.log(error);
    res.status(501).send({ message: error.message });
  }
}

async function GetPost(req, res) {

  
  const getPosts = await connection.query(
    `SELECT 
      posts.id AS "postId",
      posts.text,
      posts.link,
      users.name AS "username",
      users.id AS "userId",
      users."pictureUrl" AS "userImg",
      l.liked,
      posts."createdAt"
      FROM posts
      JOIN users ON posts."userId" = users.id
      JOIN (SELECT
        likes."postId",
        COUNT(likes."postId")-1 as "liked"
        FROM likes
        GROUP BY likes."postId") l ON posts.id = l."postId"
      ORDER BY posts."createdAt" DESC`
  )
  res.status(201).send(getPosts.rows);
}

async function EditPost(req, res) {
  const { id } = req.params;
  const { text } = req.body;
  let textMessage = "";

  try {
    const getPosts = await connection.query("SELECT * FROM posts WHERE id = $1", [id]);
    if (text) {
      textMessage = " Texto";
      const updateText = await connection.query("UPDATE posts SET text = $1 WHERE id = $2", [
        text,
        id,
      ]);
    }
    res.status(201).send({ message: `foram atualizados: ${textMessage}` });
  } catch (error) {
    res.status(404).send({ message: "url não encontrado" });
  }
}

async function DeletePost(req, res) {
  const { id } = req.params;
  try {
    // await connection.query("DELETE FROM posts WHERE id = $1", [id]);
    await postRepository.deletePost(id);
    res.status(204).send({ message: "menssagem deletada" });
  } catch (error) {
    res.status(501).send({ message: error.message });
  }
}

async function insertHashPost(hashtagId, userId, text, link) {
  const postId = await postRepository.getPostId(userId, text, link);
  await connection.query('INSERT INTO "hashPost" ("postId", "hashtagId") VALUES ($1, $2)', [
    postId.rows[0].id,
    hashtagId,
  ]);
}

async function updateLike(req, res) {
  const { userId, postId } = req.body

  try {




    await connection.query(`UPDATE posts SET liked=$1 WHERE posts.id = $2`, [liked, id])

    await connection.query(`INSERT INTO likes ("userId", "postId" VALUES ($1, $2))`, [userId, postId])

  } catch (error) {
    res.status(501).send({ message: error.message });
  }
}
export { CreatePost, EditPost, DeletePost, GetPost, updateLike };
