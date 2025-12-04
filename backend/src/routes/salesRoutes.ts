import { Router } from 'express';
import { createSale, getSales, getSale, getProducts, completeSale, cleanupExpiredSales, checkDeliveryAvailabilityController } from '../controllers/salesController';

const router = Router();

router.post('/', createSale);
router.get('/', getSales);
router.get('/products', getProducts);
router.get('/:id', getSale);
router.patch('/:id/complete', completeSale);
router.post('/cleanup-expired', cleanupExpiredSales);
router.post('/check-delivery', checkDeliveryAvailabilityController);

export default router;
