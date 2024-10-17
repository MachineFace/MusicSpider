/**
 * ----------------------------------------------------------------------------------------------------------------
 * Resident Advisor Factory
 */
class ResidentAdvisorFactory {
  constructor() {
    /** @private */
    this.url = `https://ra.co/graphql`;
    /** @private */
    this.region = PropertiesService.getUserProperties().getProperty(`RA_REGION`);
    /** @private */
    this.pageSize = 18;
    /** @private */
    this.pageLimit = 5000;
  }

  /**
   * @private
   */
  _BuildQuery(pageSize = 18, page = 1) {
    return `query GET_EVENT_LISTINGS($filters: FilterInputDtoInput, $filterOptions: FilterOptionsInputDtoInput, $page: Int, $pageSize: Int) {
      eventListings(filters: $filters, filterOptions: $filterOptions, pageSize: ${pageSize}, page: ${page}) {
        data {
          id 
          event {
            date 
            startTime 
            endTime 
            title 
            contentUrl 
            attending 
            images {
              id 
              filename 
            } 
            venue {
              id 
              name 
              address
              contentUrl 
            } 
          } 
        } 
        totalResults 
      }
    }`;
  }

  /**
   * Get Payload
   * @private
   */
  _GetPayload(page = 1, query = RA_QUERY_EVENT_LISTINGS) {
    let now = new Date();
    let today = Utilities.formatDate(now, `PST`, `yyyy/MM/dd`)
    let plusMonths  = Utilities.formatDate(new Date(now.setMonth(now.getMonth() + 6)), `PST`, `yyyy/MM/dd`);
    const payload = JSON.stringify({
      query : query, 
      variables : {
        filters : {
          areas : this.region,
          listingDate : { 
            gte : today, 
            lte : plusMonths,
          },
          // 'event': {'title': 'Playxland: Trans Pride Beach Party!' },
          // 'artists': { 
          //   'name' : name, 
          // },
          listingPosition : 1,
        },
        pageSize : 18,      // max the API will allow seems to be 18
        page : page,
      },
    });
    return payload;
  }

  /**
   * Send fetch requests to Resident Advisor - multiple if getting all pages
   * Returns each event combined in one array
   * @private
   * @returns {array} results [{eventdata}, {eventdata}...]
   */
  async GetData() {
    try { 
      let results = [];
      let totalResults = 0;

      let options = {
        method : 'POST',
        muteHttpExceptions : true,
        headers : {
          'Content-Type' : 'application/json', 
          'Accept' : 'application/json',
          'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
          // 'referer' : 'https://ra.co/events/us/bayarea',
        },
        payload : this._GetPayload(1, RA_QUERY_EVENT_LISTINGS),
      };
      
      const response = await UrlFetchApp.fetch(this.url, options);
      const responseCode = response.getResponseCode();
      if (responseCode != 200 && responseCode != 201) throw new Error(`Response Code ${responseCode} - ${RESPONSECODES[responseCode]}`);

      let data = await JSON.parse(response.getContentText());
      let parsed = data?.data?.eventListings?.data;
      results.push(...parsed);

      totalResults = data.data.eventListings.totalResults;
      if(totalResults > this.pageLimit) totalResults = this.pageLimit;
      console.info(`TOTAL RESULTS: ${totalResults}`);
      let pageLimit = Math.ceil(totalResults / this.pageSize);

      for(let page = 2; page <= pageLimit; page++) {
        options.payload = this._GetPayload(page, RA_QUERY_EVENT_LISTINGS)
        // const options = this._GetOptions(page, RA_QUERY_EVENT_LISTINGS);
        const nextPage = await UrlFetchApp.fetch(this.url, options).getContentText();
        let parsed = {};
        if(nextPage) parsed = JSON.parse(nextPage);
        const nextPageParsed = parsed?.data?.eventListings?.data;
        results.push(...nextPageParsed);
      }
      console.info(JSON.stringify(results, null, 2));
      return results;
    } catch (err) {
      console.error(`GetData() failed: ${err}`);
      return [];
    }
  }

