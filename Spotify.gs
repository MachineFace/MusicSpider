/**
 * Spotify Factory
 * Various functions for dealing with Spotify
 * Relies on Spotify Authenticate
 */
class SpotifyFactory {
  constructor() {
    this.baseUrl = `https://api.spotify.com/v1`;
    // Profile URLs
    this.profileUrl = `${this.baseUrl}/me`;

    // Library URLs
    this.playlistUrl = `${this.profileUrl}/playlists`;
    this.followUrl = `${this.profileUrl}/following`;
    this.savedTracksUrl = `${this.profileUrl}/tracks`;
    this.savedAlbumsUrl = `${this.profileUrl}/albums`;
    this.savedShowsUrl = `${this.profileUrl}/shows`;
    this.savedEpisodesUrl = `${this.profileUrl}/episodes`;
    this.topArtistsUrl = `${this.profileUrl}/top/artists`;

  }

  async RefreshArtists() {

    if (config.getTopArtists) {
      let topArtists = await this.GetTopArtists();
      console.warn(`Number of Artists: ${topArtists.length}, ${topArtists}`);
    }
    if (config.getArtistsFromPlaylist) {
      let playlistArtists = await this.GetPlaylistArtists();
      console.warn(`Number of Playlist Artists: ${playlistArtists.length}, ${playlistArtists}`);
    }
    if (config.getFollowing) { 
      let followedArtists = await this.GetFollowedArtists();
      console.warn(`Number of Followed Artists: ${followedArtists.length}, ${followedArtists}`);
    }
    
    let artistsArr = [...new Set([...topArtists, ...playlistArtists, ...followedArtists])];   // Combine arrays and filter unique
    console.info(`All Artists: ${artistsArr.length}, ${artistsArr}`);

    if (artistsArr.length < 1) console.info(`Unable to retrieve a list of artists from Spotify`);
    this._ClearData(artistSheet);    // Clear previous artist list
    
    writeArrayToColumn(artistsArr, artistSheet, 1);     // Write new artists to sheet
    console.warn(`Total Artists: ${artistsArr}`);
    artistSheet.getRange(1,1,artistSheet.getLastRow(),1)
      .setHorizontalAlignment('left');
  }

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Returns an array of all artists from Saved Tracks on Spotify
   * Caution: will return ALL artists from Saved Tracks. If you have
   * a lot of Saved Tracks, it may be artists you aren't that 
   * interested in seeing live ;)
   */
  async GetSavedTracksArtists() {
    const sheet = artistSheet;
    // Retrieve auth
    let accessToken = await retrieveAuth();
    console.warn(`Access token`,JSON.stringify(accessToken));
    
    // Retrieve data
    let params = `?limit=50`;
    console.info(`Getting artists from saved tracks`)
    let data = await getData(accessToken, savedTracksUrl + params, true);

    // Fold array of responses into single structure
    if (!data) console.warn(`Unable to get artists from saved tracks`);
    data = common.collateArrays(`items`, data);
    let artistsArr = [];
    data.forEach(track => {
      track.track.artists.forEach(artist => artistsArr.push(artist.name));
    });

    artistsArr = arrUnique(artistsArr);
    lastRow = sheet.getLastRow();

    console.warn(`Artists Array`, artistsArr);
    return artistsArr;

  }

  async GetFollowedArtists() {
    // Retrieve auth
    let accessToken = await retrieveAuth();

    // Retrieve data
    let params = `?type=artist&limit=50`;
    let data = await getData(accessToken, followUrl + params, true);

    // Fold array of responses into single structure
    data = common.collateArrays(`artists.items`, data);

    // Sort artists by name
    data.sort((first, second) => {
      if (first.name < second.name) return -1;
      if (first.name > second.name) return 1;
      return 0;  // names must be equal
    });

    let artistsArr = [];
    data.forEach(artist => {
      if (artistsToIgnore.includes(artist.name)) console.warn(`Ignoring`, artist.name);
      if (!artistsToIgnore.includes(artist.name)) artistsArr.push(artist.name);  
    });
    console.warn(`artistsArr: ${artistsArr}`);
    return artistsArr;
  }


  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Returns an array of artists from a Playlist
   * Playlist ID is supplied in config.gs
   */
  async GetPlaylistArtists() {
    const playlistId = config.playlistId;
    // Retrieve auth
    let accessToken = await retrieveAuth();
    console.warn(`Access token`,JSON.stringify(accessToken));

    // Retrieve data
    let params = `?playlist_id=` + playlistId;
    params += `&limit=50`
    console.info(`Getting artists from playlists`)
    let data = await getData(accessToken, `${playlistUrl}/${playlistId}${params}`);
    // console.info(data);

    // Fold array of responses into single structure
    if (!data[0]) console.warn(`No data received from your watch playlist`);
    // let newData = common.collateArrays(`items`, data);
    let newData = JSON.parse(data);
    let items = newData.tracks.items;
    // console.info(newData.tracks.items);
    // console.info(JSON.stringify(newData.tracks.items));
    let artistsArr = [];
    items.forEach(item => {
      let artists = item.track.album.artists;
      artists.forEach(artist => { 
        if (artistsToIgnore.includes(artist.name)) console.warn(`Ignoring`, artist.name);
        if (!artistsToIgnore.includes(artist.name)) artistsArr.push(artist.name);  
      });
    })

    artistsArr = arrUnique(artistsArr);
    console.warn(`Playlist Artists: ${artistsArr}`);
    return artistsArr;
  }

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Returns an array of Top Artists as gathered by Spotify
   * This searches `long term`, `medium term`, and `short term`
   */
  async GetTopArtists() {  
    let artistsArr = [];
    let long_term1 = [];
    let long_term2 = [];
    let med_term = [];
    let short_term = [];

    // Request for LONG TERM top artists
    artistsArr.concat(await getTopData(`long_term`, 0));
    console.info(long_term1);
    
    // Request for LONG TERM top artists OFFSET +48
    artistsArr = artistsArr.concat(await getTopData(`long_term`, 48));
    console.info(long_term2);
    
    // Re-request for MEDIUM TERM top artists
    artistsArr = artistsArr.concat(await getTopData(`medium_term`, 0));

    // Re-request for SHORT TERM top artists
    artistsArr = artistsArr.concat(await getTopData(`short_term`, 0));
    
    let final = [];

    if (artistsArr.length == 0) {
      console.info(`Returned 0 top artists somehow`)
      return artistsArr;
    }
    final = arrUnique(artistsArr);
    return final;
  }

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Returns an array of Top Artists as gathered by Spotify
   * This searches `long term`, `medium term`, and `short term`
   * @param {string} term expects `long_term`, `medium_term`, or `short_term`
   * @param {integer} offset 
   * @returns {[artists]} list of artists
   */
  async GetTopData(term, offset) {
    let accessToken = await this._RetrieveAuth();
    console.warn(`Access token: ${JSON.stringify(accessToken)}`);
    
    let params = `?time_range=${term}&limit=50&offset=${offset}`;

    console.info(`Getting top artists (long term)...`)
    let resp = await getData(accessToken, topArtistsUrl + params,true);
    if (!resp) console.warn(`No data received (long term)`);

    let artistsArr = [];
    // Fold array of responses into single structure
    data = common.collateArrays(`items`, resp);
    data.forEach(artist => { 
      if (artistsToIgnore.includes(artist.name)) console.warn(`Ignoring: ${artist.name}`);
      artistsArr.push(artist.name);
    });
    
    return artistsArr;
  }

  _ClearData (sheet, startRow = 2) {
    if(typeof sheet != `object`) return 1;
    startRow = startRow >= 2 ? startRow : 2;
    let numCols = sheet.getLastColumn();
    let numRows = numRows >= 1 ? sheet.getLastRow() - startRow + 1 : 1; // The number of row to clear
    let range = sheet.getRange(startRow, 1, numRows, numCols);
    range.clear();
  }

}


