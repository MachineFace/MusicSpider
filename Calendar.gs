

class CalendarService {
  constructor() {
    /** @private */
    this.calendar = CalendarApp.getCalendarById(PropertiesService.getScriptProperties().getProperty(`CALENDAR_ID`));
    /** @private */
    this.events = this.Events;
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
   * Delete Event by Google ID
   */
  async DeleteEventByGID(googleId) {
    try {
      console.info(`Deleting Event: ${googleId}....`);
      this.calendar
        .getEventById(googleId)
        .deleteEvent();
      console.info(`Event: ${googleId} Deleted.`);
      return 0;
    } catch(err) {
      console.error(`"DeleteEventByGID()" failed : ${err}`);
      return 1;
    }
  }

  /**
   * Delete All Events
   */
  DeleteAllEvents() {
    try {
      this.events.forEach(event => event.deleteEvent());
      return 0;
    } catch(err) {
      console.error(`"DeleteAllEvents()" failed: ${err}`);
      return 1;
    }
  }

  /**
   * Delete Duplicate Events
   */
  DeleteDuplicateEvents() {
    try {
      let seen = []
      let events = this.events;
      
      for(let event of events) {
        const uuid = this.ExtractIDFromEvent(event);
        const gID = event.getId();
        const title = event.getTitle();
        const start = event.getStartTime().getTime();
        const end = event.getEndTime().getTime();

        if (!uuid || !title) continue; // Skip incomplete events

        // Check for duplicates by comparing to each seen event
        let duplicate = seen.find(e =>
          (e.uuid === uuid && e.title === title && e.start === start && e.end === end) || // Exact duplicate
          (e.title === title && e.start === start) ||                                     // Same title + start
          (Math.abs(e.start - start) <= 60 * 1000 && e.title === title)                   // Title match & ~start
        );

        if (duplicate) {
          console.warn(`Duplicate found. Deleting: "${title}" @ ${new Date(start)} | UUID: ${uuid}`);
          event.deleteEvent();
        } else {
          seen.push({ uuid, title, start, end });
        }
      }

      console.info(`Events:`);
      seen && seen.forEach(({ uuid, title, start, end }) => console.info(`${title},\n    Start: ${new Date(start)},\n    End: ${new Date(end)}`))
      return 0;
    } catch(err) {
      console.error(`"DeleteDuplicateEvents()" failed : ${err}`);
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
      let { id, title, date, city, venue, url, image, acts, address } = event;
      if(this.EventExists(id)) return; // Already there? Do nuthin
      date  = new Date(date);
      let endTime = new Date(this.AddHours(date, 3));
      const description = `
        Title: ${title}
        Tickets: ${url}
        Acts: ${acts}
        Date: ${date}
        Venue: ${venue}
        City: ${city}
        ID: ${id}
        Image: ${image}
      `;
      console.info(`EVENT -----> ${JSON.stringify(event, null, 3)}`);
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
   * Add Hours
   * @param {Date} time initial
   * @param {Number} hours to add
   * @returns {Date} new date
   */
  AddHours(time = new Date(), h = 1) {
    const date = new Date(time).getTime();
    return new Date(date + (h * 60 * 60 * 1000));
  }

  /**
   * Extract UID from Event Description
   * @param {Object} event
   * @returns {string} uuid
   * @private
   */
  ExtractIDFromEvent(event = {}) {
    const regex = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;
    const description = event.getDescription()
    const match = description.match(regex);
    const id = match ? match[0] : null;
    // console.info(id);
    return id;    
  }

  /**
   * Test if Event Exists
   * @param {string} uuid
   * @returns {boolean} true if event exists
   */
  EventExists(uuid = ``, referenceEvent = null) {
    try {
      // console.info(`Event ID: ${uuid}`);
      if (!this.events || !Array.isArray(this.events)) {
        console.warn("this.events is undefined or not an array");
        return false;
      }

      for (let event of this.events) {
        const eventID = this.ExtractIDFromEvent(event);
        if (eventID === uuid) {
          return true;
        } else if (referenceEvent) {
          const sameTitle = event.getTitle() === referenceEvent.getTitle();
          const sameStart = event.getStartTime().getTime() === referenceEvent.getStartTime().getTime();
          const approxStart = (Math.abs(event.getStartTime() - referenceEvent.getStartTime()) <= 60 * 1000)                   // Match ~Start
          if ((sameTitle && sameStart) || (sameTitle && approxStart)) {
            console.warn(`Event Exists: (${eventID})`)
            return true;
          }
        }
      }

      return false;
    } catch(err) {
      console.error(`"EventExists()" failed: ${err}`);
      return 1;
    }
  }

  /**
   * Test if Event Exists (static func)
   * @param {string} bool
   * @returns {bool} true if event exists
   */
  static EventExists(uuid = ``, event = {}) {
    return CalendarFactory.prototype.EventExists(uuid, event);
  }

  /**
   * Check for event date conflicts.
   * @param {Date} proposedStart - Start date of the proposed event.
   * @param {Date} proposedEnd - End date of the proposed event.
   * @returns {boolean} - Returns true if there's a conflict, false otherwise.
   */
  IsEventConflict(proposedStart = new Date(), proposedEnd = new Date()) {
    try {
      if (!(proposedStart instanceof Date) || !(proposedEnd instanceof Date)) {
        throw new Error("Invalid input: proposedStart and proposedEnd must be Date objects");
      }

      let existingEvents = [];
      const ids = [...SheetService.GetColumnDataByHeader(SHEETS.Events, EVENT_SHEET_HEADERNAMES.id)];
      const dates = [...SheetService.GetColumnDataByHeader(SHEETS.Events, EVENT_SHEET_HEADERNAMES.date)];

      dates.forEach( (date, idx) => {
        let entry = {
          start : new Date(date),
          end : this.AddHours(new Date(date), 4),
        }
        existingEvents.push(entry);
      });
      console.info(JSON.stringify(existingEvents, null, 2));

      for (const event of existingEvents) {
        const existingStart = new Date(event.start);
        const existingEnd = new Date(event.end);

        // Check if proposed event overlaps with current event
        const isOverlap = proposedStart < existingEnd && proposedEnd > existingStart;
        if (isOverlap) {
          console.warn(`Conflict Encountered:`)
          return true;
        }
      }

      return false;
    } catch(err) {
      console.error(`"IsEventConflict()" failed: ${err}`);
      return 1;
    }
  }

}

/**
 * Remove Duplicate Events
 * @TRIGGERED
 */
const RemoveDuplicateEvents = () => new CalendarService().DeleteDuplicateEvents();

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




const _testCalendar = () => {
  const calendar = new CalendarService();

  // Print all events
  const events = calendar.Events;
  events.forEach(event => {
    console.info(`Event: ${event.getId()}`);
    console.info(`Description: ${event.getDescription()}`)
  });

  // // Test Existing
  // let exists = calendar.EventExists(`e9831c32-71b4-472f-a4fb-850504db5579`);
  // console.info(`Event Exists: ${exists}`);

  // Test Delete Duplicate
  // calendar.DeleteDuplicateEvents();

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


  // // Test Conflict
  // let conflict = calendar.IsEventConflict(new Date(2025, 6, 31, 3, 0, 0, 0), new Date(2025, 9, 29, 7, 0, 0, 0));
  // console.info(`Conflict: ${conflict}`);
}








