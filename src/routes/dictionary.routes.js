import express from 'express';
import { getDictionaryEntry } from '../controllers/DictionaryController.js';
const router = express.Router();

router.get('/', getDictionaryEntry);

export { router };