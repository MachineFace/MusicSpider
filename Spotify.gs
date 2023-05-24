/**
 * ---------------------------------------------------------------------------------------------------
 * Spotify Factory
 * Various functions for dealing with Spotify
 * Relies on Spotify Authenticate
 */
class SpotifyService {
  constructor() {
    this.baseUrl = `https://api.spotify.com/v1`; 
    // Profile URLs
    this.profileUrl = `${this.baseUrl}/me`;

    // Library URLs
    this.playlistUrl = `${this.baseUrl}/playlists`;
    this.followUrl = `${this.profileUrl}/following`;
    this.savedTracksUrl = `${this.profileUrl}/tracks`;
    this.savedAlbumsUrl = `${this.profileUrl}/albums`;
    this.savedShowsUrl = `${this.profileUrl}/shows`;
    this.savedEpisodesUrl = `${this.profileUrl}/episodes`;
    this.topArtistsUrl = `${this.profileUrl}/top/artists`;

    // Set up the service
    this.service = this._CreateService();
  }

  /**
   * Configure the service
   */
  _CreateService() {
    const service = OAuth2.createService(`Spotify`)
      .setAuthorizationBaseUrl(`https://accounts.spotify.com/authorize`)
      .setTokenUrl(`https://accounts.spotify.com/api/token`)
      .setClientId(PropertiesService.getScriptProperties().getProperty(`clientIdSpotify`))
      .setClientSecret(PropertiesService.getScriptProperties().getProperty(`clientSecretSpotify`))
      .setCallbackFunction((request) => {
        const service = GetSpotifyService();
        const isAuthorized = service.handleCallback(request);
        if (isAuthorized) { 
          return HtmlService
            .createTemplateFromFile("auth_success")
            .evaluate();
        } else {
          return HtmlService
            .createTemplateFromFile("auth_error")
            .evaluate();
        }
      })
      .setPropertyStore(PropertiesService.getUserProperties())
      .setCache(CacheService.getUserCache())
      .setLock(LockService.getUserLock())
      .setScope('user-library-read playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private');
    if (!service.hasAccess()) {
      throw new Error('Error: Missing Spotify authorization.');
    }
    console.info(`Service Access: ${service.hasAccess()}`);
    return service;
  }

  /**
   * Check if Service is Active
   */
  _isServiceActive() {
    if(!this.service.hasAccess()) return false;
    return true;
  }

  /**
   * Get Data
   * @param {string} url
   * @returns {object} data
   */
  async _GetData(url) {
    if(!this._isServiceActive()) {
      const authURL = service.getAuthorizationUrl();
      console.error(`Spotify not authorized yet.\nOpen the following URL and re-run the script: ${authURL}`);
      return 1;
    }
    const options = {
      "method": "GET",
      "headers" : {
        "Authorization" : "Bearer " + this.service.getAccessToken(),
        "Content-Type" : "application/json",
      },
      "muteHttpExceptions" : false,
    };
    try {
      let data = [];
      let responseCode;
      let offsetString = ``;
      for(let i = 0; i < 2000; i += 100) {
        do {
          offsetString = i > 0 && i < 1000 ? "&offset=" + i : "&offset=1000";
          const response = await UrlFetchApp.fetch(url + offsetString, options);
          responseCode = response.getResponseCode();
          data.push(JSON.parse(response.getContentText()));
        } while (responseCode == 200 && responseCode == 201);
        if (responseCode != 200 && responseCode != 201) throw new Error(`Bad response from Spotify: ${responseCode} - ${RESPONSECODES[responseCode]}`);
      }
      const parsed = data.flat();
      return parsed;
    } catch(err) {
      console.error(`"GetData()" failed: ${err}`);
    }
  }

