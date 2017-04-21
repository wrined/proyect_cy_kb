import React from 'react';
import { get, capitalize, kebabCase } from 'lodash';
import moment from 'moment-timezone';
import { translateKibanaStatus, statusIconClass } from '../../lib/map_status_classes';
import formatNumber, { formatBytesUsage, formatPercentageUsage } from '../../lib/format_number';

class ClusterItemContainer extends React.Component {
  render() {
    // Note: kebabCase takes something like 'My Name' and makes it 'my-name', which is ideal for CSS names
    return (
      <div className="panel panel-product">
        <div
          className={`panel-heading panel-heading--clickable panel-heading-${kebabCase(this.props.title)}`}
          onClick={() => this.props.angularChangeUrl(this.props.url)}
        >
          {this.props.title}
        </div>
        <div className="panel-body">
          {this.props.children}
        </div>
      </div>
    );
  }
}

class StatusContainer extends React.Component {
  render() {
    const iconClass = statusIconClass(this.props.status);
    const status = this.props.status || 'offline';

    return (
      <div className='status-container'>
        <span className={`status status-${status}`}>
          <span className={iconClass} title={`${this.props.statusPrefix}: ${capitalize(status)}`}></span>
        </span> Status
      </div>
    );
  }
}

class BytesUsage extends React.Component {
  render() {
    const usedBytes = this.props.used_bytes;
    const maxBytes = this.props.max_bytes;
    if (usedBytes && maxBytes) {
      return (
        <span>
          {formatBytesUsage(usedBytes, maxBytes)}
          &nbsp;
          ({formatPercentageUsage(usedBytes, maxBytes)})
        </span>
      );
    }

    // must always return a React element, even if input was not numeric
    return <span>N/A</span>;
  }
}

class BytesPercentageUsage extends React.Component {
  render() {
    const usedBytes = this.props.used_bytes;
    const maxBytes = this.props.max_bytes;
    if (usedBytes && maxBytes) {
      return (
        <span>
          {formatPercentageUsage(usedBytes, maxBytes)}
          &nbsp;
          ({formatBytesUsage(usedBytes, maxBytes)})
        </span>
      );
    }

    // must always return a React element, even if input was not numeric
    return <span>N/A</span>;
  }
}

class ElasticsearchPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      primaries: 'N/A',
      replicas: 'N/A'
    };
  }

  componentWillReceiveProps(nextProps) {
    const indices = get(nextProps, 'stats.indices');
    const total = get(indices, 'shards.total', 0);
    let primaries = get(indices, 'shards.primaries', 'N/A');
    let replicas = 'N/A';

    // we subtract primaries from total to get replica count, so if we don't know primaries, then
    //  we cannot know replicas (because we'd be showing the wrong number!)
    if (primaries !== 'N/A') {
      primaries = formatNumber(primaries, 'int_commas');
      replicas = formatNumber(total - primaries, 'int_commas');
    }

    this.setState({
      primaries,
      replicas
    });
  }

  render() {
    const stats = this.props.stats || {};
    const nodes = stats.nodes;
    const indices = stats.indices;

    return (
      <ClusterItemContainer {...this.props} url='elasticsearch' title='Elasticsearch'>
        <StatusContainer statusPrefix='Cluster' status={this.props.status}/>

        <div className='row'>
          <div className='col-md-4'>
            <dl data-test-subj='elasticsearch_overview' data-overview-status={this.props.status}>
              <dt className='info-title'>
                <a className='link' onClick={() => this.props.angularChangeUrl('elasticsearch')}>Overview</a>
              </dt>
              <dd>Version: {get(nodes, 'versions[0]') || 'N/A'}</dd>
              <dd>Uptime: {formatNumber(get(nodes, 'jvm.max_uptime_in_millis'), 'time_since')}</dd>
            </dl>
          </div>

          <div className='col-md-4'>
            <dl>
              <dt className='info-title'>
                <a className='link' onClick={() => this.props.angularChangeUrl('elasticsearch/nodes')}>
                  Nodes: <span data-test-subj='number_of_elasticsearch_nodes'>
                    {formatNumber(get(nodes, 'count.total'), 'int_commas')}
                  </span>
                </a>
              </dt>
              <dd>
                Disk Available: <BytesUsage
                  used_bytes={get(nodes, 'fs.available_in_bytes')}
                  max_bytes={get(nodes, 'fs.total_in_bytes')}
                />
              </dd>
              <dd>
                JVM Heap: <BytesPercentageUsage
                  used_bytes={get(nodes, 'jvm.mem.heap_used_in_bytes')}
                  max_bytes={get(nodes, 'jvm.mem.heap_max_in_bytes')}
                />
              </dd>
            </dl>
          </div>

          <div className='col-md-4'>
            <dl>
              <dt className='info-title'>
                <a className='link' onClick={() => this.props.angularChangeUrl('elasticsearch/indices')}>
                  Indices: {formatNumber(get(indices, 'count'), 'int_commas')}
                </a>
              </dt>
              <dd>Documents: {formatNumber(get(indices, 'docs.count'), 'int_commas')}</dd>
              <dd>Disk Usage: {formatNumber(get(indices, 'store.size_in_bytes'), 'bytes')}</dd>
              <dd>Primary Shards: {this.state.primaries}</dd>
              <dd>Replica Shards: {this.state.replicas}</dd>
            </dl>
          </div>
        </div>
      </ClusterItemContainer>
    );
  }
}

