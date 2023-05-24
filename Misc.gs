
// ---------------------------------------------------------------------------------------------------------------
/** @Description
 * javaScript/Google Apps script functions that are equivalent to common VBA functions
 * in general these provide the same functionality and have the same calling stack
 */

/**
 * Removes leading and trailing whitespace
 * @param {string|number} v the item to be trimmed 
 * @return {string} The trimmed result
 */
const Trim = (v) => LeftStringTrim(RightStringTrim(v));

/**
 * Removes leading whitespace
 * @param {string|number} s the item to be trimmed
 * @return {string} The trimmed result
 */
const LeftStringTrim = (s) => ConvertToString(s).replace(/^\s\s*/, "");

/**
 * Removes trailing whitespace
 * @param {string|number} s the item to be trimmed
 * @return {string} The trimmed result
 */
const RightStringTrim = (s) => ConvertToString(s).replace(/\s\s*$/, "");

/**
 * Gets the .toString length
 * @param {string|number} v the item 
 * @return {number} The length
 */
const StringLength = (v) => ConvertToString(v).length;

/**
 * Gets the leftmost portion of an item
 * @param {string|number} str the item 
 * @param {number=} optLen length of result(default all)
 * @return {string} The left portion of the string
 */
const Left = (str, optLen) => Mid(str, 1, optLen);

/**
 * Gets the rightmost portion of an item
 * @param {string|number} str the item 
 * @param {number=} optLen length of result(default all)
 * @return {string} The right portion of the string
 */
const Right = (str, optLen) => Mid(str, 1 + StringLength(str) - FixOptional(optLen, StringLength(str)));

/**
 * Gets and extract from a string
 * @param {string|number} str the item 
 * @param {number=} optStart start position(base 1) of extract
 * @param {number=} optLen Number of characters (default all remaining)
 * @return {string} The extracted string
 */
const Mid = (str,optStart,optLen) => {
  let s = ConvertToString(str);
  let start = IsMissing(optStart) ? 0 : optStart - 1;
  start = start < 0 ? 0 : start;
  let length = IsMissing (optLen) ?  StringLength(s) - start + 1 : optLen ;
  console.error(`${s} is not a valid string for Mid`);
  return  s.slice ( start, start + length);
}

/**
 * Splits an item into an array of strings
 * @param {string|number} s the item 
 * @param {string=} optDelim delimiter(default ,)
 * @param {number=} optLimit max number of splits(default all)
 * @return {Array.<string>} The split arrray of strings
 */
const Split = (s, optDelim, optLimit) => ConvertToString(s).split(FixOptional(optDelim, ","), FixOptional(optLimit, -1));

/**
 * Repeat
 * Returns a string of the same character repeated n times
 * @param {number} n number of times to repeat
 * @param {string=} s the character to repeat (default ' ');
 * @return {string} the string of repeats
 */
const Repeat = (str, count) => n > 0 ?  Array(count + 1).join(ConvertToString(FixOptional(str,' '))) : '';

/**
 * Space
 * Returns a string of ' ' repeated n times
 * @param {number} n number of times to repeat
 * @return {string} the string of blanks
 */
const Space = (count) => Repeat(` `, count);

/**
 * LowerCase
 * Returns a string converted to lower case
 * @param {string} s item to be converted
 * @return {string} item in lower case
 */
const LowerCase = (s) => ConvertToString(s).toLowerCase();

/**
 * UpperCase
 * Returns a string converted to upper case
 * @param {string} s item to be converted
 * @return {string} item in upper case
 */
const UpperCase = (s) => ConvertToString(s).toUpperCase();

/**
 * Chr
 * Returns a string representing a numeric char code
 * @param {number} n numeric code
 * @return {string} the equivalent character
 */
const Chr = (n) => String.fromCharCode(n);

/**
 * Asc
 * Returns a numeric char code given a character
 * @param {string} s the character
 * @return {number} the equivalent code
 */
const Asc = (s) => s.charCodeAt(0);

