class TicketmasterFactory {
  constructor() {
    this.ticketmasterUrl = `https://app.ticketmaster.com/discovery/v2/events.json`;
  }

  /**
   * Refresh Events
   */
  async RefreshEvents() {          
    try {
      const artists = await this._GetArtistsListFromSheet();   // Get list of artists from sheet
      this._RemoveExpiredEntries(SHEETS.Events);  // Clean expired events
      // deleteEmptyRows(SHEETS.Events);  // Clear any empty rows if something was manually deleted

      let count = 0;
      artists.forEach(async (artist) => {      
        await this.TicketSearch(artist)
          .then(data => {
            if(!data) throw new Error(`TicketSearch returned no results.`);
            for (const [index, [key]] of Object.entries(Object.entries(data))) {
              let exists = searchColForValue(SHEETS.Events, `URL`, data[key].url);
              if (!exists) {
                const event = {
                  eventTitle: data[key].eventTitle,
                  date: data[key].date,
                  city: data[key].city,
                  venue: data[key].venue, 
                  url: data[key].url, 
                  image: data[key].image,
                  acts: data[key].acts.toString(),
                  address: data[key].address,
                }
                this.WriteEventToSheet(event);   // Write to Sheet
                count += 1;
                if (PropertiesService.getScriptProperties().getProperty(`createCalendarEvents`)) CreateCalendarEvent(event);  // Write Calendar Event for new events
              }
            }
          });
      });
      return count;
    }catch (err) { 
      console.error(`"RefreshEvents()" failed: ${err}`);
      return 1;
    }
  }

  /**
   * Write Single Event To Sheet
   */
  WriteEventToSheet(event) {
    console.info(`Writing Event to Sheet..`);
    try {
      const sheetHeaderNames = Object.values(GetRowData(SHEETS.Events, 1));
      console.info(`Headernames: ${sheetHeaderNames}`);
      let values = [];
      Object.entries(event).forEach(kvp => {
        const headername = EVENTSHEETHEADERNAMES[kvp[0]];
        const index = sheetHeaderNames.indexOf(headername);
        values[index] = kvp[1];
      });
      SHEETS.Events.appendRow(values);
      return 0;
    } catch (err) {
      console.error(`WriteEventToSheet() failed: ${err}`);
      return 1;
    }
  }

  /**
   * Build an Array of Events for Email
   */
  BuildEventsArray() {
    let lastRow = SHEETS.Events.getLastRow();
    let events = {};
    let ordered = {};
    if (lastRow <= 1) {
      console.error(`No events found- unable to build array of Events`);
      return 1;
    }
    for (let i = 1; i < lastRow; i++) {
      let rowData = GetRowData(SHEETS.Events, i + 1);
      let { date } = rowData;
      events[date] = rowData;
    }
      // Sort by key, which is the date
    ordered = Object.keys(events)
      .sort()
      .reduce((obj, key) => { 
        obj[key] = events[key]; 
        return obj;
      },{}
    );
    return ordered;
  }

  /**
   * Search Ticketmaster for a kwarg
   */
  async TicketSearch(keyword) {
    try {
      if (!keyword) throw new Error(`"TicketSearch()" Keyword not provided.`);
      let events = {};

      const data = await this.SearchTicketmaster(keyword);
      // if (data.page.totalElements == 0) console.info(`No results.`);
      
      data?.forEach((item) => {
        // console.info(`DATA ---> ${new Common().PrettifyJson(item)}`);
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
        item?._embedded?.venues?.forEach((venue) =>{ 
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
            events[date] = { 
              eventTitle : item.name,
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
      console.info(new Common().PrettifyJson(events));
      return await events;
    } catch (err) {
      console.error(`"TicketSearch()" failed: ${err}`);
      return 1;
    }
  }

  /**
   * Helper function to loop through image URLs in JSON response. Find the one with the largest filesize
   */
  _GetImage(item) {
    let image = [[0,0]];
    for (let i = 0; i < item.images.length; i++){
      // let img = new Images();
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
   * @param {string} kwargs
   * @return {object} response
   */
  async SearchTicketmaster(keyword) {
    try {
      console.info(`Searching Ticketmaster for ${keyword}`);
      let params = `?apikey=${PropertiesService.getScriptProperties().getProperty(`ticketmaserKey`)}`;
      params += `&latlong=${PropertiesService.getScriptProperties().getProperty(`latlong`)}`;
      params += `&radius=${PropertiesService.getScriptProperties().getProperty(`radius`)}`;
      params += `&unit=${PropertiesService.getScriptProperties().getProperty(`unit`)}`;
      params += `&keyword=${encodeURI(keyword)}`;
      console.info(this.ticketmasterUrl + params)
      let options = {
        "method" : "GET",
        "async" : true,
        "contentType" : "application/json",
        "muteHttpExceptions" : false,
      };

      let response = await UrlFetchApp.fetch(this.ticketmasterUrl + params, options);
      let responseCode = await response.getResponseCode();
      if (responseCode != 200 && responseCode != 201) throw new Error(`Bad response from Ticketmaster: ${responseCode} - ${RESPONSECODES[responseCode]}`);
      let content = await JSON.parse(response.getContentText())?._embedded?.events;
      // console.info(new Common().PrettifyJson(content));  
      Sleep(1000);
      return content;
    } catch (err) {
      console.error(`"SearchTicketmaster()" failed: ${err}`);
      return 1;
    }
  }

  /**
   * Get List of Artists from Sheet
   */
  _GetArtistsListFromSheet() {
    try {
      const artistRows = SHEETS.Artists.getLastRow() - 1 > 1 ? SHEETS.Artists.getLastRow() - 1 : 1;
      const artists = SHEETS.Artists.getRange(2, 1, artistRows, 1).getValues().flat();
      if(artists == ``) throw new Error(`No results. Sheet is empty.`);
      return artists;
    } catch(err) {
      console.error(`"_GetArtistsListFromSheet()" failed: ${err}`);
      return 1;
    }
  }

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Removes any row of data if the Date value is before today
   * @param {sheet} sheet
   * @param {string} dateHeaderName default is "Date"
   */
  _RemoveExpiredEntries (sheet, dateHeaderName = "Date") {
    try {
      if(typeof sheet != `object`) throw `"_RemoveExpiredEntries()" Sheet provided is invalid.`;
      let data = sheet.getDataRange().getValues();
      let lastRow = sheet.getLastRow() - 1; //subtract header
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



const _testSearch = async () => console.info(new Common().PrettifyJson(await new TicketmasterFactory().SearchTicketmaster(`Clark`)));


