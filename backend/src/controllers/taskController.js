const taskService = require('../services/taskService');
const { getIO } = require('../sockets/socketHandler');

const getByProject = async (req, res, next) => {
  try {
    const tasks = await taskService.getByProject(req.params.projectId, req.user._id);
    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const task = await taskService.create(req.params.projectId, req.user._id, req.body);
    getIO().to(req.params.projectId).emit('task:created', task);
    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const task = await taskService.update(
      req.params.projectId,
      req.params.taskId,
      req.user._id,
      req.body
    );
    getIO().to(req.params.projectId).emit('task:updated', task);
    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const task = await taskService.remove(
      req.params.projectId,
      req.params.taskId,
      req.user._id
    );
    getIO().to(req.params.projectId).emit('task:deleted', { _id: task._id });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getByProject, create, update, remove };
