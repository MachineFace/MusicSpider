
/**
 * ----------------------------------------------------------------------------------------------------------------
 * Music Spider
 * 
 * Developed by https://github.com/cparsell
 * 
 * 
 * I borrowed many core Spotify API functions from https://github.com/Nitemice/spotify-backup-gas
 * 
 * To setup:
 * - Create a new copy of the template Google Spreadsheet
 * - From the sheet, go Extensions > Apps Script to create a new script project
 * - Add a new script file for each of the files in this repo
 * - Modify the config.example.gs and name it config.gs
 * - Replace values in config.gs to match your API keys 
 * - in Apps Script, click Deploy > New Deployment > Web app > copy the link.
 * - Go to this link in your browser. This page will give you further instructions to:
 *   1. Navigate to your app via the Spotify App Dashboard (https://developer.spotify.com/dashboard/applications)
 *   2. Add the given URI (on this page) to the 'Redirect URIs' field, found under `Edit Settings`
 *   3. Go to the given URL, log into the desired user's Spotify account, and approve access.
 *   4. You should be redirected back to a success page on Google App Script.
 * - Now the script should have authorization to get your user's info (playlists, top artists, etc)
 * - NOTE: Use the address given in the text of the web app page, not the one you copied from Google Script. For me at least, they were slightly different.
 */



/**
 * ----------------------------------------------------------------------------------------------------------------
 * Trigger 1 - Create menu when spreadsheet is opened
 * Reserved word: onFormSubmit() cannot be used here because it's reserved for simple triggers.
 * @param {Event} e
 */
const BarMenu = () => {
  SpreadsheetApp.getUi()
    .createMenu(`Music Spider`)
    .addItem(`Refresh Artists`, `refreshArtists`)
    .addItem(`Refresh Events`, `refreshEvents`)
    .addItem(`Send Email Newsletter`, `sendEmail`)
    .addSeparator()
    .addItem(`Delete Blank Rows`, `deleteEmptyRows`)
    .addToUi();
};



const addArrayToSheet = (sheet, column, values) => {
  const range = [column, `1:`, column, values.length]
    .join(``);
  sheet.getRange(range).setValues(values.map((v) => [ v ]));
}

const artistsList = () => {
  let artistRows = artistSheet.getLastRow() - 1;
  if (artistRows == 0) artistRows = 1;
  let artistsArr = artistSheet.getRange(2,1,artistRows,1).getValues();
  return artistsArr;
}

const getData = async (accessToken, url, getAllPages = false) => {

  let options = {
    "muteHttpExceptions" : true,
    "headers" : {
      "Authorization" : "Bearer " + accessToken,
      "Content-Type" : "application/json",
    }
  };

  let response = UrlFetchApp.fetch(url, options);
  let firstPage = response.getContentText();
  console.info(`Response Code`, `${response.getResponseCode()} - ${RESPONSECODES[response.getResponseCode()]}`);

  if (!getAllPages) return [firstPage];  // Bail out if we only wanted the first page

  
  let data = [firstPage];  // Put first page in array for return with following pages

  let pageObj = JSON.parse(firstPage);
  // Strip any outer shell, if there is one
  if (Object.values(pageObj).length == 1) pageObj = Object.values(pageObj)[0];

  // Retrieve URL for next page
  let nextPageUrl = pageObj[`next`];
  while (nextPageUrl) {
    
    nextPage = UrlFetchApp.fetch(nextPageUrl, options).getContentText();  // Retrieve the next page
    data.push(nextPage);
    pageObj = JSON.parse(nextPage);   // Retrieve URL for next page    
    if (Object.values(pageObj).length == 1) pageObj = Object.values(pageObj)[0];   // Strip any outer shell, if there is one
    nextPageUrl = pageObj[`next`]; 
  }
  return data;
}

// Just a wrapper function to simplify some code
const xmlElement = (type, text) => XmlService
  .createElement(type)
  .setText(text);

const main = () => {
  // await refreshArtists();
  // await refreshEvents();
  // await sendEmail();
}

