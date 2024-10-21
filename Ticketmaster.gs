/**
 * TicketmasterSearch
 */
class TicketmasterFactory {
  constructor() {
    /** @private */
    this.ticketmasterUrl = `https://app.ticketmaster.com/discovery/v2/events.json`;
    /** @private */
    this.ticketmasterID = PropertiesService.getScriptProperties().getProperty(`TICKETMASTER_ID`);
    /** @private */
    this.ticketmasterSecret = PropertiesService.getScriptProperties().getProperty(`TICKETMASTER_SECRET`);
    /** @private */
    this.latlong = PropertiesService.getScriptProperties().getProperty(`LATLONG`);
    /** @private */
    this.radius = PropertiesService.getScriptProperties().getProperty(`RADIUS`);
    /** @private */
    this.units = PropertiesService.getScriptProperties().getProperty(`UNITS`);
  }

  /**
   * Refresh Events
   */
  async RefreshEvents() {          
    try {
      this._RemoveExpiredEntries(SHEETS.Events);  // Clean expired events
      this._RemoveExpiredEntries(SHEETS.ComedyEvents);  // Clean expired events

      const artists = await this._GetArtistsListFromSheet();   // Get list of artists from sheet
      this._DoParse(artists, SHEETS.Events);
      const comedians = await this._GetComediansListFromSheet(); // Get list of comedians from sheet
      this._DoParse(comedians, SHEETS.ComedyEvents);

      return 0;
    } catch (err) { 
      console.error(`"RefreshEvents()" failed: ${err}`);
      return 1;
    }
  }

  /**
   * Do Parse
   * @private
   */
  _DoParse(artists = [], outputSheet = SHEETS.Events, ) {
    const cal = new CalendarService();
    if(artists.length < 1) return;
    artists.forEach(async (artist) => {      
      if(ARTISTS_TO_IGNORE.includes(artist)) return;
      await this.ParseResults(artist)
        .then(data => {
          if(!data) return;
          Object.entries(data).forEach(([key, { title, acts, venue, city, date, url, image, address, }], idx) => {
            // console.info(`IDX: ${idx}, KEY: ${key}, VALUES: ( Title: ${title}, Acts: ${acts}, Venue: ${venue}, City: ${city}, Date: ${date}, URL: ${url}, IMG: ${image}, Addr.: ${address})`);
            let exists = searchColForValue(outputSheet, `URL`, url);
            if(exists) return;
            const event = {
              id : key,
              title: title,
              date: new Date(date),
              city: city,
              venue: venue, 
              url: url, 
              image: image,
              acts: acts.toString(),
              address: address,
            }
            this.WriteEventToSheet(outputSheet, event);   // Write to Sheet
            cal.CreateCalendarEvent(event);  // Write Calendar Event for new events
          });
        });
    });
  }

  /**
   * Write Single Event To Sheet
   */
  WriteEventToSheet(sheet = SHEETS.Events, event = {}) {
    try {
      const sheetHeaderNames = sheet.getRange(1, 1, 1, sheet.getMaxColumns()).getValues()[0];
      let values = [];
      Object.entries(event).forEach(([key, value], idx) => {
        const headername = EVENT_SHEET_HEADERNAMES[key];
        const index = sheetHeaderNames.indexOf(headername);
        values[index] = value;
      });
      // console.info(`Values: ${JSON.stringify(values)}`);
      sheet.appendRow(values);
      return 0;
    } catch (err) {
      console.error(`WriteEventToSheet() failed: ${err}`);
      return 1;
    }
  }

  /**
   * Search Ticketmaster for a kwarg
   * @private
   */
  async ParseResults(keyword = ``) {
    try {
      if (!keyword) return {};
      let events = {};

      await this.SearchTicketmaster(keyword)
        .then(data => {
          if (data.length == 0 || data.length == undefined) return {};
          data.forEach((item) => {
            let id = IDService.createId();
            let image = this._GetImage(item);
            let attractions = [];
            item?._embedded?.attractions?.forEach((attraction) => attractions.push(attraction.name));
            
            let artistsArr = this._GetArtistsListFromSheet();    // if other artists in my list are in this event, move them to front of list
            for (let i = 0; i < artistsArr.length; i++){
              let artist = artistsArr[i][0];
              if (attractions.includes(artist) && artist != keyword) {
                attractions = attractions.sort((x,y) =>  x == artist ? -1 : y == artist ? 1 : 0 );
              }
            }
            // then move keyword to front of list of acts
            attractions = attractions.sort((x,y) => { return x == keyword ? -1 : y == keyword ? 1 : 0; });
            item?._embedded?.venues?.forEach((venue) => { 
              let date;
              if (item.dates.start.dateTime) {
                date = item.dates.start.dateTime;
              }
              // some list timeTBA = true, or noSpecificTime = true. if so, use localDate value
              if (item.dates.start.timeTBA || item.dates.start.noSpecificTime) {
                date = item.dates.start.localDate;
              }
              // console.info(`venue: ${venueventTitle}`);
              if (attractions.includes(keyword) || item.name.toUpperCase() == keyword.toUpperCase()) {
                events[id] = { 
                  title : item.name,
                  acts : attractions,
                  venue : venue.name , 
                  city : venue.city.name, 
                  date : date, 
                  url : item.url, 
                  image : item.images[image[0][0]].url,
                  address : `${venue.address.line1}, ${venue.city.name}, ${venue.state.name}`
                }
              }
            });
          });
        // console.info(Common.PrettifyJson(events));
        });
      return await events;
    } catch (err) {
      console.error(`"ParseResults()" failed: ${err}`);
      return {};
    }
  }

