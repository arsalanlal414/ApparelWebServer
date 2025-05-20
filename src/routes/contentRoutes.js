import express from 'express';
import { contentUpload } from '../middlewares/contentUploadMiddleware.js';
import { createContent, getCotent, productProvider } from '../controllers/contentController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, contentUpload.single('image'), createContent);
router.get('/', protect, getCotent);

router.post('/mockup/data', protect, contentUpload.single('image'), (req, res) => {
  console.log(req.file);
  console.log(req.body);
});

router.get('/products', protect, productProvider)

export default router;