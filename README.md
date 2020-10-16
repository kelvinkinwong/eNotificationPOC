# eNotificationPOC

# Event based eNotification Demo

## Introduction

This repository showcases an end to end flow of using Kafka with NodeJS. In this example, we use Kafka as a messaging system to decouple the producer and consumer/s. 

The producer exposes an REST API endpoint for the event submission, instead of our endpoint hitting the database directly, it pushes event data to Kafka, thus acting as a 'producer'.

We spin up 2 'consumers' in 2 consumer groups that will take data from Kafka. The first consumer inserts the received event record into into a database (we use Mongodb here). The second consumer extracts the document URL from the event message, invoking an external URL shortener service to get a shorten URL, then send an email to notify the recipient along with the short URL to access the original document.

## Instructions

This demonstration assumes you already have docker and docker-compose installed. The steps are as follows:

Using docker-compose, spin up all containers (Zookeeper, Kafka, Mongo, Producer and 2 Consumers):

docker-compose up

Post a request to the REST endpoint specifying the event detail:

curl -X POST \
  http://localhost:8080/events \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -d {"eventType": "DocEvent", \
      "eventSubType": "DocCreated", \
      "sourceChannel": "EMMA", \
      "eventDetail": { \
        "policyNum": "1234567-1111", \ 
        "claimNum": "123456-222", \
        "customerId": "12334444333", \
        "processTriggered": "Claim Submission", \
        "eventMetaData": { \
            "docType": "Claim_Form", \
            "docURL": "https://www.wfsfaa.gov.hk/sfo/pdf/common/Form/kcfr/SFO7B.pdf"\
        }}} 

For consumer 1 in consumer group 1,

Verify that Kafka received the data, and passed it to the consumers, which then added the event message to the mongodb:

curl -X GET http://localhost:8080/events

Upon first run, this last command should return JSON containing the event posted in the previous steps.

[
    {
        "_id": "5f87fe59769cb7001b57d040",
        "sourceChannel": "EMMA",
        "eventId": "3de19308-20f8-4fe7-a988-14966c2ff1be",
        "__v": 0,
        "eventDetail": {
            "docURL": "https://www.mpfa.org.hk/eng/information_centre/GovernanceWorkshop/Gallery/photo/20171017_MPFA-35.jpg",
            "docType": "Claim_Form",
            "policyNum": "1234567-8999"
        },
        "eventType": [
            "DocCreated"
        ],
        "eventDate": "2020-10-15T07:46:32.846Z"
    },
    {
        "_id": "5f87ff1f769cb7001b57d041",
        "sourceChannel": "EMMA",
        "eventId": "43815b0d-65e5-47a0-92ac-b8b6ee85db17",
        "__v": 0,
        "eventDetail": {
            "docURL": "https://www.wfsfaa.gov.hk/sfo/pdf/common/Form/kcfr/SFO7B.pdf",
            "docType": "Claim_Form",
            "policyNum": "1234567-1111"
        },
        "eventType": [
            "DocCreated"
        ],
        "eventDate": "2020-10-15T07:49:51.432Z"
    },
    {
        "_id": "5f880373769cb7001b57d042",
        "sourceChannel": "EMMA",
        "eventId": "d1561daf-0820-41dd-ac8b-a9ad2faabf88",
        "__v": 0,
        "eventDetail": {
            "docURL": "https://www.wfsfaa.gov.hk/sfo/pdf/common/Form/kcfr/SFO7B.pdf",
            "docType": "Claim_Form",
            "policyNum": "1234567-1111"
        },
        "eventType": [
            "DocCreated"
        ],
        "eventDate": "2020-10-15T08:08:19.634Z"
    }
]

For consumer 2 in consumer group 2,

Check if the notification email is received about the shortened URL of the original URL.

## Deployment upon code changes

Step 1: 
docker-compose down

Step 2:
docker images
- List out all the images currently in local docker repository

Step 3:
docker rmi <IMAGE_ID_OF_YOUR_CHANGED_REPOSITORY>
- In this project, it is either kafka-nodejs-example_consumer_first, kafka-nodejs-example_consumer_second or kafka-nodejs-example_producer

Step 4:
docker-compose up
