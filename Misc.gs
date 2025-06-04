
// ---------------------------------------------------------------------------------------------------------------
/** 
 * String Operations
 * javaScript/Google Apps script functions that are equivalent to common VBA functions
 * in general these provide the same functionality and have the same calling stack
 */

class StringOperations {
  constructor() {

  }
  /**
   * Removes leading and trailing whitespace
   * @param {string|number} v the item to be trimmed 
   * @return {string} The trimmed result
   */
  static Trim(v = `TestString`) {
    return StringOperations.LeftStringTrim(StringOperations.RightStringTrim(v));
  }

  /**
   * Removes leading whitespace
   * @param {string|number} s the item to be trimmed
   * @return {string} The trimmed result
   */
  static LeftStringTrim(s = `TestString`) {
    return StringOperations.ConvertToString(s).replace(/^\s\s*/, "");
  }

  /**
   * Removes trailing whitespace
   * @param {string|number} s the item to be trimmed
   * @return {string} The trimmed result
   */
  static RightStringTrim(s = `TestString`){
    return StringOperations.ConvertToString(s).replace(/\s\s*$/, "");
  } 

  /**
   * Gets the .toString length
   * @param {string|number} v the item 
   * @return {number} The length
   */
  static StringLength(v = `TestString`) {
    return StringOperations.ConvertToString(v).length;
  }

  /**
   * Gets the leftmost portion of an item
   * @param {string|number} str the item 
   * @param {number=} optLen length of result(default all)
   * @return {string} The left portion of the string
   */
  static Left(str = `TestString`, optLen) { 
    return StringOperations.Mid(str, 1, optLen);
  }

  /**
   * Gets the rightmost portion of an item
   * @param {string|number} str the item 
   * @param {number=} optLen length of result(default all)
   * @return {string} The right portion of the string
   */
  static Right(str = `TestString`, optLen) {
    return StringOperations.Mid(str, 1 + StringOperations.StringLength(str) - StringOperations.FixOptional(optLen, StringOperations.StringLength(str)));
  }

  /**
   * Gets and extract from a string
   * @param {string|number} str the item 
   * @param {number=} optStart start position(base 1) of extract
   * @param {number=} optLen Number of characters (default all remaining)
   * @return {string} The extracted string
   */
  static Mid(str = `TestString`, optStart, optLen) {
    let s = StringOperations.ConvertToString(str);
    let start = Test.isMissing(optStart) ? 0 : optStart - 1;
    start = start < 0 ? 0 : start;
    let length = Test.isMissing (optLen) ?  StringLength(s) - start + 1 : optLen ;
    console.error(`${s} is not a valid string for Mid`);
    return  s.slice(start, start + length);
  }

  /**
   * Splits an item into an array of strings
   * @param {string|number} s the item 
   * @param {string=} optDelim delimiter(default ,)
   * @param {number=} optLimit max number of splits(default all)
   * @return {Array.<string>} The split arrray of strings
   */
  static Split(s = `TestString`, optDelim, optLimit) {
    return StringOperations.ConvertToString(s).split(StringOperations.FixOptional(optDelim, ","), StringOperations.FixOptional(optLimit, -1));
  }

  /**
   * Repeat
   * @param {number} n number of times to repeat
   * @param {string=} s the character to repeat (default ' ');
   * @return {string} Returns a string of the same character repeated n times
   */
  static Repeat(str = `TestString`, count) {
    return n > 0 ?  Array(count + 1).join(StringOperations.ConvertToString(StringOperations.FixOptional(str,' '))) : '';
  }

  /**
   * Space
   * @param {number} n number of times to repeat
   * @return {string} Returns a string of ' ' repeated n times
   */
  static Space(count = 2) {
    return StringOperations.Repeat(` `, count);
  }

  /**
   * LowerCase
   * @param {string} s item to be converted
   * @return {string} item in lower case
   */
  static LowerCase(s = `TestString`) {
    return StringOperations.ConvertToString(s).toLowerCase();
  }

  /**
   * UpperCase
   * @param {string} s item to be converted
   * @return {string} Returns a string converted to upper case
   */
  static UpperCase(s = `TestString`) { 
    return StringOperations.ConvertToString(s).toUpperCase();
  }

