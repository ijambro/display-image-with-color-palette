const filesystem = require('fs');
const path = require('path');
const commandLineArgs = require('command-line-args');
const getColors = require('get-image-colors');
const { isArray } = require('util');

const DEFAULT_IMG_DIR = '/Users/jakepalmer/Pictures/Vintage Art/Travel Posters';
const DEFAULT_OUTPUT_DIR = path.join(__dirname, 'output');

console.log('-- vintage-travel-colors --');
console.log();
console.log('-- Analyze the color palette of any vintage travel poster! --');
console.log();

let options = commandLineArgs([
  { name: 'input-dir', alias: 'd', type: String, defaultValue: DEFAULT_IMG_DIR },
  { name: 'all-files', alias: 'a', type: Boolean, defaultValue: false },
  { name: 'input-files', alias: 'f', type: String, multiple: true, defaultOption: true },
  { name: 'num-colors', alias: 'c', type: Number, defaultValue: 11 },
  { name: 'output-dir', alias: 'o', type: String, defaultValue: DEFAULT_OUTPUT_DIR }
]);

console.log(options);

if (options['all-files']) {
  createOutputDir();
  getColorsFromAllImages();
}
else if (options['input-files'] && isArray(options['input-files']) && options['input-files'].length > 0) {
  createOutputDir();
  getColorsFromSpecifiedImages();
}
else {
  console.log('You must specify at least one image for me to analyze');
}

function createOutputDir() {
  const outputDir = options['output-dir'];
  if (!filesystem.existsSync(outputDir)){
    filesystem.mkdirSync(outputDir);
  }
}

async function getColorsFromSpecifiedImages() {
  const imgDir = options['input-dir'];
  options['input-files'].forEach(imgFilename => {
    const imgFilepath = path.join(imgDir, imgFilename);
    
    processImage(imgFilename, imgFilepath);
    }
  );
}

function getColorsFromAllImages() {
  const imgDir = options['input-dir'];
  console.log('Loading all images from ' + imgDir);

  filesystem.readdirSync(imgDir).forEach(async imgFilename => {
    const imgFilepath = path.join(imgDir, imgFilename);
    
    processImage(imgFilename, imgFilepath);
  });
}

async function processImage(imgFilename, imgFilepath) {
  console.log('Processing image ' + imgFilepath);

  const colorOptions = {
    count: options['num-colors']
  };
  const colorArray = await getColors(imgFilepath, colorOptions);

  // printColorsToConsole(colorArray);
  printColorsAsHtml(colorArray, imgFilename, imgFilepath);
}

function printColorsToConsole(colorArray) {
  if (!colorArray) {
    console.error('colorArray is null or undefined');
  } else if (colorArray.length === 0) {
    console.warn('colorArray is empty');
  } else {
    colorArray.forEach(color => {
      const hex = color.hex();
      console.log(hex);
    });
  }
}

async function printColorsAsHtml(colorArray, imgFilename, imgFilepath) {
  if (!colorArray) {
    console.error('colorArray is null or undefined');
  } else if (colorArray.length === 0) {
    console.warn('colorArray is empty');
  } else {
    const imgFilenameWithoutExtension = imgFilename.substring(0, imgFilename.indexOf('.'));
    const htmlFilename = imgFilenameWithoutExtension + '.html';
    const outputDir = options['output-dir'];
    const htmlFilepath = path.join(outputDir, htmlFilename);

    // Get the HTML template
    var htmlContent = new String(filesystem.readFileSync(path.join(__dirname, 'templates', 'squares-left-image-right.html')));

    // Get the CSS template
    var cssContent = new String(filesystem.readFileSync(path.join(__dirname, 'templates', 'squares-left-image-right.css')));

    // Replace the title into the HTML
    htmlContent = htmlContent.replace('TITLE', imgFilenameWithoutExtension);

    // Replace the image URL into the CSS
    cssContent = cssContent.replace('IMAGE_URL', imgFilepath);

    let i = 1;
    colorArray.forEach(color => {
      const hex = color.hex();
      // console.log(hex);

      // Replace the colors into HTML
      htmlContent = htmlContent.replace('COLOR' + i, hex);

      // Replace the colors into CSS
      cssContent = cssContent.replace('COLOR' + i, hex);

      i++;
    });
    // Embed the CSS style into the HTML
    htmlContent = htmlContent.replace('ALL_STYLES', cssContent);

    await saveHtml(htmlFilename, htmlFilepath, htmlContent);
  }
}

async function saveHtml(htmlFilename, htmlFilepath, htmlContent) {
  // console.log('Generating HTML color file in ' + HTML_OUT_DIR);

  // console.log('htmlFilepath: ' + htmlFilepath);

  filesystem.writeFile(htmlFilepath, htmlContent, err => {
    if (err) { throw err; }

    console.log('Successfully generated HTML color file: ' + htmlFilename);
    console.log();
  });
}
