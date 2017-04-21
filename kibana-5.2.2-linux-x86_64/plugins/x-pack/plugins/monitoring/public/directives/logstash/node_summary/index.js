import { get, capitalize } from 'lodash';
import { statusIconClass } from '../../../lib/map_status_classes';
import template from './index.html';
import uiModules from 'ui/modules';

const uiModule = uiModules.get('monitoring/directives', []);
uiModule.directive('monitoringLogstashNodeSummary', () => {
  return {
    restrict: 'E',
    template: template,
    scope: { logstash: '=' },
    link(scope) {
      scope.getSummaryStatus = () => {
        const online = get(scope, 'logstash.availability');
        let status = get(scope, 'logstash.status');
        if (!online) {
          status = 'offline';
        }
        return status;
      };

      scope.getSummaryStatusText = () => {
        return `Node: ${capitalize(scope.getSummaryStatus())}`;
      };

      scope.getStatusIconClass = () => {
        return statusIconClass(scope.getSummaryStatus());
      };
    }
  };
});
