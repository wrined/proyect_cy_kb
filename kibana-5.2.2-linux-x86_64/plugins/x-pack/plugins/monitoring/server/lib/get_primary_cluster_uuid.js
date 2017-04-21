import { get, set, find } from 'lodash';
export default function getPrimaryClusterUuid(req) {
  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('admin');
  return async function (clusters) {
    const queryParams = {
      filter_path: 'metadata.cluster_uuid'
    };
    const metadata = await callWithRequest(req, 'cluster.state', queryParams);
    const primaryClusterUuid = get(metadata, 'metadata.cluster_uuid');
    const primaryCluster = find(clusters, { cluster_uuid: primaryClusterUuid });
    set(primaryCluster, 'isPrimary', true);

    return clusters;
  };
}
