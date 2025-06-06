
/**
 * ----------------------------------------------------------------------------------------------------------------
 * Music Spider
 * 
 * Developed by https://github.com/cparsell & https://github.com/MachineFace/
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
    .createMenu(SERVICE_NAME)
    .addItem(`Authorize Spotify`, `popupSpotifyAuth`)
    .addItem(`Get Redirect URI for Spotify`, `popupRedirectURI`)
    .addItem(`Refresh Artists`, `popupRefreshArtists`)
    .addItem(`Refresh Events`, `popupRefreshEvents`)
    .addItem(`Refresh Comedy Events`, `popupRefreshComedyEvents`)
    .addItem(`Send Email Newsletter`, `popupSendEmail`)
    .addSeparator()
    .addItem(`Create ID for SELECTED entry.`, `popupCreateNewID`)
    .addItem(`Delete Blank Rows`, `deleteEmptyRows`)
    .addToUi();
};

/**
 * Create a pop-up to make a new ID
 */
const popupCreateNewID = () => {
  const ui = SpreadsheetApp.getUi();
  const thisSheet = SpreadsheetApp.getActiveSheet();
  const thisSheetName = thisSheet.getSheetName();
  let thisRow = thisSheet.getActiveRange().getRow();
  const newID = new IDService().id;

  // Check for correct sheet
  if(![SHEETS.Events.getSheetName(), SHEETS.ComedyEvents.getSheetName()].includes(thisSheetName)) {
    const a = ui.alert(
      `${SERVICE_NAME}: Incorrect Sheet!`,
      `Please select a valid sheet (eg. "Events").\nSelect one cell in the row and a uuid will be created.`,
      Browser.Buttons.OK,
    );
    if(a === ui.Button.OK) return;
  }

  // Check for valid ID 
  const { name, id } = SheetService.GetRowData(thisSheet, thisRow);
  if(IDService.isValid(id)) {
    const a = ui.alert(
      `${SERVICE_NAME}: Error!`,
      `ID for ${name} exists already!\n${id}`,
      ui.ButtonSet.OK
    );
    if(a === ui.Button.OK) return;
  }

  // Set value
  SheetService.SetByHeader(thisSheet, HEADERNAMES.id, thisRow, newID);
  const a = ui.alert(
    SERVICE_NAME,
    `Created a New ID for ${name}:\n${newID}`,
    ui.ButtonSet.OK
  );
  if(a === ui.Button.OK) return;
}

/**
 * Auth Spotify
 */
const popupSpotifyAuth = async () => {
  let ui = await SpreadsheetApp.getUi();
  const sps = new SpotifyService();
  let htmlOutput = HtmlService.createHtmlOutputFromFile(`auth_steps`)
    .setWidth(640)
    .setHeight(480);
  ui.showModalDialog(htmlOutput, `${SERVICE_NAME} Connect to Spotify`);
}

/**
 * Redirect URI
 */
const popupRedirectURI = () => {
  const redirectURI = GetRedirectUri();
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    SERVICE_NAME,
    `COPY THIS:\n
    -----\n
    ${redirectURI}\n
    -----\n
    COPY THIS.`,
    ui.ButtonSet.OK
  );
}

/**
 * Main Call to Refresh
 */
const popupRefreshArtists = async () => {
  const ui = await SpreadsheetApp.getUi();
  const count = await RefreshArtists();
  ui.alert(
    SERVICE_NAME,
    `Retrieving New Artists\nTotal : ${count}`,
    ui.ButtonSet.OK
  );
}

/**
 * Main Call to Refresh
 */
const popupRefreshEvents = async () => {
  const ui = await SpreadsheetApp.getUi();
  const count = await new TicketmasterFactory().RefreshEvents()
  ui.alert(
    SERVICE_NAME,
    `Retrieving New Events from Artists List\nTotal : ${count}`,
    ui.ButtonSet.OK
  );
}

/**
 * Refresh Comedy Events
 */
const popupRefreshComedyEvents = async () => {
  const ui = await SpreadsheetApp.getUi();
  const count = await new TicketmasterFactory().RefreshComedyEvents()
  ui.alert(
    SERVICE_NAME,
    `Retrieving New Comedy Events from List\nTotal : ${count}`,
    ui.ButtonSet.OK
  );
}

/**
 * Send Email
 */
const popupSendEmail = () => {
  sendEmail();
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    SERVICE_NAME,
    `Sending Email to ${PropertiesService.getScriptProperties().getProperty(`MY_EMAIL`)}...`,
    ui.ButtonSet.OK
  );
}










