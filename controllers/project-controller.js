import prisma from "../configs/prisma.js";

//create project
export const createProject = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const {
      workspaceId,
      description,
      name,
      status,
      start_date,
      end_date,
      team_members,
      team_lead,
      progress,
      priority,
    } = req.body;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } } },
    });

    if (!workspace) {
      return res.status(404).json({
        status: "error",
        message: "Workspace not found",
      });
    }

    if (
      !workspace.members.some(
        (member) => member.userId === userId && member.role === "ADMIN"
      )
    ) {
      return res.status(403).json({
        status: "error",
        message: "Only admin can create project",
      });
    }
    //get team lead using email
    const teamLead = await prisma.user.findUnique({
      where: { email: team_lead },
      select: { id: true },
    });

    const project = await prisma.project.create({
      data: {
        workspaceId,
        name,
        description,
        status,
        priority,
        progress,
        team_lead: teamLead ? teamLead.id : null,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
      },
    });

    //add members to project
    if (team_members?.length > 0) {
      const membersToAdd = [];

      workspace.members.forEach((member) => {
        if (team_members.includes(member.user.email)) {
          membersToAdd.push(member.userId);
        }
      });
      await prisma.projectMember.createMany({
        data: membersToAdd.map((userId) => ({
          projectId: project.id,
          userId,
        })),
      });
    }

    const projectWithMembers = await prisma.project.findUnique({
      where: {
        id: project.id,
      },
      include: {
        members: {
          include: { user: true },
        },
        tasks: {
          include: { assignee: true, comments: { include: { user: true } } },
        },
      },
    });

    return res
      .status(201)
      .json({
        project: projectWithMembers,
        message: "Project created successfully",
      });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};

//update project

export const updateProject = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const {
      id,
      workspaceId,
      description,
      name,
      status,
      start_date,
      end_date,
      progress,
      priority,
    } = req.body;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } } },
    });

    if (!workspace) {
      return res.status(404).json({
        status: "error",
        message: "Workspace not found",
      });
    }

    if (
      !workspace.members.some(
        (member) => member.userId === userId && member.role === "ADMIN"
      )
    ) {
      res.status(403).json({
        status: "error",
        message: "Only admin can update project",
      });

      const project = await prisma.project.findUnique({
        where: { id },
      })
      
      if (!project) {
        return res.status(404).json({
          status: "error",
          message: "Project not found",
        });
      } else if (project.team_lead !== userId) {
        return res.status(403).json({
          status: "error",
          message: "Only team lead can update project",
        });
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        workspaceId,
        description,
        name,
        status,
        priority,
        progress,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
      },
    });

    return res
      .status(200)
      .json({ project, message: "Project updated successfully" });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};

//add member to project
export const addMemberToProject = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { projectId } = req.params;
    const { email } = req.body;

    //check is the user is project lead
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { include: { user: true } } },
    });
    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }
    if (project.team_lead !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Only team lead can add member to project",
      });
    }
    const existingMember = project.members.find(
      (member) => member.user.email === email
    );
    if (existingMember) {
      return res.status(400).json({
        status: "error",
        message: "User is already a member",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });
    if(!user){
      return res.status(404).json({
        status: "error",
        message: "User not found",
      })
    }
    const newMember = await prisma.projectMember.create({
      data: {
        userId: user.id,
        projectId,
      }
    })
    return res.status(200).json({
      member: newMember,
      message: "Member added to project successfully",
    })
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};
