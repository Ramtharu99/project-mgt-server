import express from "express";
import { createTask, deleteTask, updateTask } from "../controllers/task-controller.js";

const router = express.Router();

router.post('/', createTask)
router.put('/:id', updateTask)
router.post('/delete', deleteTask)

export default router;