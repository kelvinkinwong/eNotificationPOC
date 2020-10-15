const avro = require('avsc');

const eventSchema = {
  name: 'EventType',
  type: 'record',
  fields: [
    { name: 'eventId', type: ['null', 'string']},
    { name: 'eventType', type: ['null', 'string'], default: null},
    { name: 'eventSubType',type: ['null', 'string'], default: null},
    { name: 'eventDateTime', type: {type: 'long',logicalType: 'timestamp-millis'}},
    { name: 'sourceChannel', type: ['null', 'string'], default: null},
    { name: 'policyNum', type: ['null', 'string'], default: null},
    { name: 'claimNum', type: ['null', 'string'], default: null},
    { name: 'customerId', type: ['null', 'string'], default: null},
    { name: 'processTriggered', type: ['null', 'string'], default: null},
    { name: 'eventMetaData' , type: {type: 'map', values: ['null', 'string']}}
  ]
};

const type = avro.parse(eventSchema)

module.exports = type;
