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
    this.url = `https://api.seatgeek.com/`;
    /** @private */
    this.eventsUrl = `${this.url}/events`;
    /** @private */
    this.clientID = PropertiesService.getScriptProperties().getProperty(`SEATGEEK_CLIENT_ID`);
    /** @private */
    this.clientSecret = PropertiesService.getScriptProperties().getProperty(`SEATGEEK_CLIENT_SECRET`);
    /** @private */
    this.latitude = PropertiesService.getScriptProperties().getProperty(`LATITUDE`);
    /** @private */ 
    this.longitude = PropertiesService.getScriptProperties().getProperty(`LONGITUDE`); 
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
      const authString = `client_id=${this.clientID}&client_secret=${this.clientSecret}`;
      let baseUrl = `${this.eventsUrl}?${authString}&lat=${this.latitude}&lon=${this.longitude}&range=${this.radius}${this.units}`;

      const params = {
        "method" : "GET",
        "content-Type" : 'application/json',
        "headers" : {
          "Access-Control-Allow-Origin" : '*',
        },
        "muteHttpExceptions" : true,
      }

      const fetchPage = async(page = 0) => {
        const url = `${baseUrl}&per_page=${pageSize}&page=${page}`;
        const response = await UrlFetchApp.fetch(url, params);
        const code = response.getResponseCode();
        if (![200, 201].includes(code)) {
          throw new Error(`HTTP ${code}: ${RESPONSECODES[code] || "Unknown error"}`);
        }
        return JSON.parse(response.getContentText());
      }
      
      const firstPage = await fetchPage(page);
      const total = firstData?.meta?.total || 0;
      if (total < 1) throw new Error(`_GetData(): No results for ${keyword}`);

      const results = [...(firstData.events || [])];
      const totalPages = Math.ceil(total / pageSize);

      for(page = 2; page <= totalPages; page++) {
        const nextData = await fetchPage(page);
        results.push(...(nextData.events || []));
      }

      console.info(`Fetched ${results.length} events for "${keyword}"`);
      return results;
    } catch (err) {
      console.error(`_GetData() failed: ${err}`);
      return [];
    }
  }

  /**
   * Keyword Search
   * @param {string} keyword
   * @return {[string]} events
   */
  async KeywordSearch(keyword = `Four Tet`) {
    try {
      const artistList = this.GetArtists().map(a => a.toUpperCase());
      const data = await this._GetData(keyword);
      if (!Array.isArray(data) || data.length === 0) {
        console.warn(`No results found for keyword "${keyword}".`);
        return [];
      }

      console.info(`Parsing ${data.length} results for keyword "${keyword}".`);
      const results = [];

      for (const event of data) {
        const title = event?.title ?? '';
        const date = new Date(event?.datetime_local);
        const url = event?.url ?? '';
        const venue = event?.venue?.name_v2 ?? '';
        const city = event?.venue?.city ?? '';
        const address = event?.venue?.address ?? '';
        const performers = event?.performers || [];

        const acts = performers.map(p => p.name);
        const upperActs = acts.map(name => name.toUpperCase());

        // Match any act to known artist list
        const matchedIndex = upperActs.findIndex(act => artistList.includes(act));
        if (matchedIndex === -1) continue;

        const image = performers[matchedIndex]?.image?.replace('huge', '1500x2000') || '';

        results.push({
          title,
          date,
          city,
          venue,
          url,
          image,
          acts: acts.join(', '),
          address,
        });

        console.info(`Matched artist "${acts[matchedIndex]}" in event "${title}".`);
      }

      console.info(`KeywordSearch() → ${results.length} matching events found.`);
      return results;
    } catch (err) {
      console.error(`KeywordSearch() failed: ${err}`);
      return [];
    }
  }

  /**
   * Search All Artists
   * @param {Array} artists
   * @returns {Array} events
   */
  async SearchAllArtists(artists = []) {
    try {
      artists = artists ? artists : this.GetArtists();
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

  /**
   * Main Entry Point
   * @returns {Array} events
   */
  async Main() {
    try {
      let events = [];
      const artists = this.GetArtists();
      artists.forEach(async (artist) => {
        await this.KeywordSearch(artist).then(data => {
          console.info(data);
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
  GetArtists() {
    try {
      let input = SheetService.GetColumnDataByHeader(SHEETS.Artists, ARTIST_SHEET_HEADERNAMES.artists);
      let artists = Array.isArray(input) ? input : [];

      let filtered = artists
        .filter(Boolean)
        .filter(artist => typeof artist === 'string' && artist.trim() !== '')  // Ensure valid strings
        .filter(artist => !ARTISTS_TO_IGNORE.includes(artist));                // Exclude ignored artists

      if (filtered.length < 1) return [];
      let singular = [...new Set(filtered)].sort();
      return singular;
    } catch(err) {
      console.error(`"GetArtists()" failed : ${err}`);
      return 1;
    }
  }

   /**
   * Build an Array of Events
   * @private
   */
  _GetExistingEvents() {
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
      console.error(`"_GetExistingEvents()" failed: ${err}`);
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
        const headername = EVENT_SHEET_HEADERNAMES[kvp[0]];
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
  // sf.GetArtists();
  await sf.Main();
} 



