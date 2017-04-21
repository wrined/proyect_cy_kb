import { includes } from 'lodash';

/*
 * "Uninitialized" is a rare status in Kibana but should be mapped to "offline"
 * Otherwise, if a status is something other than 'red', 'yellow', or 'green', translate it to 'yellow'.
 */
export function translateKibanaStatus(givenStatus = 'offline') {
  const status = givenStatus.toLowerCase();
  if (status === 'uninitialized') return 'offline';

  const expectedStatuses = ['red', 'yellow', 'green'];
  return includes(expectedStatuses, status) ? status : 'yellow';
}

export function statusIconClass(givenStatus = 'offline') {
  const status = givenStatus.toLowerCase();
  if (status === 'green') return 'fa fa-check';
  if (status === 'yellow') return 'fa fa-warning';
  return 'fa fa-bolt';
};
