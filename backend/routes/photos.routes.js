import { Router } from 'express';
import * as ctrl  from '../controllers/photos.controller.js';

const router = Router();

router.get('/stats',               ctrl.getStats);
router.get('/shoots',              ctrl.getShoots);
router.get('/clients',             ctrl.getClients);
router.get('/equipment',           ctrl.getEquipment);
router.get('/galleries',           ctrl.getGalleries);
router.patch('/shoots/:id/status', ctrl.updateShootStatus);

export default router;
