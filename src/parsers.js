import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import yaml from 'js-yaml';

const normalizePath = (inputPath) => path.resolve(process.cwd(), inputPath);

const getExtension = (filename) => filename.split('.').at(-1);

export function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const getFormat = (filename) => {
  if (getExtension(filename).toLowerCase() === 'json') return 'JSON';
  if (['yaml', 'yml'].includes(getExtension(filename).toLowerCase())) {
    return 'YAML';
  }
  return null;
};

export const getRecursiveEntries = (obj) => {
  const keyValuePairs = _.toPairs(obj);

  const entries = keyValuePairs.map((pair) => {
    if (!isObject(pair[1])) {
      return { key: pair[0], value: pair[1], nested: false };
    }
    return {
      key: pair[0],
      value: getRecursiveEntries(pair[1]),
      nested: true,
    };
  });
  return entries;
};

function parseJSONFile(filePath) {
  return JSON.parse(fs.readFileSync(normalizePath(filePath)));
}

function parseYAMLFile(filePath) {
  return yaml.load(fs.readFileSync(normalizePath(filePath)));
}

export const parseEntries = (filepath) => {
  const format = getFormat(filepath);
  if (format === 'JSON') return getRecursiveEntries(parseJSONFile(filepath));
  if (format === 'YAML') return getRecursiveEntries(parseYAMLFile(filepath));
  return null;
};
