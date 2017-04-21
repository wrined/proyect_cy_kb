import url from 'url';
import { get, pick, find, merge } from 'lodash';
import Joi from 'joi';
import { parseKibanaState } from '../../../../server/lib/parse_kibana_state';
import { uriEncode } from './uri_encode';
import { getAbsoluteTime } from './get_absolute_time';

export function getSavedObjects(callWithRequest, config) {
  const schema = Joi.object().keys({
    kibanaApp: Joi.string().required(),
    kibanaIndex: Joi.string().required(),
    protocol: Joi.string().valid(['http', 'https']).default('http'),
    hostname: Joi.string().default('localhost'),
    port: Joi.number().integer().default(5601),
  });

  const result = Joi.validate(config, schema);

  if (result.error) throw result.error;
  const opts = result.value;

  const appTypes = {
    dashboard: {
      getUrlParams: function (id) {
        return {
          pathname: opts.kibanaApp,
          hash: '/dashboard/' + uriEncode.string(id, true),
        };
      },
      searchSourceIndex: 'kibanaSavedObjectMeta.searchSourceJSON',
      stateIndex: 'uiStateJSON',
    },
    visualization: {
      getUrlParams: function (id) {
        return {
          pathname: opts.kibanaApp,
          hash: '/visualize/edit/' + uriEncode.string(id, true),
        };
      },
      searchSourceIndex: 'kibanaSavedObjectMeta.searchSourceJSON',
      stateIndex: 'uiStateJSON',
    },
    search: {
      getUrlParams: function (id) {
        return {
          pathname: opts.kibanaApp,
          hash: '/discover/' + uriEncode.string(id, true),
        };
      },
      searchSourceIndex: 'kibanaSavedObjectMeta.searchSourceJSON',
      stateIndex: 'uiStateJSON',
    }
  };

  function getIndexPatternObject(request, indexPattern) {
    const body = {
      index: opts.kibanaIndex,
      type: 'index-pattern',
      id: indexPattern
    };

    return callWithRequest(request, 'get', body).then(response => response._source);
  }

  async function hasTimeBasedIndexPattern(request, savedObjSearchSourceIndex) {
    const indexPattern = savedObjSearchSourceIndex.index;
    if (!indexPattern) {
      return Promise.resolve(false);
    }

    const indexPatternObj = await getIndexPatternObject(request, indexPattern);
    return !!indexPatternObj.timeFieldName;
  }

  function getObject(request, type, id, fields = []) {
    fields = ['title', 'description'].concat(fields);
    validateType(type);
    const body = {
      index: opts.kibanaIndex,
      type: type,
      id: id
    };

    function parseJsonObjects(source) {
      const searchSourceJson = get(source, appTypes[type].searchSourceIndex, '{}');
      const uiStateJson = get(source, appTypes[type].stateIndex, '{}');
      let searchSource;
      let uiState;

      try {
        searchSource = JSON.parse(searchSourceJson);
      } catch (e) {
        searchSource = {};
      }

      try {
        uiState = JSON.parse(uiStateJson);
      } catch (e) {
        uiState = {};
      }

      return { searchSource, uiState };
    }

    return callWithRequest(request, 'get', body)
    .then(function _getRecord(response) {
      return response._source;
    })
    .then(async function _buildObject(source) {
      const { searchSource, uiState } = parseJsonObjects(source);

      const isUsingTimeBasedIndexPattern = await hasTimeBasedIndexPattern(request, searchSource);

      const obj = Object.assign(pick(source, fields), {
        id: body.id,
        type: type,
        searchSource: searchSource,
        uiState: uiState,
        isUsingTimeBasedIndexPattern,
        getUrl: function getAppUrl(query = {}, urlOptions = {}) {
          const options = Object.assign({
            useAbsoluteTime: true
          }, urlOptions);
          const app = appTypes[this.type];
          if (!app) throw new Error('Unexpected app type: ' + this.type);

          // map panel state to panel from app state part of the query
          const cleanQuery = this.getState(query);

          // modify the global state in the query
          const globalState = parseKibanaState(query, 'global');
          if (globalState.exists) {
            globalState.removeProps('refreshInterval');

            // transform to absolute time based on option
            if (options.useAbsoluteTime) {
              globalState.set('time', getAbsoluteTime(globalState.get('time')));
            }

            Object.assign(cleanQuery, globalState.toQuery());
          }

          const urlParams = Object.assign({
            protocol: opts.protocol,
            hostname: opts.hostname,
            port: opts.port,
          }, app.getUrlParams(this.id));

          // Kibana appends querystrings to the hash, and parses them as such,
          // so we'll do the same internally so kibana understands what we want
          // const encoder = (str) => str;
          // const unencodedQueryString = qs.stringify(cleanQuery, null, null, { encodeURIComponent: encoder });
          const unencodedQueryString = uriEncode.stringify(cleanQuery);
          urlParams.hash += '?' + unencodedQueryString;

          return url.format(urlParams);
        },
        getState: function mergeQueryState(query = {}) {
          const appState = parseKibanaState(query, 'app');
          if (!appState.exists || !this.panelIndex) return query;

          const panel = find(appState.get('panels', []), { panelIndex: this.panelIndex });
          const panelState = appState.get(['uiState', `P-${this.panelIndex}`]);

          appState.removeProps(['uiState', 'panels', 'vis']);

          // if uiState doesn't match panel, simply strip uiState
          if (panel && panelState) {
            appState.set('uiState', merge({}, this.uiState, panelState));
          }

          return Object.assign({}, query, appState.toQuery());
        },
        toJSON: function (query, urlOptions) {
          const savedObj = {
            id: this.id,
            type: this.type,
            searchSource: this.searchSource,
            uiState: this.uiState,
            isUsingTimeBasedIndexPattern,
            url: this.getUrl(query, urlOptions)
          };

          fields.forEach((field) => {
            savedObj[field] = this[field];
          });

          return savedObj;
        }
      });

      return obj;
    })
    .catch(() => {
      const isMissing = true;
      const savedObj = {
        id,
        type,
        isMissing,
        toJSON() {
          return {
            id,
            type,
            isMissing
          };
        }
      };
      return savedObj;
    });
  }

  function validateType(type) {
    const app = appTypes[type];
    if (!app) throw new Error('Invalid object type: ' + type);
  }

  // exported methods
  return {
    get: getObject
  };
};
