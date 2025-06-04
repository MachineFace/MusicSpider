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
      let page = 1;

      const pageSize = 25;
      const authString = `client_id=${this.clientID}&client_secret=${this.clientSecret}`;
      const baseUrl = `${this.eventsUrl}?${authString}&lat=${this.latitude}&lon=${this.longitude}&range=${this.radius}${this.units}`;

      // Fetch Function
      async function FetchPage(page = 0) {
        const url = `${baseUrl}&per_page=${pageSize}&page=${page}`;
        const params = {
          "method" : "GET",
          "content-Type" : 'application/json',
          "headers" : {
            "Access-Control-Allow-Origin" : '*',
          },
          "muteHttpExceptions" : true,
        }
        const response = await UrlFetchApp.fetch(url, params);
        const code = response.getResponseCode();
        if (![200, 201].includes(code)) {
          throw new Error(`HTTP ${code}: ${RESPONSECODES[code] || "Unknown error"}`);
        }
        return JSON.parse(response.getContentText());
      }
      
      const firstPage = await FetchPage(page);
      const total = firstPage?.meta?.total || 0;
      if (total < 1) {
        console.info(`_GetData(): No results for ${keyword}`);
        return []
      }

      const results = [...(firstPage.events || [])];
      const totalPages = Math.ceil(total / pageSize);

      for(page = 2; page <= totalPages; page++) {
        const nextData = await FetchPage(page);
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
   * Standardize Address
   * Split addresses at the first comma or semicolon and replace 'St.' or 'Street' with 'St'
   * Returns something like: 1290 Sutter Street
   * This reduces false negatives if Ticketmaster shows CA but another shows it as California
   * @param {string} address
   * @returns {string} standardized address
   * @private
   */
  StandardizeAddress(address = ``) {
    try {
      if(!address) throw new Error(`Missing address.`);
      return address
        .replace(/(Avenue|Ave[.]?)/g, "Ave")
        .replace(/(Street|St[.]?)/g, "St")
        .replace(/(Drive|Dr[.]?)/g, "Dr")
        .replace(/(Road|Rd[.]?)/g, "Rd");
    } catch(err) {
      console.error(`"StandardizeAddress()" failed: ${err}`);
      return 1;
    }
  }

  /**
   * Compare 2 Events
   * @param {Object} event A
   * @param {Object} event B
   * @param {number} threshold (0 to 1)
   * @returns {Object} comparison
   */
  CompareEvents(eventA = {}, eventB = {}, threshold = 0.66) {
    try {

      // Event A
      const { title: titleA, venue: venueA, date: dateA, url: urlA, acts: actsA, } = eventA;

      // Event B
      const { title: titleB, venue: venueB, date: dateB, url: urlB, acts: actsB, row: rowB } = eventB;

      // Step 1: Date Comparison
      const d1 = Utilities.formatDate(new Date(dateA), "PST", "yyyy/MM/dd");
      const d2 = Utilities.formatDate(new Date(dateB), "PST", "yyyy/MM/dd");
      const dateScore = Common.ScoreStringSimilarity(d1, d2);
      const dateThreshold = dateScore > threshold;

      // Step 2: Compare URLs
      const urlScore = Common.ScoreStringSimilarity(urlA, urlB);         // > 0.66
      const urlThreshold = urlScore >= 0.95;

      // Step 3: Compare Venue Names
      const venueScore = Common.ScoreStringSimilarity(venueA, venueB);   // > 0.5;
      const venueThreshold = venueScore > threshold;

      // Step 4: Compare Event Titles
      const titleScore = Common.ScoreStringSimilarity(titleA, titleB);   // > 0.66;
      const titleThreshold = titleScore > threshold;

      // Step 5: Compare Acts
      const actScore = Common.ScoreStringSimilarity(actsA, actsB);       // > 0.66;
      const actsThreshold = actScore > threshold;

      // Step 6: Average Weights
      const average = StatisticsService.ArithmeticMean([ titleScore, dateScore, actScore, venueScore, urlScore, ]);
      const verdict = average > threshold;
      // console.info(`
      //   TitleA: ${titleA} -----> TitleB: ${titleB} -----> Score: ${titleScore},
      //   DateA: ${dateA}   -----> DateB:  ${dateB}  -----> Score ${dateScore}, 
      //   ActsA: ${actsA}   -----> ActsB:  ${actsB}  -----> Score: ${actScore}, 
      //   VenueA: ${venueA} -----> VenueB: ${venueB} -----> Score: ${venueScore},
      //   Average Score: (${average}) > Threshold (${threshold}) = ${verdict},
      // `);

      return {
        dateScore : dateScore,
        dateThreshold : dateThreshold,
        urlScore : urlScore,
        urlThreshold : urlThreshold,
        venueScore : venueScore,
        venueThreshold : venueThreshold,
        titleScore : titleScore,
        titleThreshold : titleThreshold,
        actScore : actScore,
        actsThreshold : actsThreshold,
        averageScore: average,
        verdict : verdict,
        row: rowB,
      }

    } catch (err) {
      console.error(`"CompareEvents()" failed: ${err}`);
      return {}; 
    }
  }

  /**
   * Filter list of new events to exclude ones that already exist on the Events Sheet
   * Either:
   *  A. URLs are the same OR
   *  B. the event NAMES, ADDRESSES, and DATES are the same
   * In the case of B, it will add the URL to the URL2 column so one can choose from multiple ticket vendors
   * @param {Array} newArray list of new results
   * @param {Array} existingArray list of existing events
   * @returns {Array} the filtered array
   */
  ScoreEventSimilarity(existingEvents = [], event = {}) {
    try {
      const threshold = 0.66;
      // Event A
      const { title: titleA, venue: venueA, date: dateA, url: urlA, acts: actsA, } = event;

      for (const existingEvent of existingEvents) {
        // Event B
        const { title: titleB, venue: venueB, date: dateB, url: urlB, acts: actsB, } = existingEvent;

        // Step 1: Date Comparison
        const d1 = Utilities.formatDate(new Date(dateA), "PST", "yyyy/MM/dd");
        const d2 = Utilities.formatDate(new Date(dateB), "PST", "yyyy/MM/dd");
        const dateScore = Common.ScoreStringSimilarity(d1, d2);
        if(dateScore < 0.05) continue;  // Early Exit if dates aren't even close

        // Step 2: Compare URLs
        const urlScore = Common.ScoreStringSimilarity(urlA, urlB);         // > 0.66
        if(urlScore >= 0.95) return { row: existingRow, score: urlScore };  // Early return if the url is above 80% match

        // Step 3: Compare Venue Names
        const venueScore = Common.ScoreStringSimilarity(venueA, venueB);   // > 0.5;
        if(venueScore < 0.05) continue;

        // Step 4: Compare Event Titles
        const titleScore = Common.ScoreStringSimilarity(titleA, titleB);   // > 0.66;

        // Step 5: Compare Acts
        const actScore = Common.ScoreStringSimilarity(actsA, actsB);       // > 0.66;

        // Step 6: Average Weights
        const average = StatisticsService.ArithmeticMean([ titleScore, dateScore, actScore, venueScore, urlScore, ]);
        const verdict = average > threshold;
        console.info(`
          TitleA: ${titleA} -----> TitleB: ${titleB} -----> Score: ${titleScore},
          DateA: ${dateA}   -----> DateB:  ${dateB}  -----> Score ${dateScore}, 
          ActsA: ${actsA}   -----> ActsB:  ${actsB}  -----> Score: ${actScore}, 
          VenueA: ${venueA} -----> VenueB: ${venueB} -----> Score: ${venueScore},
          urlA: ${urlA}     -----> urlB: ${urlB}.    -----> Score: ${urlScore},
          Average Score: (${average}) > Threshold (${threshold}) = ${verdict}, 
        `);
        if(verdict) return { row: existingRow, score: average };
      }
      return false;
    } catch (err) {
      console.error(`"ScoreEventSimilarity()" failed: ${err}`);
      return []; 
    }
  }

  /**
   * Score All Events
   */
  ScoreAllEvents(event = {}) {
    try {
      let scores = [];
      const events = this.GetExistingEvents(SHEETS.Events);
      for(const eventB of events) {
        const compare = this.CompareEvents(event, eventB);
        // console.info(JSON.stringify(compare, null, 2));
        scores.push(compare);
      }
      return scores;
    } catch (err) {
      console.error(`"ScoreAllEvents()" failed: ${err}`);
      return []; 
    }
  }
  

  /**
   * Filters events from newArray that share Date, Address, Name, and Venue with events in existingArray.
   * @param {Array} newArray - The array of new events to filter.
   * @param {Array} existingArray - The array of existing events to compare against.
   * @returns {Array} The filtered array of alternate events.
   *
  const filterAltEvents = (newArray, existingArray) => {
    try {
      console.info("filterAltEvents() starting");
      // Ensure inputs are arrays
      if (!Array.isArray(newArray) || !Array.isArray(existingArray)) {
        throw new Error("Both newArray and existingArray must be arrays.");
      }

      let alternates = newArray.filter((aItem) => {
        // console.info('aItem');
        // console.info(aItem);
        try {
          return existingArray.find((bItem) => {
            // console.info('bItem');
            // console.info(bItem);
            // Extract and format dates
            let aDate = "";
            let bDate = "";
            try {
              aDate = aItem["date"]
                ? Utilities.formatDate(
                    new Date(aItem["date"]),
                    "PST",
                    "yyyy/MM/dd"
                  )
                : "";
              bDate = bItem["date"]
                ? Utilities.formatDate(
                    new Date(bItem["date"]),
                    "PST",
                    "yyyy/MM/dd"
                  )
                : "";
            } catch (error) {
              Logger.log(`Error formatting date: ${error.message}`);
              return false; // Skip comparison if date formatting fails
            }
            let datesEqual = aDate === bDate;

            let aName = aItem["eName"] ? aItem["eName"].toString().trim() : "";
            let bName = bItem["eName"] ? bItem["eName"].toString().trim() : "";
            // Compare acts
            let aActs = aItem["acts"]
              ? CommonLib.sortArrayAlpha(
                  aItem["acts"].toString().split(",")
                ).join()
              : "";
            let bActs = bItem["acts"]
              ? CommonLib.sortArrayAlpha(
                  bItem["acts"].toString().split(",")
                ).join()
              : "";
            // console.info(`aActs: ${aActs}`);
            // console.info(`bActs: ${bActs}`);
            let actsScore = CommonLib.stringSimilarity(aActs, bActs) > 0.6;

            // Compare addresses
            let aAddress = aItem["address"]
              ? aItem["address"].toString().trim().toUpperCase()
              : "";
            let bAddress = bItem["address"]
              ? bItem["address"].toString().trim().toUpperCase()
              : "";
            let aAddressFiltered = filterAddress(aAddress.split(/[s,s;]+/)[0]);
            let bAddressFiltered = filterAddress(bAddress.split(/[s,s;]+/)[0]);
            // console.info(`aAddress: ${aAddress}`);
            // console.info(`bAddress: ${bAddress}`);
            let addressScore =
              CommonLib.stringSimilarity(aAddressFiltered, bAddressFiltered) >
              0.5;

            // Compare venue names
            let aVenue = aItem["venue"]
              ? aItem["venue"].toString().trim().toUpperCase()
              : "";
            let bVenue = bItem["venue"]
              ? bItem["venue"].toString().trim().toUpperCase()
              : "";
            // console.info(`aVenue: ${aVenue}`);
            // console.info(`bVenue: ${bVenue}`);
            let venueScore = CommonLib.stringSimilarity(aVenue, bVenue) > 0.5;

            // Compare URLs
            let aUrl = aItem["url"]
              ? aItem["url"].toString().trim().toUpperCase()
              : "";
            let bUrl = bItem["url"]
              ? bItem["url"].toString().trim().toUpperCase()
              : "";
            // console.info(`aUrl: ${aUrl}`);
            // console.info(`bUrl: ${bUrl}`);
            let urlsEqual = aUrl === bUrl;
            // Logger.log(`Comparing events - URLs Equal: ${urlsEqual},
            // Act Score: ${actsScore}, Date Score: ${datesEqual},
            // Address Score: ${addressScore}, Venue Score: ${venueScore}`);
            Log.Debug(
              `existing: ${aName}, new: ${bName}, urlsEqual: ${urlsEqual}, actScore: ${actsScore}, dateScore: ${datesEqual}, addressScore: ${addressScore}, venueScore: ${venueScore}`
            );

            return (
              !urlsEqual &&
              actsScore &&
              datesEqual &&
              (addressScore || venueScore)
            );
          });
        } catch (error) {
          Logger.log(`Error comparing events: ${error.message}`);
          return false; // Skip this item in case of any comparison errors
        }
      });
      Log.Debug(
        "filterAltEvents() exist but are from a different vendor",
        alternates
      );

      return alternates;
    } catch (error) {
      Logger.log(`Error in filterAltEvents function: ${error.message}`);
      return []; // Return an empty array in case of an error
    }
  }
  */

  /**
   * Search All Artists
   * @param {Array} artists
   * @returns {Array} events
   */
  async SearchAllArtists(artists = []) {
    try {
      artists = artists ? artists : this.GetArtists();
      let events = [];
      Utilities.sleep(100);  // Wait a sec

      artists.forEach(async(artist) => {
        const result = await this.KeywordSearch(artist);
        console.info(result);
        // let filteredEventsArr = filterNewEvents(results, existingEvents);
        // console.info(`SeatGeek: New Events ${filteredEventsArr}`);

        // this.WriteEventToSheet(SHEETS.Events, result); 

        // Write Calendar Event for new events
        // if (Config.CREATE_CALENDAR_EVENTS) createCalEvents(results);
        
        events.push(result);
      });
      return events;
    } catch(err) {
      console.error(`"SearchAllArtists()" failed: ${err}`);
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
   * @param {sheet} Event Sheet
   */
  GetExistingEvents(sheet = SHEETS.Events) {
    try {
      let lastRow = sheet.getLastRow();
      if (lastRow <= 1) throw new Error(`No events found- unable to build array of Events`);

      let events = [];
      for (let row = 2; row < lastRow; row++) {
        let rowData = SheetService.GetRowData(sheet, row);
        events.push(rowData)
      }
      // console.info(events);
      return events;
    } catch(err) {
      console.error(`"GetExistingEvents()" failed: ${err}`);
      return 1;
    }
  }

   /**
   * Write Single Event To Sheet
   * @private
   */
  WriteEventToSheet(sheet = SHEETS.Events, event = {}) {
    try {
      console.info(`Writing Event to Sheet..`);
      const sheetHeaderNames = sheet.getRange(1, 1, 1, sheet.getMaxColumns()).getValues()[0];
      let values = [];
      Object.entries(event).forEach(kvp => {
        const headername = EVENT_SHEET_HEADERNAMES[kvp[0]];
        const index = sheetHeaderNames.indexOf(headername);
        // console.info(`HEADERNAME: ${headername}, idx: ${index}, KVP: ${kvp[0]}, VALUE: ${kvp[1]}`);
        values[index] = kvp[1];
      });
      // console.info(`Values: ${values}`);
      sheet.appendRow(values);
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
  // await sf.Main();
  // const existingEvents = sf.GetExistingEvents(SHEETS.Events);

  // const eventA = SheetService.GetRowData(SHEETS.Events, 19);
  // const eventB = SheetService.GetRowData(SHEETS.Events, 15);
  // const compareA = sf.CompareEvents(eventA, eventB);
  // console.info(compareA);
  // const eventC = SheetService.GetRowData(SHEETS.Events, 19);
  // const compareB = sf.CompareEvents(eventA, eventC);
  // console.info(compareB);

  // const compare = sf.ScoreEventSimilarity(existingEvents, event);

  // Score all
  const event = SheetService.GetRowData(SHEETS.Events, 19);
  const scores = sf.ScoreAllEvents(event);
  console.info(scores);
} 



