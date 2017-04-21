import _ from 'lodash';
import ajaxErrorHandlersProvider from 'plugins/monitoring/lib/ajax_error_handler';

export default function routeInitProvider(Private, monitoringClusters, globalState, license, kbnUrl) {
  const ajaxErrorHandlers = Private(ajaxErrorHandlersProvider);

  function isOnPage(hash) {
    return _.contains(window.location.hash, hash);
  }

  // check if the license expiration is in the future
  function isLicenseFresh(expiryDateInMillis) {
    return (new Date()).getTime() < expiryDateInMillis;
  }

  /*
   * returns true if:
   * license is not basic or
   * the data just has a single cluster or
   * all the clusters are basic and this is the primary cluster
   */
  function isClusterSupported(isBasic, cluster, clusters) {
    return (!isBasic || clusters.length === 1 || (cluster.isPrimary && cluster.allBasicClusters));
  }

  return function routeInit() {
    return monitoringClusters()
    // Set the clusters collection and current cluster in globalState
    .then((clusters) => {
      const cluster = (() => {
        const existingCurrent = _.find(clusters, { cluster_uuid: globalState.cluster_uuid });
        if (existingCurrent) return existingCurrent;

        const firstCluster = _.first(clusters);
        if (firstCluster && firstCluster.cluster_uuid) return firstCluster;

        return null;
      })();

      if (cluster && cluster.license) {
        globalState.cluster_uuid = cluster.cluster_uuid;
        globalState.save();
      } else {
        return kbnUrl.redirect('/no-data');
      }

      const clusterLicense = cluster.license;
      license.setLicenseType(clusterLicense.type);

      // check if we need to redirect because of license expiration
      if (!(isOnPage('license') || isOnPage('home')) && !isLicenseFresh(clusterLicense.expiry_date_in_millis)) {
        return kbnUrl.redirect('/license');
      }

      // check if we need to redirect because of check if multi-cluster monitoring, and if its allowed
      if (!isOnPage('home') && !isClusterSupported(license.isBasic(), cluster, clusters)) {
        return kbnUrl.redirect('/home');
      }

      return clusters;
    })
    .catch(ajaxErrorHandlers);
  };
};
