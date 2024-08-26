const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const mqtt = require('mqtt');
require('dotenv').config();

/**
 * Streamer - A class to handle data reception and write to InfluxDB
 */
class Streamer {
    /**
     * @constructor - Initialize MQTT connection and setup stream
     * @param {object} mqttConfig - MQTT configuration object
     * @param {object} influxConfig - InfluxDB configuration object
     * @param {string} measurement - Measurement name in InfluxDB
     * @param {Array<string>} [tags] - Optional array of tag names
     * @param {Array<string>} [fields] - Optional array of field names
     */
    constructor(mqttConfig, influxConfig, measurement = 'default_measurement', tags = [], fields = []) {
        this.mqttConfig = mqttConfig;
        this.influxConfig = influxConfig;
        this.measurement = measurement;
        this.tags = tags;
        this.fields = fields;

        this.client = mqtt.connect(mqttConfig.url, {
            username: mqttConfig.username,
            password: mqttConfig.password,
        });

        this.client.on('connect', () => {
            console.log('Connected to MQTT broker');
            this.client.subscribe(mqttConfig.topic, (err) => {
                if (!err) {
                    console.log('Subscribed to topic');
                } else {
                    console.error('Subscription error:', err);
                }
            });
        });

        this.client.on('message', this.handleMessage.bind(this));
        this.client.on('error', (err) => {
            console.error('Connection error:', err);
        });
    }

    /**
     * @handleMessage - Shows received payload and streams to InfluxDB
     * @param {string} topic - MQTT topic subscribed to
     * @param {Buffer} message - The received payload
     */
    handleMessage(topic, message) {
        console.log(`Received message on ${topic}: ${message.toString()}`);
        this.streamToInflux(message);
    }

    /**
     * @streamToInflux - Streams data to InfluxDB
     * @param {Buffer} message - Received payload
     */
    streamToInflux(message) {
        const { token, url, org, bucket } = this.influxConfig;

        const client = new InfluxDB({ url, token });
        const writeClient = client.getWriteApi(org, bucket, 'ns');

        let mqttData;
        try {
            mqttData = JSON.parse(message.toString());
        } catch (error) {
            console.error('Error parsing MQTT message:', error);
            return;
        }

        let point = new Point(this.measurement);

        this.tags.forEach(tag => {
            if (mqttData[tag] !== undefined) {
                point.tag(tag, mqttData[tag].toString());
            }
        });

        this.fields.forEach(field => {
            if (mqttData[field] !== undefined) {
                const value = mqttData[field];
                if (typeof value === 'number' && Number.isInteger(value)) {
                    point.intField(field, value);
                } else if (typeof value === 'number') {
                    point.floatField(field, value);
                } else if (typeof value === 'string') {
                    point.stringField(field, value);
                }
            }
        });

        writeClient.writePoint(point);

        writeClient
            .close()
            .then(() => {
                console.log('Data written successfully.');
            })
            .catch((err) => {
                console.error('Error writing data to InfluxDB:', err);
            });
    }
}


module.exports = Streamer;
