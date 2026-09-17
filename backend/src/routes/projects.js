const express = require('express');
const { verifyToken } = require('../middleware/auth');
const {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
} = require('../controllers/projectController');
const {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

const router = express.Router();

// All project routes require authentication
router.use(verifyToken);

// Project CRUD
router.post('/', createProject);                   // POST   /api/projects
router.get('/', listProjects);                     // GET    /api/projects
router.get('/:id', getProject);                    // GET    /api/projects/:id
router.patch('/:id', updateProject);               // PATCH  /api/projects/:id
router.delete('/:id', deleteProject);              // DELETE /api/projects/:id
router.post('/:id/members', addMember);            // POST   /api/projects/:id/members

// Task CRUD (nested under project)
router.post('/:id/tasks', createTask);             // POST   /api/projects/:id/tasks
router.get('/:id/tasks', listTasks);               // GET    /api/projects/:id/tasks
router.get('/:id/tasks/:taskId', getTask);         // GET    /api/projects/:id/tasks/:taskId
router.patch('/:id/tasks/:taskId', updateTask);    // PATCH  /api/projects/:id/tasks/:taskId
router.delete('/:id/tasks/:taskId', deleteTask);   // DELETE /api/projects/:id/tasks/:taskId

module.exports = router;
