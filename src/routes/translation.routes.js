import express from 'express';
import { translateText } from '../controllers/TranslationController.js';
const router = express.Router();

router.get('/', translateText);

export { router };