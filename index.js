import _ from 'lodash';
import { parseEntries, getEntries } from './src/parsers.js';

export function genDiff(filepath1, filepath2) {
  const entries1 = parseEntries(filepath1);
  const entries2 = parseEntries(filepath2);

  const addMarkProp = (obj, mark) => ({ ...obj, mark });

  const differedEntries = _.differenceWith(entries1, entries2, _.isEqual).map(
    (entry) => addMarkProp(entry, '-')
  );
  const newEntries = _.differenceWith(entries2, entries1, _.isEqual).map(
    (entry) => addMarkProp(entry, '+')
  );
  const unchangedEntries = _.intersectionWith(
    entries1,
    entries2,
    _.isEqual
  ).map((entry) => addMarkProp(entry, ' '));

  const summary = [...differedEntries, ...newEntries, ...unchangedEntries];
  const summarySorted = _.orderBy(summary, ['key', 'mark'], ['asc', 'desc']);

  const makeDiffLine = (entry) => `${entry.mark} ${entry.key}: ${entry.value}`;

  const output = ['{', ...summarySorted.map(makeDiffLine), '}'].join('\n');

  return output;
}

// mark is not good for logical diff coz it's preparation for string output
// Let's make structure like {key: 'KEY', oldValue: {...}, newValue: {...}}

const isObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getRecursiveEntries = (obj) => {
  const keyValuePairs = _.toPairs(obj);

  const entries = keyValuePairs.map((pair) => ({
    key: pair[0],
    value: isObject(pair[1]) ? getRecursiveEntries(pair[1]) : pair[1],
    nested: isObject(pair[1])
  }));
  return entries;
};

const addProp = (obj, propName, propVal) => ({ ...obj, [propName]: propVal });

export function genDiffTree(data1, data2) {
  const entries1 = getRecursiveEntries(data1).map((entry) =>
    addProp(entry, 'file', 1)
  );
  const entries2 = getRecursiveEntries(data2).map((entry) =>
    addProp(entry, 'file', 2)
  );

  const checkEntry = (entry, data) => {
    // console.log(entry.key, entry.value);
    const indexOfSameEntry = _.findIndex(data, (el) => el.key === entry.key);
    if (indexOfSameEntry === -1) {
      // return `not found... ${entry.key}:${entry.value}`;
      return {
        key: entry.key,
        file1: entry.value,
        file2: undefined,
        status: 'not found'
      };
    }

    const comparedEntry = data[indexOfSameEntry];

    if (_.isEqual(entry.value, comparedEntry.value)) {
      // return `not changed | ${entry.key}:${entry.value}`;
      return {
        key: entry.key,
        file1: entry.value,
        file2: comparedEntry.value,
        status: 'not changed'
      };
    }
    // return `changed! ${entry.key}:${entry.value} to ${comparedEntry.key}:${comparedEntry.value}`;
    return {
      key: entry.key,
      file1: entry.value,
      file2: comparedEntry.value,
      status: 'changed'
    };
  };

  const iter = (tree1, tree2) => {
    const comparedFromTree1 = tree1.map((entry) => {
      if (!entry.nested) {
        const value = checkEntry(entry, tree2);
        return { ...value, nested: entry.nested };
      }
      if (entry.nested) {
        const value = iter(
          entry.value,
          tree2[_.findIndex(tree2, (el) => el.key === entry.key)].value
        );
        return { value, nested: entry.nested };
      }
    });
    const newEntries = tree2
      .filter(
        (entry) => _.findIndex(tree1, (el) => el.key === entry.key) === -1
      )
      .map((entry) => ({
        key: entry.key,
        file1: undefined,
        file2: entry.value,
        status: 'new'
      }));
    // const newEntries = [];

    return [...comparedFromTree1, ...newEntries];
  };

  return iter(entries1, entries2);
}

const data1 = {
  hello: 'world',
  is: true,
  nestedProp: { count: 5, units: 'm' },
  foo: 'bar'
};

const data2 = {
  hello: 'World!!!',
  is: true,
  nestedProp: { count: 6, units: 'm' },
  nested2: { kek: 12 },
  peepo: 'Happy'
};

const plain1 = {
  string: 'value',
  boolean: true,
  number: 5,
  float: 1.5
};

const plain2 = {
  string: 'value',
  boolean: true,
  peepo: 'happy',
  float: 1.25
};

console.log(genDiffTree(data1, data2));
// console.log(genDiffTree(plain1, plain2));

// const isFlat = (obj) => {
//   const values = Object.values(obj);
//   return values.every(
//     (val) => typeof val !== 'object' || val === null || Array.isArray(val)
//   );
// };

// console.log(isFlat(plain1) && isFlat(plain2));
