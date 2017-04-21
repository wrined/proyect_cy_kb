import React from 'react';
import ReactDOM from 'react-dom';
import Table from 'plugins/monitoring/directives/paginated_table/components/table';
import ClusterRow from './components/cluster_row.jsx';
import Notifier from 'ui/notify/notifier';
import uiModules from 'ui/modules';

const uiModule = uiModules.get('monitoring/directives', []);
uiModule.directive('monitoringClusterListing', function (globalState, kbnUrl, showLicenseExpiration) {
  return {
    restrict: 'E',
    scope: { clusters: '=' },
    link: function ($scope, $el) {

      const options = {
        title: null,
        searchPlaceholder: 'Filter Clusters',
        filterFields: ['cluster_name', 'status', 'license.type'],
        // "key" properties are scalars used for sorting
        columns: [
          {
            key: 'cluster_name',
            sort: 1,
            title: 'Name'
          },
          {
            key: 'status',
            title: 'Status'
          },
          {
            key: 'elasticsearch.stats.nodes.count.total',
            title: 'Nodes'
          },
          {
            key: 'elasticsearch.stats.indices.count',
            title: 'Indices'
          },
          {
            key: 'elasticsearch.stats.indices.store.size_in_bytes',
            title: 'Data'
          },
          {
            key: 'logstash.count',
            title: 'Logstash'
          },
          {
            key: 'kibana.count',
            title: 'Kibana'
          },
          {
            key: 'license.type',
            title: 'License'
          }
        ]
      };

      const table = ReactDOM.render(<Table
        scope={ $scope }
        template={ ClusterRow }
        options={ options }/>, $el[0]);

      const notify = new Notifier();
      function licenseWarning(message) {
        $scope.$evalAsync(function () {
          notify.warning(message, {
            lifetime: 60000
          });
        });
      }

      function changeCluster(uuid) {
        $scope.$evalAsync(function () {
          globalState.cluster_uuid = uuid;
          globalState.save();
          kbnUrl.changePath('/overview');
        });
      }

      $scope.$watch('clusters', (data) => {
        if (data) {
          data.forEach((cluster) => {
            // these become props for the cluster row
            cluster.changeCluster = changeCluster;
            cluster.licenseWarning = licenseWarning;
            cluster.showLicenseExpiration = showLicenseExpiration;
          });
          table.setData(data);
        }
      });
    }
  };
});
