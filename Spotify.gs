/**
 * ---------------------------------------------------------------------------------------------------
 * Spotify Factory
 * Various functions for dealing with Spotify
 * Relies on Spotify Authenticate
 */
class SpotifyService {
  constructor() {
    /** @private */
    this.baseUrl = `https://api.spotify.com/v1`;
    /** @private */
    this.clientID = PropertiesService.getScriptProperties().getProperty(`SPOTIFY_CLIENT_ID`);
    /** @private */
    this.clientSecret = PropertiesService.getScriptProperties().getProperty(`SPOTIFY_CLIENT_SECRET`);

    this.getTopArtists = true;
    this.getPlaylistArtists = true;
    this.getFollowingArtists = true,

    /** @private */
    this.profileUrl = `${this.baseUrl}/me`;
    /** @private */
    this.playlistUrl = `${this.baseUrl}/playlists`;
    /** @private */
    this.followUrl = `${this.profileUrl}/following`;
    /** @private */
    this.savedTracksUrl = `${this.profileUrl}/tracks`;
    /** @private */
    this.savedAlbumsUrl = `${this.profileUrl}/albums`;
    /** @private */
    this.savedShowsUrl = `${this.profileUrl}/shows`;
    /** @private */
    this.savedEpisodesUrl = `${this.profileUrl}/episodes`;
    /** @private */
    this.topArtistsUrl = `${this.profileUrl}/top/artists`;

    /** @private */
    this.service = this._CreateService();
  }

  /**
   * Configure the service
   * @private
   */
  _CreateService() {
    const service = OAuth2.createService(`Spotify`)
      .setAuthorizationBaseUrl(`https://accounts.spotify.com/authorize`)
      .setTokenUrl(`https://accounts.spotify.com/api/token`)
      .setClientId(this.clientID)
      .setClientSecret(this.clientSecret)
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
   * @private
   */
  _isServiceActive() {
    if(!this.service.hasAccess()) return false;
    return true;
  }

  /**
   * Get Data
   * @private
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
      method : "GET",
      contentType : "application/json",
      headers : { "Authorization" : "Bearer " + this.service.getAccessToken(), },
      muteHttpExceptions : false,
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
    if (this.getTopArtists) {
      topArtists = await this.GetTopArtists();
      console.warn(`Number of Artists: ${topArtists.length}`);
    }
    if (this.getPlaylistArtists) {
      playlistArtists = await this.GetPlaylistArtists();
      console.warn(`Number of Playlist Artists: ${playlistArtists.length}`);
    }
    if (this.getFollowingArtists) { 
      followedArtists = await this.GetFollowedArtists();
      console.warn(`Number of Followed Artists: ${followedArtists.length}`);
    }
    savedArtists = await this.GetSavedTracksArtists();
    console.warn(`Number of Saved Artists: ${savedArtists.length}`);

    let artists = [...new Set([...topArtists, ...playlistArtists, ...followedArtists, ...savedArtists, ...ARTISTS])].sort();   // Combine arrays and filter unique
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
   * @private
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
    const playlistId = PropertiesService.getScriptProperties().getProperty(`SPOTIFY_PLAYLIST_ID`);
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
   * @private
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

  /**
   * Filter Artists
   * @private
   * @param {[string]} artists
   * @returns {[string]} artists
   */
  _FilterArtists(artists) {
    let filtered = [];
    artists.forEach(artist => {
      if (!artistsToIgnore.includes(artist)) filtered.push(artist);
    });
    return [...new Set(artists)].sort();
  }

  /**
   * Helper Function to clear sheet
   * @private
   */
  _ClearData () {
    console.warn(`CLEARING ARTIST SHEET!`);
    SHEETS.Artists
      .getRange(2, 1, SHEETS.Artists.getLastRow() + 1, 1)
      .clear();
  }

}

/**
 * MAIN CALL
 */
const refreshArtists = () => new SpotifyService().RefreshArtists();








// Configure the service
const GetSpotifyService = () => {
  const service = OAuth2.createService(`Spotify`)
    .setAuthorizationBaseUrl(`https://accounts.spotify.com/authorize`)
    .setTokenUrl(`https://accounts.spotify.com/api/token`)
    .setClientId(PropertiesService.getScriptProperties().getProperty(`SPOTIFY_CLIENT_ID`))
    .setClientSecret(PropertiesService.getScriptProperties().getProperty(`SPOTIFY_CLIENT_SECRET`))
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



