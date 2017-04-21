import { get } from 'lodash';
import { statusIconClass } from '../../lib/map_status_classes';
import template from 'plugins/monitoring/directives/node_summary/index.html';
import uiModules from 'ui/modules';

const uiModule = uiModules.get('monitoring/directives', []);
uiModule.directive('monitoringNodeSummary', () => {
  return {
    restrict: 'E',
    template: template,
    scope: { node: '=' },
    link(scope) {
      scope.getOnlineClass = () => {
        const nodeStatus = get(scope, 'node.status');
        if (nodeStatus && nodeStatus.toLowerCase() === 'online') {
          return 'green';
        } else {
          return 'offline';
        }
      };

      scope.getStatusIconClass = () => {
        return statusIconClass(scope.getOnlineClass());
      };
    }
  };
});
