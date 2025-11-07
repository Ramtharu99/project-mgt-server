//add comment

import prisma from "../configs/prisma.js";

export const addComment = async (req, res) => {
    try {
        const {userId} = await req.auth();
        const {taskId, content} = req.body;

        const task = await prisma.task.findUnique({
            where: {id: taskId}
        })

        const project = await prisma.project.findUnique({
            where: {id: task.projectId},
            include: {members: {include: {user: true}}}
        })
        if(!task){
            return res.status(404).json({message: "Task not found"});
        }

        const member = project.members.find(member => member.userId === userId)

        if(!member){
            return res.status(403).json({message: "Only project members can add comments"});
        }

        const comment = await prisma.comment.create({
            data: {
                taskId,
                content,
                userId
            },
            include: {user: true}
        })
        return res.status(201).json({message: "Comment added successfully", comment});

    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

//get comments for task

export const getComments = async (req, res) => {
    try {
        const {taskId} = req.params;

        const comments = await prisma.comment.findMany({
            where: {taskId},
            include: {user: true}
        })
        return res.status(200).json({comments});
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}