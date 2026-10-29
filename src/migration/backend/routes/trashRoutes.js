const express = require('express');
const router = express.Router();
const { listTrash, restoreItem, purgeItem } = require('../controllers/trashController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/', listTrash);
router.post('/:resource/:id/restore', restoreItem);
router.delete('/:resource/:id', purgeItem);

module.exports = router;
