import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import uiModules from 'ui/modules';
import { set } from 'lodash';
import getTitle from './get_title';
import getUnits from './get_units';
import MonitoringTimeseriesComponent from './monitoring_timeseries_component';
import ChartTooltip from './chart_tooltip_component';
import { Tooltip } from 'pui-react-tooltip';
import { OverlayTrigger } from 'pui-react-overlay-trigger';

const uiModule = uiModules.get('plugins/monitoring/directives', []);
uiModule.directive('monitoringChart', (timefilter) => {
  return {
    restrict: 'E',
    scope: {
      series: '='
    },
    link(scope, $elem) {

      const series = scope.series;
      const dataSize = series.reduce((prev, current) => {
        return prev + current.data.length;
      }, 0);
      const options = {};
      if (dataSize !== 0) {
        const bounds = timefilter.getBounds();
        set(options, 'xaxis.min', bounds.min.valueOf());
        set(options, 'xaxis.max', bounds.max.valueOf());
      }

      const units = getUnits(series);

      function onBrush({ xaxis, _yaxis }) {
        scope.$evalAsync(() => {
          timefilter.time.from = moment(xaxis.from);
          timefilter.time.to = moment(xaxis.to);
          timefilter.time.mode = 'absolute';
        });
      }

      ReactDOM.render(
        <div className='monitoring-chart__container'>
          <h2 className='monitoring-chart__title'>
            {getTitle(series)}{units ? ` (${units})` : ''}
            <OverlayTrigger
              placement='left'
              trigger='click'
              overlay={<Tooltip><ChartTooltip series={series}/></Tooltip>}
            >
              <i
                className='overlay-trigger monitoring-chart-tooltip__trigger fa fa-info-circle'
                tabIndex='0'
              ></i>
            </OverlayTrigger>
          </h2>
          <MonitoringTimeseriesComponent scope={scope} options={options} onBrush={onBrush}/>
        </div>,
        $elem[0]
      );

    }
  };
});