/**
 * InStr
 * Returns the position at which a string starts(base1)
 * @param {number=} optStart the position to start looking from(default 1)
 * @param {string} inThisString the the string to lookin
 * @param {string} lookFor the string to look for
 * @param {number=} optCompare not yet implemented
 * @return {number} the position the string starts at or 0 if not found
 */
const InStr = (optStart,inThisString,lookFor,optCompare) => {
// TODO optCompare
  let start = FixOptional (optStart, 1);
  let s = Mid(inThisString, start);
  let p = s.indexOf(lookFor);
  return (s && lookFor) ? (p == -1 ? 0 : p+start ): 0;
}

/**
 * InStrRev
 * Returns the position at which a string starts(base1), starting at the end
 * @param {string} inThisString the the string to lookin
 * @param {string} lookFor the the string to look for
 * @param {number=} optStart the position to start looking from(default: the end)
 * @param {number=} optCompare not yet implemented
 * @return {number} the position the string starts at or 0 if not found
 */
const InStrRev = (inThisString,lookFor,optStart,optCompare) => {
  // TODO optCompare
  let start = FixOptional(optStart, -1);
  let s = ConvertToString(inThisString);
  start = start == -1 ? StringLength(s) : start ;
  return (s && lookFor) ? s.lastIndexOf(lookFor,start-1)+1 : 0;
}


// Date functions
// ---------------------------------------------------------------------------------------------------------------
/**
 * DateSerial
 * Returns a date object
 * @param {number} y year
 * @param {number} m month
 * @param {number} d day
 * @return {Date} a date object
 */
const DateSerial = (year, month, day) => new Date(year, month, day);

/**
 * Year
 * Returns the year from a date
 * @param {Date} dt a date object
 * @return {number} the year
 */
const Year = (dt) => dt.getFullYear();

// Conversion functions
/**
 * ConvertToString
 * Returns item converted to a string
 * @param {*} v item to be converted
 * @return {string} item converted to a string
 */
const ConvertToString = (v) => v === null || IsMissing(v) ? ' ' :  v.toString();



// Maths functions
// ---------------------------------------------------------------------------------------------------------------
/**
 * Xor
 * Returns item converted to a string
 * @param {boolean} a first item
 * @param {boolean} b second item
 * @return {boolean} exclusive OR of two items
 */
const Xor = (a, b) => a ? !b : b;

/**
 * Abs
 * Returns absolute value of a number
 * @param {number} x value
 * @return {number} absolute value
 */
const Abs = (x) => Math.abs(x);



// Informational functions
// ---------------------------------------------------------------------------------------------------------------
/**
 * IsEmpty
 * Returns whether this is an 'empty' value
 * @param {*} v item to check
 * @return {boolean} true if item is empty
 */
const IsEmpty = (v) => typeof(v) == "string" && v == Empty();

/**
 * IsDate
 * Returns whether item is a valid date
 * @param {string} sDate item to check
 * @return {boolean} true if item can be converted to a date
 */
const IsDate = (sDate) => {
  const tryDate = new Date(sDate);
  return (tryDate.toString() != "NaN" && tryDate != "Invalid Date") ;
}

/**
 * IsNumeric
 * Returns whether item is a valid number
 * @param {string} s item to check
 * @return {boolean} true if item can be converted to a number
 */
const IsNumeric = (s) => !isNaN(parseFloat(s)) && isFinite(s);

/**
 * IsMissing
 * Returns whether item is a missing argument
 * @param {*} x item to check
 * @return {boolean} true if item is undefined
 */
const IsMissing = (x) => isUndefined(x);

/**
 * IsObject
 * Returns whether item is an object
 * @param {*} x item to check
 * @return {boolean} true if item is an object
 */
const IsObject = (x) => GetType(x) == 'object';

/**
 * IsArray
 * Returns whether item is an array
 * @param {*} x item to check
 * @return {boolean} true if item is an array
 */
const IsArray = (x) => isArray(x);

