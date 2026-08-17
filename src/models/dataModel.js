/**
 * @file Defines the data model.
 * @module models/DataModel
 * @author Jennifer von Trotta-Treyden <jv222th@student.lnu.se>
 * @version 1.0.0
 */

import mongoose from 'mongoose'
import { BASE_SCHEMA } from './baseSchema.js'

const ttlDays = Number(process.env.MONGO_TTL_DAYS ?? 30)
const expireAfterSeconds = Number.isFinite(ttlDays) && ttlDays > 0
  ? ttlDays * 24 * 60 * 60
  : 30 * 24 * 60 * 60

// Create a schema.
const schema = new mongoose.Schema({
  temperature: {
    type: Number,
    required: true
  },
  humidity: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  device: {
    type: String,
    required: true,
    trim: true
  },
  topic: {
    type: String,
    required: true,
    trim: true,
    default: 'ta/sht30'
  }
})

schema.add(BASE_SCHEMA)
schema.index({ timestamp: 1 }, { expireAfterSeconds })

// Create a model using the schema.
export const DataModel = mongoose.model('Data', schema)
