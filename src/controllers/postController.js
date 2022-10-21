import dayjs from "dayjs";
import { connection } from "../database/database.js";

async function CreatePost(req, res) {
  const { userId, text, link } = req.body;
  const hashtagsArray = await text.split(" ").filter((value) => value[0] === "#");
  try {
    await connection.query('INSERT INTO posts ("userId", text, link) VALUES ($1, $2, $3)', [
      userId,
      text,
      link,
    ]);

    if (hashtagsArray.length !== 0) {
      for (let i = 0; i < hashtagsArray.length; i++) {
        const atual = hashtagsArray[i];
        const isHashtagExists = await connection.query(
          "SELECT (name) FROM hashtags WHERE name = $1",
          [atual]
        );

        if (isHashtagExists.rowCount !== 0) {
          const hashtagId = await connection.query("SELECT (id) from hashtags WHERE name = $1", [
            atual,
          ]);
          const postId = await connection.query(
            'SELECT (id) from posts WHERE "userId" = $1 AND text = $2 AND link = $3 LIMIT 1',
            [userId, text, link]
          );
          await connection.query('INSERT INTO "hashPost" ("postId", "hashtagId") VALUES ($1, $2)', [postId.rows[0].id, hashtagId.rows[0].id]);
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
        await connection.query('INSERT INTO "hashPost" ("postId", "hashtagId") VALUES ($1, $2)', [postId.rows[0].id, hashtagId.rows[0].id]);
      }
    }
    return res.sendStatus(201);
  } catch (error) {
    console.log(error)
    res.status(501).send({ message: error.message });
  }
}

async function GetPost(req, res) {
  try {
    const getPosts = await connection.query("SELECT * FROM posts");

    res.status(201).send(getPosts.rows);
  } catch (error) {
    res.status(404).send({ message: "url não encontrado" });
  }
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
    await connection.query("DELETE FROM posts WHERE id = $1", [id]);
    res.status(204).send({ message: "menssagem deletada" });
  } catch (error) {
    res.status(501).send({ message: error.message });
  }
}

export { CreatePost, EditPost, DeletePost, GetPost };
