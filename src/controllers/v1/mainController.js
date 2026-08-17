/**
 * @file Defines the main controller class.
 * @module controllers/v1/mainController
 * @author Jennifer von Trotta-Treyden <jv222th@student.lnu.se>
 * @version 1.0.0
 */

import { DataModel } from '../../models/dataModel.js'

/**
 * Encapsulates a controller.
 */
export class MainController {
  /**
   * Returns the latest telemetry payload.
   * 
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @param {Function} next - The next middleware function.
   */
  async latest (req, res, next) {
    try {
      const latest = await DataModel.findOne({}).sort({ createdAt: -1 }).lean()

      if (!latest) {
        return res.status(204).json({ message: 'No sensor data has been received yet.' })
      }

      return res.status(200).json({
        ...latest,
        receivedAt: latest.timestamp ?? latest.createdAt
      })
    } catch (error) {
      const err = new Error('Unable to read the latest telemetry payload.')
      err.status = 500
      err.cause = error
      return next(err)
    }
  }

  /**
   * Returns the latest 50 telemetry payloads.
   * 
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @param {Function} next - The next middleware function.
   */
  async history (req, res, next) {
    try {
      // Parse the limit from the query parameters, defaulting to 50 if not provided
      const limit = parseInt(req.query.limit, 10) || 50

      const history = await DataModel.find({}).sort({ createdAt: -1 }).limit(limit).lean()
      return res.status(200).json({
        count: history.length,
        history: history.map((entry) => ({
          ...entry,
          receivedAt: entry.timestamp ?? entry.createdAt
        }))
      })
    } catch (error) {
      const err = new Error('Unable to read telemetry history.')
      err.status = 500
      err.cause = error
      return next(err)
    }
  }
}
