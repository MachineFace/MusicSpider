
class SheetService {
  constructor() {

  }
  /**
   * Return the value of a cell by column name and row number
   * @param {sheet} sheet
   * @param {string} colName
   * @param {number} row
   */
  static GetByHeader(sheet, columnName = ``, row = 2) {
    try {
      let data = sheet.getDataRange().getValues();
      let col = data[0].indexOf(columnName);
      if (col == -1) throw new Error(`Getting data by header fucking failed...`);
      return data[row - 1][col];
    } catch (err) {
      console.error(`"GetByHeader()" failed : ${err} @ Sheet: ${sheet} Col Name specified: ${columnName} Row: ${row}`);
      return 1;
    }
  }

  /**
   * Set the value of a cell by column name and row number
   * @param {sheet} sheet
   * @param {string} colName
   * @param {number} row
   * @param {any} val
   */
  static SetByHeader(sheet, columnName = ``, row = 2, val = ``) {
    try {
      let data;
      let col;
      data = sheet.getDataRange().getValues();
      col = data[0].indexOf(columnName) + 1;
      if(col == -1) return 1;
      sheet.getRange(row, col).setValue(val);
      return 0;
    } catch (err) {
      console.error(`"SetByHeader()" failed : ${err} @ Sheet: ${sheet} Row: ${row} Col: ${col} Value: ${val}`);
      return 1;
    }
  }

  /**
   * Return the values of a column by the name
   * @param {sheet} sheet
   * @param {string} colName
   * @param {number} row
   */
  static GetColumnDataByHeader(sheet, columnName = ``) {
    try {
      const data = sheet.getDataRange().getValues();
      const col = data[0].indexOf(columnName);
      if (col == -1) throw new Error(`Column not found`);
      let colData = data.map(d => d[col]);
      colData.splice(0, 1);
      return colData;
    } catch (err) {
      console.error(`"GetColumnDataByHeader()" failed : ${err}`);
      return 1;
    }
  }

  /**
   * Return a dictionary of values from a whole row on a given sheet
   * @param {sheet} sheet
   * @param {number} row
   */
  static GetRowData(sheet, row = 2) {
    try {
      if(typeof sheet != `object`) throw new Error(`No sheet or bad sheet provided.`);
      let dict = {};
      let headers = sheet.getRange(1, 1, 1, sheet.getMaxColumns()).getValues()[0];
      headers.forEach( (name, index) => {
        const headdict = { ...EVENT_SHEET_HEADERNAMES, ...ARTIST_SHEET_HEADERNAMES };
        const linkedKey = Object.keys(headdict).find(key => headdict[key] === name);
        if(!linkedKey) headers[index] = name;
        else headers[index] = linkedKey;
      })
      const data = sheet.getRange(row, 1, 1, sheet.getMaxColumns()).getValues()[0];
      headers.forEach( (header, index) => {
        dict[header] = data[index];
      });
      dict[`sheetName`] = sheet.getSheetName();
      dict[`row`] = row;
      // console.info(dict);
      return dict;
    } catch (err) {
      console.error(`"GetRowData()" failed : ${err} @ Sheet: ${sheet} Row: ${row}`);
      return 1;
    }
  }

  /**
   * Writes a row of data to a sheet. Input event data and it writes each value to the sheet with matching header name
   * @param {sheet} sheet
   * @param {dict} data 
   * @returns {dict} {header, value}
   */
  static SetRowData(sheet, data = {}) {
    try {
      if(typeof sheet != `object`) throw new Error(`No sheet or bad sheet provided.`);
      let sheetHeaderNames = Object.values(GetRowData(sheet, 1));
      let values = [];
      Object.entries(data).forEach(pair => {
        let headername = [...EVENT_SHEET_HEADERNAMES, ...ARTIST_SHEET_HEADERNAMES][pair[0]];
        let index = sheetHeaderNames.indexOf(headername);
        values[index] = pair[1];
      });
      sheet.appendRow(values);
    } catch (err) {
      console.error(`"SetRowData()" failed : ${err} @ Sheet: ${sheet}`);
      return 1;
    }
  }

