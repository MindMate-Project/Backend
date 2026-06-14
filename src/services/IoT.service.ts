import mqtt from 'mqtt';
import { io } from '../server';
import { Patient } from '../models/User';
import { Types } from 'mongoose';

export class IoTService {
    private client: mqtt.MqttClient;

    constructor() {
        this.client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883', {
            clientId: 'zhimar-backend',
            username: process.env.MQTT_USERNAME,
            password: process.env.MQTT_PASSWORD,
        });

        this.setupListeners();
    }

    private setupListeners() {
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

                if (!Types.ObjectId.isValid(topicIdentifier)) {
                    console.error(`Invalid ObjectId: ${topicIdentifier}`);
                    return;
                }

                // Validate the payload before persisting — never store garbage or
                // spoofed values from an unauthenticated MQTT publisher.
                const lat = Number(data.latitude);
                const lng = Number(data.longitude);
                if (
                    !Number.isFinite(lat) || lat < -90 || lat > 90 ||
                    !Number.isFinite(lng) || lng < -180 || lng > 180
                ) {
                    console.error(`Invalid coordinates for ${topicIdentifier}:`, data);
                    return;
                }
                const batteryNum = Number(data.battery);
                const battery =
                    Number.isFinite(batteryNum) && batteryNum >= 0 && batteryNum <= 100
                        ? batteryNum
                        : undefined;
                const timestamp = new Date();

                await Patient.findByIdAndUpdate(
                    topicIdentifier,
                    {
                        $set: {
                            "device.latitude": lat,
                            "device.longitude": lng,
                            "device.timestamp": timestamp,
                            ...(battery !== undefined ? { "device.battery": battery } : {}),
                        },
                    },
                    { new: true }
                );

                io.to(`patient:${topicIdentifier}`).emit('location-update', {
                    patientId: topicIdentifier,
                    latitude: lat,
                    longitude: lng,
                    timestamp,
                    battery,
                });

                console.log(`Updated location for patient with ID ${topicIdentifier}`);

            } catch (error) {
                console.error('Error processing location data:', error);
            }
        });

        this.client.on('error', (error) => {
            console.error('MQTT Error:', error);
        });
    }

    public disconnect() {
        this.client.end();
    }
}