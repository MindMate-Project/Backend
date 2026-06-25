import mqtt from 'mqtt';
import { io } from '../server';
import { Caregiver, IPatient, Patient } from '../models/User';
import { Types } from 'mongoose';
import Alert from '../models/Alert';
import { sendPush } from '../services/firebase.service';
import { getDistanceMeters } from '../utils/geo';

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

                // Reset the offline flag here so a fresh message always marks the
                // device back online; deviceOfflineCron is the only place that sets it.
                const updatedPatient = await Patient.findByIdAndUpdate(
                    topicIdentifier,
                    {
                        $set: {
                            "device.latitude": lat,
                            "device.longitude": lng,
                            "device.timestamp": timestamp,
                            "device.offlineAlertSent": false,
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

                if (updatedPatient) {
                    await this.checkGeofence(updatedPatient, lat, lng);
                }

            } catch (error) {
                console.error('Error processing location data:', error);
            }
        });

        this.client.on('error', (error) => {
            console.error('MQTT Error:', error);
        });
    }

    private async checkGeofence(patient: IPatient, lat: number, lng: number) {
        const home = patient.homeLocation;
        if (!home) return;

        const distance = getDistanceMeters(lat, lng, home.lat, home.lng);
        const isOutOfBounds = distance > home.radiusMeters;

        if (isOutOfBounds && !patient.device.outOfBoundsAlertSent) {
            try {
                await Alert.create({
                    patient_id: patient._id,
                    alert_type: "location_out_of_bounds",
                    timestamp: new Date(),
                });
            } catch (error) {
                console.error(`Failed to create out-of-bounds alert for patient ${patient._id}:`, error);
            }

            try {
                const caregivers = await Caregiver.find({ _id: { $in: patient.caregivers } }).select("fcmTokens");
                const tokens = caregivers.flatMap((caregiver) => caregiver.fcmTokens || []);
                if (tokens.length > 0) {
                    await sendPush(tokens, "Location Alert", `${patient.name} has left the safe zone`);
                }
            } catch (error) {
                console.error(`Failed to send geofence notification for patient ${patient._id}:`, error);
            }

            await Patient.findByIdAndUpdate(patient._id, {
                $set: { "device.outOfBoundsAlertSent": true },
            });
        } else if (!isOutOfBounds && patient.device.outOfBoundsAlertSent) {
            await Patient.findByIdAndUpdate(patient._id, {
                $set: { "device.outOfBoundsAlertSent": false },
            });
        }
    }

    public disconnect() {
        this.client.end();
    }
}