  /**
   * Chr
   * @param {number} n numeric code
   * @return {string} Returns a string representing a numeric char code
   */
  static Chr(n = `TestString`) {
    return String.fromCharCode(n);
  }

  /**
   * Asc
   * @param {string} s the character
   * @return {number} Returns a numeric char code given a character
   */
  static Asc(s = `TestString`) {
    return s.charCodeAt(0);
  }

  /**
   * InStr
   * @param {number=} optStart the position to start looking from(default 1)
   * @param {string} inThisString the the string to lookin
   * @param {string} lookFor the string to look for
   * @param {number=} optCompare not yet implemented
   * @return {number} the position the string starts at or 0 if not found
   */
  static InStr(optStart = 0, inThisString = `TestString`, lookFor = `estS`, optCompare) {
    // TODO optCompare
    let start = StringOperations.FixOptional (optStart, 1);
    let s = StringOperations.Mid(inThisString, start);
    let p = s.indexOf(lookFor);
    return (s && lookFor) ? (p == -1 ? 0 : p+start ): 0;
  }

  /**
   * InStrRev
   * @param {string} lookFor the the string to look for
   * @param {number=} optStart the position to start looking from(default: the end)
   * @param {number=} optCompare not yet implemented
   * @return {number} the position at which a string starts(base1), starting at the end
   */
  static InStrRev(inThisString = `TestString`, lookFor = `estS`, optStart = 0, optCompare) {
    // TODO optCompare
    let start = StringOperations.FixOptional(optStart, -1);
    let s = StringOperations.ConvertToString(inThisString);
    start = start == -1 ? StringOperations.StringLength(s) : start ;
    return (s && lookFor) ? s.lastIndexOf(lookFor, start - 1) + 1 : 0;
  }

  /**
   * ConvertToString
   * @param {*} v item to be converted
   * @return {string} item converted to a string
   */
  static ConvertToString(v = `TestString`) {
    return v === null || Evaluate.isMissing(v) ? ' ' :  v.toString();
  } 

  /**
   * FixOptional
   * throw an exception if not true
   * @param {*} arg given value
   * @param {*} defaultValue value to use if given value IsMissing
   * @return {*} the new value 
   */
  static FixOptional(arg, defaultValue) {
    if (Test.isUndefined(arg)){
      console.error(`Error: No default value for missing argument`);
      return defaultValue;
    }
    return arg;
  }
}





/**
 * Xor
 * Returns item converted to a string
 * @param {boolean} a first item
 * @param {boolean} b second item
 * @return {boolean} exclusive OR of two items
 */
const Xor = (a, b) => a ? !b : b;




// ---------------------------------------------------------------------------------------------------------------
/**
 * Informational Functions
 */
class Evaluate {
  constructor() {

  }
  /**
   * IsEmpty
   * @param {*} v item to check
   * @return {boolean} true if item is empty
   */
  static isEmpty(v) {
    return typeof(v) == "string" && v == Evaluate.Empty();
  }

  /**
   * IsDate
   * @param {string} sDate item to check
   * @return {boolean} true if item can be converted to a date
   */
  static isDate(sDate) {
    const tryDate = new Date(sDate);
    return (tryDate.toString() != "NaN" && tryDate != "Invalid Date");
  }

  /**
   * IsNumeric
   * @param {string} s item to check
   * @return {boolean} true if item can be converted to a number
   */
  static isNumeric(s) {
    return !isNaN(parseFloat(s)) && isFinite(s);
  }

  /**
   * IsMissing
   * Returns whether item is a missing argument
   * @param {*} x item to check
   * @return {boolean} true if item is undefined
   */
  static isMissing(x) {
    return Evaluate.isUndefined(x);
  }

  /**
   * IsObject
   * Returns whether item is an object
   * @param {*} x item to check
   * @return {boolean} true if item is an object
   */
  static isObject(x) {
    return Evaluate.GetType(x) == 'object';
  }