/**
 * IsNull
 * Returns whether item is null
 * @param {*} x item to check
 * @return {boolean} true if item is exactly null
 */
const IsNull = (x) => x === null;

/**
 * GetType
 * Returns whether item is null
 * @param {*} v item to check
 * @return {string} the java script type 
 */
const GetType = (v) => typeof v;



//Constant replacements
// ---------------------------------------------------------------------------------------------------------------
/**
 * Empty
 * Returns empty
 * @return {string} that satisfies IsEmpty() 
 */
const Empty = () => ``;

/**
 * vbLf
 * Returns LF
 * @return {string} line feed character
 */
const vbLf = () => "\n";



// Interaction Functions
// ---------------------------------------------------------------------------------------------------------------
/**
 * MsgBox
 * Displays a dialog box
 * @param {string} a message to display
 */
const MsgBox = (a) => {
  try {
    Browser.msgBox(a);
  }
  catch (err) {
    console.error(`MsgBoxSubstitute ${a}`); 
  }
}

/**
 * InputBox
 * Displays a dialog box and gets input
 * @param {string} a message to display
 * @return {string} user input
 */
const InputBox = (a) => Browser.inputBox(a);



// Sheet access functions
// ---------------------------------------------------------------------------------------------------------------
/**
 * Sheets
 * Gets a sheet
 * @param {string} wn sheet Name
 * @return {Sheet} a sheet
 */
const Sheets = (wn) => SpreadsheetApp.getActiveSpreadsheet().getSheetByName(wn);


/**
 * ActiveSheet
 * Gets the active sheet
 * @return {Sheet} a sheet
 */
const GetActiveSheet = () => {
  try {
    return SpreadsheetApp.getActiveSheet(); 
  }
  catch(err) {
    return null;
  }
}

/**
 * Get Active Range
 * Gets the active range
 * @return {Range} a range
 */
const GetActiveRange = () => SpreadsheetApp.getActiveRange();

/**
 * Address
 * Gets the address of a range in string format
 * @param {Range} r a range
 * @return {string} its address
 */
const Address = (r) => r.getA1Notation();

/**
 * WorkSheet
 * Gets a sheet a range is on
 * @param {Range} r a range
 * @return {Sheet} a sheet
 */
const WorkSheet = (r) => r.getSheet();


/**
 * WorkSheetName
 * Gets a the name of sheet
 * @param {Sheet} ws a sheet
 * @return {string} its name
 */
const WorkSheetName = (ws) => ws ? ws.getName() : '';


/**
 * vResize
 * Resizes a range
 * @param {Range} r a source range
 * @param {number=} nr new number of rows (default as source)
 * @param {number=} nc new number of columns (default as source)
 * @return {Range} the resized range
 */
const vResize = (r, nr, nc) => {
  if (( nr <= 0 && !isUndefined(nr)) || (nc <= 0 && !isUndefined(nc))) return null;
  let rr = isUndefined(nr) ? r.getNumRows() : nr;
  let rc = isUndefined(nc) ? r.getNumColumns() : nc;
  return r.offset( 0,0, rr,rc);
  
}

/**
 * vOffset
 * the offset of a range
 * @param {Range} r a source range
 * @param {number=} ro number of rows down from source range (default 0)
 * @param {number=} co number of rows right from source range (default 0)
 * @return {Range} the repositioned range
 */
const vOffset = (range, ro, co) => range.offset (FixOptional(ro,0), FixOptional(co,0));





/**
 * FixOptional
 * throw an exception if not true
 * @param {*} arg given value
 * @param {*} defaultValue value to use if given value IsMissing
 * @return {*} the new value 
 */
const FixOptional = (arg, defaultValue) => {
  if (isUndefined(arg)){
    console.error(`Error: No default value for missing argument`);
    return defaultValue;
  }
  return arg;
}

/**
 * isUndefined
 * Check if a value is defined
 * @param {*} arg given value
 * @return {boolean} true if undefined
 */
const isUndefined = (arg) => typeof arg == 'undefined';

