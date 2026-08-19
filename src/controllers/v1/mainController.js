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
   * Returns historical telemetry payloads.
   * 
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @param {Function} next - The next middleware function.
   */
async history (req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50

    const start = req.query.start ? new Date(req.query.start) : null
    const end = req.query.end ? new Date(req.query.end) : null

    const filter = {}

    // Apply date range filter if start or end is provided
    if (start || end) {
      filter.timestamp = {}

      if (start) {
        filter.timestamp.$gte = start
      }

      if (end) {
        filter.timestamp.$lte = end
      }
    }

    // Fetch historical data from the database based on the filter and limit.
    const history = await DataModel
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean()

      history.reverse() // Reverse the order to have the oldest first and the newest last.  

    // Fetch the earliest and latest timestamps for the filtered data.
    const earliest = await DataModel.findOne(filter).sort({ timestamp: 1 }).lean()
    const latest = await DataModel.findOne(filter).sort({ timestamp: -1 }).lean()

    return res.status(200).json({
      count: history.length,
      earliestTimestamp: earliest?.timestamp ?? null,
      latestTimestamp: latest?.timestamp ?? null,
      history: history.map((entry) => ({
        ...entry,
        receivedAt: entry.timestamp
      }))
    })
  } catch (error) {
    const err = new Error('Unable to read telemetry history.')
    err.status = 500
    err.cause = error
    return next(err)
  }
}

  /**
   * Returns a summary of the telemetry data.
   * 
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @param {Function} next - The next middleware function.
   */
  async summary (req, res, next) {
    try {
      const maxTemp = await DataModel.findOne({}).sort({ temperature: -1 }).lean()
      const minTemp = await DataModel.findOne({}).sort({ temperature: 1 }).lean()
      const maxHumidity = await DataModel.findOne({}).sort({ humidity: -1 }).lean()
      const minHumidity = await DataModel.findOne({}).sort({ humidity: 1 }).lean()
      const avgTemp = await DataModel.aggregate([
        { $group: { _id: null, avgTemperature: { $avg: '$temperature' } } }
      ])
      const avgHumidity = await DataModel.aggregate([
        { $group: { _id: null, avgHumidity: { $avg: '$humidity' } } }
      ])

      return res.status(200).json({
        maxTemp: maxTemp?.temperature ?? null,
        minTemp: minTemp?.temperature ?? null,
        avgTemp: avgTemp[0]?.avgTemperature ?? null,
        maxHumidity: maxHumidity?.humidity ?? null,
        minHumidity: minHumidity?.humidity ?? null,
        avgHumidity: avgHumidity[0]?.avgHumidity ?? null
      })
    } catch (error) {
      const err = new Error('Unable to read telemetry summary.')
      err.status = 500
      err.cause = error
      return next(err)
    }
  }
}
