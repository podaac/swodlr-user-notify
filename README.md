# swodlr-user-notify

A microservice for emailing users who have requested granules, once the products
are finished generating.

## Workflow

`swodlr-user-notify` is triggered by a SQS topic which fires off the Lambda.
This SQS topic is listening to a SNS topic which receives messages from
`swodlr-raster-create`. These messages follow the `jobset` spec from
[swodlr-schemas](https://github.com/podaac/swodlr-schemas) and are directly
sent from the `swodlr-raster-create` pipeline.

This means that there is no inherent "request" within the input data. Instead
this service determines its own trigger conditions for sending out an email to
users. `swodlr-user-notify` is setup to trigger when the input jobset contains
a job that was a success and also at the `submit_raster` stage which indicates
it is at the end of the SWODLR generation pipeline.

Once this is determined, `swodlr-user-notify` then performs a lookup for all
users who requested this product while it was still in the `NEW` phase. This
lookup is performed in two stages:
  1. Looking up the timestamp of when the product was last in the `NEW` state
  2. Looking up users who have this product in their histories on or after the
  `NEW` status timestamp

## Notes

`swodlr-user-notify` utilizes AWS Simple Email Service to send out emails to
its users. Due to the way that CCS, the organization that oversees NGAP (the
platform SWODLR runs on), we utilize a "FromEmailAddressIdentityArn" from an
externally managed account which authorizes sending from the no-reply@nasa.gov
address.
