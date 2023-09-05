import { SESv2 } from "@aws-sdk/client-sesv2";
import { ProductHistory, Status, User } from "@podaac/swodlr-common/lib/models.js";
import { sdsStatuses } from "@podaac/swodlr-common";
import { Op } from "sequelize";
import utils from "./utilities.js";

const logger = utils.getLogger(import.meta.url);
const productReadyTemplate = await utils.loadTemplate('product-ready');
const validateJob = utils.loadSchema('job');

const ses = new SESv2({
  credentials: JSON.parse(utils.getParameter('ses_credentials')),
  region: utils.getParameter('ses_region')
});

export async function lambdaHandler(event) {
  logger.debug(`Records received: ${event['Records'].length}`);

  let jobs = [];
  for (const record of event['Records']) {
    const job = JSON.parse(record['body']);
    if (validateJob(job)) {
      jobs = jobs.concat([job]);
    } else {
      logger.error('Job failed to validate');
      logger.debug(`Failed job: ${JSON.stringify(job)}`);
    }
  }
  logger.debug(`Jobs received: ${jobs.length}`);

  for (const job of jobs) {
    logger.info(`Processing job: ${job['job_id']}`);

    const jobStatus = job['job_status'];
    if (!sdsStatuses.SUCCESS.has(jobStatus)) {
      continue;
    }

    const stage = job['stage'];
    if (stage !== 'submit_raster') {
      continue;
    }

    const productId = job['product_id'];

    const statusQueryResults = await Status.findAll({
      where: {
        state: 'NEW', // TODO: Move this to a const in commons
        productId
      },
      order: [['timestamp', 'DESC']],
      limit: 1
    });

    if (statusQueryResults.length == 0) {
      logger.error(`No products found with NEW status: ${job['product_id']}`);
      continue;
    }

    const newStatus = statusQueryResults[0];
    const requests = await ProductHistory.findAll({
      where: {
        timestamp: {
          [Op.gte]: newStatus.timestamp
        },
        rasterProductId: productId
      },
      include: [User]
    });

    const emails = requests.map((req) => req.User.email);
    const downloadUrls = job['granules'].map((url) => utils.generateTeaUrl(url));
    const body = productReadyTemplate({
      productId, downloadUrls
    });
    
    for (const email of emails) {
      try {
        await ses.sendEmail({
          FromEmailAddress: 'On-Demand Services <noreply@nasa.gov>',
          ReplyToAddresses: ['on-demand-support@jpl.nasa.gov'],
          Destination: {
            ToAddresses: [email]
          },
          Content: {
            Simple: {
              Subject: {
                Data: 'Product Download Ready',
                Charset: 'UTF-8',
              },
              Body: {
                Html: {
                  Data: body,
                  Charset: 'UTF-8',
                }
              },
            }
          }
        });
      } catch (err) {
        logger.error(`Error while sending email for product: ${productId}`);
        logger.error(err);
      }
    }
  }
}
