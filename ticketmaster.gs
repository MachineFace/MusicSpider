class TicketmasterFactory {
  constructor() {
    this.ticketmasterUrl = `https://app.ticketmaster.com/discovery/v2/events.json`;
  }

  async RefreshEvents() {  
    let artistsArr = this.GetArtistsListFromSheet();   // Get list of artists from sheet
    removeExpiredEntries(eventSheet);  // Clean expired events
    deleteEmptyRows(eventSheet);  // Clear any empty rows if something was manually deleted

    //search each artist
    let eventsArr = {};
        
    try {
      // console.info(`arrray length ${artistsArr.length}`);
      // for (i=0;i<artistsArr.length; i++){
      while (i < artistsArr.length){
        await this.TicketSearch(artistsArr[i][0])
          .then(data => {
          i++;
          // console.info(data);
          for (const [index, [key]] of Object.entries(Object.entries(data))) {
            let exists = searchColForValue(eventSheet, `URL`, data[key].url);
            if (!exists) {
              eventsArr[key] = {
                eventTitle: data[key].eventTitle,
                date: data[key].date,
                city: data[key].city,
                venue: data[key].venue, 
                url: data[key].url, 
                image: data[key].image,
                acts: data[key].acts.toString(),
                address: data[key].address,
              }
            }
          }
          Utilities.sleep(200);
        });
      }
    }catch (e) { 
      console.error(e);
    }
    // Write new events to events sheet
    this.WriteEventsToSheet(eventsArr);

    // Write Calendar Event for new events
    if (config.createCalendarEvents) CreateCalEvents(eventsArr);
  }

  WriteEventsToSheet(eventsArr) {
    for (const [index, [key]] of Object.entries(Object.entries(eventsArr))) {
      SetRowData(eventSheet, eventsArr[key]);
    }
  }

  BuildEventsArray() {
    let lastRow = eventSheet.getLastRow();
    let events = {};
    let ordered = {};
    if (lastRow <= 1) console.warn(`No events found- unable to build array of Events`);
    for (let i = 1; i < lastRow; i++) {
      let rowData = GetRowData(eventSheet, i + 1);
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

  async TicketSearch(keyword) {
    if (!keyword) {
      console.info(`No keyword provided`);
      return;
    }
    let artist = artistSheet.getRange(2,1);
    let eventsArr = {};

    try {
      // returns JSON response
      await this.SearchTicketmaster(keyword)
        .then( async (data) => {
          console.info(data);
          if (data.page.totalElements == 0) {
            console.info(`No results for ${keyword}`)
            return false;
          }
          
          data?._embedded?.events?.forEach((item) => {
            let url = item.url;
            let image = [[0,0]];
            // Loop through image URLs in JSON response. Find the one with the largest filesize
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
            let attractions = [];
            item?._embedded?.attractions?.forEach((attraction) => {
              attractions.push(attraction.name);
            });
            // if other artists in my list are in this event, move them to front of list
            let artistsArr = this.GetArtistsList();
            for (let i = 0; i < artistsArr.length; i++){
              let artist = artistsArr[i][0];
              if (attractions.includes(artist) && artist != keyword) {
                attractions = attractions.sort((x,y) => { return x == artist ? -1 : y == artist ? 1 : 0; });
              }
            }
            // then move keyword to front of list of acts
            attractions = attractions.sort((x,y) => { return x == keyword ? -1 : y == keyword ? 1 : 0; });
            item?._embedded?.venues?.forEach((venue) =>{ 
              let venueventTitle = venue.name; 
              let venueAddress = venue.address.line1;
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
                eventsArr[date] = { 
                  eventTitle : item.name,
                  acts : attractions,
                  venue : venueventTitle , 
                  city : venue.city.name, 
                  date : date, 
                  url : url, 
                  image : item.images[image[0][0]].url,
                  address : `${venueAddress}, ${venue.city.name}, ${venue.state.name}`
                }
              }
            });
          });
          if (Object.keys(eventsArr) == 0) {
            console.info(`No events found for ${keyword}`);
            return;
          }
          // console.info(eventsArr);
          console.warn(`eventsArr: ${eventsArr}`);
      });
      return await eventsArr;
    } catch (err) {
      console.error(`TicketSearch failed - ${err}`);
    }
  }

  WriteEvent({ eventTitle, date, city, venue, url, image, acts, }) {
    let thisRow = eventSheet.getLastRow() + 1;
    SetByHeader(eventSheet, HEADERNAMES.eventTitle, thisRow, eventTitle);
    SetByHeader(eventSheet, HEADERNAMES.city, thisRow, city);
    SetByHeader(eventSheet, HEADERNAMES.venue, thisRow, venue);
    SetByHeader(eventSheet, HEADERNAMES.date, thisRow, date);
    SetByHeader(eventSheet, HEADERNAMES.url, thisRow, url);
    SetByHeader(eventSheet, HEADERNAMES.image, thisRow, image);
    SetByHeader(eventSheet, HEADERNAMES.acts, thisRow, acts.toString());
  }

  async SearchTicketmaster(keyword) {
    let options = {
      "method": "GET",
      "async": true,
      "contentType": "application/json",
    };
    let params = `?apikey=${config.keyTM}`;
    params += `&latlong=${config.latlong}`;
    params += `&radius=${config.radius}`;
    params += `&unit=${config.unit}`;
    params += `&keyword=${encodeURIComponent(keyword)}`;
    console.info(`Searching Ticketmaster for ${keyword}`);
    try {
      let response = await UrlFetchApp.fetch(this.ticketmasterUrl + params, options);
      let responseCode = response.getResponseCode();
      if (responseCode != 200 || responseCode != 201) {
        console.error(`Failed to search Ticketmaster`);
        return false;
      } 
      let content = await response.getContentText();
      console.info(content);  
      return await JSON.parse(content);
    } catch (err) {
      console.error(`Failed to search Ticketmaster ${err}`);
      return {};
    }
  }

  GetArtistsListFromSheet() {
    let artistRows = artistSheet.getLastRow() - 1;
    if (artistRows == 0) artistRows = 1;
    let artistsArr = artistSheet.getRange(2,1,artistRows,1).getValues();
    return artistsArr;
  }

}


const refreshEvents = () => new TicketmasterFactory().RefreshEvents();


