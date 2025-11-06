import express from "express";
import { addMember, getUserWorkspaces } from "../controllers/workspace-controller.js";

const router = express.Router();

router.get("/",  getUserWorkspaces)
router.post("/add-member",  addMember)

export default router;