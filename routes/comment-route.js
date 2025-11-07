import express from "express";
import { addComment, getComments } from "../controllers/commenct-controller.js";

const router = express.Router()

router.post("/", addComment)
router.get("/:taskId", getComments)

export default router;