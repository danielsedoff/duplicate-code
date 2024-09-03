const MINIMAL_INTERSECTION = 100;
const GLOB_PATH = './src/**/*(*.ts|*.tsx|*.js|*.jsx)';
const LOG_DIR = './logs';
const LOG_FILE = LOG_DIR + '/dupes.log';

const { globSync } = require('glob');
const fs = require('fs');
const importRegex = /^import .+ from/;

try{
  fs.mkdirSync(LOG_DIR);
} catch(e){
  console.log('WARN: couldn\'t create a /logs directory');
}

function printProgress(progress) {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(progress);
}

function formatLog(intersections) {
  result = '';
  intersections

    .sort((a, b) => b[4] - a[4])

    .forEach((line) => {
      result += '\nFile1:             ' + line[0];
      result += '\nFile2:             ' + line[1];
      result += '\nPosition in File1: ' + line[3];
      result += '\nPosition in File2: ' + line[2];
      result += '\nLength:            ' + line[4];
      result += '\nSignature:         ' + line[5];
      result += '\n';
    });
  return result;
}

function findIntersection(string1, string2, minLength) {
  tlcsStart = 0;
  tlcsEnd = 0;
  lcsLength = 0;
  tAddress = 0;
  address = 0;
  for (let i = 0; i < string1.length; ++i) {
    tlcsEnd++;
    if (tlcsEnd - tlcsStart < minLength) continue;
    tAddress = string2.indexOf(string1.substring(tlcsStart, tlcsEnd));
    if (tAddress > -1) {
      if (tlcsEnd - tlcsStart > lcsLength) {
        address = tAddress;
        lcsLength = tlcsEnd - tlcsStart;
      }
    } else {
      tlcsStart = i;
      tlcsEnd = i;
    }
  }
  const lcsPart = string2.substring(address, address + Math.min(lcsLength, 80));
  return [address, lcsLength, lcsPart];
}

const removeImports = (text) => {
  return text.replaceAll(/(import .+ from [^\s]+)|(import ['"].+?['"])/g, ' ');
};

const normalizeFile = (text) => text.replaceAll(/\r?\n/g, ' ').replaceAll(/\b/g, ' ').replaceAll(/\s+/g, ' ');

console.log('start');
console.log('current dir:' + process.cwd());

const allSources = [];
const intersections = [];

const res = globSync(GLOB_PATH);
res.forEach((fileName) => {
  try {
    const data = fs.readFileSync(fileName, 'utf8');
    const normalizedData = normalizeFile(data);
    const unImportedData = removeImports(normalizedData);
    allSources.push({ fileName: fileName, text: unImportedData.toString() });
  } catch (e) {
    console.log('✖ Error reading:', e.stack);
  }
});

console.log('finding intersections...');

const len = allSources.length;
let progress = 0;

for (let i = 0; i < len; ++i) {
  for (let j = i + 1; j < len; ++j) {
    const newProgress = Number((100 * (i * j + j)) / (len * len)).toFixed(2);
    if (newProgress - progress > 0.1) {
      progress = newProgress;
      printProgress('progress: ' + String(progress) + '%');
    }
    const [address1, lcsLength, lcsPart] = findIntersection(
      allSources[i].text,
      allSources[j].text,
      MINIMAL_INTERSECTION,
    );
    const [address2, unused1, unused2] = findIntersection(allSources[j].text, allSources[i].text, MINIMAL_INTERSECTION);
    if (lcsLength >= MINIMAL_INTERSECTION) {
      intersections.push([allSources[i].fileName, allSources[j].fileName, address1, address2, lcsLength, lcsPart]);
    }
  }
}

fs.writeFile(LOG_FILE, formatLog(intersections), (err) => {
  if (err) {
    console.error('✖ error writing', err);
  } else {
    console.error('\n✔ file written successfully');
  }
});
