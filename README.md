# MQTT TO INFLUXDB STREAMING LIBRARY
This is a simple library to help you stream your IoT data from mqtt to influxDB.

## Usage
First, create a ```.env``` file in your project from the ```.env.sample``` provided above then populate the variables

```sh
cp .env.sample .env
```

The general usage is as follows

```js
import Streamer from "path/to/main.js"
const my_mqtt_config = {
    url: process.env.BROKER_URL,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    topic: process.env.MQTT_TOPIC
};

const my_influx_config = {
    token: process.env.INFLUXDB_TOKEN,
    url: process.env.INFLUX_URL,
    org: 'my_org',
    bucket: 'my_bucket'
};

const measurement = 'some_measurement';
const tags = ['tag1', 'tag2', 'tag3'];
const fields = ['field1', 'field2', 'field3'];

const streamer = new Streamer(my_mqtt_config, my_influx_config, measurement, tags, fields);

```