const express = require('express');
const { getDocuments, uploadDocument, getDocument, deleteDocument } = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { ROLES } = require('../utils/roles');

const router = express.Router();
router.get('/', protect, getDocuments);
router.post('/upload', protect, upload.single('file'), uploadDocument);
router.get('/:id', protect, getDocument);
router.delete('/:id', protect, authorize(ROLES.ADMIN, ROLES.RECEPTION), deleteDocument);
module.exports = router;