  /**
   * MAIN ENTRY POINT!
   * Refresh the list of Artists from Spotify
   */
  async RefreshArtists() {
    this._ClearData(SHEETS.Artists);    // Clear previous artist list

    let topArtists, playlistArtists, followedArtists, savedArtists;
    if (PropertiesService.getScriptProperties().getProperty(`getTopArtists`)) {
      topArtists = await this.GetTopArtists();
      console.warn(`Number of Artists: ${topArtists.length}`);
    }
    if (PropertiesService.getScriptProperties().getProperty(`getArtistsFromPlaylist`)) {
      playlistArtists = await this.GetPlaylistArtists();
      console.warn(`Number of Playlist Artists: ${playlistArtists.length}`);
    }
    if (PropertiesService.getScriptProperties().getProperty(`getFollowing`)) { 
      followedArtists = await this.GetFollowedArtists();
      console.warn(`Number of Followed Artists: ${followedArtists.length}`);
    }
    savedArtists = await this.GetSavedTracksArtists();
    console.warn(`Number of Saved Artists: ${savedArtists.length}`);

    let artists = [...new Set([...topArtists, ...playlistArtists, ...followedArtists, ...savedArtists])].sort();   // Combine arrays and filter unique
    if (artists.length < 1) console.info(`Unable to retrieve a list of artists from Spotify`);
    
    artists = this._FilterArtists(artists);
    console.warn(`Total Artists: ${artists.length}`);
    this._WriteArtistsToSheet(artists);    // Write new artists to sheet
    SHEETS.Artists.getRange(2, 1, SHEETS.Artists.getLastRow(), 1)
      .setHorizontalAlignment('left');
    return artists.length;
  }

  /**
   * Write Artists to Sheet
   * @param {array} artist names
   */
  _WriteArtistsToSheet(array) {
    array.forEach((artist, idx) => {
      SHEETS.Artists.getRange(2 + idx, 1, 1, 1).setValue(artist);
    });
  };

  /**
   * Returns an array of all artists from Saved Tracks on Spotify
   * Caution: will return ALL artists from Saved Tracks. If you have
   * a lot of Saved Tracks, it may be artists you aren't that 
   * interested in seeing live ;)
   */
  async GetSavedTracksArtists() {
    console.info(`Getting Saved Tracks Artists....`);
    const params = "?limit=50";
    try {
      const data = await this._GetData(this.savedTracksUrl + params);
      let artists = [];
      data.forEach(entry => {
        entry.items.forEach(item => {
          item.track.artists.forEach(artist => artists.push(artist.name));
        });
      })
      const filteredArtists = [...new Set(artists)].sort();
      console.info(`Saved Tracks Artists Count: ${filteredArtists.length}`);
      return filteredArtists;
    } catch(err) {
      console.error(`"GetSavedTracksArtists()" failed: ${err}`);
    }
  }


  /**
   * Get Followed Artists
   */
  async GetFollowedArtists() {
    console.info(`Getting Followed Artists...`);
    const params = "?type=artist&limit=50";
    const data = await this._GetData(this.followUrl + params);

    let artists = [];
    data.forEach(entry => {
      const items = entry.artists.items;
      items.forEach(item => artists.push(item.name));
    })
    artists = [...new Set(artists)].sort();
    console.info(`Followed Artists Count: ${artists.length}`);
    return artists;
  }


  /**
   * Returns an array of artists from a Playlist
   * Playlist ID is supplied in config.gs
   */
  async GetPlaylistArtists() {
    if(!this._isServiceActive()) {
      const authURL = service.getAuthorizationUrl();
      console.error(`Spotify not authorized yet.\nOpen the following URL and re-run the script: ${authURL}`);
      return 1;
    }
    console.info(`Getting artists from playlists....`);
    const playlistId = PropertiesService.getScriptProperties().getProperty(`playlistId`);
    const url = this.playlistUrl + "/" + playlistId + "/tracks";
    console.info(url);
    const options = {
      "method": "GET",
      "headers" : {
        "Authorization" : "Bearer " + this.service.getAccessToken(),
        "Content-Type" : "application/json",
      },
      "muteHttpExceptions" : false,
    };
    try {
      let responseCode, data;
      do {
        const response = await UrlFetchApp.fetch(url, options);
        responseCode = response.getResponseCode();
        data = JSON.parse(response.getContentText());
      } while (responseCode == 200 && responseCode == 201);
      if (responseCode != 200 && responseCode != 201) throw new Error(`Bad response from Spotify: ${responseCode} - ${RESPONSECODES[responseCode]}`);
      if (!data) throw new Error(`No data received from your watch playlist...`);

      let artists = [];
      data?.items?.forEach(entry => {
        const artist = entry?.track?.album?.artists[0]?.name;
        artists.push(artist);
      });
      const filteredArtists = [...new Set(artists)];
      console.info(`Playlist Artists Count: ${filteredArtists.length}`);
      return filteredArtists;
    } catch(err) {
      console.error(`"GetPlaylistArtists()" failed: ${err}`);
    }
  }


