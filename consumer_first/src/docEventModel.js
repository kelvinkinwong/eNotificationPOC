'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DocEventSchema = new Schema({
  eventId: {
    type: String,
    required: 'Kindly provide the ID of the event'
  },
  eventDate: {
    type: Date,
    default: Date.now
  },
  sourceChannel: {
    type: String
  },
  eventType: {
    type: [{
      type: String,
      enum: ['DocCreated', 'DocDeleted','DocInfoChanged']
    }],
    default: ['DocCreated']
  },
  eventDetail: {
    policyNum: {
      type: String
    },
    claimNum: {
      type: String
    },
    docURL: {
      type: String
    },
    docType: {
      type: String
    }
  }
});

module.exports = mongoose.model('DocEvents', DocEventSchema);
