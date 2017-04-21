import _ from 'lodash';
import uiModules from 'ui/modules';
import uiRoutes from 'ui/routes';
import uiChrome from 'ui/chrome';
import 'ui/autoload/all';
import 'plugins/monitoring/less/main.less';
import 'plugins/monitoring/filters';
import 'plugins/monitoring/directives';
import 'plugins/monitoring/services/clusters';
import 'plugins/monitoring/services/features';
import 'plugins/monitoring/services/executor';
import 'plugins/monitoring/services/license';
import 'plugins/monitoring/services/title';
import 'plugins/monitoring/views/no_data/no_data_controller';
import 'plugins/monitoring/views/access_denied/access_denied_controller';
import 'plugins/monitoring/views/license';
import 'plugins/monitoring/views/clusters/listing_controller';
import 'plugins/monitoring/views/clusters/overview_controller';
import 'plugins/monitoring/views/elasticsearch/overview/overview_controller';
import 'plugins/monitoring/views/elasticsearch/indices/indices_controller';
import 'plugins/monitoring/views/elasticsearch/index/index_controller';
import 'plugins/monitoring/views/elasticsearch/index/index_advanced_controller';
import 'plugins/monitoring/views/elasticsearch/nodes/nodes_controller';
import 'plugins/monitoring/views/elasticsearch/node/node_controller';
import 'plugins/monitoring/views/elasticsearch/node/node_advanced_controller';
import 'plugins/monitoring/views/kibana/overview/overview_controller';
import 'plugins/monitoring/views/kibana/instances/kibanas_controller';
import 'plugins/monitoring/views/kibana/instance/kibana_controller';
import 'plugins/monitoring/views/logstash/overview/overview_controller';
import 'plugins/monitoring/views/logstash/nodes/nodes_controller';
import 'plugins/monitoring/views/logstash/node/node_controller';

const uiModule = uiModules.get('kibana');
uiModule.run(function (uiSettings) {
  _.set(uiSettings, 'defaults.timepicker:timeDefaults.value', JSON.stringify({
    from: 'now-1h',
    to: 'now',
    mode: 'quick'
  }));
  _.set(uiSettings, 'defaults.timepicker:refreshIntervalDefaults.value', JSON.stringify({
    display: '10 seconds',
    pause: false,
    value: 10000
  }));
});

// Enable Angular routing
uiRoutes.enable();

uiChrome
  .setRootController('monitoring', function ($scope, courier) {
    $scope.$on('application.load', function () {
      courier.start();
    });
  });
