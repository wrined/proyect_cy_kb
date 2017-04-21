import React from 'react';
import { includes, isFunction } from 'lodash';

export default class HorizontalLegend extends React.Component {
  constructor() {
    super();
    this.formatter = this.formatter.bind(this);
    this.createSeries = this.createSeries.bind(this);
  }

  formatter(value) {
    if (isFunction(this.props.tickFormatter)) {
      return this.props.tickFormatter(value);
    }
    return value;
  }

  createSeries(row) {
    const formatter = row.tickFormatter || this.formatter;
    const value = formatter(this.props.seriesValues[row.id]);
    const classes = ['col-md-4 col-xs-6 rhythm_chart__legend-item'];
    const key = row.id;

    if (!includes(this.props.seriesFilter, row.id)) {
      classes.push('disabled');
    }
    if (!row.label || row.legend === false) {
      return (
        <div key={key} style={{display: 'none'}}/>
      );
    }

    return (
      <div
        className={classes.join(' ')}
        onClick={event => this.props.onToggle(event, row.id)}
        key={key}
      >
        <span className='rhythm_chart__legend-label'>
          <span className='fa fa-circle rhythm_chart__legend-indicator' style={{color: row.color}}/>
          {row.label}
        </span>
        <span className='rhythm_chart__legend-value'>{value}</span>
      </div>
    );
  }

  render() {
    const rows = this.props.series.map(this.createSeries);

    return (
      <div className='rhythm_chart__legend-horizontal'>
        <div className='row rhythm_chart__legend-series'>
          {rows}
        </div>
      </div>
    );
  }
}
