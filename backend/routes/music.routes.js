import { Router } from 'express';
import * as ctrl  from '../controllers/music.controller.js';
import * as beatCtrl from '../controllers/beat.controller.js';

const router = Router();

// Existing routes
router.get('/stats',               ctrl.getStats);
router.patch('/stats/now-playing', ctrl.updateNowPlaying);

router.get('/tracks',              ctrl.getTracks);
router.get('/tracks/:id',          ctrl.getTrack);
router.post('/tracks',             ctrl.createTrack);

router.get('/podcasts',            ctrl.getPodcasts);

// Beat management routes
router.get('/beats',               beatCtrl.getBeats);
router.get('/beats/:id',           beatCtrl.getBeat);
router.post('/beats',              beatCtrl.createBeat);
router.put('/beats/:id',           beatCtrl.updateBeat);
router.delete('/beats/:id',        beatCtrl.deleteBeat);

// Layer management
router.post('/beats/:id/layers',           beatCtrl.addLayer);
router.post('/beats/:id/layers/duplicate', beatCtrl.duplicateLayer);
router.delete('/beats/:id/layers',         beatCtrl.deleteLayer);

// Engagement
router.post('/beats/:id/like',     beatCtrl.likeBeat);
router.post('/beats/:id/play',     beatCtrl.playBeat);

export default router;
