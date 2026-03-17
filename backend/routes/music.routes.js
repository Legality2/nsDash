import { Router } from 'express';
import * as ctrl  from '../controllers/music.controller.js';

const router = Router();

router.get('/stats',               ctrl.getStats);
router.patch('/stats/now-playing', ctrl.updateNowPlaying);

router.get('/tracks',              ctrl.getTracks);
router.get('/tracks/:id',          ctrl.getTrack);
router.post('/tracks',             ctrl.createTrack);

router.get('/podcasts',            ctrl.getPodcasts);

export default router;
