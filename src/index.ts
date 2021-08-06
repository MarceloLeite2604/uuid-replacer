import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const uuidRegex = /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/i;

if (process.argv.length < 3) {
  console.error(`Usage node ${process.argv[1]} <file-path>`);
  process.exit(1);
}

type JsonElement = { [key: string]: any } |
  Array<{ [key: string]: any } | string> |
  string;

function findUuids(element: JsonElement, uuids: Array<string> = []) {
  if (typeof element === 'object') {
    if (Array.isArray(element)) {
      element.forEach(arrayValue => findUuids(arrayValue, uuids));
    } else {
      for (const child in element) {
        findUuids(element[child], uuids);
      }
    }
  } else {
    if (typeof element === 'string' &&
      element.match(uuidRegex) &&
      !uuids.find(value => value.toLowerCase() === element.toLowerCase())) {
      uuids.push(element);
    }
  }

  return uuids;
}

function createUuidsMap(uuids: Array<string>) {
  const uuidsMap = new Map<string, string>();
  uuids.forEach(value => uuidsMap.set(value, uuidv4()));
  return uuidsMap;
}

function replaceUuids(fileContent: string, uuidsMap: Map<string, string>) {
  for (let [originalUuid, newUuid] of uuidsMap) {
    fileContent = fileContent.replaceAll(originalUuid, newUuid);
  }
  return fileContent;
}

function writeOutputFileContent(inputFilePath : string, content: string) {
  const filename = `${path.basename(inputFilePath).replace(/\.[^/.]+$/, "")}-replaced`;
  const extension = path.extname(inputFilePath);
  const dirname = path.dirname(inputFilePath);
  const baseName = filename + extension;
  const outputFilePath = path.join(dirname, baseName);
  fs.writeFileSync(outputFilePath, content);
}

((filePath) => {
  if (!fs.existsSync(filePath)) {
    console.error(`Could not find file \"${filePath}\".`);
    process.exit(0);
  }

  const fileContent = fs.readFileSync(filePath).toString();
  const parsedFileContent = JSON.parse(fileContent);

  const uuidsFound = findUuids(parsedFileContent);

  const uuidsMap = createUuidsMap(uuidsFound);

  const replacedFileContent = replaceUuids(fileContent, uuidsMap);
  writeOutputFileContent(filePath, replacedFileContent);
  
})(process.argv[2])