  /**
   * Searches the results to return only events that match artists in your list
   */
  async ParseResults() {
    try {
      let results = {};
      const listings = await this.GetData();
      listings.forEach(listing => {
        const event = listing?.event;
        if(!event) return;
        let { date, startTime, endTime, title, contentUrl, images, venue, } = event;
        const id = IDService.createId();
        title = title ? title : `Untitled Event`;
        date = new Date(date) ? new Date(date) : new Date();
        let venueName = venue.name ? venue.name : `Unknown Venue`;
        let url = `https://ra.co${contentUrl}` ? `https://ra.co${contentUrl}` : `https://ra.co/`;
        let imageUrl = images[0]?.filename;
        let address = venue.address ? venue.address : `Unknown Location`;
        let city = ExtractCityFromAddress(address) ? ExtractCityFromAddress(address) : `Unknown City`;
        let acts = `Unknown Artists`;
        
        const eventData = {
          id : id,
          title: title,
          date: date,
          city: city,
          venue: venueName, 
          url: url, 
          image: imageUrl,
          acts: acts,
          address: address,
        }
        results[id] = eventData;
        console.info(JSON.stringify(eventData, null, 3));
      });
      return results;
    } catch (err) {
      console.error(`"ParseResults()" failed : ${err}`);
      return [];
    }
  }

  /**
   * Filter list of new events to exclude ones that already exist on the Events Sheet
   * @private
   * @param {array} newArray list of new results
   * @param {array} existingArray list of existing events
   * @param {string} name parameter "eName" in quotes
   * @param {string} venue parameter "venue" in quotes
   * @param {string} date parameter "date" in quotes
   * @param {string} url parameter "url" in quotes
   * @returns {array} [{}]
   */
  FilterNewEvents(newArray = {}, existingArray = {}, name = ``, venue = ``, date = new Date(), url = ``) {
    try {
      // Helper function to extract and normalize fields from event objects
      const normalizeEvent = (event, nameKey, venueKey, dateKey, urlKey) => {
        return {
          name: event[nameKey]?.toString().toUpperCase(),
          venue: event[venueKey]?.toString().toUpperCase(),
          date: new Date(event[dateKey]),
          url: event[urlKey]?.toString().toUpperCase()
        };
      };

      // Convert existingArray entries to a map for faster lookup by URL
      const existingMap = new Map(Object.entries(existingArray).map(([key, value]) => {
        const normalized = normalizeEvent(value, name, venue, date, url);
        return [normalized.url, normalized];
      }));

      // Filter out new events that already exist in the existingArray
      const filtered = Object.entries(newArray).filter(([key, value]) => {
        const newEvent = normalizeEvent(value, name, venue, date, url);
        
        // Check by URL first for quick match
        const existingEvent = existingMap.get(newEvent.url);

        if (existingEvent) return false;

        // Check for similar name, venue, and date if URL doesn't match
        for (const [, existingEvent] of existingMap) {
          const nameMatch = newEvent.name.includes(existingEvent.name) || existingEvent.name.includes(newEvent.name);
          const venueMatch = newEvent.venue === existingEvent.venue;
          const dateMatch = newEvent.date.getTime() === existingEvent.date.getTime();

          if (nameMatch && venueMatch && dateMatch) return false;
        }

        return true; // This is a new event
      });
      console.info(`New Events: ${JSON.stringify(filtered, null, 3)}`);
      return filtered;
    } catch(err) {
      console.error(`"FilterNewEvents()" failed: ${err}`);
      return 1;
    }
  }

  /**
   * Get Artist List
   * @private
   */
  GetArtistList() {
    try {
      let artists = GetColumnDataByHeader(SHEETS.Artists, ARTIST_SHEET_HEADERNAMES.artists);
      if (artists.length < 1) throw new Error(`Unable to retrieve a list of artists`);
      return artists;
    } catch(err) {
      console.error(`'GetArtistList()' failed : ${err}`);
      return 1;
    }
  }


  /**
   * Main handler function for Resident Advisor API
   * Reaches out to RA API to get results, 
   * @param {array} artistsArr the array of artists in the Artists List sheet
   */
  async Main() {
    try {
      // const events = await this.GetExistingEvents();
      const results = await this.ParseResults();

      // let filteredEvents = this.FilterNewEvents(results, events, "title", "venue", "date", "url");
      // console.info(`Resident Advisor: ${filteredEvents}`);
      // results.forEach(event => this.WriteEventToSheet(event));

      // Object.entries(results).forEach(event => {
        // console.info(event[1]);
        // this.WriteEventToSheet(event[1]);
      // });
      
    } catch (err) {
      console.error(`SearchRAMain() failed: ${err}`);
      return [];
    }
  }



