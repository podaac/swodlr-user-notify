import fs from 'fs/promises';
import Handlebars from 'handlebars';
import path from 'path';
import BaseUtils from "@podaac/swodlr-common/lib/utilities.js";

class Utilities extends BaseUtils {
  /**
   * Loads a html template from the templates/ directory and compiles it into a
   * template function via Handlebars
   * @param {*} templateName 
   * @returns 
   */
  async loadTemplate(templateName) {
    const templatePath = path.resolve(
      import.meta.url.replace(/^file:/, ''),
      '../../templates',
      `${templateName}.html`,
    );
    const rawTemplate = await fs.readFile(templatePath, {encoding: 'utf-8'});
    return Handlebars.compile(rawTemplate);
  }

  generateTeaUrl(s3Url) {
    const origin = new URL(s3Url);
    if (origin.protocol !== 's3') {
      return s3Url;
    }

    const bucketName = origin.host;
    const teaHost = this.getParameter(`tea_mapping/${bucketName}`);
    const teaUrl = new URL(`/${bucketName}${origin.pathname}`, `https://${teaHost}/`);

    return teaUrl.toString();
  }
}

const instance = new Utilities('swodlr', 'user-notify');
await instance.init();

export default instance;