  /**
   * Returns an array of Top Artists as gathered by Spotify
   * This searches `long term`, `medium term`, and `short term`
   */
  async GetTopArtists() {  

    let long_term1 = await this._GetTopData(`long_term`);    // LONG TERM top artists
    let long_term2 = await this._GetTopData(`long_term`);   // LONG TERM top artists OFFSET +48
    let med_term = await this._GetTopData(`medium_term`);    // MEDIUM TERM top artists
    let short_term = await this._GetTopData(`short_term`);   // SHORT TERM top artists

    let artists = [...long_term1, ...long_term2, ...med_term, ...short_term];
    
    if (artists.length == 0) {
      console.error(`Returned 0 top artists somehow....`);
      return [];
    }
    const setOfArtists = [...new Set(artists)].sort();
    console.info(setOfArtists);
    return setOfArtists;
  }

  /**
   * Returns an array of Top Artists as gathered by Spotify
   * This searches `long term`, `medium term`, and `short term`
   * @param {string} term expects `long_term`, `medium_term`, or `short_term`
   * @param {integer} offset 
   * @returns {[artists]} list of artists
   */
  async _GetTopData(term) {
    if(!this._isServiceActive()) {
      const authURL = service.getAuthorizationUrl();
      console.error(`Spotify not authorized yet.\nOpen the following URL and re-run the script: ${authURL}`);
      return 1;
    }
    const options = {
      "method": "GET",
      "headers" : {
        "Authorization" : "Bearer " + this.service.getAccessToken(),
        "Content-Type" : "application/json",
      },
      "muteHttpExceptions" : false,
    };
    console.info(`Getting top artists (${term})...`);
    const params = `?time_range=${term}&limit=50`;

    try {
      let data = [];
      let responseCode;
      do {
        const response = await UrlFetchApp.fetch(this.topArtistsUrl + params, options);
        responseCode = response.getResponseCode();
        data.push(JSON.parse(response.getContentText()));
      } while (responseCode == 200 && responseCode == 201);
      if (responseCode != 200 && responseCode != 201) throw new Error(`Bad response from Spotify: ${responseCode} - ${RESPONSECODES[responseCode]}`);
      if (!data) throw new Error(`No data received (${term})`);
      
      let artists = [];
      data.forEach(entry => {
        entry.items.forEach(item => artists.push(item.name));
      });
      artists = [...new Set(artists)].sort();
      console.info(`Top Data Artists Count ${term}: ${artists.length}`);
      return artists;
    } catch(err) {
      console.error(`"GetData()" failed: ${err}`);
    }

    // let artists = [];
    // response?.items.forEach(artist => { 
    //   if (!artistsToIgnore.includes(artist.name)) {
    //     artists.push(artist.name);
    //   }
    // });
    // console.info(artists);
    // return artists;
  }

  _FilterArtists(artists) {
    let filtered = [];
    artists.forEach(artist => {
      if (!artistsToIgnore.includes(artist)) filtered.push(artist);
    });
    return [...new Set(artists)].sort();
  }

  _ClearData () {
    console.warn(`CLEARING ARTIST SHEET!`);
    SHEETS.Artists
      .getRange(2, 1, SHEETS.Artists.getLastRow() + 1, 1)
      .clear();
  }

}

const _testSpotify = () => new SpotifyService().RefreshArtists();


/**
 * ---------------------------------------------------------------------------------------------------
 * Spotify Authenticate
 * @DEPRICATED
 */
class SpotifyAuthenticate {
  constructor() {
    this.baseAuthUrl = `https://accounts.spotify.com`;
    this.authUrl = `https://accounts.spotify.com/authorize`;
    this.refreshUrl = `https://accounts.spotify.com/api/token`;
    this.scope = `user-library-read playlist-read-private playlist-read-collaborative user-top-read user-follow-read`;
    this.clientID = PropertiesService.getScriptProperties().getProperty(`clientIdSpotify`);
    this.clientSecret = PropertiesService.getScriptProperties().getProperty(`clientSecretSpotify`);
  }

  DoGet(e) {
    if (e.parameter.error) {
      let template = HtmlService.createTemplateFromFile("auth_error");
      template.errorText = `Whoops: ${e.parameter.error}`;
      return template.evaluate();
    } else if (!e.parameter.code) {
      return HtmlService
        .createTemplateFromFile("auth_steps")
        .evaluate();
    }

    // Retrieve refreshable auth with auth code then store it
    let authInfo = this.GetFreshAuth(e.parameter.code);
    this.StoreAuth(authInfo);

    return HtmlService
      .createTemplateFromFile("auth_success")
      .evaluate();
  }

