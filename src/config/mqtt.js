import mqtt from 'mqtt'
import { DataModel } from '../models/dataModel.js'
import { logger } from './winston.js'

let mqttClient = null

const normalizePayload = (topic, payload) => {
  const payloadString = payload.toString()

  try {
    const parsed = JSON.parse(payloadString)
    const temperature = Number.parseFloat(parsed.temperature ?? parsed.temp)
    const humidity = Number.parseFloat(parsed.humidity)
    const rawTimestamp = Number(parsed.timestamp)
    const timestamp = Number.isFinite(rawTimestamp)
      ? new Date(rawTimestamp * 1000)
      : new Date()

    return {
      topic,
      temperature: Number.isFinite(temperature) ? temperature : null,
      humidity: Number.isFinite(humidity) ? humidity : null,
      device: parsed.device ?? 'unknown',
      timestamp
    }
  } catch {
    return {
      topic,
      temperature: null,
      humidity: null,
      device: 'unknown',
      timestamp: new Date()
    }
  }
}

export const getLatestTelemetry = async () => {
  const doc = await DataModel.findOne({}).sort({ createdAt: -1 }).lean()

  if (!doc) {
    return null
  }

  return {
    ...doc,
    receivedAt: doc.timestamp ?? doc.createdAt
  }
}

export const getTelemetryHistory = async () => {
  const docs = await DataModel.find({}).sort({ createdAt: -1 }).limit(50).lean()

  return docs.map((doc) => ({
    ...doc,
    receivedAt: doc.timestamp ?? doc.createdAt
  }))
}

export const startMqttClient = async () => {
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883'
  const topic = process.env.MQTT_TOPIC || 'ta/sht30'
  const username = process.env.MQTT_USERNAME
  const password = process.env.MQTT_PASSWORD

  if (!process.env.MQTT_BROKER_URL && !process.env.MQTT_TOPIC) {
    logger.warn('MQTT configuration is not set. The backend will run without MQTT subscriptions.')
    return null
  }

  mqttClient = mqtt.connect(brokerUrl, {
    username,
    password,
    reconnectPeriod: 5000,
    clientId: `iot-backend-${Date.now()}`
  })

  mqttClient.on('connect', () => {
    console.log('MQTT connect event fired.')
    logger.info(`Connected to MQTT broker at ${brokerUrl}`)

    mqttClient.subscribe(topic, (error) => {
      if (error) {
        console.log('MQTT subscribe error:', error)
        logger.error('Failed to subscribe to MQTT topic.', { error })
        return
      }

      console.log(`MQTT subscribed to topic: ${topic}`)
      logger.info(`Subscribed to MQTT topic: ${topic}`)
    })
  })

  mqttClient.on('message', async (messageTopic, payload) => {
    console.log('MQTT message received:', { messageTopic, payload: payload.toString() })

    const reading = normalizePayload(messageTopic, payload)
    console.log('Normalized reading:', reading)

    try {
      const saved = await DataModel.create(reading)
      const safeSaved = saved.toObject({ transform: false })
      console.log('MongoDB document created:', safeSaved)
      logger.info(`MQTT message received and stored on ${messageTopic}`, { metadata: safeSaved })
    } catch (error) {
      console.log('MongoDB insert failed:', error)
      logger.error('Unable to persist MQTT reading to MongoDB.', { error, metadata: reading })
    }
  })

  mqttClient.on('error', (error) => {
    logger.error('MQTT connection error.', { error })
  })

  mqttClient.on('close', () => {
    logger.warn('MQTT client disconnected.')
  })

  return mqttClient
}

export const stopMqttClient = () => {
  if (mqttClient) {
    mqttClient.end(true)
  }
}
