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
  }

  /**
   * Send fetch requests to Resident Advisor - multiple if getting all pages
   * Returns each event combined in one array
   * @private
   * @returns {array} results [{eventdata}, {eventdata}...]
   */
  async GetData() {
    try { 
      const pageSize = 18;
      const pageLimit = 5000;
      let page = 1;
      let running = 0;
      let totalResults;
      
      let results = [];
      let options = this._GetOptions(page, RA_QUERY_EVENT_LISTINGS);
      const response = await UrlFetchApp.fetch(this.url, options);
      const firstPage = response.getContentText();

      const responseCode = response.getResponseCode();
      if (responseCode != 200 && responseCode != 201) throw new Error(`Response Code ${responseCode} - ${RESPONSECODES[responseCode]}`);

      let data = await JSON.parse(firstPage);
      let newData = data?.data?.eventListings
      totalResults = newData.totalResults;
      results.push(...newData.data);

      console.info(`Total results: ${totalResults}`);
      if(totalResults > pageLimit) totalResults = pageLimit;
      console.info(`Total results adjusted: ${totalResults}`);

      running = pageSize;
      for(let pageIdx = 2; pageIdx <= Math.ceil(totalResults / pageSize); pageIdx++) {
        // console.info(`Page: ${pageIdx}`)
        options = this._GetOptions(pageIdx);
        const nextPage = await UrlFetchApp.fetch(this.url, options).getContentText();
        let parsed;
        if(nextPage) parsed = JSON.parse(nextPage);
        const nextPageParsed = parsed?.data?.eventListings?.data;
        results.push(...nextPageParsed);
        running += pageSize;
      }
      // console.info(results);
      return results;
    } catch (err) {
      console.error(`GetData() failed: ${err}`);
      return [];
    }
  }

  /**
   * Returns the headers and variables formatted for the API fetch request
   * @private
   * @param {string} page which page of results to fetch 
   * @param {string} theQuery optional, defaults to queryRAEventListings if not provided
   * @returns {object} options {filters:{...}, pageSize, page}
   */
  _GetOptions(page = 1, query = RA_QUERY_EVENT_LISTINGS) {
    let today = new Date();
    let date = Utilities.formatDate(today, "PST", "yyyy/MM/dd")
    let addTime = new Date(today.setMonth(today.getMonth() + 8));
    let nextYear  = Utilities.formatDate(addTime, "PST", "yyyy/MM/dd");
    const name = `Four Tet`;
    return {
      "muteHttpExceptions" : true,
      "headers" : {
        'Content-Type' : "application/json", 
        'Accept' : "application/json",
        'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
        // "referer" : "https://ra.co/events/us/bayarea",
      },
      "payload" : JSON.stringify({
        "query" : query, 
        "variables" : {
          "filters" : {
            "areas" : { 
              "eq" : this.region,
            },
            "listingDate" : { 
              "gte" : date, 
              "lte" : nextYear
            },
            // "event": {"title": "Playxland: Trans Pride Beach Party!" },
            // "artists": { 
            //   "name" : name, 
            // },
            "listingPosition" : { 
              "eq" : 1 
            },
          },
          "pageSize" : 18,      // max the API will allow seems to be 18
          "page" : page,
        },
      }),
      "method" : "POST",
    };
  }

  /**
   * Searches the results to return only events that match artists in your list
   */
  async ParseResults() {
    try {
      const artistList = this.GetArtistList();
      let results = [];
      const listings = await this.GetData();
      listings.forEach(listing => {
        const event = listing?.event;
        if(!event) return;
        // console.info(event);
        const { date, startTime, endTime, title, contentUrl, artists, images, venue,  } = event;
        const eventDate = new Date(startTime);
        const venueName = venue?.name;
        const address = venue.address;
        const contentURL = `https://ra.co${contentUrl}`;
        const imageUrl = images[0]?.filename;
        const city = ExtractCityFromAddress(address);

        let acts = [];
        if (artists.length != 0) {
          for (let index = 0; index < artists.length; index++) {
            acts.push(artists[index].name);
          }
        }
        
        const data = {
          date : eventDate,
          title : title,
          city : city,
          venue : venueName,
          url : contentURL,
          image : imageUrl,
          acts : acts.toString(),
          address : address,
        }
        
        // For each artist in the Artist Sheet, check the result for 
        for (let j = 0; j < artistList.length; j++) {
          acts.forEach(res => {
            if(res.toUpperCase() === artistList[j].toString().toUpperCase()) {
              // console.info(`ResidentAdvisor: Found a match for artist: ${artistList[j]} in list of acts - title: ${title}`);
              results[eventDate] = data;
            } 
          });
          // check artist against title of this result
          if ((title.toString().indexOf(artistList[j].toString()) > -1) || (artistList[j].toString().indexOf(title.toString()) > -1) ) {
            // console.info(`Resident Advisor: Found a match for artist ${artistList[j]} in title: ${title}`);
            results[eventDate] = data;
          }
        }
        
      });

      if (results.length > 0) results = Common.UniqueArray(results);

      // Sort by key, which is the date
      const ordered = Object.keys(results)
        .sort()
        .reduce((obj, key) => { 
            obj[key] = results[key]; 
            return obj;
          },[]
        );

      // console.info(JSON.stringify(results));
      return ordered;
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
      // console.info(existingArray);
      // console.info(newArray);
      const reduced = Object.entries(newArray).filter(aItem => !Object.entries(existingArray).find(bItem => { 
        const aDate = new Date(aItem[date]);
        const bDate = new Date(bItem[date]);
        const aName = aItem[name]?.toString().toUpperCase();
        const bName = bItem[name]?.toString().toUpperCase();
        const aVenue = aItem[venue]?.toString().toUpperCase();
        const bVenue = bItem[venue]?.toString().toUpperCase();
        const aUrl = aItem[url]?.toString().toUpperCase();
        const bUrl = bItem[url]?.toString().toUpperCase();
        return ((aUrl == bUrl) || ((aName.indexOf(bName > -1) || bName.indexOf(aName) > -1) && aVenue == bVenue && aDate == bDate))  //|| aItem[url] == bItem[url]
      }));
      console.info(reduced);
      return reduced;
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
      let artists = GetColumnDataByHeader(SHEETS.Artists, ARTISTSHEETHEADERNAMES.artists);
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
      const events = await this.GetExistingEvents();
      const results = await this.ParseResults();

      // let filteredEvents = this.FilterNewEvents(results, events, "title", "venue", "date", "url");
      // console.info(`Resident Advisor: ${filteredEvents}`);
      // results.forEach(event => this.WriteEventToSheet(event));

      Object.entries(results).forEach(event => {
        console.info(event[1]);
        // this.WriteEventToSheet(event[1]);
      });
      
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

}





const _testRA = () => {
  const ra = new ResidentAdvisorFactory();
  ra.Main();
}