class SpotifyAuthenticate {
  constructor() {
    this.baseAuthUrl = `https://accounts.spotify.com`;
    this.authUrl = `${this.baseAuthUrl}/authorize`;
    this.refreshUrl = `${this.baseAuthUrl}/api/token`;
    this.scope = "user-library-read playlist-read-private playlist-read-collaborative user-top-read user-follow-read";
  }

  async DoGet(e) {
    if (e.parameter.error) {
      let template = HtmlService.createTemplateFromFile("auth_error");
      template.errorText = e.parameter.error;
      return template.evaluate();
    } else if (!e.parameter.code) {
      return HtmlService
        .createTemplateFromFile("auth_steps")
        .evaluate();
    }

    // Retrieve refreshable auth with auth code
    // Then store it for later
    let authInfo = this.GetFreshAuth(e.parameter.code);
    this.StoreAuth(authInfo);

    return HtmlService
      .createTemplateFromFile("auth_success")
      .evaluate();
  }

  // Generate URL for requesting authorization using Authorization Code Flow
  async GenerateAuthUrl() {
    let url = ScriptApp.getService().getUrl();
    let params = `?response_type=code&client_id=${config.clientIdSpotify}&scope=${this.scope}&redirect_uri=${url}`;
    return authUrl + encodeURI(params);
  }

