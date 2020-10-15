const moment = require('moment');
const uuidv4 = require('uuid/v4');
const kafka = require('kafka-node');
const axios = require('axios');
const nodemailer = require('nodemailer');

const type = require('./type');

(async () => {

  const kafkaClientOptions = { sessionTimeout: 100, spinDelay: 100, retries: 2 };
  const kafkaClient = new kafka.Client(process.env.KAFKA_ZOOKEEPER_CONNECT, 'consumer-client2', kafkaClientOptions);

  const topics = [
    { topic: 'document-event-notify' }
  ];

  const options = {
    groupId: 'consumer_group2',
    autoCommit: true,
    fetchMaxWaitMs: 1000,
    fetchMaxBytes: 1024 * 1024,
    encoding: 'buffer'
  };

  const kafkaConsumer = new kafka.HighLevelConsumer(kafkaClient, topics, options);

  kafkaConsumer.on('message', async function(message) {
    console.log('From consumer group 2: Message received:', message);
    const messageBuffer = Buffer.from(message.value, 'binary');

    const decodedMessage = type.fromBuffer(messageBuffer.slice(0));
    console.log('Decoded Message:', typeof decodedMessage, decodedMessage);

    var config = {
      headers: {'apikey': process.env.SHORTEN_URL_API_KEY},
      responseType: 'application/json'
    };
    axios.post(process.env.SHORTEN_URL_PROVIDER_API, decodedMessage.eventMetaData.docURL , config).then((response) => {
      console.log(response.data);
      console.log('short URL:', response.data.short_url);
      console.log('original URL:', response.data.long_url);

      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'notification.poc.axa@gmail.com',
          pass: 'Hello123!'
        }
      });

      var mailOptions = {
        from: 'notification.poc.axa@gmail.com',
        to: 'kelvin.wong.axa@gmail.com',
        subject: 'e-Notification Demo',
        html: '<h1>' + decodedMessage.eventSubType + '</h1>' + '<p><a href="'+ response.data.short_url +'">' + response.data.short_url + '</a></p>'
      };

      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
    });

    const eventDateISO8601 = moment(decodedMessage.eventDateTime).toISOString();
  });

  kafkaClient.on('error', (error) => console.error('Kafka client error:', error));
  kafkaConsumer.on('error', (error) => console.error('Kafka consumer error:', error));
})();