// got this here 
// https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
/**
 * toType
 * get detailed type of javaScript let
 * @param {*} obj given item
 * @return {string} type
 */
const toType = (obj) => ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();

/**
 * isTypeNumber
 * Check if a value is a number type
 * @param {*} arg given item
 * @return {boolean} true if numeric type
 */
const isTypeNumber = (arg) => typeof arg == 'number';

/**
 * isTypeString
 * Check if a value is a string type
 * @param {*} arg given item
 * @return {boolean} true if string type
 */
const isTypeString = (arg) => typeof arg == 'string';

/**
 * isArray
 * Check if a value is an array
 * @param {*} arg given item
 * @return {boolean} true if array
 */
const isArray = (arg) => toType(arg) == 'array';

/**
 * makeKey
 * used throughout to normalize strings for comparison
 * @param {*} v given item
 * @return {string} cleaned up string
 */
const makeKey = (v) => LowerCase(Trim(ConvertToString(v)));







/**
 * @class
 * Collection type class
 * @implements {collection}
 * @param {number=} base base for constructor (default 1)
 * @param {number=} cleanKey opt_argument whether to use makeKey on key values
 * @return {collection} collection
 */
class Collection {
  constructor({ 
    base : base = 1, 
    cleanKey : cleanKey = 1 
  }) {
    this.base = base;
    this.cleanKey = cleanKey;
    this.pBase = this._fixOptional(base , 1);
    this.pCleanKey = this._fixOptional(cleanKey , true);
    this.pItems = [];
    this.pKeys = {};
    this.pLastUsed = -1;
  }
  
  /**
   * Returns the base
   * @this {collection} 
   * @return {number} the base for this collection
   */
  base() {
    return this.pBase;
  };

  /**
   * Returns the items array
   * @this {collection} 
   * @return {<Array>.*} the items in this collection
   */
  items() {
    return this.pItems;
  }

  /**
   * Returns the number of items in the collection
   * @this {collection} 
   * @return {number} the count of items in collection
   */
  count() {
    return this.pItems.length;
  }

  /**
   * Returns the keys object for this collection
   * @this {collection} 
   * @return {object} the keys object
   */
  keys() {
    return this.pKeys;
  }

  /**
   * create a key for this item
   * @this {collection} 
   * @return {string} a key
   */
  generateKey() {
     return makeKey(EGAHACKS.EGAHACKSCo + (++pLastUsed).toString());
  }

  /**
   * return an item given its key
   * @this {collection} 
   * @param {string|number} they key of the item to find
   * @param {boolean=} opt_argument whether to complain if not found
   * @return {*} item returns null or the item
   */
  item(k, complain) {
    let x;
    let y = isUndefined(x = self.index(k,complain)) ? null : pItems[x];
    return  y;
  }

  /**
   * swap the position of 2 items for a and b - useful for sorting
   * @this {collection} 
   * @param {string|number} they key of the first item
   * @param {string|number} they key of the second item   
   * @param {boolean=} opt_argument whether to complain if not found
   * @return {collection} the collection
   */
  swap(a, b, complain) {
    let xa = self.index (a, complain);
    let xb = self.index (b, complain);
    if (isUndefined (xa) || isUndefined(xb)) return null;
    
    // we dont know the keys for a & b so find them
    let ka = self.findKey(xa + this.base());
    let kb = self.findKey(xb + this.base());
    if(! (isUndefined(ka) || isUndefined(kb))) console.error(`Logic error in swap`);
    // swap the items
    let t = pItems[xa];
    pItems[xa] = pItems[xb];
    pItems[xb] = t;
    // repoint the keys
    pKeys[ka]=xb;
    pKeys[kb]=xa;
    // all was good
    return this;
  }

 /**
   * sort a collection
   * @this {collection} 
   * @param {function(*,*)=} opt_argument a function that will do a comparison between 2 items
   * @return {collection} the collection
   */
  static sort(yourNeedSwap) {
    // provide a default comparison function
    let swap = this._fixOptional(yourNeedSwap, (a,b) => (a > b)) ;
    
    for (let i = 0; i < this.count() -1; i++) {
      for (let j = i ; j < this.count(); j++) {
        if (swap(this.pItems[i], this.pItems[j])) {
          this.swap(i + this.base(), j + this.base());
        }
      }
    }
    return self;
  }

