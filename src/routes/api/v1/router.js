/**
 * @file API version 1 router.
 * @module routes/router
 * @author Jennifer von Trotta-Treyden <jv222th@student.lnu.se>
 * @version 1.0.0
 */

import express from 'express'
import { MainController } from '../../../controllers/v1/mainController.js'

const startMessage = {
  message: 'Welcome to the IoT telemetry API',
  version: 'v1'
}

export const router = express.Router()

const controller = new MainController()

router.get('/', (req, res) => res.json(startMessage))
router.get('/health', (req, res) => res.json({ status: 'ok' }))
router.get('/telemetry/latest', (req, res, next) => controller.latest(req, res, next))
router.get('/telemetry/history', (req, res, next) => controller.history(req, res, next))
