import parseFileData from './parsers.js';
import { normalizePath, getFormat, readFile } from './helpers.js';

import genDiffData from './genDiffData.js';
import chooseFormatter from './formatters/index.js';

const genDiff = (filepath1, filepath2, formatName) => {
  const path1 = normalizePath(filepath1);
  const fileFormat1 = getFormat(path1);
  const fileData1 = readFile(path1);
  const parsedData1 = parseFileData(fileData1, fileFormat1);

  const path2 = normalizePath(filepath2);
  const fileFormat2 = getFormat(path2);
  const fileData2 = readFile(path2);
  const parsedData2 = parseFileData(fileData2, fileFormat2);

  const diff = genDiffData(parsedData1, parsedData2);
  const formatDiffData = chooseFormatter(formatName);
  console.log(formatDiffData);
  return formatDiffData(diff);
};

export default genDiff;
