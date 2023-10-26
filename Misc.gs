
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
    return this.LeftStringTrim(this.RightStringTrim(v));
  }

  /**
   * Removes leading whitespace
   * @param {string|number} s the item to be trimmed
   * @return {string} The trimmed result
   */
  static LeftStringTrim(s = `TestString`) {
    return this.ConvertToString(s).replace(/^\s\s*/, "");
  }

  /**
   * Removes trailing whitespace
   * @param {string|number} s the item to be trimmed
   * @return {string} The trimmed result
   */
  static RightStringTrim(s = `TestString`){
    return this.ConvertToString(s).replace(/\s\s*$/, "");
  } 

  /**
   * Gets the .toString length
   * @param {string|number} v the item 
   * @return {number} The length
   */
  static StringLength(v = `TestString`) {
    return this.ConvertToString(v).length;
  }

  /**
   * Gets the leftmost portion of an item
   * @param {string|number} str the item 
   * @param {number=} optLen length of result(default all)
   * @return {string} The left portion of the string
   */
  static Left(str = `TestString`, optLen) { 
    return this.Mid(str, 1, optLen);
  }

  /**
   * Gets the rightmost portion of an item
   * @param {string|number} str the item 
   * @param {number=} optLen length of result(default all)
   * @return {string} The right portion of the string
   */
  static Right(str = `TestString`, optLen) {
    return this.Mid(str, 1 + this.StringLength(str) - this.FixOptional(optLen, this.StringLength(str)));
  }

  /**
   * Gets and extract from a string
   * @param {string|number} str the item 
   * @param {number=} optStart start position(base 1) of extract
   * @param {number=} optLen Number of characters (default all remaining)
   * @return {string} The extracted string
   */
  static Mid(str = `TestString`, optStart, optLen) {
    let s = this.ConvertToString(str);
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
    return this.ConvertToString(s).split(this.FixOptional(optDelim, ","), this.FixOptional(optLimit, -1));
  }

  /**
   * Repeat
   * @param {number} n number of times to repeat
   * @param {string=} s the character to repeat (default ' ');
   * @return {string} Returns a string of the same character repeated n times
   */
  static Repeat(str = `TestString`, count) {
    return n > 0 ?  Array(count + 1).join(this.ConvertToString(this.FixOptional(str,' '))) : '';
  }

  /**
   * Space
   * @param {number} n number of times to repeat
   * @return {string} Returns a string of ' ' repeated n times
   */
  static Space(count = 2) {
    return this.Repeat(` `, count);
  }

  /**
   * LowerCase
   * @param {string} s item to be converted
   * @return {string} item in lower case
   */
  static LowerCase(s = `TestString`) {
    return this.ConvertToString(s).toLowerCase();
  }

  /**
   * UpperCase
   * @param {string} s item to be converted
   * @return {string} Returns a string converted to upper case
   */
  static UpperCase(s = `TestString`) { 
    return this.ConvertToString(s).toUpperCase();
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
    let start = this.FixOptional (optStart, 1);
    let s = this.Mid(inThisString, start);
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
    let start = this.FixOptional(optStart, -1);
    let s = this.ConvertToString(inThisString);
    start = start == -1 ? this.StringLength(s) : start ;
    return (s && lookFor) ? s.lastIndexOf(lookFor, start - 1) + 1 : 0;
  }

  /**
   * ConvertToString
   * @param {*} v item to be converted
   * @return {string} item converted to a string
   */
  static ConvertToString(v = `TestString`) {
    return v === null || Test.isMissing(v) ? ' ' :  v.toString();
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





// ---------------------------------------------------------------------------------------------------------------
/**
 * Date Operations
 */
class DateOperations {
  constructor() {

  }

  /**
   * DateSerial
   * @param {number} y year
   * @param {number} m month
   * @param {number} d day
   * @return {Date} a date object
   */
  static DateSerial(year, month, day) {
    return new Date(year, month, day);
  }

  /**
   * Year
   * @param {Date} dt a date object
   * @return {number} the year from a date
   */
  static Year(dt) {
    return dt.getFullYear();
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
class Test {
  constructor() {

  }
  /**
   * IsEmpty
   * @param {*} v item to check
   * @return {boolean} true if item is empty
   */
  static isEmpty(v) {
    return typeof(v) == "string" && v == this.Empty();
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
    return this.isUndefined(x);
  }

  /**
   * IsObject
   * Returns whether item is an object
   * @param {*} x item to check
   * @return {boolean} true if item is an object
   */
  static isObject(x) {
    return this.GetType(x) == 'object';
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
    return this.toType(arg) == 'array';
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

/**
 * Extract City From Address
 * @param {string} address
 * @return {string} city
 */
const ExtractCityFromAddress = (address = `123 Main St, Springfield, IL 12345`) => {
  address = address != null && address != undefined ? address : `123 Main St, San Francisco, CA 94606`;
  const regex = /,\s*([^,]+),\s*([A-Z]{2})\s*\d{5}$/;
  const match = address.match(regex);
  if (match && match[1]) return match[1].trim();
  else return RESIDENT_ADVISOR_REGIONS[218];
}


const _testS = () => {
  const s = StringOperations.Trim(`  asldkfj.   `);
  console.info(s);
}













