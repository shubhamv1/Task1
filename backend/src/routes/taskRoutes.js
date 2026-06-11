const router = require('express').Router();
const { body } = require('express-validator');
const taskController = require('../controllers/taskController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/:projectId/tasks', taskController.getByProject);

router.post(
  '/:projectId/tasks',
  [body('title').trim().notEmpty().withMessage('Task title is required')],
  validate,
  taskController.create
);

router.put('/:projectId/tasks/:taskId', taskController.update);
router.delete('/:projectId/tasks/:taskId', taskController.remove);

module.exports = router;
