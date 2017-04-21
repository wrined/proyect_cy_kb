import _ from 'lodash';
import uiChrome from 'ui/chrome';
import moment from 'moment';
import uiModules from 'ui/modules';
import PathProvider from 'plugins/xpack_main/services/path';
import 'plugins/monitoring/services/clusters';

function phoneHomeClassFactory($window, Promise, $http, reportStats, statsReportUrl, features) {

  return class PhoneHome {

    constructor() {
      this._attributes = {};
      let storedAttributes = {};
      const monitoringData = $window.localStorage.getItem('xpack.monitoring.data');

      try {
        storedAttributes = monitoringData && JSON.parse(monitoringData) || {};
      } catch (e) {
        console.error('Monitoring UI: error parsing locally stored monitoring data', e);
      }

      _.defaults(this._attributes, storedAttributes);
    }

    _set(key, value) {
      if (typeof key === 'object') {
        this._attributes = _.assign(this._attributes, key);
      } else {
        this._attributes[key] = value;
      }
    }

    _get(key) {
      if (_.isUndefined(key)) {
        return this._attributes;
      } else {
        return this._attributes[key];
      }
    }

    _saveToBrowser() {
      $window.localStorage.setItem('xpack.monitoring.data', JSON.stringify(this._attributes));
    }

    /*
     * Check for report permission and time interval passage
     */
    _checkReportStatus() {
      const reportInterval = 86400000; // 1 day
      let sendReport = false;

      // check if opt-in for phone home is enabled in config (reportStats) and browser setting (features)
      // "true" param to isEnabled means enabled by default: assume true if setting doesn't exist yet
      if (reportStats && features.isEnabled('report', true)) {
        // If the last report is empty it means we've never sent an report and
        // now is the time to send it.
        if (!this._get('lastReport')) {
          sendReport = true;
        }
        // If it's been a day since we last sent an report, send one.
        if (new Date().getTime() - parseInt(this._get('lastReport'), 10) > reportInterval) {
          sendReport = true;
        }
      }

      return sendReport;
    }

    /*
     * Call the API to get the basic cluster info from the non-timebased index
     */
    _getClusterInfo(clusterUUID) {
      const url = uiChrome.addBasePath(`/api/monitoring/v1/clusters/${clusterUUID}/info`);
      return $http.get(url)
      .then((resp) => {
        return resp.data;
      })
      .catch(() => { return {}; });
    }

    /*
     * Check report permission and if passes, send the report
     */
    _sendIfDue() {
      if (!this._checkReportStatus()) return Promise.resolve();

      // call to get the latest cluster uuids with a time range to go back 20 minutes up to now
      const currentClustersUrl = uiChrome.addBasePath('/api/monitoring/v1/clusters_stats');
      const currentClustersTimeRange = {
        min: moment().subtract(20, 'minutes').toISOString(),
        max: (new Date()).toISOString()
      };
      return $http.post(currentClustersUrl, {
        timeRange: currentClustersTimeRange
      })
      .then((clustersData) => clustersData.data)
      .then((clusters) => {
        return Promise.map(clusters, (cluster) => {
          // get the data per cluster uuid
          return this._getClusterInfo(cluster.cluster_uuid).then((info) => {
            const req = {
              method: 'POST',
              url: statsReportUrl,
              data: info
            };
            // if passing data externally to Infra, suppress kbnXsrfToken
            if (statsReportUrl.match(/^https/)) req.kbnXsrfToken = false;
            return $http(req);
          });
        }).then(() => {
          // we sent a report, so we need to record and store the current time stamp
          this._set('lastReport', Date.now());
          this._saveToBrowser();
        })
        .catch(() => {
          // no ajaxErrorHandlers for phone home
          return Promise.resolve();
        });
      });
    }

    /*
     * Public method
     */
    start() {
      // delay the initial report to allow the user some time to read the opt-out message
      let hasWaited = false;

      // continuously check if it's due time for a report
      window.setInterval(() => {
        if (hasWaited) {
          this._sendIfDue();
        }
        hasWaited = true;
      }, 60000);
    }

  }; // end class

}


function phoneHomeStart(Private) {
  // no phone home for non-logged in users
  if (Private(PathProvider).isLoginOrLogout()) return;

  const PhoneHome = Private(phoneHomeClassFactory);
  const sender = new PhoneHome();
  sender.start();
}

uiModules.get('monitoring/hacks').run(phoneHomeStart);
