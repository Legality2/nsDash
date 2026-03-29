import { Router } from 'express';
import * as ctrl  from '../controllers/trading.controller.js';

const router = Router();

/* Exchange connection configs */
router.get('/exchanges',          ctrl.getExchangeConfigs);
router.post('/exchanges',         ctrl.upsertExchangeConfig);
router.post('/exchanges/credentials', ctrl.saveExchangeCredentials);
router.delete('/exchanges/:exchange/credentials', ctrl.clearExchangeCredentials);

/* Trading bots */
router.get('/bots',               ctrl.getBots);
router.post('/bots',              ctrl.createBot);
router.patch('/bots/:id',         ctrl.updateBot);
router.delete('/bots/:id',        ctrl.deleteBot);
router.patch('/bots/:id/status',  ctrl.setBotStatus);

/* Bot orders */
router.get('/orders',             ctrl.getBotOrders);
router.post('/orders',            ctrl.createBotOrder);

export default router;
