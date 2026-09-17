const prisma = require('../prisma');

// Helper: check if user is a member of a project
async function getProjectMembership(projectId, userId) {
  return prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
}

// POST /api/projects — Create project (auth required)
const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required.' });
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        ownerId: req.user.id,
        members: {
          create: {
            userId: req.user.id,
            role: 'owner',
          },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
    });

    return res.status(201).json({ message: 'Project created successfully', project });
  } catch (error) {
    console.error('Create project error:', error);
    return res.status(500).json({ error: 'Failed to create project.' });
  }
};

// GET /api/projects — List projects where the user is a member
const listProjects = async (req, res) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      include: {
        project: {
          include: {
            owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
            _count: { select: { members: true, tasks: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const projects = memberships.map((m) => ({
      ...m.project,
      myRole: m.role,
    }));

    return res.status(200).json({ projects });
  } catch (error) {
    console.error('List projects error:', error);
    return res.status(500).json({ error: 'Failed to fetch projects.' });
  }
};

// GET /api/projects/:id — Get project details + members with workload
const getProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        tasks: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Check membership
    const membership = await getProjectMembership(id, req.user.id);
    if (!membership) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    }

    // Compute inProgressCount and isOverloaded for each member
    const membersWithWorkload = project.members.map((member) => {
      const inProgressCount = project.tasks.filter(
        (task) => task.assignedToId === member.userId && task.status === 'in_progress'
      ).length;

      return {
        ...member,
        inProgressCount,
        isOverloaded: inProgressCount > 5,
      };
    });

    return res.status(200).json({
      project: {
        ...project,
        members: membersWithWorkload,
      },
    });
  } catch (error) {
    console.error('Get project error:', error);
    return res.status(500).json({ error: 'Failed to fetch project.' });
  }
};

// PATCH /api/projects/:id — Update project (owner only)
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only the project owner can update this project.' });
    }

    const updateData = {};
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: 'Project name cannot be empty.' });
      }
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return res.status(200).json({ message: 'Project updated successfully', project: updated });
  } catch (error) {
    console.error('Update project error:', error);
    return res.status(500).json({ error: 'Failed to update project.' });
  }
};

// DELETE /api/projects/:id — Delete project (owner only)
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only the project owner can delete this project.' });
    }

    await prisma.project.delete({ where: { id } });

    return res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json({ error: 'Failed to delete project.' });
  }
};

// POST /api/projects/:id/members — Add member by email (owner only)
const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Owner check
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only the project owner can add members.' });
    }

    const userToAdd = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });

    if (!userToAdd) {
      return res.status(404).json({ error: 'User with this email not found.' });
    }

    // Check if already a member
    const existing = await getProjectMembership(id, userToAdd.id);
    if (existing) {
      return res.status(409).json({ error: 'User is already a member of this project.' });
    }

    const validRoles = ['member', 'owner'];
    const memberRole = validRoles.includes(role) ? role : 'member';

    const newMember = await prisma.projectMember.create({
      data: {
        userId: userToAdd.id,
        projectId: id,
        role: memberRole,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return res.status(201).json({ message: 'Member added successfully', member: newMember });
  } catch (error) {
    console.error('Add member error:', error);
    return res.status(500).json({ error: 'Failed to add member.' });
  }
};

module.exports = {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
};
