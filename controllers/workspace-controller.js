import prisma from "../configs/prisma.js";

// get all workspace for User
export const getUserWorkspaces = async (req, res) => {
  try {
    const { userId } = await req.auth();

    // get workspace membership
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            members: { include: { user: true } },
            projects: {
              include: {
                tasks: {
                  include: {
                    assignee: true,
                    comments: { include: { user: true } },
                  },
                },
                members: { include: { user: true } },
              },
            },
            owner: true,
          },
        },
      },
    });

    const workspaces = memberships.map((m) => m.workspace);

    return res.json({
      status: "success",
      workspaces, 
    });
  } catch (error) {
    console.error("Error fetching user workspaces:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch user workspaces",
    });
  }
};

// add member to workspace

export const addMember = async (req, res) => {
  try {
    const { userId } = await res.auth();
    const { workspaceId, email, role, message } = req.body;

    //check is user exiist
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    if (!workspaceId || !role) {
      return res.status(400).json({
        status: "error",
        message: "workspaceId and role are required",
      });
    }

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid role",
      });
    }
    //fetch workspace

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return res.status(404).json({
        status: "error",
        message: "Workspace not found",
      });
    }
    //check creater is admin or not
    if (
      !workspace.members.find(
        (member) => member.userId === userId && member.role === "ADMIN"
      )
    ) {
      return res.status(403).json({
        status: "error",
        message: "Only admin can add members",
      });
    }

    //check user is already member
    const existingMember = workspace.members.find(
      (member) => member.userId === user.id
    );
    if (existingMember) {
      return res.status(400).json({
        status: "error",
        message: "User is already a member",
      });
    }

    const member = await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId,
        role,
        message,
      },
    });

    return res.json({
      status: "success",
      data: { member },
    });
  } catch (error) {
    console.error("Error fetching user workspaces:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch user workspaces",
    });
  }
};
