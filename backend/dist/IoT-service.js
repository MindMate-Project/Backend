"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IoTService = void 0;
const mqtt_1 = __importDefault(require("mqtt"));
const server_1 = require("./server");
const User_1 = require("./models/User");
const mongoose_1 = require("mongoose");
class IoTService {
    constructor() {
        this.client = mqtt_1.default.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883', {
            clientId: 'zhimar-backend',
            username: process.env.MQTT_USERNAME,
            password: process.env.MQTT_PASSWORD,
        });
        this.setupListeners();
    }
    setupListeners() {
        this.client.on('connect', () => {
            console.log('Connected to MQTT broker');
            this.client.subscribe('patients/+/location', (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                }
            });
        });
        this.client.on('message', async (topic, message) => {
            try {
                const data = JSON.parse(message.toString());
                console.log(`Received message on topic ${topic}:`, data);
                const [patientsSegment, topicIdentifier, locationSegment] = topic.split('/');
                if (patientsSegment !== 'patients' || locationSegment !== 'location' || !topicIdentifier) {
                    console.error(`Invalid topic format: ${topic}`);
                    return;
                }
                console.log(`Received location for identifier ${topicIdentifier}:`, data);
                if (!mongoose_1.Types.ObjectId.isValid(topicIdentifier)) {
                    console.error(`Invalid ObjectId: ${topicIdentifier}`);
                    return;
                }
                await User_1.Patient.findByIdAndUpdate(topicIdentifier, {
                    $set: {
                        "device.latitude": data.latitude,
                        "device.longitude": data.longitude,
                        "device.timestamp": new Date(),
                        "device.battery": data.battery,
                    },
                }, { new: true });
                server_1.io.to(`patient:${topicIdentifier}`).emit('location-update', {
                    patientId: topicIdentifier,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    timestamp: new Date(),
                    battery: data.battery,
                });
                console.log(`Updated location for patient with ID ${topicIdentifier}`);
            }
            catch (error) {
                console.error('Error processing location data:', error);
            }
        });
        this.client.on('error', (error) => {
            console.error('MQTT Error:', error);
        });
    }
    disconnect() {
        this.client.end();
    }
}
exports.IoTService = IoTService;
