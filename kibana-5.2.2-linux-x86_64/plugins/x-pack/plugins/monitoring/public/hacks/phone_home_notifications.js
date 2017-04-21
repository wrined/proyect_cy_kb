import Notifier from 'ui/notify/notifier';
import uiModules from 'ui/modules';
import PathProvider from 'plugins/xpack_main/services/path';
import 'plugins/monitoring/services/features';
import { PHONE_HOME_FEATURE, PHONE_HOME_NOTIFICATION_SEEN } from '../../lib/constants';

/*
 * @param features {Service} (optional) passed to action factory in getting the callback
 */
function showNotification(features) {
  const notify = new Notifier('X-Pack');
  const directive = {
    template: (`
      <h3>Welcome to X-Pack!</h3>
      <p>
        Sharing your cluster statistics with us helps us improve. Your data is never shared with anyone.
        <span ng-switch="phonehome.allowReport">
          <span ng-switch-when="true">
            Not interested? <a ng-click="phonehome.toggleOpt()">Opt out here</a>.
          </span>
          <span ng-switch-default>
            <a ng-click="phonehome.toggleOpt()">Opt in here</a>.
          </span>
        </span>
      </p>
    `),
    controllerAs: 'phonehome',
    controller() {
      this.allowReport = features.isEnabled(PHONE_HOME_FEATURE, true);

      this.toggleOpt = () => {
        features.update(PHONE_HOME_FEATURE, !this.allowReport);
        this.allowReport = !this.allowReport;

        features.update(PHONE_HOME_NOTIFICATION_SEEN, true);
      };
    }
  };

  notify.directive(directive, {
    type: 'banner',
    lifetime: Infinity,
    actions: [{
      text: 'Dismiss',
      callback() {
        features.update(PHONE_HOME_NOTIFICATION_SEEN, true);
      }
    }]
  });
}

function customNotification(reportStats, Private, features) {
  // exit if the server config has phone home disabled
  if (!reportStats) {
    return;
  }

  // no welcome message for non-logged in users
  if (Private(PathProvider).isLoginOrLogout()) return;

  // only run once
  const hasRan = features.isEnabled(PHONE_HOME_NOTIFICATION_SEEN);
  if (hasRan) {
    return;
  }

  showNotification(features);
}

uiModules.get('monitoring/hacks').run(customNotification);
