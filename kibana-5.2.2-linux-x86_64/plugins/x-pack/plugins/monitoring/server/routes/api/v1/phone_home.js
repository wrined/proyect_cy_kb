/*
 * This endpoint is ONLY for development and internal testing.
 */
import handleError from '../../../lib/handle_error';

export default function phoneHomeRoutes(server) {
  const { callWithRequest } = server.plugins.elasticsearch.getCluster('monitoring');

  server.route({
    path: '/api/monitoring/v1/phone-home',
    method: 'POST',
    handler: (req, reply) => {
      // Change to true to test indexing the data. Note, user must have privileges
      if (false) {
        const body = req.payload;
        const options = {
          index: '.monitoring',
          type: 'phone_home',
          body: body
        };
        callWithRequest(req, 'index', options)
        .then(reply)
        .catch(err => reply(handleError(err, req)));
      } else {
        reply({});
      }
    }
  });
};
