/**
 * ---------------------------------------------------------------------------------------------------
 * Spotify Factory
 * Various functions for dealing with Spotify
 * Relies on Spotify Authenticate
 */

const doGet = (e) => {
  return OAuth2Callback(e); // must exist at global scope
}


/** @private */
const refreshUrl = `https://accounts.spotify.com/api/token`;

/** @private */
const playlistId = PropertiesService.getScriptProperties().getProperty(`SPOTIFY_PLAYLIST_ID`);
/** @private */
const profileUrl = `https://api.spotify.com/v1/me`;


/**
 * Authorizes and makes a request to the Spotify API.
 * MAIN FUNCTION
 * DO NOT DELETE
 */
const run = () => {
  var service = SpotifyService();
  if(!service.hasAccess()) {
    const authorizationUrl = service.getAuthorizationUrl();
    console.warn(`Open the following URL and re-run the script:\n${authorizationUrl}`);
  } else if (service.hasAccess()) {
    var response = UrlFetchApp.fetch(profileUrl, {
      headers: {
        'Authorization': 'Bearer ' + service.getAccessToken(),
        'User-Agent': 'Apps Script Sample',
        'client_id': PropertiesService.getScriptProperties().getProperty(`SPOTIFY_CLIENT_ID`),
      }
    });
    var result = JSON.parse(response.getContentText());
    console.info(JSON.stringify(result, null, 2));
  } 
}


/**
 * Configure the service
 */
const SpotifyService = () => {
  try {
    const clientID = PropertiesService.getScriptProperties().getProperty(`SPOTIFY_CLIENT_ID`);
    const clientSecret = PropertiesService.getScriptProperties().getProperty(`SPOTIFY_CLIENT_SECRET`);
    const scope = `user-library-read playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private`;

    const service = OAuth2.createService(`SpotifyService`)
      .setAuthorizationBaseUrl(`https://accounts.spotify.com/authorize`)
      .setTokenUrl(`https://accounts.spotify.com/api/token`)
      .setClientId(clientID)
      .setClientSecret(clientSecret)
      .setPropertyStore(PropertiesService.getUserProperties())
      .setCache(CacheService.getUserCache())
      .setLock(LockService.getUserLock())
      .setScope(scope)
      .setTokenHeaders({
        Authorization: 'Basic ' + Utilities.base64Encode(clientID + ':' + clientSecret)
      })
      .setCallbackFunction(`OAuth2Callback`)
      
    if (!service.hasAccess()) {
      const auth_url = GenerateAuthUrl();
      // throw new Error('Error: Missing Spotify authorization.');
    }
    // console.info(service);
    console.info(`Service Access: ${service.hasAccess()}`);
    return service;
  } catch(err) {
    console.error(`"CreateService()" failed: ${err.message}`);
    return 1;
  }
}

/**
 * Callback
 */
const OAuth2Callback = (e) => {
  const service = SpotifyService();
  const isAuthorized = service.handleCallback(e);
  if (isAuthorized) { 
    return HtmlService
      .createTemplateFromFile("auth_success")
      .evaluate();
  } else if(!isAuthorized) {
    return HtmlService
      .createTemplateFromFile("auth_steps")
      .evaluate();
  } else {
    return HtmlService
      .createTemplateFromFile("auth_error")
      .evaluate();
  }
}

/**
 * Reset the authorization state, so that it can be re-tested.
 */
const Reset = () => SpotifyService().reset();

/**
 * Generate URL for requesting authorization
 * @private
 */
const GenerateAuthUrl = () => {
  try {
    const clientID = PropertiesService.getScriptProperties().getProperty(`SPOTIFY_CLIENT_ID`);
    const clientSecret = PropertiesService.getScriptProperties().getProperty(`SPOTIFY_CLIENT_SECRET`);
    const scope = `user-library-read playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private`;
    const redirect_uri = `https://script.google.com/macros/d/16EI9_XdBK2wvXyqSotATeE9zsr5MOKu99UvuQyCKR44CnkqdkHSW7X4F/usercallback`;
    const params = `?response_type=code&client_id=${clientID}&scope=${scope}&redirect_uri=${redirect_uri}`;
    const authURL = `https://accounts.spotify.com/authorize` + encodeURI(params);
    console.warn(`Auth URL:\n${authURL}`);
    return authURL;
  } catch(err) {
    console.error(`"GenerateAuthUrl()" failed: ${err}`);
    return 1;
  }
}

/**
 * Get the Redirect URI.
 */
const GetRedirectUri = () => {
  const redirect_uri = OAuth2.getRedirectUri();
  console.log(redirect_uri);
  return redirect_uri;
}


/**
 * MAIN ENTRY POINT!
 * Refresh the list of Artists from Spotify
 */
