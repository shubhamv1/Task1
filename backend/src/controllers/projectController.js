const projectService = require('../services/projectService');

const getAll = async (req, res, next) => {
  try {
    const projects = await projectService.getAll(req.user._id);
    res.json({ success: true, count: projects.length, projects });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const project = await projectService.getById(req.params.id, req.user._id);
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const project = await projectService.create(req.body, req.user._id);
    res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const project = await projectService.update(req.params.id, req.user._id, req.body);
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await projectService.remove(req.params.id, req.user._id);
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};

const addMember = async (req, res, next) => {
  try {
    const project = await projectService.addMember(req.params.id, req.user._id, {
      email: req.body.email,
      memberId: req.body.memberId,
    });
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove, addMember };
