//create task
import prisma from "../configs/prisma.js";
import { inngest } from "../inngest/index.js";

export const createTask = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const {
      projectId,
      title,
      description,
      type,
      status,
      priority,
      assigneeId,
      due_date,
    } = req.body;

    const origin = req.get("origin");
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { include: { user: true } } },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    } else if (project.team_lead !== userId) {
      return res
        .status(403)
        .json({ message: "Only team lead can create tasks" });
    } else if (
      !assigneeId &&
      !project.members.find((member) => member.user.id === assigneeId)
    ) {
      return res
        .status(400)
        .json({ message: "Assignee must be a member of the project" });
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description,
        priority,
        status,
        type,
        assigneeId,
        due_date: new Date(due_date),
      },
    });

    const taskWithAssignee = await prisma.task.findUnique({
      where: { id: task.id },
      include: { assignee: true },
    });

    await inngest.send({
      name: "app/task.assigned",
      data: {
        taskId: task.id,
        origin,
      },
    });

    return res
      .status(201)
      .json({
        message: "Task created successfully",
        task: taskWithAssignee,
        origin,
      });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//update task

export const updateTask = async (req, res) => {
  try {
    const { assigneeId } = req.body;
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    const { userId } = await req.auth();

    const project = await prisma.project.findUnique({
      where: { id: task.projectId },
      include: { members: { include: { user: true } } },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    } else if (project.team_lead !== userId) {
      return res
        .status(403)
        .json({ message: "Only team lead can create tasks" });
    } else if (
      !assigneeId &&
      !project.members.find((member) => member.user.id === assigneeId)
    ) {
      return res
        .status(400)
        .json({ message: "Assignee must be a member of the project" });
    }

    const updatedTask = await prisma.task.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return res
      .status(201)
      .json({ message: "Task created successfully", task: updatedTask });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//delete task

export const deleteTask = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { taskIds } = req.body;

    // Fetch tasks
    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
    });

    if (tasks.length === 0) {
      return res.status(404).json({ message: "Tasks not found" });
    }

    // Fetch project
    const project = await prisma.project.findUnique({
      where: { id: tasks[0].projectId },
      include: { members: { include: { user: true } } },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only team lead can delete tasks
    if (project.team_lead !== userId) {
      return res
        .status(403)
        .json({ message: "Only team lead can delete tasks" });
    }

    // Delete tasks
    await prisma.task.deleteMany({
      where: { id: { in: taskIds } },
    });

    return res.status(200).json({ message: "Tasks deleted successfully" });
  } catch (error) {
    console.error("Error deleting tasks:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
