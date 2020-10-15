const _ = require('underscore');
const bodyParser = require('body-parser');
const express = require('express');

const Router = require('express-promise-router');
const uuidv4 = require('uuid/v4');
const kafka = require('kafka-node');
const type = require('./type');

const docEventModel = require('./docEventModel'); //created model loading here

const mongoose = require('mongoose');

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

const kafkaClientOptions = { sessionTimeout: 100, spinDelay: 100, retries: 2 };
const kafkaClient = new kafka.Client(process.env.KAFKA_ZOOKEEPER_CONNECT, 'producer-client', kafkaClientOptions);
const kafkaProducer = new kafka.HighLevelProducer(kafkaClient);

kafkaClient.on('error', (error) => console.error('Kafka client error:', error));
kafkaProducer.on('error', (error) => console.error('Kafka producer error:', error));

const app = express();
const router = new Router();

app.use('/', router);
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.post('/events', (req, res) => {

  console.log('Req: ', req.body);
  console.log('EventType:', req.body.eventType);
  console.log('PolicyNum:', req.body.eventDetail.policyNum);
  console.log('eventmetadata:', req.body.eventDetail.eventMetaData);
  if (req.body.eventType == 'DocEvent') {0

    console.log('docType:', req.body.eventDetail.eventMetaData.docType);
    console.log('docURL:', req.body.eventDetail.eventMetaData.docURL);
  }

  const messageBuffer = type.toBuffer({
    eventId: uuidv4(),
    eventType: req.body.eventType,
    eventSubType: req.body.eventSubType,
    eventDateTime: Date.now(),
    sourceChannel: req.body.sourceChannel,
    processTriggered: req.body.processTriggered,
    policyNum: req.body.eventDetail.policyNum,
    claimNum: req.body.eventDetail.claimNum,
    customerId: req.body.eventDetail.customerId,
    eventMetaData: req.body.eventDetail.eventMetaData,
  });

  const payload = [{
    topic: 'document-event-notify',
    messages: messageBuffer,
    attributes: 1
  }];

  kafkaProducer.send(payload, function(error, result) {
    console.info('Sent payload to Kafka:', payload);

    if (error) {
      console.error('Sending payload failed:', error);
      res.status(500).json(error);
    } else {
      console.log('Sending payload result:', result);
      res.status(202).json(result);
    }
  });
});

router.get('/events', async (req, res) => {
  const { rows } = await EventObject.find({}, function(err, task) {
    if (err)
      res.send(err);
    res.json(task);
  });

  res.status(200).json(rows);
});

app.listen(process.env.PRODUCER_PORT);