  // Retrieve refreshable auth info
  async GetFreshAuth (code) {
    let now = Date.now() / 1000;
    let options = {
      'method': 'post',
      'Content-Type': 'application/json',
      'payload': {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": ScriptApp.getService().getUrl(),
        "client_id": config.clientIdSpotify,
        "client_secret": config.clientSecretSpotify,
      }
    };

    let response = UrlFetchApp.fetch(refreshUrl, options);

    // Grab the values we're looking for and return them
    let newTokens = JSON.parse(response.getContentText());
    let authInfo = {
      accessToken : newTokens.access_token,
      refreshToken : newTokens.refresh_token,
      expiry : now + newTokens.expires_in,
    };
    console.info(`Token: ${authInfo.accessToken}`);
    return authInfo;
  }

  // Refresh auth info with refresh token
  async RefreshAuth (refreshToken) {
    let now = Date.now() / 1000;
    let options = {
      'method': 'post',
      'Content-Type': 'application/json',
      'payload': {
        "grant_type": "refresh_token",
        "refresh_token": refreshToken,
        "client_id": config.clientIdSpotify,
        "client_secret": config.clientSecretSpotify,
      }
    };

    let response = UrlFetchApp.fetch(refreshUrl, options);

    // Grab the values we're looking for and return them
    let newTokens = JSON.parse(response.getContentText());
    let authInfo = {
      accessToken : newTokens.access_token,
      expiry : now + newTokens.expires_in,
    };

    if (newTokens.refresh_token) authInfo[refreshToken] = newTokens.refresh_token;
    return authInfo;
  }

  StoreAuth (authInfo) {
    // Retrieve refreshable auth info from user properties store
    let userProperties = PropertiesService.getUserProperties();

    // Save the new auth info back to the user properties store
    userProperties.setProperties(authInfo);
  }

  async RetrieveAuth () {
    // Retrieve refreshable auth info from user properties store
    let userProperties = PropertiesService.getUserProperties();
    let authInfo = userProperties.getProperties();

    // Check if auth info is there
    if (!authInfo.hasOwnProperty("refreshToken") || !authInfo.hasOwnProperty("accessToken")) {
      // First-time auth missing.
      // Needs to be manually authorised.
      throw "No access/refresh token. You need to deploy & run first-time authentication.";
    }

    // Check if the auth token has expired yet
    let now = Date.now() / 1000;
    if (now > authInfo.expiry) {
      // Refresh the auth info
      console.info("Access token expired. Refreshing authentication...");
      authInfo = await this.RefreshAuth(authInfo.refreshToken);

      // Save the new auth info back to the user properties store
      userProperties.setProperties(authInfo);
    }

    // Return just what we need for retrieving data
    return authInfo.accessToken;
  }

}


/**
 * Main Call on HTML page
 */
const generateAuthUrl = () => {
  const s = new SpotifyAuthenticate();
  s.GenerateAuthUrl();
}











