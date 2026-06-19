import express from 'express';
import {
  collectCash,
  getDashboardStats,
  getMachines,
  restockMachine,
  seedMachines
} from '../controllers/machineController.js';

const router = express.Router();

router.get('/machines', getMachines);
router.get('/dashboard/stats', getDashboardStats);
router.post('/machines/:id/restock', restockMachine);
router.post('/machines/:id/collect-cash', collectCash);
router.get('/seed', seedMachines);

export default router;
