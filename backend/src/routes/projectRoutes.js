const router = require('express').Router();
const { body } = require('express-validator');
const projectController = require('../controllers/projectController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', projectController.getAll);
router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Project name is required')],
  validate,
  projectController.create
);

router.get('/:id', projectController.getById);
router.put('/:id', projectController.update);
router.delete('/:id', projectController.remove);
router.post('/:id/members', projectController.addMember);

module.exports = router;
