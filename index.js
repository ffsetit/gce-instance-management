const Compute = require('@google-cloud/compute');
const compute = new Compute();


/**
 * Starts Compute Engine instances.
 *
 * Expects an HTTP message with JSON-formatted event data containing the
 * following attributes:
 *  instances - object array of instance labels to start.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 *  completion.
 */
 exports.startInstance = async (req, res) => {
    try {
      const payload = _validatePayload(req);
      for(const nodes of payload.instances) {
        const options = {filter: `labels.${nodes.labels}`};
        const [vms] = await compute.getVMs(options);
        await Promise.all(
          vms.map(async instance => {
            const [operation] = await compute
              .zone(instance.zone.id)
              .vm(instance.name)
              .start();
    
            return operation.promise();
          })
        );
      }
  
      // Operation complete. Instance successfully started.
      const message = 'Successfully started instance(s)';
      console.log(message);
      res.send(message);
    } catch (err) {
      console.log(err);
      res.send(err);
    }
  };


  
/**
 * Stops Compute Engine instances.
 *
 * Expects a HTTP message with JSON-formatted event data containing the
 * following attributes:
 *  instances - object array of instance labels to stop.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.stopInstance = async (req, res) => {
    try {
      const payload = _validatePayload(req);
      for(const nodes of payload.instances) {
        const options = {filter: `labels.${nodes.labels}`};
        const [vms] = await compute.getVMs(options);
        await Promise.all(
          vms.map(async instance => {
            const [operation] = await compute
              .zone(instance.zone.id)
              .vm(instance.name)
              .stop();
    
            // Operation pending
            return operation.promise();
          })
        );
      }
  
      // Operation complete. Instance successfully stopped.
      const message = 'Successfully stopped instance(s)';
      console.log(message);
      res.send(message);
    } catch (err) {
      console.log(err);
      res.send(err);
    }
  };
  
  /**
   * Validates that a request payload contains the expected fields.
   *
   * @param {!object} payload the request payload to validate.
   * @return {!object} the payload object.
   */
  const _validatePayload = req => {
    let payload;
    try {
      payload = JSON.parse(Buffer.from(req.body, 'base64').toString());
    } catch (err) {
      throw new Error('Invalid message: ' + err);
    }
    if (!payload.instances) {
      throw new Error("Attribute 'instances' is required");
    }
    return payload;
  };