  /**
   * Search Column for Value
   * @param {sheet} sheet
   * @param {string} column name
   * @param {string} value to look for
   * @return {number} row number
   */
  static SearchColumn(sheet, columnName = ``, val = ``) {
    try {
      if(typeof sheet != `object`) throw new Error(`No sheet or bad sheet provided.`);
      let data = sheet.getDataRange().getValues();
      let lastRow = sheet.getLastRow();
      let col = data[0].indexOf(columnName);
      let range = sheet.getRange(2,col+1,lastRow,1).getValues();
      // console.info(range);
      if (col == -1) return false;
      return range.some( row => row[0] === val);
    } catch (err) {
      console.error(`"SearchColumn()" failed : ${err} @ Sheet: ${sheet} Col Name specified: ${columnName} value: ${val}`);
      return false;
    }
  }

  /**
   * Write Array to Column
   * @param {array} array to write
   * @param {sheet} sheet
   * @param {number} column number
   */
  static WriteArrayToColumn(sheet, array = [], col = 2) {
    array.forEach( (entry, idx) => {
      sheet.getRange(sheet.getLastRow() + 1 + idx, col, 1, 1).setValues(entry);
    });
    return 0;
  }

  /**
   * Checks if array is all empty values.
   */
  static IsRowEmpty(row = []) {
    return row.filter((value) => value !== '').length === 0;
  }

  /**
   * Delete Empty Rows
   * @param {sheet} sheet
   */
  static DeleteEmptyRows(sheet) {
    try {
      sheet = sheet ? sheet : SpreadsheetApp.getActiveSheet();
      const activeRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
      const rowCount = activeRange.getHeight();

      // Tests that the selection is a valid range.
      if (rowCount <= 0 || rowCount >= 10000) throw new Error(`Range either <= 0 or >= 10,000. Please fix it.`);

      // Utilizes an array of values for efficient processing to determine blank rows.
      const activeRangeValues = activeRange.getValues();

      // Maps the range values as an object with value (to test) and corresponding row index (with offset from selection).
      let rowsToDelete = activeRangeValues.map((row, index) => ({ row, offset : index + activeRange.getRowIndex() }))
        .filter(item => isRowEmpty(item.row)) // Test to filter out non-empty rows.
        .map(item => item.offset); //Remap to include just the row indexes that will be removed.

      // Combines a sorted, ascending list of indexes into a set of ranges capturing consecutive values as start/end ranges.
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
    } catch(err) {
      console.error(`"deleteEmptyRows()" failed for some reason: ${err}`);
    }
  }

  /**
   * Add Array to Sheet
   * @NOTIMPLEMENTED
   */
  static AddArrayToSheet(sheet, column = 1, values = ``) {
    try {
      const range = [column, `1:`, column, values.length]
        .join(``);
      sheet.getRange(range).setValues(values.map((v) => [ v ]));
      return 0;
    } catch(err) {
      console.error(`"AddArrayToSheet()" failed: ${err}`);
      return 1;
    }
  }

  /**
   * Removes blank columns in a selected range.
   * Cells containing Space characters are treated as non-empty.
   * The entire column, including cells outside of the selected range,
   * must be empty to be deleted.
   * Called from menu option.
   * @NOTIMPLEMENTED
   */
  static DeleteEmptyColumns(sheet) {
    try {
      if(typeof sheet != `object`) sheet = SpreadsheetApp.getActiveSheet();       // Gets active selection and dimensions.
      let activeRange = sheet.getActiveRange();
      let rowCountMax = sheet.getMaxRows();
      let columnWidth = activeRange.getWidth();
      let firstActiveColumn = activeRange.getColumn();

      // Tests that the selection is a valid range.
      if (columnWidth <= 0 || columnWidth >= 10000) throw new Error('Select a valid range.');

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
      return 0;
    } catch(err) {
      console.error(`"DeleteEmptyColumns()" failed: ${err}`);
      return 1;
    }
  }

  /**
   * Trims all of the unused rows and columns outside of selected data range.
   * Called from menu option.
   * @NOTIMPLEMENTED
   */
  static CropSheet(sheet) {
    let dataRange = sheet.getDataRange();

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
   * @NOTIMPLEMENTED
   */
  static FillDownData(sheet, cell) {

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


}




const _tRD = () => {
  let r = SheetService.GetRowData(SHEETS.Events, 5);
  console.info(r)
}




/**
 * A helper function to display messages to user.
 * @param {string} message - Message to be displayed.
 * @param {string} caller - {Optional} text to append to title.
 * @NOTIMPLEMENTED
const showMessage = (message, caller) => {
  if (caller) title += ` : ${caller}`;
  let ui = SpreadsheetApp.getUi();
  ui.alert(
    APP_TITLE, 
    message, 
    ui.ButtonSet.OK,
  );
}
*/









