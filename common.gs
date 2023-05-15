// Common GAS Functions
// v2.2.0 - 2021-10-04


/**
 * Parse URL path parameters
 * @param {request} request
 * @returns {string} path
 */
const parsePathParameters = (request) => {
  if (!request.queryString.match(/\=/)) return request.queryString;  // If there`s only one parameter, just treat it as a path
  return request.parameter.path || ``;
}


/**
 * Strip spaces, no-break spaces, zero-width spaces, & zero-width no-break spaces
 * @param {string} string
 * @returns {string} string
 */
const trim = (string) => {
  const pattern = /(^[\s\u00a0\u200b\uFEFF]+)|([\s\u00a0\u200b\uFEFF]+$)/g;
  return string.replace(pattern, ``);
}


/**
 * Retrieve text from inside XML tags
 * @param {string} string
 * @returns {string} string
 */
const stripXml = (input) => {
  // Only parse input if it looks like it contains tags
  if (input.match(/<[^>]*>/)) {
    // Find where the tags start & end
    let start = input.indexOf(`<`);
    let end = input.lastIndexOf(`>`) + 1;

    // Grab any text before all XML tags
    let pre = input.slice(0, start);
    // Grab any text after all XML tags
    let post = input.slice(end);
    let inside = ``;

    try {
      // Parse input without any pre or post text
      let cleanInput = input.slice(start, end);

      let doc = XmlService.parse(cleanInput);
      inside = doc.getRootElement().getText();
    } catch (error) {
      console.info(`Whoops: ${input} = ${error}`);
    }
    return pre + inside + post;
  }
  return input;
}

/**
 * Convert a JSON string to a pretty-print JSON string
 * @param {string} input
 * @returns {[string]} string array
 */
const prettifyJson = (input) => JSON.stringify(JSON.parse(input), null, 4);

/**
 * Collate objects at given path, from array of JSON strings
 * @param {string} path
 * @param {[object]} objects
 */
const collateArrays = (path, objects) => {
  let outArray = [];
  let chunks = path.split(`.`);

  // Iterate over each object
  for (const resp of objects) {
    // Logger.log(resp);
    let obj = JSON.parse(resp);
    for (const chunk of chunks) {
      obj = obj[chunk];
    }
    outArray = outArray.concat(obj);
  }
  return outArray;
}


/**
 * ----------------------------------------------------------------------------------------------------------------
 * Remove duplictes from an array
 * @param {array} array
 */
const UniqueArray = (array) => [...new Set(array)];


/**
 * ----------------------------------------------------------------------------------------------------------------
 * Return TRUE if number is even, FALSE if it is odd
 * @param {number} n
 */
const isEven = (n) => n % 2 == 0;
