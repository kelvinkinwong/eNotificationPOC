const moment = require('moment');
const uuidv4 = require('uuid/v4');
const kafka = require('kafka-node');
const type = require('./type');
const docEventModel = require('./docEventModel'); //created model loading here

const mongoose = require('mongoose');

bodyParser = require('body-parser');

// mongoose instance connection url connection
mongoose.Promise = global.Promise;

const options = {
  useMongoClient: true,
  autoIndex: false, // Don't build indexes
  reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
  reconnectInterval: 500, // Reconnect every 500ms
  poolSize: 10, // Maintain up to 10 socket connections
  // If not connected, return errors immediately rather than waiting for reconnect
  bufferMaxEntries: 0
};

mongoose.connect(process.env.MONGO_CONNECT,options);

EventObject = mongoose.model('DocEvents');

(async () => {

  const kafkaClientOptions = { sessionTimeout: 100, spinDelay: 100, retries: 2 };
  const kafkaClient = new kafka.Client(process.env.KAFKA_ZOOKEEPER_CONNECT, 'consumer-client', kafkaClientOptions);

  const topics = [
    { topic: 'document-event-notify' } ];

  const options = {
    groupId: 'consumer_group1',
    autoCommit: true,
    fetchMaxWaitMs: 1000,
    fetchMaxBytes: 1024 * 1024,
    encoding: 'buffer'
  };

  const kafkaConsumer = new kafka.HighLevelConsumer(kafkaClient, topics, options);

  kafkaConsumer.on('message', async function(message) {
    console.log('From Consumer Group 1: Message received:', message);
    const messageBuffer = Buffer.from(message.value, 'binary');

    const decodedMessage = type.fromBuffer(messageBuffer.slice(0));
    console.log('Decoded Message:', typeof decodedMessage, decodedMessage);

    const eventDateISO8601 = moment(decodedMessage.eventDateTime).toISOString();

    console.log('eventId:', decodedMessage.eventId);
    console.log('eventType:', decodedMessage.eventSubType);
    console.log('docURL:', decodedMessage.eventMetaData.docURL);

    var new_event = new EventObject();
    new_event.eventId = decodedMessage.eventId;
    new_event.eventType = decodedMessage.eventSubType;
    new_event.eventDate = decodedMessage.eventDateTime;
    new_event.sourceChannel = decodedMessage.sourceChannel;

    new_event.eventDetail.policyNum = decodedMessage.policyNum;
    new_event.eventDetail.docType = decodedMessage.eventMetaData.docType;
    new_event.eventDetail.docURL = decodedMessage.eventMetaData.docURL;

    new_event.save(function(err, task) {
      if (err) {
        console.error('Event Record save error !', err);
        return;
      }
      console.log('Event Record saved !', task);
    });
  });

  kafkaClient.on('error', (error) => console.error('Kafka client error:', error));
  kafkaConsumer.on('error', (error) => console.error('Kafka consumer error:', error));
})();
