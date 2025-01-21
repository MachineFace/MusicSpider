

class CalendarService {
  constructor() {
    /** @private */
    this.calendar = CalendarApp.getCalendarById(PropertiesService.getScriptProperties().getProperty(`CALENDAR_ID`));
  }

  /**
   * Get All Events
   */
  get Events() {
    const todayMillis = TimeService.DateToMilliseconds(new Date());
    const days1000 = TimeService.DaysToMillis(1000);
    const minus1000 = new Date(todayMillis - days1000);
    const plus1000 = new Date(todayMillis + days1000);

    const events = this.calendar
      .getEvents(minus1000, plus1000);
    return events
  }

  /**
   * Create a calendar event from a list of events
   * @param {[event]} events
   */
  CreateCalendarEvents(events = []) {
    events.forEach(event => this.CreateCalendarEvent(event));
  }

  /**
   * Delete Event by ID
   * @param {string} id
   */
  DeleteEvent(id = ``) {
    try {
      this.calendar.getEventById(id)
        .deleteEvent();
      console.warn(`Event (${id}) Deleted`);
      return 0;
    } catch(err) {
      console.error(`"DeleteEvent()" failed: ${err}`);
      return 1;
    }
  }

  /**
   * Delete All Events
   */
  DeleteAllEvents() {
    const events = this.Events;
    events && Object.entries(events).forEach(([key, event], idx) => {
      event.deleteEvent();
    });
    return 0;
  }

  /**
   * Remove Duplicates
   */
  RemoveDuplicateEvents() {
    try {
      const events = this.Events;
      events.forEach(event => {
        if(this.EventExists(event)) {
          const title = event.getTitle();
          console.info(`Checking (${title})`);
          let eventID = event.getDescription()
            .split(`ID:`)[1];
          if(typeof(eventID) == String) {
            eventID
              .replace(/^\s\s*/, "")
              .replace(/\s\s*$/, "")
          }
          // event.deleteEvent();
        }
      });
      console.info(`No Duplicate Events found.`);
      return 0;
    } catch(err) {
      console.error(`"RemoveDuplicateEvents()" failed: ${err}`);
      return 1;
    }
  }

  /**
   * Create a Single Calendar Event
   * format: {
        "eventTitle": "",
        "date": "2023-06-24T04:00:00Z",
        "city": "",
        "venue": "",
        "url": "",
        "image": "",
        "acts": "",
        "address": ""
    }
  * @param {object} event 
  */
  CreateCalendarEvent(event = {}) {
    try {
      if(this.EventExists(event)) return; // Already there? Do nuthin
      console.info(`EVENT -----> ${JSON.stringify(event, null, 3)}`);
      let { id, title, date, city, venue, url, image, acts, address } = event;
      date  = new Date(event.date);
      const endTime = new Date(this.AddHours(date, 3));
      const description = `
        ${image}\n
        Title: ${title}\n
        Tickets: ${url}\n
        Acts: ${acts}\n
        Date: ${date}\n
        Venue: ${venue}\n
        City: ${city}\n
        ID: ${id}\n
      `;
      this.calendar
        .createEvent(
          `${title} at ${venue}`, 
          date, 
          endTime, {
            location : address,
            description : description,
          },
        );
      console.warn(`Created calendar event for ${title}`);
      return 0;
    } catch(err) {
      console.error(`"CreateCalendarEvent()" failed: ${err}`);
      return 1;
    }
  }

  /**
   * Test if Event Exists
   */
  EventExists(event = {}) {
    const { id, title, date, city, venue, url, image, acts, address } = event;
    const events = this.Events;

    for(let i = 0; i < Object.entries(events).length; i++) {
      const [key, event] = Object.entries(events)[i];
      let eventID = event.getDescription()
        .split(`ID:`)[1];
      if(typeof(eventID) == String) {
        eventID
          .replace(/^\s\s*/, "")
          .replace(/\s\s*$/, "")
      }
      // console.info(eventID);
      if(eventID == id) return true;
    }
    return false;
  }

  /**
   * Add Hours
   * @param {Date} time initial
   * @param {Number} hours to add
   * @returns {Date} new date
   */
  AddHours(time = new Date(), h = 1) {
    const date = new Date(time).getTime();
    return new Date(date + (h * 60 * 60 * 1000));
  }

}

/**
 * Remove Duplicate Events
 * @TRIGGERED
 */
const RemoveDuplicateEvents = () => new CalendarService().RemoveDuplicateEvents();

/**
 * Delete All Events
 */
const DeleteAllEvents = () => new CalendarService().DeleteAllEvents();

/**
 * Build CalendarFromSheet
 */
const BuildCalendarFromSheet = () => {
  const calendar = new CalendarService();
  for(let i = 2; i < SHEETS.Events.getLastRow() + 1; i++) {
    const event = SheetService.GetRowData(SHEETS.Events, i);
    calendar.CreateCalendarEvent(event);
  }
  for(let i = 2; i < SHEETS.ComedyEvents.getLastRow() + 1; i++) {
    const event = SheetService.GetRowData(SHEETS.ComedyEvents, i);
    calendar.CreateCalendarEvent(event);
  }
}




// const _testCalendar = () => {
//   const calendar = new CalendarService();
//   const event = {
//     "id": "6f918456-549e-442b-a195-109f75b7bfc0",
//     "title": "Animals As Leaders: Joy Of Motion X Tour",
//     "venue": "The Fillmore",
//     "city": "San Francisco",
//     "date": "2024-10-30T03:00:00.000Z",
//     "url": "https://concerts.livenation.com/animals-as-leaders-joy-of-motion-san-francisco-california-10-29-2024/event/1C006097CCDB4915",
//     "image": "https://s1.ticketm.net/dam/a/16d/4f583465-39ae-48a7-b158-330d6522916d_SOURCE",
//     "acts": "Animals As Leaders,Plini",
//     "address": "1805 Geary Boulevard, San Francisco, California",
//   }
//   const x = calendar.EventExists(event);
//   console.info(x);
// }








