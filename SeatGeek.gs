// https://github.com/SethuSenthil/Concert-Ticket-Finder/blob/main/backend/server.js
// API documentation: https://platform.seatgeek.com/
/*
  ENDPOINTS::::
  /events/{EVENT_ID}
  /performers
  /performers/{PERFORMER_ID}
  /venues
  /venues/{VENUE_ID}
*/

class SeatGeekFactory {
  constructor() {
    /** @private */
    this.url = `https://api.seatgeek.com/2`;
    /** @private */
    this.eventsUrl = `${this.url}/events`;
    /** @private */
    this.clientID = PropertiesService.getScriptProperties().getProperty(`SEATGEEK_CLIENT_ID`);
    /** @private */
    this.clientSecret = PropertiesService.getScriptProperties().getProperty(`SEATGEEK_CLIENT_SECRET`);
    /** @private */
    this.latlong = PropertiesService.getScriptProperties().getProperty(`LATLONG`);
    /** @private */
    this.latitude = this.latlong.split(',')[0];
    /** @private */ 
    this.longitude = this.latlong.split(',')[1]; 
    /** @private */
    this.radius = PropertiesService.getScriptProperties().getProperty(`RADIUS`);
    /** @private */
    this.units = `mi`;
  }

  /**
   * Get Data from API
   * @private
   */
  async _GetData(keyword = `Four Tet`) {
    try {
      const pageSize = 25;
      let page = 1;
      const authString = `client_id=${this.clientID}&client_secret=${this.clientSecret}&`;

      const options = {
        'contentType': 'application/json',
        'headers': {
          'Access-Control-Allow-Origin': '*',
        },
        "muteHttpExceptions": true,
      };
      
      let url = `${this.eventsUrl}?${authString}&lat=${this.latitude}&lon=${this.longitude}&range=${this.radius}${this.units}&per_page=${pageSize}&page=${page}`; 

      const response = await UrlFetchApp.fetch(url, options);
      const firstPage = await response.getContentText();
      const responseCode = await response.getResponseCode();

      if (responseCode != 200 && responseCode != 201) throw new Error(`Response Code ${responseCode} - ${RESPONSECODES[responseCode]}`);

      const data = await JSON.parse(firstPage);
      const totalResults = data?.meta?.total;
      console.info(`Total: ${totalResults}`);
      if (totalResults == 0) {
        console.warn(`_GetData(): No results for ${keyword}`);
        return [];
      }
      let results = [];
      results.push(...await data?.events);
      const pages = Math.ceil(totalResults / pageSize);
  
      let running = pageSize;
      for (let pg = 2; pg <= pages; pg++) {
        let pgSize = pageSize;
        page = pg;
        if (totalResults - running < pageSize) pgSize = totalResults - pg;
        running += pgSize;
        
        url = `${this.eventsUrl}?${authString}&lat=${this.latitude}&lon=${this.longitude}&range=${this.radius}${this.units}&per_page=${pageSize}&page=${page}`; 

        nextPage = await UrlFetchApp.fetch(url, options).getContentText();
        let nextPageParsed = await JSON.parse(nextPage).events;
        let newEvents = nextPageParsed?.data?.events;
        results.push(...nextPageParsed);
      }
      // Log.Info("getSeatGeekData() results", results);
      return results;
    } catch (err) {
      console.error(`_GetData() failed: ${err}`);
      return 1;
    }
  }

  /**
   * Keyword Search
   * @param {string} keyword
   * @return {[string]} events
   */
  async KeywordSearch(keyword = `Four Tet`) {
    try {
      const artistList = this.GetArtistList();

      let results = [];
      await this._GetData(keyword)
        .then(async(data) => {

          console.info(`${data.length} results parsed`);
          if (data.length == 0) {
            console.warn(`No results for ${keyword}`);
            return [];
          }
          for (let i = 0; i < data.length; i++) {
            const event = data[i];
            const title = event?.title;
            const date = new Date(event.datetime_local);
            const url = event?.url;
            const venue = event?.venue?.name_v2;
            const city = event?.venue?.city;
            const address = event?.venue?.address;
            let acts = [];
            for (let index = 0; index < event?.performers?.length; index++) {
              acts.push(event.performers[index].name);
            }

            let newEvent = {
              date: date,
              title: title,
              city: city,
              venue: venue,
              url: url,
              image: "",
              acts: acts.toString(),
              address: address,
            }
            
            // Compare list of acts in this result against your list of Artists
            for (let j = 0; j < artistList.length; j++) {
              for (let index = 0; index < acts.length; index++) {
                let res = acts[index];

                if(res.toUpperCase() === artistList[j].toString().toUpperCase()) {
                  console.info(`KeywordSearch(): Found artist: ${artistList[j]}, Event: ${title}`);
                  let img = event.performers[index].image;
                  let biggerImg = img.split("huge").join("1500x2000");
                  newEvent.image = biggerImg;
                  results.push(newEvent);
                  break;
                } 
              }
              // check artist against title of this result
              // if ((title.toString().indexOf(artistList[j].toString()) > -1) || (artistList[j].toString().indexOf(title.toString()) > -1) ) {
              //   Log.Info(`searchSeatGeek() - Found a match for artist ${artistList[j]} in title: ${title}`);
              //   results.push(newEvent);
              // }
            }
          }
        });
      return results;
    } catch (err) {
      console.error(`KeywordSearch() failed: ${err}`);
      return 1;
    }
  }

