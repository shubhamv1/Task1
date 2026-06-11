const Project = require('../models/Project');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const getAll = async (userId) => {
  return Project.find({
    $or: [{ owner: userId }, { members: userId }],
  })
    .populate('owner', 'name email')
    .populate('members', 'name email')
    .sort({ createdAt: -1 });
};

const getById = async (projectId, userId) => {
  const project = await Project.findById(projectId)
    .populate('owner', 'name email')
    .populate('members', 'name email');
  if (!project) throw new AppError('Project not found', 404);
  const isMember =
    project.owner._id.toString() === userId.toString() ||
    project.members.some((m) => m._id.toString() === userId.toString());
  if (!isMember) throw new AppError('Access denied', 403);
  return project;
};

const create = async ({ name, description }, userId) => {
  const project = await Project.create({ name, description, owner: userId, members: [userId] });
  return project.populate([
    { path: 'owner', select: 'name email' },
    { path: 'members', select: 'name email' },
  ]);
};

const update = async (projectId, userId, updates) => {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);
  if (project.owner.toString() !== userId.toString()) {
    throw new AppError('Only the project owner can update it', 403);
  }
  Object.assign(project, updates);
  return project.save();
};

const remove = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);
  if (project.owner.toString() !== userId.toString()) {
    throw new AppError('Only the project owner can delete it', 403);
  }
  await project.deleteOne();
};

const addMember = async (projectId, userId, { email, memberId }) => {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);
  if (project.owner.toString() !== userId.toString()) {
    throw new AppError('Only the project owner can add members', 403);
  }

  // Resolve the member either by email (preferred from UI) or by id
  let resolvedId = memberId;
  if (email) {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) throw new AppError('No user found with that email', 404);
    resolvedId = user._id.toString();
  }
  if (!resolvedId) throw new AppError('Provide an email or memberId', 400);

  if (project.members.map(String).includes(resolvedId)) {
    throw new AppError('User is already a member', 400);
  }
  project.members.push(resolvedId);
  await project.save();
  return project.populate([
    { path: 'owner', select: 'name email' },
    { path: 'members', select: 'name email' },
  ]);
};

module.exports = { getAll, getById, create, update, remove, addMember };