const RefreshArtists = async() => {
  try {
    const service = SpotifyService();
    const sleepLength = 5 * 1000;
    _ClearArtistData(SHEETS.Artists);    // Clear previous artist list

    let artists = [...ARTISTS];

    await GetTopArtists(service)
      .then(topArtists => {
        if(topArtists) artists.push(...topArtists);
        Utilities.sleep(sleepLength);
      });

    await GetPlaylistArtists(service)
      .then(playlistArtists => {
        if(playlistArtists) artists.push(...playlistArtists);
        Utilities.sleep(sleepLength);
      });

    await GetFollowedArtists(service)
      .then(followedArtists => {
        if(followedArtists) artists.push(...followedArtists);
        Utilities.sleep(sleepLength);
      });
    
    await GetSavedTracksArtists(service)
      .then(savedArtists => {
        if(savedArtists) artists.push(...savedArtists);
        Utilities.sleep(sleepLength);
      });
    await GetSavedAlbums(service)
      .then(savedAlbumArtists => {
        if(savedAlbumArtists) artists.push(...savedAlbumArtists);
        Utilities.sleep(sleepLength);
      });

    artists = [...new Set(artists)].sort();   // Combine arrays and filter unique
    if (artists.length < 1) console.info(`Unable to retrieve a list of artists from Spotify`);
    
    artists = _FilterArtists(artists);
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
 * Get Data
 * @private
 * @param {string} url
 * @returns {object} data
 */
const GetData = async(service, url = ``) => {
  try {
    const params = {
      "method" : "GET",
      "content-Type" : "application/json",
      "headers" : {
        "Authorization": 'Bearer ' + service.getAccessToken(),
        'User-Agent': 'Spotify & Apps Script Integration Tool',
      },
      "muteHttpExceptions" : false,
    }

    let data = [];
    for(let i = 0; i < 1000; i += 100) {
      const loc = `${url}&offset=${i}`;
      const response = await UrlFetchApp.fetch(loc, params);
      const responseCode = response.getResponseCode();
      if (responseCode != 200 && responseCode != 201) {
        throw new Error(`Bad response from Spotify: ${responseCode} - ${RESPONSECODES[responseCode]}`);
      }
      data.push(JSON.parse(response.getContentText()));
    }
    const parsed = data.flat();
    return parsed;
  } catch(err) {
    console.error(`"GetData()" failed: ${err}`);
    return 1;
  }
}


/**
 * Returns an array of all artists from Saved Tracks on Spotify
 * Caution: will return ALL artists from Saved Tracks. If you have
 * a lot of Saved Tracks, it may be artists you aren't that 
 * interested in seeing live ;)
 */
const GetSavedTracksArtists = async(service) => {
  try {
    console.info(`Getting Saved Tracks Artists....`);
    const url = `${profileUrl}/tracks?limit=50`;
    const data = await GetData(service, url);
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
const GetFollowedArtists = async(service) => {
  try {
    console.info(`Getting Followed Artists...`);
    const url = `${profileUrl}/following?type=artist&limit=50`;
    const data = await GetData(service, url);
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
const GetPlaylistArtists = async(service) => {
  try {
    // if(!isServiceActive(service)) {
    //   const authURL = GenerateAuthUrl();
    //   throw new Error(`Spotify not authorized yet.\nOpen the following URL and re-run the script: ${authURL}`);
    // }
    
    console.info(`Getting artists from playlists....`);
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

    const options = {
      "method" : "GET",
      "content-Type" : "application/json",
      "headers" : {
        "Authorization" : "Bearer " + service.getAccessToken(),
      },
      "muteHttpExceptions" : false,
    }

    let data = {}
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
const GetTopArtists = async(service) => {
  try {
    const topArtistsUrl = `${profileUrl}/top/artists`;
    const params = {
      "method" : "GET",
      "content-Type" : "application/json",
      "headers" : {
        "Authorization" : "Bearer " + service.getAccessToken(),
      },
      "muteHttpExceptions" : false,
    }
    const terms = [ `long_term`, `medium_term`, `short_term`, ];

    let artists = [];
    terms.forEach( async(term) => {
      let data = [];
      console.info(`Getting top artists (${term})...`);
      const terms = `?time_range=${term}&limit=50`;
      const response = await UrlFetchApp.fetch(topArtistsUrl + terms, params);
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
const GetSavedAlbums = async(service) => {
  try {
    console.info(`Getting Saved Albums....`);
    const url = `${profileUrl}/albums` + `?limit=50`;
    const data = await GetData(service, url);

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
const RefreshComedians = async() => {
  try {
    ClearComedianData(SHEETS.Comedians);    // Clear previous artist list
    let comedians = [...COMEDIANS];
    comedians = _FilterArtists(comedians);
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
const _FilterArtists = (artists = []) => {
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
const _ClearArtistData = () => {
  console.warn(`CLEARING ARTIST SHEET!`);
  SHEETS.Artists
    .getRange(2, 1, SHEETS.Artists.getLastRow() + 1, 1)
    .clear();
}

/**
 * Helper Function to clear sheet
 * @private
 */
const _ClearComedianData = () => {
  console.warn(`CLEARING COMEDIAN SHEET!`);
  SHEETS.Comedians
    .getRange(2, 1, SHEETS.Comedians.getLastRow() + 1, 1)
    .clear();
}


// Handle the callback
// const authCallback = (request) => {
//   const service = GetSpotifyService();
//   const isAuthorized = service.handleCallback(request);
//   if (isAuthorized) { 
//     return HtmlService
//       .createTemplateFromFile("auth_success")
//       .evaluate();
//   } else {
//     return HtmlService
//       .createTemplateFromFile("auth_error")
//       .evaluate();
//   }
// }








/**
 * Retrieve refreshable auth info
 */
const GetFreshAuth = (code = ``) => {
  try {
    const refreshUrl = `https://accounts.spotify.com/api/token`;
    const now = Date.now() * 0.001;
    const params = {
      "method": "post",
      "content-Type": "application/json",
      "payload": {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": ScriptApp.getService().getUrl(),
        "client_id": PropertiesService.getScriptProperties().getProperty(`SPOTIFY_CLIENT_ID`),
        "client_secret": PropertiesService.getScriptProperties().getProperty(`SPOTIFY_CLIENT_SECRET`),
      },
    }

    const response = UrlFetchApp.fetch(refreshUrl, params);

    const newTokens = JSON.parse(response.getContentText());
    const authInfo = {
      accessToken : newTokens.access_token ? newTokens.access_token : ``,
      refreshToken : newTokens.refresh_token ? newTokens.refresh_token : ``,
      expiry : newTokens.expires_in ? now + newTokens.expires_in : ``,
    }

    console.warn(`Token: ${authInfo.accessToken}`);
    StoreAuth(authInfo);
    return authInfo;
  } catch(err) {
    console.error(`"GetFreshAuth()" failed: ${err}`);
    return 1;
  }
}

/**
 * Refresh auth info with refresh token
 */
const RefreshAuth = (refreshToken = {}) => {
  try {
    const refreshUrl = `https://accounts.spotify.com/api/token`;
    const now = Date.now() * 0.001;
    const params = {
      "method": "post",
      "content-Type": "application/json",
      "payload": {
        "grant_type": "refresh_token",
        "refresh_token": refreshToken,
        "client_id": PropertiesService.getScriptProperties().getProperty(`SPOTIFY_CLIENT_ID`),
        "client_secret": PropertiesService.getScriptProperties().getProperty(`SPOTIFY_CLIENT_SECRET`),
      },
    }

    const response = UrlFetchApp.fetch(refreshUrl, params);
    const newTokens = JSON.parse(response.getContentText());
    const authInfo = {
      accessToken : newTokens.access_token ? newTokens.access_token : ``,
      refreshToken : newTokens.refresh_token ? newTokens.refresh_token : ``,
      expiry : newTokens.expires_in ? now + newTokens.expires_in : ``,
    }
    StoreAuth(authInfo);
    return authInfo;
  } catch(err) {
    console.error(`"RefreshAuth()" failed: ${err}`);
    return 1;
  }
}

/**
 * Store refreshable auth info in user properties store
 * API auth reference: https://developer.spotify.com/documentation/web-api/concepts/authorization
 */
const StoreAuth = (authInfo = {}) => {
  try {
    if(!authInfo) throw new Error(`Nothing to store...`);
    PropertiesService.getUserProperties()
      .setProperties(authInfo);
  } catch(err) {
    console.error(`"StoreAuth()" failed: ${err}`);
    return 1;
  }
}

/**
 * Retrieve Auth
 * Retrieve refreshable auth info from user properties store
 */
const RetrieveAuth = () => {
  try {
    const now = Date.now() * 0.001;
    const userProperties = PropertiesService.getUserProperties();
    let authInfo = userProperties.getProperties();

    // First-time auth missing. Needs to be manually authorised.
    if(!authInfo.hasOwnProperty("refreshToken") || !authInfo.hasOwnProperty("accessToken")) {
      throw new Error("No access/refresh token. You need to deploy & run first-time authentication.");
    }

    // Refresh the auth info
    if (now < authInfo.expiry) return authInfo.accessToken;
    console.warn("Access token expired. Refreshing authentication...");
    authInfo = RefreshAuth(authInfo.refreshToken);
    console.warn(`Expires: ${authInfo.expiry}`);

    return authInfo.accessToken;
  } catch(err) {
    console.error(`"RetrieveAuth()" failed: ${err}`);
    return 1;
  }
}





