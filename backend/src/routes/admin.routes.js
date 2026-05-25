const router = require('express').Router();
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const { getAllUsers, getAllActivities, getInactiveStudents } = require('../controllers/admin.controller');

router.use(authenticate, authorizeAdmin);

router.get('/users', getAllUsers);           // ?class=X to filter
router.get('/activities', getAllActivities);
router.get('/inactive', getInactiveStudents); // ?days=7

module.exports = router;