  /**
   * Write Single Event To Sheet
   * @private
   */
  WriteEventToSheet(event) {
    try {
      console.info(`Writing Event to Sheet..`);
      const sheet = SHEETS.Events;
      const sheetHeaderNames = sheet.getRange(1, 1, 1, sheet.getMaxColumns()).getValues()[0];
      let values = [];
      Object.entries(event).forEach(([key, value], idx) => {
        const headername = EVENT_SHEET_HEADERNAMES[key];
        const index = sheetHeaderNames.indexOf(headername);
        // console.info(`HEADERNAME: ${headername}, idx: ${index}, KEY: ${key}, VALUE: ${value}`);
        values[index] = value;
      });
      sheet.appendRow(values);
      return 0;
    } catch (err) {
      console.error(`WriteEventToSheet() failed: ${err}`);
      return 1;
    }
  }

  /**
   * Build an Array of Events
   * @private
   */
  GetExistingEvents() {
    try {
      const sheet = SHEETS.Events;
      const lastRow = sheet.getLastRow();
      if (lastRow < 1) throw new Error(`No events found- unable to build array of Events`);
      let events = {};
      for (let row = 2; row < lastRow; row++) {
        const rowData = GetRowData(sheet, row);
        const { id } = rowData;
        events[id] = rowData;
      }
      return events;
    } catch(err) {
      console.error(`"GetExistingEvents()" failed: ${err}`);
      return 1;
    }
  }

}





const _testRA = () => {
  const ra = new ResidentAdvisorFactory();
  ra.Main();
  // ra.GetExistingEvents();
}



//  * ----------------------------------------------------------------------------------------------------------------

// /**
//  * 
//  */
// /**
//  * Send fetch requests to Resident Advisor - multiple if getting all pages
//  * Returns each event combined in one array
//  * @param {string} area which page of results to fetch
//  * @param {boolean} getAllPages if false will only return 1 page (18 results max)
//  * @returns {array} results [{eventdata}, {eventdata}...]
//  */
// const getRAData = (area = 218, getAllPages = true) => {
//   const pageSize = 18; // 18 is teh max number of results RA will send in one page
//   let page = 1;
//   let running = 0;
//   const url = `https://ra.co/graphql`;

//   let results = new Array();
//   try {
//     // build the headers for the fetch request
//     let options = returnRAOptions(page, area, queryRAEventListings);
//     // Fetch from the API
//     let response = UrlFetchApp.fetch(url, options);
//     let firstPage = response.getContentText();
//     let responseCode = response.getResponseCode();
//     Log.Info(`Response Code ${responseCode} - ${RESPONSECODES[responseCode]}`);
//     // If response is good
//     if (responseCode == 200 || responseCode == 201) {
//       // Log.Debug("results", JSON.parse(firstPage));
//       let data = JSON.parse(firstPage);
//       let newData = data.data.eventListings;
//       let totalResults = newData.totalResults;
//       results.push(...newData.data);
//       // Return only one page if that's what's asked for
//       if (!getAllPages) {
//         return results;
//       }
//       Logger.log(
//         "getRAData() - Total results according to API: " + totalResults
//       );
//       running = pageSize;
//       for (let pg = 2; pg <= Math.ceil(totalResults / pageSize); pg++) {
//         let pgSize = pageSize;
//         page = pg;
//         let options = returnRAOptions(page, area);
//         if (totalResults - running < pageSize) pgSize = totalResults - pg;
//         running += pgSize;
//         nextPage = UrlFetchApp.fetch(url, options).getContentText();
//         let nextPageParsed = JSON.parse(nextPage).data.eventListings.data;
//         results.push(...nextPageParsed);
//       }
//       Log.Debug("results", results);
//       return results;
//     } else {
//       throw new Error(
//         `response code ${responseCode} - ${RESPONSECODES[responseCode]}`
//       );
//     }
//   } catch (err) {
//     Log.Error(`getRAData() - Failed to get data from ${url} - ${err}`);
//     return [];
//   }
// };

// /**
//  * ----------------------------------------------------------------------------------------------------------------
//  * Returns the headers and variables formatted for the API fetch request
//  * @param {string} page which page of results to fetch
//  * @param {string} area which locality to search in (see list in resAdv_enums)
//  * @param {string} theQuery optional, defaults to queryRAEventListings if not provided
//  * @returns {object} options {filters:{...}, pageSize, page}
//  */
// const returnRAOptions = (page, area, theQuery = queryRAEventListings) => {
//   let today = new Date();
//   let date = Utilities.formatDate(today, "PST", "yyyy/MM/dd");
//   let addTime = new Date(today.setMonth(today.getMonth() + 8));
//   let nextYear = Utilities.formatDate(addTime, "PST", "yyyy/MM/dd");
//   let variables = {
//     filters: {
//       areas: { eq: area },
//       // "id": 1731004,
//       // "addressRegion":"San Francisco/Oakland",
//       listingDate: { gte: date, lte: nextYear },
//       // "event": {"title": "Playxland: Trans Pride Beach Party!" },
//       //"artists": { "name": "Four Tet" },
//       listingPosition: { eq: 1 },
//     },
//     pageSize: 18, //max the API will allow seems to be 18
//     page: page,
//   };