  /**
   * Helper function to loop through image URLs in JSON response. Find the one with the largest filesize
   * @private
   */
  _GetImage(item) {
    let image = [[0,0]];
    for (let i = 0; i < item.images.length; i++){
      let img = UrlFetchApp.fetch(item.images[i].url)
        .getBlob();
      let imgBytes = img.getBytes().length;
      
      if (imgBytes > image[0][1]) {
        image[0][0] = i;
        image[0][1] = imgBytes;
      }
    }
    return image;
  }

  /**
   * Search Ticketmaster for a keyword
   * @private
   * @param {string} kwargs
   * @return {object} response
   */
  async SearchTicketmaster(keyword = ``) {
    try {
      console.info(`Searching Ticketmaster for ${keyword}`);
      const url = `${this.ticketmasterUrl}?apikey=${this.ticketmasterID}&latlong=${this.latlong}&radius=${this.radius}&unit=${this.units}&keyword=${encodeURI(keyword)}`;
      const options = {
        method : "GET",
        async : true,
        contentType : "application/json",
        muteHttpExceptions : false,
      };
      Sleep(500);       // Wait a sec
      const response = await UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();
      if (responseCode != 200) throw new Error(`Bad response from Ticketmaster: ${responseCode} - ${RESPONSECODES[responseCode]}`);

      const content = JSON.parse(response.getContentText());
      if(!content.hasOwnProperty(`_embedded`)) return {}
      // console.info(Common.PrettifyJson(content._embedded.events));  
      else return content._embedded.events;
    } catch (err) {
      console.error(`"SearchTicketmaster()" failed: ${err}`);
      return {};
    }
  }

  /**
   * Get List of Artists from Sheet
   * @private
   */
  _GetArtistsListFromSheet() {
    try {
      const artistsLength = SHEETS.Artists.getLastRow() - 1 > 1 ? SHEETS.Artists.getLastRow() - 1 : 1;
      if(artistsLength < 1) throw new Error(`No results. Sheet is empty.`);
      const artists = SHEETS.Artists
        .getRange(2, 1, artistsLength, 1)
        .getValues()
        .flat();
      return artists;
    } catch(err) {
      console.error(`"_GetArtistsListFromSheet()" failed: ${err}`);
      return 1;
    }
  }

  /**
   * Get List of Comedians from Sheet
   * @private
   */
  _GetComediansListFromSheet() {
    try {
      const comediansLength = SHEETS.Comedians.getLastRow() - 1 > 1 ? SHEETS.Comedians.getLastRow() - 1 : 1;
      if(comediansLength < 1) throw new Error(`No results. Sheet is empty.`);
      const comedians = SHEETS.Comedians
        .getRange(2, 1, comediansLength, 1)
        .getValues()
        .flat();
      return comedians;
    } catch(err) {
      console.error(`"_GetComediansListFromSheet()" failed: ${err}`);
      return 1;
    }
  }

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Removes any row of data if the Date value is before today
   * @private
   * @param {sheet} sheet
   * @param {string} dateHeaderName default is "Date"
   */
  _RemoveExpiredEntries (sheet = SHEETS.Events, dateHeaderName = "Date") {
    try {
      let data = sheet.getDataRange().getValues();
      let lastRow = sheet.getLastRow() - 1; 
      if (lastRow < 1) return 1;
      let col = data[0].indexOf(dateHeaderName);
      let range = sheet.getRange(2, col + 1, lastRow, 1).getValues();
      if (col == -1) throw `"_RemoveExpiredEntries" Matching data by header failed...`;
      let rowsToDel = [];
      for (let i = 0; i < range.length; i++){
        let date = new Date(range[i][0]);
        if (date <= new Date()) rowsToDel.push(i + 2);
      }
      for (let i = 0; i < rowsToDel.length; i++){
        console.info(`Removing expired event: ${data[i + 1][0]}, Date: ${range[rowsToDel[i] - 2]}`);
        sheet.deleteRow(rowsToDel[i]);
      }
      return 0;
    } catch (err) {
      console.error(`${err} : "_RemoveExpiredEntries" failed - Sheet: ${sheet} Col Name specified: ${dateHeaderName}`);
      return 1;
    }
  }

  

}

/**
 * Main Refresh Event Call
 * @TRIGGERED
 */
const refreshEvents = async () => await new TicketmasterFactory().RefreshEvents();


const _testSearch = () => {
  const t = new TicketmasterFactory();
  const artists = t._GetArtistsListFromSheet().slice(0, 50);
  artists.forEach(async (artist) => {
    console.info(Common.PrettifyJson(await t.ParseResults(artist)));
  });
}


const _testWrite = () => {
  const event = {
    title : "Arctic Monkeys",
    acts : [
      "Arctic Monkeys",
      "Fontaines D.C."
    ],
    venue : "Chase Center",
    city : "San Francisco",
    date : new Date(2023, 09, 27),
    url : "https://www.ticketmaster.com/arctic-monkeys-san-francisco-california-09-26-2023/event/1C005D3C7B3E1307",
    image : "https://s1.ticketm.net/dam/a/20c/39a92fd1-cff7-4815-9e38-47ad38dde20c_1817101_TABLET_LANDSCAPE_LARGE_16_9.jpg",
    address : "300 16th Street, San Francisco, California"
  }
  const t = new TicketmasterFactory();
  t.WriteEventToSheet(SHEETS.Events, event);
}