  /**
   * Generate URL for requesting authorization using Authorization Code Flow
   */
  GenerateAuthUrl() {
    try {
      let url = ScriptApp.getService().getUrl();
      let params = "?response_type=code&client_id=" + this.clientID + "&scope=" + this.scope + "&redirect_uri=" + url;
      console.warn(`URI:   ---->   ${this.authUrl}${encodeURIComponent(params)}`);
      return this.authUrl + encodeURIComponent(params);
    } catch(err) {
      console.error(`Generating Auth URL failed for some reason: ${err}`);
      return 1;
    }
  }

  /**
   * Retrieve Refreshable AuthInfo
   * @param {string} code (auth)
   * @returns {obj} authInfo
   */
  async GetFreshAuth (code) {
    try {
      console.info(`Getting Fresh AuthInfo....`);
      const now = Date.now() * 0.001;
      const options = {
        'method': 'post',
        'Content-Type': 'application/json',
        'payload': {
          "grant_type": "authorization_code",
          "code": code,
          "redirect_uri": ScriptApp.getService().getUrl(),
          "client_id": this.clientID,
          "client_secret": this.clientSecret,
        }
      };

      const response = await UrlFetchApp.fetch(refreshUrl, options);
      const responseCode = response.getResponseCode();
      if (responseCode != 200 || responseCode != 201) throw new Error(`Bad response from Spotify: ${responseCode} - ${RESPONSECODES[responseCode]}`);
      const newTokens = JSON.parse(response.getContentText());

      let authInfo = {
        access_token : newTokens.access_token,
        refresh_token : newTokens.refresh_token,
        expires_in : now + newTokens.expires_in,
      };
      console.info(`Token: ${authInfo.access_token}`);
      return await authInfo;
    } catch(err) {
      console.error(`Getting Fresh AuthInfo failed for some reason: ${err}`);
      return 1;
    }
  }

  /**
   * Refresh authInfo with Refresh Token
   * @param {string} refresh_token
   * @returns {obj} authInfo
   */
  async RefreshAuth (refresh_token) {
    try {
      refresh_token = refresh_token ? refresh_token : PropertiesService.getUserProperties().getProperty(`access_token`);
      console.info(`Refreshing AuthInfo....`);
      const now = Date.now() * 0.001;
      const options = {
        "method": "POST",
        "Content-Type": "application/json",
        "payload": {
          "grant_type": "refresh_token",
          "refresh_token": refresh_token,
          "client_id": this.clientID,
          "client_secret": this.clientSecret,
        },
        "muteHttpExceptions": false,
      };

      const response = await UrlFetchApp.fetch(this.refreshUrl, options);
      const responseCode = response.getResponseCode();
      if (responseCode != 200 || responseCode != 201) throw new Error(`Bad response from Spotify: ${responseCode}  - ${RESPONSECODES[responseCode]}`);

      const newTokens = JSON.parse(response.getContentText());
      
      let authInfo = {
        access_token : newTokens.access_token,
        refresh_token : newTokens.refresh_token,
        expires_in : now + newTokens.expires_in,
      };

      if (newTokens.refresh_token) authInfo[refresh_token] = newTokens.refresh_token;
      return await authInfo;
    } catch(err) {
      console.error(`Refreshing Auth failed for some reason: ${err}`);
      return 1;
    }
  }

  /**
   * Retrieve refreshable auth info from user properties store
   * @param {{string}} authInfo
   * @returns {bool} success or failure 
   */
  StoreAuth(authInfo) {
    try {
      PropertiesService
        .getUserProperties()
        .setProperties(authInfo);
      console.warn(`Setting User Properties: ${JSON.stringify(authInfo)}`);
      return 0;
    } catch(err) {
      console.error(`Storing AuthInfo failed for some reason: ${err}`);
      return 1;
    }
  }

  /**
   * Retrieve Refreshable authInfo from User Properties Store
   * @returns {string} access_token 
   */
  async RetrieveAuth () {
    try {
      let userProps = PropertiesService.getUserProperties();
      let authInfo = userProps.getProperties();
      console.warn(authInfo);

      // Check if auth info is there
      if (!authInfo.hasOwnProperty(`access_token`) || !authInfo.hasOwnProperty(`refresh_token`)) {
        // PropertiesService.getUserProperties().setProperty(`refresh_token`, ``);
        throw new Error(`No access/refresh token. You need to deploy & run first-time authentication.`);     // First-time auth missing. Needs to be manually authorised.
      }

      // Check if the auth token has expired yet
      if (Date.now() * 0.001 > authInfo.expires_in) {
        console.warn("Access token expired. Refreshing authentication...");
        authInfo = await this.RefreshAuth(authInfo.refresh_token);
        userProps.setProperties(authInfo);
      }
      return await authInfo.access_token;
    } catch(err) {
      console.error(`Fetching Auth failed for some reason: ${err}`);
      return 1;
    }
  }
}