class KibanaPanel extends React.Component {
  render() {
    if (!this.props.count) return (<div></div>);

    const status = translateKibanaStatus(this.props.status);

    return (
      <ClusterItemContainer {...this.props} url='kibana' title='Kibana'>
        <StatusContainer statusPrefix='Instances' status={status}/>

        <div className='row'>
          <div className='col-md-4'>
            <dl data-test-subj='kibana_overview' data-overview-status={status}>
              <dt className='info-title'>
                <a className='link' onClick={() => this.props.angularChangeUrl('kibana')}>Overview</a>
              </dt>
              <dd>Requests: {this.props.requests_total}</dd>
              <dd>Max. Response Time: {this.props.response_time_max} ms</dd>
            </dl>
          </div>
          <div className='col-md-4'>
            <dl>
              <dt className='info-title'>
                <a className='link' onClick={() => this.props.angularChangeUrl('kibana/instances')}>
                  Instances: <span data-test-subj='number_of_kibana_instances'>{this.props.count}</span>
                </a>
              </dt>
              <dd>Connections: {formatNumber(this.props.concurrent_connections, 'int_commas')}</dd>
              <dd>Memory Usage: <BytesPercentageUsage used_bytes={this.props.memory_size} max_bytes={this.props.memory_limit} />
              </dd>
            </dl>
          </div>
        </div>
      </ClusterItemContainer>
    );
  }
}

class LogstashPanel extends React.Component {
  render() {
    if (!this.props.count) return null;
    return (
      <ClusterItemContainer {...this.props} url='logstash' title='Logstash'>
        <div className='row'>
          <div className='col-md-4'>
            <dl data-test-subj='logstash_overview'>
              <dt className='info-title'>
                <a className='link' onClick={() => this.props.angularChangeUrl('logstash')}>Overview</a>
              </dt>
              <dd>Events Received: {formatNumber(this.props.events_in_total, '0.[0]a')}</dd>
              <dd>Events Emitted: {formatNumber(this.props.events_out_total, '0.[0]a')}</dd>
            </dl>
          </div>
          <div className='col-md-4'>
            <dl>
              <dt className='info-title'>
                <a className='link' onClick={() => this.props.angularChangeUrl('logstash/nodes')}>
                  Nodes: <span data-test-subj='number_of_logstash_instances'>{this.props.count}</span>
                </a>
              </dt>
              <dd>Uptime: {formatNumber(this.props.max_uptime, 'time_since')}</dd>
              <dd>
                JVM Heap: <BytesPercentageUsage used_bytes={this.props.avg_memory_used} max_bytes={this.props.avg_memory} />
              </dd>
            </dl>
          </div>
        </div>
      </ClusterItemContainer>
    );
  }
}

class Overview extends React.Component {
  constructor(props) {
    super(props);
    const scope = props.scope;
    const kbnChangePath = props.kbnUrl.changePath;
    const angularChangeUrl = target => {
      scope.$evalAsync(() => {
        kbnChangePath(target);
      });
    };

    this.goToLicense = () => {
      angularChangeUrl('/license');
    };

    const cluster = scope.cluster || {};
    this.state = {
      elasticsearch: { ...cluster.elasticsearch },
      kibana: cluster.kibana,
      license: cluster.license,
      logstash: cluster.logstash,
      angularChangeUrl
    };
  }

  componentWillMount() {
    this.props.scope.$watch('cluster', (cluster) => {
      cluster = cluster || {};

      this.setState({
        elasticsearch: { ...cluster.elasticsearch},
        kibana: cluster.kibana,
        logstash: cluster.logstash,
        license: cluster.license
      });
    });
  }

  render() {
    const getLicenseInfo = () => {
      const formatDateLocal = (input) => {
        return moment.tz(input, moment.tz.guess()).format('LL');
      };

      if (this.state.license) {
        return (
          <div className='page-row'>
            <div className='page-row-text'>
              Your { capitalize(this.state.license.type)
              } license will expire on <a className='link' onClick={ this.goToLicense }> {
              formatDateLocal(this.state.license.expiry_date) }.</a>
            </div>
          </div>
        );
      }

      return null;
    };

    return (
      <div className='monitoring-view'>
        {/* General info */}
        { this.props.showLicenseExpiration ? getLicenseInfo() : null }

        {/* Elasticsearch info */}
        <div className='page-row'>
          <ElasticsearchPanel
            {...this.state.elasticsearch}
            license={this.state.license}
            angularChangeUrl={this.state.angularChangeUrl}
          />
        </div>

        {/* Kibana info */}
        <div className='page-row'>
          <KibanaPanel {...this.state.kibana} angularChangeUrl={this.state.angularChangeUrl} />
        </div>

        {/* Logstash info */}
        <div className='page-row'>
          <LogstashPanel {...this.state.logstash} angularChangeUrl={this.state.angularChangeUrl} />
        </div>

      </div>
    );
  }
}

export default Overview;
