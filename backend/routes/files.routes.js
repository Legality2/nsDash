import { Router } from 'express';
import * as ctrl  from '../controllers/files.controller.js';

const router = Router();

// All routes in this file are already protected by the global verifyToken
// applied in server.js:  app.use('/api/files', verifyToken, filesRouter)

router.post('/upload', ctrl.fileUpload.single('file'), ctrl.uploadFile);
router.get('/',        ctrl.getFiles);
router.get('/:id',     ctrl.getFile);
router.delete('/:id',  ctrl.deleteFile);

export default router;
