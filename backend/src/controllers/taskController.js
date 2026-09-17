const prisma = require('../prisma');

const VALID_STATUSES = ['todo', 'in_progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

// Helper: check if user is a member of a project
async function getProjectMembership(projectId, userId) {
  return prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
}

// POST /api/projects/:id/tasks — Create a task in a project (members only)
const createTask = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { title, description, status, priority, dueDate, assignedToId, order } = req.body;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Membership check
    const membership = await getProjectMembership(projectId, req.user.id);
    if (!membership) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }

    // If assignedToId provided, verify that user is a member of this project
    if (assignedToId) {
      const assigneeMembership = await getProjectMembership(projectId, assignedToId);
      if (!assigneeMembership) {
        return res.status(400).json({ error: 'Assigned user is not a member of this project.' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || 'todo',
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId: assignedToId || null,
        projectId,
        order: typeof order === 'number' ? order : 0,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ error: 'Failed to create task.' });
  }
};

// GET /api/projects/:id/tasks — List tasks with optional filters (members only)
const listTasks = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { status, priority, assignedToId } = req.query;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Membership check
    const membership = await getProjectMembership(projectId, req.user.id);
    if (!membership) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    }

    const where = { projectId };

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Invalid status filter. Must be one of: ${VALID_STATUSES.join(', ')}` });
      }
      where.status = status;
    }

    if (priority) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({ error: `Invalid priority filter. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
      }
      where.priority = priority;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    return res.status(200).json({ tasks });
  } catch (error) {
    console.error('List tasks error:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
};

// GET /api/projects/:id/tasks/:taskId — Get single task
const getTask = async (req, res) => {
  try {
    const { id: projectId, taskId } = req.params;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const membership = await getProjectMembership(projectId, req.user.id);
    if (!membership) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    if (!task || task.projectId !== projectId) {
      return res.status(404).json({ error: 'Task not found in this project.' });
    }

    return res.status(200).json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    return res.status(500).json({ error: 'Failed to fetch task.' });
  }
};

// PATCH /api/projects/:id/tasks/:taskId — Update task (project owner or assignee only)
const updateTask = async (req, res) => {
  try {
    const { id: projectId, taskId } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Membership check
    const membership = await getProjectMembership(projectId, userId);
    if (!membership) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.projectId !== projectId) {
      return res.status(404).json({ error: 'Task not found in this project.' });
    }

    // Only project owner or task assignee can update
    const isProjectOwner = project.ownerId === userId;
    const isAssignee = task.assignedToId === userId;

    if (!isProjectOwner && !isAssignee) {
      return res.status(403).json({ error: 'Only the project owner or the assigned user can update this task.' });
    }

    const { title, description, status, priority, dueDate, assignedToId, order } = req.body;

    if (title !== undefined && (!title || !title.trim())) {
      return res.status(400).json({ error: 'Task title cannot be empty.' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }

    // If new assignedToId provided, verify they are a project member
    if (assignedToId !== undefined && assignedToId !== null) {
      const assigneeMembership = await getProjectMembership(projectId, assignedToId);
      if (!assigneeMembership) {
        return res.status(400).json({ error: 'Assigned user is not a member of this project.' });
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (order !== undefined) updateData.order = typeof order === 'number' ? order : 0;

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return res.status(200).json({ message: 'Task updated successfully', task: updated });
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({ error: 'Failed to update task.' });
  }
};

// DELETE /api/projects/:id/tasks/:taskId — Delete a task (project owner or assignee only)
const deleteTask = async (req, res) => {
  try {
    const { id: projectId, taskId } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Membership check
    const membership = await getProjectMembership(projectId, userId);
    if (!membership) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.projectId !== projectId) {
      return res.status(404).json({ error: 'Task not found in this project.' });
    }

    // Only project owner or task assignee can delete
    const isProjectOwner = project.ownerId === userId;
    const isAssignee = task.assignedToId === userId;

    if (!isProjectOwner && !isAssignee) {
      return res.status(403).json({ error: 'Only the project owner or the assigned user can delete this task.' });
    }

    await prisma.task.delete({ where: { id: taskId } });

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({ error: 'Failed to delete task.' });
  }
};

module.exports = {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
};
