import { Router } from 'express';
import * as ctrl  from '../controllers/photos.controller.js';

const router = Router();

/* Stats */
router.get('/stats',                       ctrl.getStats);

/* Shoots */
router.get('/shoots',                      ctrl.getShoots);
router.post('/shoots',                     ctrl.createShoot);
router.patch('/shoots/:id/status',         ctrl.updateShootStatus);
router.patch('/shoots/:id',                ctrl.updateShoot);
router.delete('/shoots/:id',               ctrl.deleteShoot);

/* Clients */
router.get('/clients',                     ctrl.getClients);
router.post('/clients',                    ctrl.createClient);
router.patch('/clients/:id',               ctrl.updateClient);
router.delete('/clients/:id',              ctrl.deleteClient);

/* Packages */
router.get('/packages',                    ctrl.getPackages);

/* Equipment */
router.get('/equipment',                   ctrl.getEquipment);
router.patch('/equipment/:id/status',      ctrl.updateEquipmentStatus);

/* Galleries */
router.get('/galleries',                   ctrl.getGalleries);
router.patch('/galleries/:id/status',      ctrl.updateGalleryStatus);

export default router;
