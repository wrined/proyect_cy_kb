import { isNumber, get, last } from 'lodash';

export default function getLastValue(data, ...rest) {
  if (rest.length !== 0) {
    throw new Error('getLastValue only supports single parameter');
  }

  if (isNumber(data)) return data;
  if (!Array.isArray(data)) return 0;

  return get(last(data), '[1]') || 0;
};