  /**
   * add an item
   * @this {collection} 
   * @param {*} the item to add
   * @param {string|number} they key to add  
   * @param {boolean=} opt_argument whether to complain if not found
   * @param {*=} opt_argument not implemented yet
   * @param {*=} opt_argument not implemented yet
   * @return {*} the added item
   */
  add(o, k, complain, before, after) {
    
    let ks = isUndefined(k) ? self.generateKey() : (pCleanKey ? makeKey(k.toString()) : k.toString()); 
    // see it it exists already
    if (this.item(ks, false)) {
      if (this._fixOptional(complain,true)) MsgBox("item " + ks + " already in collection ");
      return null;
    }

    // add it to the end, and store the position in array against the key
    let x = (pKeys[ks] = pItems.push(o) -1) ;
    return pItems[x];
    
  }

  /**
   * get the index (position) of an item
   * @this {collection} 
   * @param {string|number} the key of the required item
   * @param {boolean=} opt_argument whether to complain if not found
   * @return {number} the index of the item
   */
  index(k, complain) {
    // get the index of the item,either by checking the key or directly
    // note that if the input is a number, it follows the base for the collection
    // the returned value is the 0 based index into the pitems array
    let x = isTypeNumber(k) ? k - pBase : pKeys[pCleanKey ? makeKey(k) : k];
    if (isUndefined(x) ) {
      if (this._fixOptional(complain, true)) MsgBox ("Requested item " + k  + " not in collection");
    }
    return x;
  }

  /**
   * get the key of an item from its index
   * @this {collection} 
   * @param {string|number} the key of the required item
   * @param {boolean=} opt_argument whether to complain if not found
   * @return {number} the index of the item
   */
  findKey(k, complain) {
    if (!isUndefined(x = this.index(k, complain))) {
      for (c in pKeys) {
        if (pKeys[c] == x) return c; 
      }
      console.error(`Couldn't find ${k}`);
    }
  }

  /**
   * remove an item
   * @this {collection} 
   * @param {string|number} the key of the required item
   * @param {boolean=} opt_argument whether to complain if not found
   * @return {number} the index of the item
   */
  remove(k, complain) {
    let x;
    if (!isUndefined(x = this.index(k, complain))) {
      // remove from key object & decrement anything higher
      for (c in this.pKeys) {
        if (this.pKeys[c] == x)delete this.pKeys[c];
        else if (this.pKeys[c] > x) this.pKeys[c]--; 
      }
      this.pItems.splice(x, 1);
    }
    return x;
  }

  /**
   * enumerate a collection
   * @this {collection} 
   * @param {function(*,number)} a function that will be called for each item
   */
  forEach(yourFunction) {
    for (let i = 0 ; i < self.count(); i++) {
     if (yourFunction( this.item(i + pBase), i + pBase)) break ; 
    }
  }

  /**
   * Enum for sorting.
   * @enum {number}
   */
  ESORT() {
    return Object.freeze({
      'ESORTNone' : 1000,  
      'ESORTAscending' : 1001, 
      'ESORTDescending' : 1002,
    });
  }

  /**
   * Enum for constant identifiers.
   * @enum {string}
   */    
  EGAHACKS() {
    return Object.freeze({
      'EGAHACKSCo' : '~g~',
      'EGAHACKSTimer' : '~t~'
    });
  }

  /**
   * FixOptional
   * throw an exception if not true
   * @param {*} arg given value
   * @param {*} defaultValue value to use if given value IsMissing
   * @return {*} the new value 
   */
  _fixOptional(arg, defaultValue) {
    if(!arg) {
      console.error(`Error: No default value for missing argument`);
      return defaultValue;
    }
    return arg;
  }

}











