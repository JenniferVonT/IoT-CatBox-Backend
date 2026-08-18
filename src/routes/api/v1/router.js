/**
 * @file API version 1 router.
 * @module routes/router
 * @author Jennifer von Trotta-Treyden <jv222th@student.lnu.se>
 * @version 1.0.0
 */

import express from 'express'
import { auth } from '../../../lib/auth.js'
import { MainController } from '../../../controllers/v1/mainController.js'

const startMessage = {
  message: 'Welcome to the IoT telemetry API exposing latest and historic data from the temperature and humidity sensor ran by a Raspberry Pi Pico WH',
  version: 'v1',
  auth: {
    type: "Bearer",
    description: "The paths that demand auth are set to auth=True, it should be included as a Bearer token in the authorization header",
    get_access: "At the moment access is private and cannot be requested. Future open auth requests will be written here."
  },
  paths: {
    0: {
      path: "/health",
      description: "Check the server status, if ok it's up and running",
      auth: "False"
    },
    1: {
      path: "/telemetry/latest",
      description: "Get the latest reading from the sensors",
      auth: "True",
    },
    2: {
      path: "/telemetry/history",
      description: "Get historical data from the sensors, defaults to 50 results but the limit can be set as a parameter",
      auth: "True",
      params: {
        0: {
          name: "limit",
          value: "int",
          description: "Limits the amount of results given, any limit"
        },
        1: {
          name: "start",
          value: "timestamp",
          description: "The start timestamp for the date range filter"
        },
        2: {
          name: "end",
          value: "timestamp",
          description: "The end timestamp for the date range filter"
        }
      }
    }
  }
}

export const router = express.Router()

const controller = new MainController()

router.get('/', (req, res) => res.json(startMessage))

// ====== Apply authentication middleware to all routes below. ======
router.use(auth)

router.get('/health', (req, res) => res.json({ status: 'ok' }))
router.get('/telemetry/latest', (req, res, next) => controller.latest(req, res, next))
router.get('/telemetry/history', (req, res, next) => controller.history(req, res, next))
router.get('/telemetry/summary', (req, res, next) => controller.summary(req, res, next))
