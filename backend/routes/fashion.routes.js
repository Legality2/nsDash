import { Router } from 'express';
import * as ctrl  from '../controllers/fashion.controller.js';

const router = Router();

router.get('/stats',              ctrl.getStats);

router.get('/looks',              ctrl.getLooks);
router.post('/looks',             ctrl.createLook);
router.patch('/looks/:id/save',   ctrl.toggleSaveLook);
router.delete('/looks/:id',       ctrl.deleteLook);

router.get('/brands',             ctrl.getBrands);
router.post('/brands',            ctrl.createBrand);

export default router;