  /**
   * IsNull
   * Returns whether item is null
   * @param {*} x item to check
   * @return {boolean} true if item is exactly null
   */
  static isNull(x) {
    return x === null;
  }

  /**
   * GetType
   * Returns whether item is null
   * @param {*} v item to check
   * @return {string} the java script type 
   */
  static GetType(v) {
    return typeof v;
  }

  /**
   * Empty
   * @return {string} that satisfies IsEmpty() 
   */
  static Empty() {
    return ``;
  }

  /**
   * vbLf
   * Returns LF
   * @return {string} line feed character
   */
  static vbLf(){
    return "\n";
  }

  /**
   * isUndefined
   * Check if a value is defined
   * @param {*} arg given value
   * @return {boolean} true if undefined
   */
  static isUndefined(arg) {
    return typeof arg == 'undefined';
  }

  // https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
  /**
   * toType
   * get detailed type of javaScript let
   * @param {*} obj given item
   * @return {string} type
   */
  static toType(obj) {
    const check = /\s([a-zA-Z]+)/;
    return ({}).toString.call(obj).match(check)[1].toLowerCase();
  }

  /**
   * isTypeNumber
   * Check if a value is a number type
   * @param {*} arg given item
   * @return {boolean} true if numeric type
   */
  static isTypeNumber(arg) {
    return typeof arg == 'number';
  }

  /**
   * isTypeString
   * Check if a value is a string type
   * @param {*} arg given item
   * @return {boolean} true if string type
   */
  static isTypeString(arg) {
    return typeof arg == 'string';
  }

  /**
   * isArray
   * Check if a value is an array
   * @param {*} arg given item
   * @return {boolean} true if array
   */
  static isArray(arg) {
    return Evaluate.toType(arg) == 'array';
  }

  /**
   * makeKey
   * used throughout to normalize strings for comparison
   * @param {*} v given item
   * @return {string} cleaned up string
   */
  static makeKey(v) {
    return StringOperations.LowerCase(StringOperations.Trim(StringOperations.ConvertToString(v)));
  }
}





// ---------------------------------------------------------------------------------------------------------------

/**
 * Compare 2 Events
 * @param {Object} event A
 * @param {Object} event B
 * @param {number} threshold (0 to 1)
 * @returns {Object} comparison
 */
const CompareEvents = (eventA = {}, eventB = {}, threshold = 0.66) => {
  try {

    // Event A
    const { title: titleA, venue: venueA, date: dateA, url: urlA, acts: actsA, } = eventA;

    // Event B
    const { title: titleB, venue: venueB, date: dateB, url: urlB, acts: actsB, } = eventB;

    // Step 1: Date Comparison
    const d1 = Utilities.formatDate(new Date(dateA), "PST", "yyyy/MM/dd");
    const d2 = Utilities.formatDate(new Date(dateB), "PST", "yyyy/MM/dd");
    const dateScore = Common.ScoreStringSimilarity(d1, d2);
    const dateThreshold = dateScore > threshold;

    // Step 2: Compare URLs
    const urlScore = Common.ScoreStringSimilarity(urlA, urlB);         // > 0.66
    const urlThreshold = urlScore >= 0.95;

    // Step 3: Compare Venue Names
    const venueScore = Common.ScoreStringSimilarity(venueA, venueB);   // > 0.5;
    const venueThreshold = venueScore > threshold;

    // Step 4: Compare Event Titles
    const titleScore = Common.ScoreStringSimilarity(titleA, titleB);   // > 0.66;
    const titleThreshold = titleScore > threshold;

    // Step 5: Compare Acts
    const actScore = Common.ScoreStringSimilarity(actsA, actsB);       // > 0.66;
    const actsThreshold = actScore > threshold;

    // Step 6: Average Weights
    const average = StatisticsService.ArithmeticMean([ titleScore, dateScore, actScore, venueScore, urlScore, ]);
    const verdict = average > threshold;
    console.info(`
      TitleA: ${titleA} -----> TitleB: ${titleB} -----> Score: ${titleScore},
      DateA: ${dateA}   -----> DateB:  ${dateB}  -----> Score ${dateScore}, 
      ActsA: ${actsA}   -----> ActsB:  ${actsB}  -----> Score: ${actScore}, 
      VenueA: ${venueA} -----> VenueB: ${venueB} -----> Score: ${venueScore},
      Average Score: (${average}) > Threshold (${threshold}) = ${verdict},
    `);

    return {
      dateScore : dateScore,
      dateThreshold : dateThreshold,
      urlScore : urlScore,
      urlThreshold : urlThreshold,
      venueScore : venueScore,
      venueThreshold : venueThreshold,
      titleScore : titleScore,
      titleThreshold : titleThreshold,
      actScore : actScore,
      actsThreshold : actsThreshold,
      averageScore: average,
      verdict : verdict,
    }

  } catch (err) {
    console.error(`"CompareEvents()" failed: ${err}`);
    return {}; 
  }
}