  async SearchAllArtists(artists = []) {
    artists = artists ? artists : this.GetArtistList();
    try {
      let events = [];
      artists.forEach(async(artist) => {
        const result = await this.KeywordSearch(artist);

        // let filteredEventsArr = filterNewEvents(results, existingEvents);
        // console.info(`Trigger() - SeatGeek: New Events ${filteredEventsArr}`);

        this.WriteEventToSheet(result); 

        // Write Calendar Event for new events
        // if (Config.CREATE_CALENDAR_EVENTS) createCalEvents(results);
        
        events.push(result);
      });
      return events;
    } catch(err) {
      console.error(`Trigger() failed : ${err}`);
      return 1;
    }
  }

  async Main(artists = []) {
    try {
      let events = [];
      artists.forEach(async (artist) => {
        await this.KeywordSearch(artist).then(data => {
          for (let i = 0; i < data.length; i++) {
            events.push({
              date: data[i].date,
              title: data[i].title,
              city: data[i].city,
              venue: data[i].venue, 
              url: data[i].url, 
              image: data[i].image,
              acts: data[i].acts.toString(),
              address: data[i].address,
            });
          }
        })
        Utilities.sleep(100);
      });
      return events;
    } catch(err) {
      console.error(`Main() failed : ${err}`);
      return 1;
    }
  }

  /**
   * Get Artist List
   * @private
   */
  GetArtistList() {
    try {
      let artists = GetColumnDataByHeader(SHEETS.Artists, ARTISTSHEETHEADERNAMES.artists);
      if (artists.length < 1) throw new Error(`Unable to retrieve a list of artists`);
      return artists;
    } catch(err) {
      console.error(`'GetArtistList()' failed : ${err}`);
      return 1;
    }
  }

   /**
   * Build an Array of Events
   * @private
   */
  GetExistingEvents() {
    try {
      let lastRow = SHEETS.Events.getLastRow();
      let events = [];
      let ordered = [];
      if (lastRow <= 1) throw new Error(`No events found- unable to build array of Events`);
      for (let i = 2; i < lastRow; i++) {
        let rowData = GetRowData(SHEETS.Events, i);
        let { date } = rowData;
        events[date] = rowData;
      }

      // Sort by key, which is the date
      ordered = Object.keys(events)
        .sort()
        .reduce((obj, key) => { 
          obj[key] = events[key]; 
          return obj;
        },[]
      );
      return ordered;
    } catch(err) {
      console.error(`"BuildEventsArray()" failed: ${err}`);
      return 1;
    }
  }

   /**
   * Write Single Event To Sheet
   * @private
   */
  WriteEventToSheet(event) {
    try {
      console.info(`Writing Event to Sheet..`);
      const sheetHeaderNames = SHEETS.Events.getRange(1, 1, 1, SHEETS.Events.getMaxColumns()).getValues()[0];
      let values = [];
      Object.entries(event).forEach(kvp => {
        const headername = EVENTSHEETHEADERNAMES[kvp[0]];
        const index = sheetHeaderNames.indexOf(headername);
        // console.info(`HEADERNAME: ${headername}, idx: ${index}, KVP: ${kvp[0]}, VALUE: ${kvp[1]}`);
        values[index] = kvp[1];
      });
      // console.info(`Values: ${values}`);
      SHEETS.Events.appendRow(values);
      return 0;
    } catch (err) {
      console.error(`WriteEventToSheet() failed: ${err}`);
      return 1;
    }
  }
}

const _testSeatGeek = async () => {
  const sf = new SeatGeekFactory();
  await sf.SearchAllArtists();
} 