//   let query = {
//     query: theQuery,
//     variables: variables,
//   };
//   const headers = {
//     "Content-Type": "application/json",
//     Accept: "application/json",
//     "User-Agent":
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
//     // "referer": "https://ra.co/events/us/bayarea",
//   };
//   let options = {
//     muteHttpExceptions: true,
//     headers: headers,
//     payload: JSON.stringify(query),
//     method: "POST",
//   };
//   return options;
// };

// /**
//  * ----------------------------------------------------------------------------------------------------------------
//  * Searches the results to return only events that match artists in your list
//  * @param {array} artistList
//  */
// const searchRA = (artistList) => {
//   // Create array for new event matches
//   let results = new Array();
//   try {
//     // Fetch all Resident Advisor events in the next 8 months in your region
//     let listings = getRAData(Math.floor(Config.regionRA()));
//     Logger.log("searchRA() - TOTAL events parsed: " + listings.length);
//     // Run through each result to see if they match any artists in the Artist Sheet
//     for (let i = 0; i < listings.length; i++) {
//       let listing = listings[i]?.event;
//       // Log.Debug("RA Listing", listing);

//       if (listing) {
//         let acts = [];
//         // if there are artists listed, create an array with their names
//         // (most of RA events don't seem to have artists listed here though)
//         let artists = listing.artists ? listing.artists : [];
//         if (artists.length > 0) {
//           for (let index = 0; index < artists.length; index++) {
//             acts.push(artists[index].name);
//           }
//         }
//         const shouldAddEvent = acts.some((act) => artistList.includes(act));
//         if (shouldAddEvent) {
//           const title = listing.title ? listing.title : "";
//           console.warn(
//             `Match for: ${acts.filter((element) =>
//               artistList.includes(element)
//             )}, Event name: ${title}`
//           );
//           const venue = listing.venue.name ? listing.venue.name : "";
//           // let images = listing?.images;
//           const imageUrl = listing.images[0]?.filename
//             ? listing.images[0].filename
//             : "";
//           const contentUrl = listing.contentUrl
//             ? `https://ra.co${listing.contentUrl}`
//             : "";
//           const address = listing.venue.address ? listing.venue.address : "";

//           let event = {
//             date: Utilities.formatDate(
//               new Date(listing.startTime),
//               "PST",
//               "yyyy/MM/dd HH:mm"
//             ),
//             eName: title,
//             city: "",
//             venue: venue,
//             url: contentUrl,
//             image: imageUrl,
//             acts: acts.toString(),
//             address: address,
//           };

//           results.push(event);
//         }
//       }
//     }
//     //Log.Info(JSON.stringify(results));
//     if (results.length > 0) results = CommonLib.arrayRemoveDupes(results);
//     return results;
//   } catch (err) {
//     Log.Error(`searchRA() error - ${err}`);
//     return [];
//   }
// };

// /**
//  * ----------------------------------------------------------------------------------------------------------------
//  * Main handler function for Resident Advisor API
//  * Reaches out to RA API to get results,
//  * @param {array} artistsArr the array of artists in the Artists List sheet
//  */
// const searchRAMain = (artistsArr) => {
//   let newEvents = {};

//   if (Config.searchRA()) {
//     try {
//       // Get list of artists from Artists Sheet
//       if (!artistsArr) artistsArr = artistsList();
//       // Get existing list of events from events sheet
//       const existingEvents = buildEventsArr();
//       // returns events that match your artists
//       const results = searchRA(artistsArr);
//       // run function that filters out results that are already on the events sheet
//       newEvents = filterDupeEvents(results, existingEvents);
//       let altEvents = filterAltEvents(results, existingEvents);

//       Log.Debug("New RA Events", newEvents);

//       return { newEvents: newEvents, altEvents: altEvents };
//     } catch (err) {
//       Log.Error(`searchRAMain () error - ${err}`);
//       return [];
//     }
//   } else
//     Log.Info(
//       "searchRAMain() started but Music Spider is not configured to search Resident Advisor. Skipping."
//     );
// };
