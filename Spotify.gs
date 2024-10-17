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
    /** @private */
    this.playlistId = PropertiesService.getScriptProperties().getProperty(`SPOTIFY_PLAYLIST_ID`);
    /** @private */
    this.profileUrl = `${this.baseUrl}/me`;

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
      for(let i = 0; i < 1000; i += 100) {
        const response = await UrlFetchApp.fetch(url + "&offset=" + i, options);
        const responseCode = response.getResponseCode();
        if (responseCode != 200 && responseCode != 201) throw new Error(`Bad response from Spotify: ${responseCode} - ${RESPONSECODES[responseCode]}`);
        data.push(JSON.parse(response.getContentText()));
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
    try {
      const sleepLength = 5;
      this._ClearArtistData(SHEETS.Artists);    // Clear previous artist list

      let artists = [...ARTISTS];

      await this.GetTopArtists()
        .then(topArtists => {
          if(topArtists) artists.push(...topArtists);
          Utilities.sleep(sleepLength * 1000);
        });

      await this.GetPlaylistArtists()
        .then(playlistArtists => {
          if(playlistArtists) artists.push(...playlistArtists);
          Utilities.sleep(sleepLength * 1000);
        });

      await this.GetFollowedArtists()
        .then(followedArtists => {
          if(followedArtists) artists.push(...followedArtists);
          Utilities.sleep(sleepLength * 1000);
        });
      
      await this.GetSavedTracksArtists()
        .then(savedArtists => {
          if(savedArtists) artists.push(...savedArtists);
          Utilities.sleep(sleepLength * 1000);
        });
      await this.GetSavedAlbums()
        .then(savedAlbumArtists => {
          if(savedAlbumArtists) artists.push(...savedAlbumArtists);
          Utilities.sleep(sleepLength * 1000);
        });

      artists = [...new Set(artists)].sort();   // Combine arrays and filter unique
      if (artists.length < 1) console.info(`Unable to retrieve a list of artists from Spotify`);
      
      artists = this._FilterArtists(artists);
      if(artists) console.warn(`Total Artists: ${artists.length}`);

      artists.forEach((artist, idx) => {
        SHEETS.Artists.getRange(2 + idx, 1, 1, 1).setValue(artist);
      });
      SHEETS.Artists.getRange(2, 1, SHEETS.Artists.getLastRow(), 1)
        .setHorizontalAlignment('left');
      return artists.length;
    } catch(err) {
      console.error(`RefreshArtists() failed: ${err}`);
      return 1;
    }
  }


  /**
   * Returns an array of all artists from Saved Tracks on Spotify
   * Caution: will return ALL artists from Saved Tracks. If you have
   * a lot of Saved Tracks, it may be artists you aren't that 
   * interested in seeing live ;)
   */
  async GetSavedTracksArtists() {
    try {
      console.info(`Getting Saved Tracks Artists....`);
      const url = `${this.profileUrl}/tracks` + `?limit=50`;
      const data = await this._GetData(url);
      let artists = [];
      data.forEach(entry => {
        entry.items.forEach(item => {
          item.track.artists.forEach(artist => artists.push(artist.name));
        });
      })
      const filteredArtists = [...new Set(artists)].sort();
      console.warn(`Number of Saved Artists: ${filteredArtists.length}`);
      return filteredArtists;
    } catch(err) {
      console.error(`"GetSavedTracksArtists()" failed: ${err}`);
      return [];
    }
  }


  /**
   * Get Followed Artists
   */
  async GetFollowedArtists() {
    try {
      console.info(`Getting Followed Artists...`);
      const url = `${this.profileUrl}/following` + `?type=artist&limit=50`;
      const data = await this._GetData(url);
      let artists = [];
      data?.forEach(entry => {
        if(entry) {
          const items = entry?.artists?.items;
          if(items) items.forEach(item => artists.push(item.name));
        }
      })
      artists = [...new Set(artists)].sort();
      console.warn(`Number of Followed Artists: ${artists.length}`);
      return artists;
    } catch(err) {
      console.error(`"GetFollowedArtists()" failed: ${err}`);
      return [];
    }
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
    const url = `${this.baseUrl}/playlists` + "/" + this.playlistId + "/tracks";

    const options = {
      "method": "GET",
      "headers" : {
        "Authorization" : "Bearer " + this.service.getAccessToken(),
        "Content-Type" : "application/json",
      },
      "muteHttpExceptions" : false,
    };

    try {
      let data = {};
      const response = await UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();
      if (responseCode != 200 && responseCode != 201) throw new Error(`Bad response from Spotify: ${responseCode} - ${RESPONSECODES[responseCode]}`);
      
      data = JSON.parse(response.getContentText());
      if (!data) throw new Error(`No data received from your watch playlist...`);

      let artists = [];
      data?.items?.forEach(entry => {
        const artist = entry?.track?.album?.artists[0]?.name;
        artists.push(artist);
      });
      const filteredArtists = [...new Set(artists)];
      console.warn(`Number of Playlist Artists: ${filteredArtists.length}`);
      return filteredArtists;
    } catch(err) {
      console.error(`"GetPlaylistArtists()" failed: ${err}`);
      return 1;
    }
  }


  /**
   * Returns an array of Top Artists as gathered by Spotify
   * This searches `long term`, `medium term`, and `short term`
   */
  async GetTopArtists() {
    if(!this._isServiceActive()) {
      const authURL = service.getAuthorizationUrl();
      console.error(`Spotify not authorized yet.\nOpen the following URL and re-run the script: ${authURL}`);
      return 1;
    }

    const topArtistsUrl = `${this.profileUrl}/top/artists`;

    const options = {
      "method": "GET",
      "headers" : {
        "Authorization" : "Bearer " + this.service.getAccessToken(),
        "Content-Type" : "application/json",
      },
      "muteHttpExceptions" : false,
    };
    const terms = [ `long_term`, `medium_term`, `short_term`, ];

    try {
      let artists = [];
      terms.forEach( async(term) => {
        let data = [];
        console.info(`Getting top artists (${term})...`);
        const params = `?time_range=${term}&limit=50`;
        const response = await UrlFetchApp.fetch(topArtistsUrl + params, options);
        const responseCode = response.getResponseCode();
        if (responseCode != 200 && responseCode != 201) throw new Error(`Bad response from Spotify: ${responseCode} - ${RESPONSECODES[responseCode]}`);

        data.push(JSON.parse(response.getContentText()));
        if (!data) throw new Error(`No data received (${term})`);

        const temp = [];
        data.forEach(entry => {
          entry?.items?.forEach(item => {
            const artist = item?.name;
            temp.push(artist);
          });
        });
        artists.push(...temp);
      });

      const filteredArtists = [...new Set(await artists)].sort();
      console.info(filteredArtists);
      console.warn(`Number of Top Artists: ${filteredArtists.length}`);
      return filteredArtists;
    } catch(err) {
      console.error(`"GetData()" failed: ${err}`);
      return 1;
    }

    // let artists = [];
    // response?.items.forEach(artist => { 
    //   if (!ARTISTS_TO_IGNORE.includes(artist.name)) {
    //     artists.push(artist.name);
    //   }
    // });
    // console.info(artists);
    // return artists;
  }

  /**
   * Get Saved Album Artists
   * @return {[string]} artists
   */
  async GetSavedAlbums() {
    try {
      console.info(`Getting Saved Albums....`);
      const url = `${this.profileUrl}/albums` + `?limit=50`;
      const data = await this._GetData(url);

      let artists = [];
      data.forEach(entry => {
        entry.items.forEach(item => {
          const artist = item?.album?.artists[0]?.name;
          artists.push(artist);
        });
      });
      const filteredArtists = [...new Set(artists)].sort();
      console.warn(`Number of Saved Album Artists: ${filteredArtists.length}`);
      return filteredArtists;
    } catch(err) {
      console.error(`"GetSavedAlbums()" failed: ${err}`);
      return 1;
    }
  }

  /**
   * Refresh the list of Comedians
   */
  async RefreshComedians() {
    try {
      this._ClearComedianData(SHEETS.Comedians);    // Clear previous artist list
      let comedians = [...COMEDIANS];
      comedians = this._FilterArtists(comedians);
      if (comedians.length < 1) throw new Error(`Unable to retrieve a list of comedians.`);

      comedians = [...new Set(comedians)].sort();
      comedians.forEach((comedian, idx) => {
        SHEETS.Comedians.getRange(2 + idx, 1, 1, 1)
          .setValue(comedian);
      });
      SHEETS.Comedians.getRange(2, 1, SHEETS.Comedians.getLastRow(), 1)
        .setHorizontalAlignment('left');

      console.warn(`Total Comedians: ${comedians.length}`);
      return comedians.length;
    } catch(err) {
      console.error(`RefreshComedians() failed: ${err}`);
      return 1;
    }
  }

  // -------------------------------
  /**
   * Filter Artists
   * @private
   * @param {[string]} artists
   * @returns {[string]} artists
   */
  _FilterArtists(artists) {
    let filtered = [];
    artists.forEach(artist => {
      if (!ARTISTS_TO_IGNORE.includes(artist)) filtered.push(artist);
    });
    return [...new Set(artists)].sort();
  }

  /**
   * Helper Function to clear sheet
   * @private
   */
  _ClearArtistData() {
    console.warn(`CLEARING ARTIST SHEET!`);
    SHEETS.Artists
      .getRange(2, 1, SHEETS.Artists.getLastRow() + 1, 1)
      .clear();
  }

  /**
   * Helper Function to clear sheet
   * @private
   */
  _ClearComedianData() {
    console.warn(`CLEARING COMEDIAN SHEET!`);
    SHEETS.Comedians
      .getRange(2, 1, SHEETS.Comedians.getLastRow() + 1, 1)
      .clear();
  }

}

/**
 * MAIN CALL
 */
const refreshArtists = () => new SpotifyService().RefreshArtists();
const refreshComedians = () => new SpotifyService().RefreshComedians();

/**
 * @private
 */
const _testSP = async () => {
  const s = new SpotifyService().RefreshComedians();
} 





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



