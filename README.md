# IoT CatBox Backend

Backend server for an IoT application that collects, persists, and exposes temperature and humidity telemetry from a Raspberry Pi Pico WH.

The system uses **MQTT** as the communication layer between the Raspberry Pi Pico WH and the backend. The Pico publishes sensor readings to a **HiveMQ MQTT broker**, while this backend subscribes to the relevant MQTT topic, processes incoming telemetry, and stores the data in **MongoDB Atlas** for persistence. The stored data can then be accessed through a REST API.

## System Overview

The backend is one part of a larger IoT system:

```text
┌─────────────────────┐
│  Raspberry Pi Pico  │
│        WH           │
│                     │
│ Temperature Sensor  │
│ Humidity Sensor     │
└──────────┬──────────┘
           │
           │ MQTT Publish
           ▼
┌─────────────────────┐
│       HiveMQ        │
│    MQTT Broker      │
└──────────┬──────────┘
           │
           │ MQTT Subscribe
           ▼
┌─────────────────────┐
│   Backend Server    │
│                     │
│ MQTT Subscriber     │
│ Data Processing     │
│ REST API            │
└──────────┬──────────┘
           │
           │ Store / Query
           ▼
┌─────────────────────┐
│     MongoDB Atlas   │
│                     │
│ Telemetry History   │
└─────────────────────┘
```

The backend therefore acts as the bridge between the real-time MQTT communication system and the persistent database/API layer.

## Features

- Subscribes to telemetry data published by the Raspberry Pi Pico WH through MQTT.
- Uses HiveMQ as the MQTT broker.
- Processes incoming temperature and humidity readings.
- Persists telemetry data in MongoDB.
- Provides a REST API for accessing the collected data.
- Provides the latest sensor reading.
- Provides historical sensor data with an optional result limit.
- Protects telemetry endpoints using Bearer token authentication.
- Provides a health endpoint for checking whether the server is running.
- Uses Express for HTTP routing.
- Uses Mongoose for MongoDB communication.
- Uses environment variables for configuration and secrets.

## Technologies

- **Node.js** – Runtime environment
- **Express** – REST API framework
- **MQTT** – IoT messaging protocol
- **HiveMQ** – MQTT broker
- **MongoDB Atlas** – Persistent database
- **Mongoose** – MongoDB object modeling
- **Bearer Token Authentication** – API authentication

## Data Flow

### 1. Sensor data is collected

The Raspberry Pi Pico WH collects temperature and humidity measurements from its sensors.

### 2. The Pico publishes telemetry through MQTT

The Pico connects to the HiveMQ MQTT broker and publishes the sensor readings to the configured MQTT topic.

The published message contains data like this:

```json
{
    "humidity": 37, 
    "temperature": 26, 
    "device": "pico-wh", 
    "timestamp": 1786992547
}

```

### 3. The backend subscribes to MQTT

The backend maintains an MQTT connection to HiveMQ and subscribes to the telemetry topic.

Whenever the Pico publishes a new reading, the backend receives the MQTT message and processes it.

### 4. Telemetry is persisted

After receiving a telemetry message, the backend stores the reading in MongoDB Atlas.

This allows measurements to remain available even after the MQTT message has been delivered and allows historical data to be retrieved later through the REST API.

### 5. Data is exposed through the REST API

Clients can request the stored telemetry data through the backend's REST API.

The API provides endpoints for retrieving:

- The latest sensor reading.
- Historical sensor readings.
- Server health/status.

## MQTT

MQTT is used as the communication protocol between the Raspberry Pi Pico WH and the backend server.

The architecture uses a publish/subscribe model:

```text
Pico WH
   │
   │ publish
   ▼
HiveMQ Broker
   │
   │ subscribe
   ▼
Backend
   │
   │ save
   ▼
MongoDB
```

The Pico does not communicate directly with the backend HTTP API to transmit telemetry. Instead, both the Pico and backend communicate through the MQTT broker.

This decouples the sensor device from the backend server and allows the MQTT broker to handle message distribution.

## REST API

The API is versioned under:

```text
/api/v1
```

### API Overview

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| GET | `/api/v1/` | No | API information and available paths |
| GET | `/api/v1/health` | No | Check whether the server is running |
| GET | `/api/v1/telemetry/latest` | Yes | Retrieve the latest sensor reading |
| GET | `/api/v1/telemetry/history` | Yes | Retrieve historical sensor readings |

## API Root

```http
GET /api/v1/
```

Returns information about the API, including its version, authentication requirements, and available endpoints.

Example response:

```json
{
  "message": "Welcome to the IoT telemetry API exposing latest and historic data from the temperature and humidity sensor ran by a Raspberry Pi Pico WH",
  "version": "v1",
  "auth": {
    "type": "Bearer",
    "description": "The paths that demand auth are set to auth=True, it should be included as a Bearer token in the authorization header",
    "get_access": "At the moment access is private and cannot be requested. Future open auth requests will be written here."
  }
}
```

## Health Check

```http
GET /api/v1/health
```

Checks whether the backend server is running.

Example response:

```json
{
  "status": "ok"
}
```

This endpoint does not require authentication.

It can be used by monitoring systems or deployment platforms to verify that the server is available.

## Authentication

Authentication is implemented using Bearer tokens.

The telemetry endpoints require an `Authorization` header:

```http
Authorization: Bearer <token>
```

The following endpoints are currently public:

```text
GET /api/v1/
GET /api/v1/health
```

The following endpoints require authentication:

```text
GET /api/v1/telemetry/latest
GET /api/v1/telemetry/history
```

Access to the API is currently private.

## Environment Variables

The application requires configuration values to be supplied through environment variables.

For local development, these can be stored in a `.env` file. See the `.env.example` file for the correct structure.

### Important

The `.env` file contains credentials and must **not** be committed to the repository. So make sure that it is present in the `.gitignore` file.

When deployed to Heroku, environment variables should instead be configured as Heroku Config Vars.

## Local Development

### Prerequisites

Make sure the following are installed:

- Node.js
- npm
- MongoDB Atlas account/database (can be run as a docker instance locally)
- HiveMQ MQTT broker (can be run as a docker instance locally)
- Access credentials for the MQTT broker

### Installation

Clone the repository:

```bash
git clone <repository-url>
```

Install dependencies:
*Make sure you are in the right directory, the backend root.*

```bash
npm install
```

### Start the Server

Start the backend using:

```bash
npm start
```

For development:

```bash
npm run dev
```

## License

This project was developed as part of an IoT application/course project at Linnaeus University.