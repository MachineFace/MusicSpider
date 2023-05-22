
/**
 * ----------------------------------------------------------------------------------------------------------------
 * Common GAS Functions
 */
class Common {
  constructor() {
  }

  /**
   * Parse URL path parameters
   * @param {request} request
   * @returns {string} path
   */
  ParsePathParameters(request) {
    if (!request.queryString.match(/\=/)) return request.queryString;  // If there`s only one parameter, just treat it as a path
    return request.parameter.path || ``;
  }

  /**
   * Strip spaces, no-break spaces, zero-width spaces, & zero-width no-break spaces
   * @param {string} string
   * @returns {string} string
   */
  StringTrim(string) {
    const pattern = /(^[\s\u00a0\u200b\uFEFF]+)|([\s\u00a0\u200b\uFEFF]+$)/g;
    return string.replace(pattern, ``);
  }

  /**
   * Retrieve text from inside XML tags
   * @param {string} string
   * @returns {string} string
   */
  StripXml(input) {
    // Only parse input if it looks like it contains tags
    if (input.match(/<[^>]*>/)) {
      // Find where the tags start & end
      const start = input.indexOf(`<`);
      const end = input.lastIndexOf(`>`) + 1;

      // Grab any text before all XML tags
      const pre = input.slice(0, start);
      // Grab any text after all XML tags
      const post = input.slice(end);
      let inside = ``;

      try {
        // Parse input without any pre or post text
        let cleanInput = input.slice(start, end);

        let doc = XmlService.parse(cleanInput);
        inside = doc.getRootElement().getText();
      } catch (error) {
        console.error(`Whoops: ${input} = ${error}`);
      }
      return pre + inside + post;
    }
    return input;
  }

  /**
   * Create XML Element
   */
  XmlElement(type, text) {
    return XmlService
      .createElement(type)
      .setText(text);
  }

  /**
   * Convert a JSON string to a pretty-print JSON string
   * @param {string} input
   * @returns {[string]} string array
   */
  PrettifyJson(input) {
    return JSON.stringify(input, null, 4);
  }

  /**
   * Collate objects at given path, from array of JSON strings
   * @param {string} path
   * @param {[object]} objects
   */
  CollateArrays(path, objects) {
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
   * Remove duplictes from an array
   * @param {array} array
   */
  UniqueArray(array) {
    return [...new Set(array)];
  }

  /**
   * Test if a number is even.
   * @param {number} n
   * @returns {bool} boolean
   */
  IsEven(n) {
    return n % 2 === 0;
  }

  /**
   * Test if number is odd.
   * @param {number} n
   * @returns {bool} boolean
   */
  IsOdd(n) {
    return n % 2 !== 0;
  }
}

/**
 * Sleep function to wait for execution
 * @param {number} milliseconds
 */
const Sleep = async (ms) => new Promise(r => setTimeout(r, ms));



const _testC = () => {
  const c = new Common();
  const monthNames = [`Jan`, `Feb`, `Mar`, `Apr`, `May`, `June`, `July`, `Aug`, `Jan`, `Feb`, `Sept`, `Oct`, `Mar`, `Nov`, `Dec`, ];
  console.info(c.UniqueArray(monthNames));
  console.info(`Test 2 is even: ${c.IsEven(2)}`);
  console.info(`Test 2 is odd: ${c.IsOdd(2)}`);
}








