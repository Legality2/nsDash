import { Router } from 'express';
import * as ctrl  from '../controllers/finance.controller.js';

const router = Router();

router.post('/excel/parse',        ctrl.excelUpload.single('file'), ctrl.parseExcel);

router.get('/portfolio',           ctrl.getPortfolio);

router.get('/tickers',             ctrl.getTickers);
router.get('/tickers/:symbol',     ctrl.getTicker);
router.post('/tickers',            ctrl.createTicker);
router.patch('/tickers/:symbol',   ctrl.updateTicker);

router.get('/transactions',        ctrl.getTransactions);
router.post('/transactions',       ctrl.createTransaction);

export default router;
