import express from "express";
import { getHashtagPosts, getTrendingHashtags} from "../controllers/hashtagController.js";
import { loggedUser } from "../middlewares/authMiddleware.js";  
const router = express.Router();

router.get('/hashtag/:hashtag', loggedUser, getHashtagPosts);
router.get('/trending', getTrendingHashtags);


export default router;
