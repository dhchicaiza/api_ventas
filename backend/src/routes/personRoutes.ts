import { Router } from 'express';
import { createPerson, getPersons, getPerson, updatePerson, deletePerson } from '../controllers/personController';

const router = Router();

router.post('/', createPerson);
router.get('/', getPersons);
router.get('/:id', getPerson);
router.put('/:id', updatePerson);
router.delete('/:id', deletePerson);

export default router;
