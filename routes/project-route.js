import express from 'express';
import { addMemberToProject, createProject, updateProject } from '../controllers/project-controller.js';

const router = express.Router();

router.post("/", createProject)
router.put("/", updateProject)
router.post("/:projectId/addMember", addMemberToProject)

export default router;