// Configure the service
const GetSpotifyService = () => {
  const service = OAuth2.createService(`Spotify`)
    .setAuthorizationBaseUrl(`https://accounts.spotify.com/authorize`)
    .setTokenUrl(`https://accounts.spotify.com/api/token`)
    .setClientId(PropertiesService.getScriptProperties().getProperty(`clientIdSpotify`))
    .setClientSecret(PropertiesService.getScriptProperties().getProperty(`clientSecretSpotify`))
    .setCallbackFunction((request) => {
      const service = GetSpotifyService();
      const isAuthorized = service.handleCallback(request);
      if (isAuthorized) { 
        return HtmlService
          .createTemplateFromFile("auth_success")
          .evaluate();
      } else {
        return HtmlService
          .createTemplateFromFile("auth_error")
          .evaluate();
      }
    })
    .setPropertyStore(PropertiesService.getUserProperties())
    .setCache(CacheService.getUserCache())
    .setLock(LockService.getUserLock())
    .setScope('user-library-read playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private');
  if (!service.hasAccess()) {
    throw new Error('Error: Missing Spotify authorization.');
  }
  console.info(`Access: ${service.hasAccess()}`);
  return service;
}

// Logs the redirect URI to register. You can also get this from File > Project Properties
const GetRedirectUri = () => {
  const redirectURI = GetSpotifyService().getRedirectUri();
  console.log(redirectURI);
  return redirectURI;
}

// Handle the callback
const authCallback = (request) => {
  const service = GetSpotifyService();
  const isAuthorized = service.handleCallback(request);
  if (isAuthorized) { 
    return HtmlService
      .createTemplateFromFile("auth_success")
      .evaluate();
  } else {
    return HtmlService
      .createTemplateFromFile("auth_error")
      .evaluate();
  }
}



/** 
const GetSpotifyData = () => {
  
  // Set up the service
  const service = GetSpotifyService();

  // Need to authorize, open this URL from the Console Log to gain authorization from Spotify
  if (!service.hasAccess()) {
    console.log("App has no access yet.");
    const authorizationUrl = service.getAuthorizationUrl();
    console.log("Open the following URL and re-run the script: " + authorizationUrl);
    return { "errorMessage": "Authorize and rerun: " + authorizationUrl };
  }
  try {

    // Grab playlist data in sets of 100 (limited by API)
    const limit = 100;
    let offset = 0;
    var offsetText = "";
    var totalArray = [];
    const base = "https://api.spotify.com";

    // Examples of endpoints:
    // const endpoint = "/v1/me";
    // var endpoint = "/v1/me/tracks";
    // var endpoint = "/v1/me/playlists?limit=50";    
    const endpoint = "/v1/playlists/" + PropertiesService.getScriptProperties().getProperty(`playlistId`) + "/tracks?fields=items(added_at,track)&limit=" + limit;

    // Pass token to API through header
    const options = {
      "method": "GET",
      "headers": {
        "Authorization": "Bearer " + GetSpotifyService().getAccessToken()
      },
      "muteHttpExceptions": false,
    };

    // Collect data from API in sets of 100 until we grab it all
    let responseCode, responseTextJSON;
    do {
      if (offset > 0) {
        offsetText = "&offset=" + offset;
      }
      const response = UrlFetchApp.fetch(base + endpoint + offsetText, options);
      responseCode = response.getResponseCode();
      responseTextJSON = JSON.parse(response.getContentText());

      // For debugging, download source text of URL to Google Drive since it's too much text for console log
      //  console.log(DriveApp.createFile("Spotify_return.txt", JSON.stringify(response)).getUrl());

      totalArray = totalArray.concat(responseTextJSON.items);
      offset += 100;
    } while (responseCode == 200 && responseTextJSON.items.length != 0);

    // Filter array to remove empty tracks
    totalArray = totalArray.filter(key => key.track != null);

    // Return array of collected data
    console.info(totalArray);
    return totalArray;

  } catch (err) {
    console.error(`GetSpotifyData() failed: ${err}`);
    return 1;
  }

}
*/