/**
 * Standardize Address
 * Split addresses at the first comma or semicolon and replace 'St.' or 'Street' with 'St'
 * Returns something like: 1290 Sutter Street
 * This reduces false negatives if Ticketmaster shows CA but another shows it as California
 * @param {string} address
 * @returns {string} standardized address
 * @private
 */
const StandardizeAddress = (address = ``) => {
  try {
    if(!address) throw new Error(`Missing address.`);
    const stdAddress = address
      .replace(/(Avenue|Ave[.]?)/g, "Ave")
      .replace(/(Street|St[.]?)/g, "St")
      .replace(/(Drive|Dr[.]?)/g, "Dr")
      .replace(/(Road|Rd[.]?)/g, "Rd");
    console.info(stdAddress);
    return stdAddress;
  } catch(err) {
    console.error(`"StandardizeAddress()" failed: ${err}`);
    return 1;
  }
}

/**
 * Extract City From Address
 * @param {string} address form:(`123 Main St, Springfield, IL 12345`)
 * @return {string} city
 */
const ExtractCityFromAddress = (address = ``) => {
  try {
    let match = [];
    address = address ? address : `123 Main St, San Francisco, CA 12345`;
    match = address.match(/,\s*([^,]+),\s*([A-Z]{2})\s*\d{5}$/);
    if(!match) match = address.match(/([\w\s\.\-]+),\s?(\d{5})\s([\w\s\-]+),\s([\w\s]+)/);
    if(!match) match = address.match(/(?:\d{5}|\d{4}|\d{3,6})\s+([a-zA-Z\u00C0-\u017F\s\-]+)(?:,\s?[a-zA-Z\s]+)?$/);
    if(!match) match = address.match(/(\d+)\s([\w\s]+);\s([\w\s]+),\s([A-Z]{1,2}\d[A-Z\d]?\s\d[A-Z]{2});\s([\w\s]+);\s([\w\s]+)$/);
    if(!match) match = address.match(/([\w\s]+),\s([\w\s\d]+);\s([\w\s]+);\s([\w\s]+)$/);
    else if(!match) match = [ RESIDENT_ADVISOR_REGIONS[218] ];
    const matchLength = match.length != null ? match.length : 2;
    const city = match[matchLength - 2];
    console.info(`CITY: ${city}`);
    return city;
  } catch(err) {
    console.error(`"ExtractCityFromAddress()" failed: ${err}`);
    return RESIDENT_ADVISOR_REGIONS[218];
  }
}

const _testMatch = () => {
  ExtractCityFromAddress(`123 Main St, Springfield, IL 12345`);
  ExtractCityFromAddress(`Skalitzer str. 114, 10999 Berlin, Germany`);
  ExtractCityFromAddress(`22 Jamaica St; Glasgow, G1 4QD; Scotland; United Kingdom`);
  ExtractCityFromAddress(`De Ruyterkade, Pier 14; Binnenstad Amsterdam; Netherlands`);
  StandardizeAddress(`123 Main St, Springfield, IL 12345`);
  StandardizeAddress(`Skalitzer str. 114, 10999 Berlin, Germany`);
  StandardizeAddress(`22 Jamaica St; Glasgow, G1 4QD; Scotland; United Kingdom`);
  StandardizeAddress(`De Ruyterkade, Pier 14; Binnenstad Amsterdam; Netherlands`);
}













