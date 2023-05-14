/**
 * ----------------------------------------------------------------------------------------------------------------
 * Clear a range of values
 * @param {sheet} sheet 
 * @param {number} startRow header title
 */
const clearData = (sheet, startRow = 2) =>  {
  if(typeof sheet != `object`) return 1;
  startRow = startRow >= 2 ? startRow : 2;
  let numCols = sheet.getLastColumn();
  let numRows = numRows >= 1 ? sheet.getLastRow() - startRow + 1 : 1; // The number of row to clear
  let range = sheet.getRange(startRow, 1, numRows, numCols);
  range.clear();
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Removes any row of data if the Date value is before today
 * @param {sheet} sheet
 * @param {string} dateHeaderName default is "Date"
 */
const removeExpiredEntries = (sheet, dateHeaderName = "Date") => {
  if(typeof sheet != `object`) return 1;
  try {
    let today = new Date();
    let data = sheet.getDataRange().getValues();
    let lastRow = sheet.getLastRow() - 1; //subtract header
    if (lastRow < 1) return 1;
    let col = data[0].indexOf(dateHeaderName);
    let range = sheet.getRange(2, col + 1, lastRow, 1).getValues();
    if (col == -1) {
      console.error(`Matching data by header failed...`);
      return false;
    }
    let rowsToDel = [];
    for (let i = 0; i < range.length; i++){
      let date = new Date(range[i][0]);
      if (date <= today) {
        rowsToDel.push(i+2);
      }
    }
    for (let i = 0; i < rowsToDel.length; i++){
      console.info(`Removing expired event: ${data[i+1][0]}, Date: ${range[rowsToDel[i]-2]}`);
      sheet.deleteRow(rowsToDel[i]);
    }
  } catch (err) {
    console.error(`${err} : removeExpiredEntry failed - Sheet: ${sheet} Col Name specified: ${dateHeaderName}`);
    return false;
  }
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Return the value of a cell by column name and row number
 * @param {sheet} sheet
 * @param {string} colName
 * @param {number} row
 */
const GetByHeader = (sheet, columnName, row) => {
  if(typeof sheet != `object`) return 1;
  try {
    let data = sheet.getDataRange().getValues();
    let col = data[0].indexOf(columnName);
    if (col != -1) return data[row - 1][col];
    else {
      console.error(`Getting data by header fucking failed...`);
      return 1;
    }
  } catch (err) {
    console.error(`${err} : GetByHeader failed - Sheet: ${sheet} Col Name specified: ${columnName} Row: ${row}`);
    return 1;
  }
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Return a dictionary of values from a whole row on a given sheet
 * @param {sheet} sheet
 * @param {number} row
 */
const GetRowData = (sheet, row) => {
  if(typeof sheet != `object`) return 1;
  let dict = {};
  try {
    let headers = sheet.getRange(1, 1, 1, sheet.getMaxColumns()).getValues()[0];
    headers.forEach( (name, index) => {
      let linkedKey = Object.keys(HEADERNAMES).find(key => HEADERNAMES[key] === name);
      if(!linkedKey) headers[index] = name;
      else headers[index] = linkedKey;
    })
    let data = sheet.getRange(row, 1, 1, sheet.getMaxColumns()).getValues()[0];
    headers.forEach( (header, index) => {
      dict[header] = data[index];
    });
    dict[`sheetName`] = sheet.getSheetName();
    dict[`row`] = row;
    // console.info(dict);
    return dict;
  } catch (err) {
    console.error(`${err} : GetRowData failed - Sheet: ${sheet} Row: ${row}`);
    return 1;
  }
}


const searchColForValue = (sheet, columnName, val) => {
  if(typeof sheet != `object`) return false;
  try {
    let data = sheet.getDataRange().getValues();
    let lastRow = sheet.getLastRow();
    let col = data[0].indexOf(columnName);
    let range = sheet.getRange(2,col+1,lastRow,1).getValues();
    // console.info(range);
    if (col == -1) {
      console.error(`Matching data by header failed...`);
      return false;
    }
    return range.some( row => row[0] === val);
  } catch (err) {
    console.error(`${err} : searchForValue failed - Sheet: ${sheet} Col Name specified: ${columnName} value: ${val}`);
    return false;
  }
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Set the value of a cell by column name and row number
 * @param {sheet} sheet
 * @param {string} colName
 * @param {number} row
 * @param {any} val
 */
const SetByHeader = (sheet, columnName, row, val) => {
  // if(typeof sheet != `object`) return 1;
  let data;
  let col;
  try {
    data = sheet.getDataRange().getValues();
    col = data[0].indexOf(columnName) + 1;
    if(col == -1) return 1;
    sheet.getRange(row, col).setValue(val);
    return 0;
  } catch (err) {
    console.info(`${err} : SetByHeader failed - Sheet: ${sheet} Row: ${row} Col: ${col} Value: ${val}`);
    console.error(`${err} : SetByHeader failed - Sheet: ${sheet} Row: ${row} Col: ${col} Value: ${val}`);
    return 1;
  }
};

/**
 * ------------------------------------------------------------------------------------------------------
 * Writes a row of data to a sheet. Input event data and it writes each value to the sheet with matching header name
 * @param {sheet} sheet
 * @param {dict} data 
 * @returns {dict} {header, value}
 */
const SetRowData = (sheet,data) => {
  if(typeof sheet != `object`) return 1;
  try {
    let sheetHeaderNames = Object.values(GetRowData(sheet, 1));
    let values = [];
    Object.entries(data).forEach(pair => {
      let headername = HEADERNAMES[pair[0]];
      let index = sheetHeaderNames.indexOf(headername);
      values[index] = pair[1];
    });
    sheet.appendRow(values);
  } catch (err) {
    console.error(`${err} : SetRowData failed - Sheet: ${sheet}`);
    return 1;
  }
}


const writeArrayToColumn = (array, sheet, col) => {
  let outerArray = [];

  for (let i = 0; i < array.length; i++) {
    let tempArray = [...array];
    outerArray.push(tempArray);
  };
  let range = sheet.getRange(sheet.getLastRow() + 1, col, array.length, 1);
  range.setValues(outerArray);
};

const deleteEmptyRows = (sheet) => {
  sheet = sheet ? sheet : SpreadsheetApp.getActiveSheet();
  // Gets active selection and dimensions.
  let activeRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
  let rowCount = activeRange.getHeight();
  let firstActiveRow = activeRange.getRow();
  let columnCount = sheet.getMaxColumns();

  // Tests that the selection is a valid range.
  if (rowCount <= 0 || rowCount >= 10000) {
    console.info('Select a valid range.');
    return;
  }

  // Utilizes an array of values for efficient processing to determine blank rows.
  let activeRangeValues = activeRange.getValues();

  // Checks if array is all empty values.
  const valueFilter = (value) => value !== '';
  const isRowEmpty = (row) => row.filter(valueFilter).length === 0;

  // Maps the range values as an object with value (to test) and corresponding row index (with offset from selection).
  let rowsToDelete = activeRangeValues.map((row, index) => ({ row, offset: index + activeRange.getRowIndex() }))
    .filter(item => isRowEmpty(item.row)) // Test to filter out non-empty rows.
    .map(item => item.offset); //Remap to include just the row indexes that will be removed.

  // Combines a sorted, ascending list of indexes into a set of ranges capturing consecutive values as start/end ranges.
  // Combines sequential empty rows for faster processing.
  let rangesToDelete = rowsToDelete.reduce((ranges, index) => {
    let currentRange = ranges[ranges.length - 1];
    if (currentRange && index === currentRange[1] + 1) {
      currentRange[1] = index;
      return ranges;
    }
    ranges.push([index, index]);
    return ranges;
  }, []);

  // Sends a list of row indexes to be deleted to the console.
  console.log(rangesToDelete);

  // Deletes the rows using REVERSE order to ensure proper indexing is used.
  rangesToDelete.reverse().forEach(([start, end]) => sheet.deleteRows(start, end - start + 1));
  SpreadsheetApp.flush();
}


/**
 * Removes blank columns in a selected range.
 * Cells containing Space characters are treated as non-empty.
 * The entire column, including cells outside of the selected range,
 * must be empty to be deleted.
 * Called from menu option.
 */
const deleteEmptyColumns = (sheet) => {
  if(typeof sheet != `object`) sheet = SpreadsheetApp.getActiveSheet();       // Gets active selection and dimensions.
  let activeRange = sheet.getActiveRange();
  let rowCountMax = sheet.getMaxRows();
  let columnWidth = activeRange.getWidth();
  let firstActiveColumn = activeRange.getColumn();

  // Tests that the selection is a valid range.
  if (columnWidth <= 0 || columnWidth >= 10000) {
    console.info('Select a valid range.');
    return;
  }

  // Utilizes an array of values for efficient processing to determine blank columns.
  let activeRangeValues = sheet.getRange(1, firstActiveColumn, rowCountMax, columnWidth).getValues();

  // Transposes the array of range values so it can be processed in order of columns.
  let activeRangeValuesTransposed = activeRangeValues[0].map((_, colIndex) => activeRangeValues.map(row => row[colIndex]));

  // Checks if array is all empty values.
  let valueFilter = value => value !== '';
  let isColumnEmpty = (column) => {
    return column.filter(valueFilter).length === 0;
  }

  // Maps the range values as an object with value (to test) and corresponding column index (with offset from selection).
  let columnsToDelete = activeRangeValuesTransposed.map((column, index) => ({ column, offset: index + firstActiveColumn}))
    .filter(item => isColumnEmpty(item.column)) // Test to filter out non-empty rows.
    .map(item => item.offset); //Remap to include just the column indexes that will be removed.

  // Combines a sorted, ascending list of indexes into a set of ranges capturing consecutive values as start/end ranges.
  // Combines sequential empty columns for faster processing.
  let rangesToDelete = columnsToDelete.reduce((ranges, index) => {
    let currentRange = ranges[ranges.length - 1];
    if (currentRange && index === currentRange[1] + 1) {
      currentRange[1] = index;
      return ranges;
    }
    ranges.push([index, index]);
    return ranges;
  }, []);

  // Sends a list of column indexes to be deleted to the console.
  console.log(rangesToDelete);

  // Deletes the columns using REVERSE order to ensure proper indexing is used.
  rangesToDelete.reverse().forEach(([start, end]) => sheet.deleteColumns(start, end - start + 1));
  SpreadsheetApp.flush();
}

/**
 * Trims all of the unused rows and columns outside of selected data range.
 * Called from menu option.
 */
const cropSheet = () => {
  let dataRange = SpreadsheetApp.getActiveSheet().getDataRange();
  let sheet = dataRange.getSheet();

  let numRows = dataRange.getNumRows();
  let numColumns = dataRange.getNumColumns();

  let maxRows = sheet.getMaxRows();
  let maxColumns = sheet.getMaxColumns();

  let numFrozenRows = sheet.getFrozenRows();
  let numFrozenColumns = sheet.getFrozenColumns();

  // If last data row is less than maximium row, then deletes rows after the last data row.
  if (numRows < maxRows) {
    numRows = Math.max(numRows, numFrozenRows + 1); // Don't crop empty frozen rows.
    sheet.deleteRows(numRows + 1, maxRows - numRows);
  }

  // If last data column is less than maximium column, then deletes columns after the last data column.
  if (numColumns < maxColumns) {
    numColumns = Math.max(numColumns, numFrozenColumns + 1); // Don't crop empty frozen columns.
    sheet.deleteColumns(numColumns + 1, maxColumns - numColumns);
  }
}

/**
 * Copies value of active cell to the blank cells beneath it. 
 * Stops at last row of the sheet's data range if only blank cells are encountered.
 * Called from menu option.
 */
const fillDownData = () => {

  let sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // Gets sheet's active cell and confirms it's not empty.
  let activeCell = sheet.getActiveCell();
  let activeCellValue = activeCell.getValue();

  if (!activeCellValue) {
    console.info("The active cell is empty. Nothing to fill.");
    return;
  }

  // Gets coordinates of active cell.
  let column = activeCell.getColumn();
  let row = activeCell.getRow();

  // Gets entire data range of the sheet.
  let dataRange = sheet.getDataRange();
  let dataRangeRows = dataRange.getNumRows();

  // Gets trimmed range starting from active cell to the end of sheet data range.
  let searchRange = dataRange.offset(row - 1, column - 1, dataRangeRows - row + 1, 1)
  let searchValues = searchRange.getDisplayValues();

  // Find the number of empty rows below the active cell.
  let i = 1; // Start at 1 to skip the ActiveCell.
  while (searchValues[i] && searchValues[i][0] == "") { i++; }

  // If blanks exist, fill the range with values.
  if (i > 1) {
    let fillRange = searchRange.offset(0, 0, i, 1).setValue(activeCellValue)
    //sheet.setActiveRange(fillRange) // Uncomment to test affected range.
  }
  else {
    console.info("There are no empty cells below the Active Cell to fill.");
  }
}

/**
 * A helper function to display messages to user.
 * @param {string} message - Message to be displayed.
 * @param {string} caller - {Optional} text to append to title.
 */
const showMessage = (message, caller) => {
  if (caller) title += ` : ${caller}`;
  let ui = SpreadsheetApp.getUi();
  ui.alert(
    APP_TITLE, 
    message, 
    ui.ButtonSet.OK,
  );
}










