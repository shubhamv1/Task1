const Task = require('../models/Task');
const Project = require('../models/Project');
const AppError = require('../utils/AppError');

const assertProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);
  const isMember =
    project.owner.toString() === userId.toString() ||
    project.members.map(String).includes(userId.toString());
  if (!isMember) throw new AppError('Access denied', 403);
  return project;
};

const getByProject = async (projectId, userId) => {
  await assertProjectAccess(projectId, userId);
  return Task.find({ project: projectId })
    .populate('assignee', 'name email')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};

const create = async (projectId, userId, data) => {
  await assertProjectAccess(projectId, userId);
  const task = await Task.create({ ...data, project: projectId, createdBy: userId });
  return task.populate([
    { path: 'assignee', select: 'name email' },
    { path: 'createdBy', select: 'name email' },
  ]);
};

const update = async (projectId, taskId, userId, updates) => {
  await assertProjectAccess(projectId, userId);
  const task = await Task.findOneAndUpdate(
    { _id: taskId, project: projectId },
    updates,
    { new: true, runValidators: true }
  )
    .populate('assignee', 'name email')
    .populate('createdBy', 'name email');
  if (!task) throw new AppError('Task not found', 404);
  return task;
};

const remove = async (projectId, taskId, userId) => {
  await assertProjectAccess(projectId, userId);
  const task = await Task.findOneAndDelete({ _id: taskId, project: projectId });
  if (!task) throw new AppError('Task not found', 404);
  return task;
};

module.exports = { getByProject, create, update, remove };
