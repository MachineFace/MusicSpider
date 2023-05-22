
/**
 * ----------------------------------------------------------------------------------------------------------------
 * Music Spider
 * 
 * Developed by https://github.com/cparsell
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
    .addItem(`Get Redirect URI for Spotify`, `popupRedirectURI`)
    .addItem(`Refresh Artists`, `refreshArtists`)
    .addItem(`Refresh Events`, `refreshEvents`)
    .addItem(`Send Email Newsletter`, `sendEmail`)
    .addSeparator()
    .addItem(`Delete Blank Rows`, `deleteEmptyRows`)
    .addToUi();
};

const popupRedirectURI = () => {
  const redirectURI = GetRedirectUri();
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    `Music Spider`,
    `COPY THIS: ----->  ${redirectURI}   <----- COPY THIS.`,
    ui.ButtonSet.OK
  );
}

/**
 * Main Call to Refresh
 */
const refreshArtists = async () => {
  const ui = await SpreadsheetApp.getUi();
  const count = await new SpotifyService().RefreshArtists();
  ui.alert(
    SERVICE_NAME,
    `Retrieving New Artists\nTotal : ${count}`,
    ui.ButtonSet.OK
  );
}

/**
 * Main Call to Refresh
 */
const refreshEvents = async () => {
  const ui = await SpreadsheetApp.getUi();
  const count = await new TicketmasterFactory().RefreshEvents()
  ui.alert(
    SERVICE_NAME,
    `Retrieving New Events from Artists List\nTotal : ${count}`,
    ui.ButtonSet.OK
  );
}

const main = () => {
  // await refreshArtists();
  // await refreshEvents();
  // await sendEmail();
}







