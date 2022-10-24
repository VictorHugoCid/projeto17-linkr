import dayjs from "dayjs";
import { connection } from "../database/database.js";

import {postRepository } from '../repositories/postRepositories.js'

async function CreatePost(req, res) {
  const { userId, text, link } = req.body;
  const hashtagsArray = [];
  await text.split(" ").forEach((value) => {
    if (value[0] === "#") {
      hashtagsArray.push(value.replace("#", ""));
    }
  });

  try {
    // await connection.query('INSERT INTO posts ("userId", text, link) VALUES ($1, $2, $3)', [
    //   userId,
    //   text,
    //   link,
    // ]);
    
    await postRepository.insertPost(userId, text, link)

    if (hashtagsArray.length !== 0) {
      for (let i = 0; i < hashtagsArray.length; i++) {
        const atual = hashtagsArray[i];
        // const isHashtagExists = await connection.query(
        //   "SELECT (name) FROM hashtags WHERE name = $1",
        //   [atual]
        // );
        const isHashtagExists = await postRepository.getHashtagByName(atual)

        // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX olhar aqui se da pra resumir
        // nao precisa fazer tanto select
        if (isHashtagExists.rowCount !== 0) {
          const hashtagId = await connection.query("SELECT (id) from hashtags WHERE name = $1", [
            atual,
          ]);

          const postId = await connection.query(
            'SELECT (id) from posts WHERE "userId" = $1 AND text = $2 AND link = $3 LIMIT 1',
            [userId, text, link]
          );
          await connection.query('INSERT INTO "hashPost" ("postId", "hashtagId") VALUES ($1, $2)', [
            postId.rows[0].id,
            hashtagId.rows[0].id,
          ]);
          continue;
        }
        await connection.query("INSERT INTO hashtags (name) VALUES ($1)", [atual]);

        const hashtagId = await connection.query("SELECT (id) from hashtags WHERE name = $1", [
          atual,
        ]);
        const postId = await connection.query(
          'SELECT (id) from posts WHERE "userId" = $1 AND text = $2 AND link = $3 LIMIT 1',
          [userId, text, link]
        );
        await connection.query('INSERT INTO "hashPost" ("postId", "hashtagId") VALUES ($1, $2)', [
          postId.rows[0].id,
          hashtagId.rows[0].id,
        ]);
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
      users.name,
      users.id AS "userId",
      users."pictureUrl",
      likes.liked,
      posts."createdAt"
      FROM posts
      JOIN users ON posts."userId" = users.id
      JOIN likes ON users.id = likes."userId"
      ORDER BY posts."createdAt" DESC`
  );

  const getCount = await connection.query(
    `SELECT
      likes."postId",
      COUNT(likes."postId") as "count"
      FROM likes
      GROUP BY likes."postId"`
  );

  const ArrayPost = getPosts;
  const ArrayCount = getCount;

  let i = 0;
  const BodyArray = [];
  getPosts.rows.map((p) => {
    if (i > getPosts.rowCount) return;
    let j = 0;
    getCount.rows.map(() => {
      if (getCount.rows[j].postId === getPosts.rows[i].postId) {
        BodyArray.push({
          postId: getPosts.rows[i].postId,
          username: getPosts.rows[i].name,
          userId: getPosts.rows[i].userId,
          img: getPosts.rows[i].pictureUrl,
          text: getPosts.rows[i].text,
          link: getPosts.rows[i].link,
          likesQtd: parseInt(getCount.rows[j].count),
          liked: getPosts.rows[i].liked,
        });
      } else {
        BodyArray.push({
          postId: getPosts.rows[i].postId,
          username: getPosts.rows[i].name,
          userId: getPosts.rows[i].userId,
          img: getPosts.rows[i].pictureUrl,
          text: getPosts.rows[i].text,
          link: getPosts.rows[i].link,
          likesQtd: 0,
          liked: getPosts.rows[i].liked,
        });
      }
      j++;
    });
    i++;
  });
  res.status(201).send(BodyArray);
}

async function EditPost(req, res) {
  const { id } = req.params;
  const { link, text } = req.body;
  let textMessage,
    linkMessage = "";

  try {
    const getPosts = await connection.query("SELECT * FROM posts WHERE id = $1", [id]);

    if (link) {
      linkMessage = " Link";
      const updateLink = await connection.query("UPDATE posts SET link = $1 WHERE id = $2", [
        link,
        id,
      ]);
    }
    if (text) {
      textMessage = " Texto";
      const updateText = await connection.query("UPDATE posts SET text = $1 WHERE id = $2", [
        text,
        id,
      ]);
    }

    res.status(201).send({ message: `foram atualizados:${linkMessage} ${textMessage}` });
  } catch (error) {
    res.status(404).send({ message: "url não encontrado" });
  }
}

async function DeletePost(req, res) {
  const { id } = req.params;
  try {
    await postRepository.deletePost(id);
    res.status(204).send({ message: "menssagem deletada" });
  } catch (error) {
    res.status(501).send({ message: error.message });
  }
}

export { CreatePost, EditPost, DeletePost, GetPost };
