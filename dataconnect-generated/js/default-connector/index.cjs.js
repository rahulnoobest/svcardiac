const { getDataConnect, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'sv_cardiac_backend',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

