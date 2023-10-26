/**
 * Create a calendar event from a list of events
 * @param {[event]} events
 */
const CreateCalendarEvents = (events) => {
  events.forEach(event => CreateCalendarEvent(event));
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
const CreateCalendarEvent = (event) => {
  try {
    console.info(`EVENT -----> ${JSON.stringify(event, null, 3)}`);
    let { title, date, city, venue, url, image, acts, address } = event;
    date  = new Date(event.date);
    const endTime = new Date(AddHours(date, 3));
    const description = `
      ${image}\n
      Title: ${title}\n
      Tickets: ${url}\n
      Acts: ${acts}\n
      Date: ${date}\n
      Venue: ${venue}\n
      City: ${city}\n
    `;
    CalendarApp.getCalendarById(PropertiesService.getScriptProperties().getProperty(`CALENDAR_ID`))
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

const EventExists = (event) => {
  let { title, date, city, venue, url, image, acts, address } = event;
  const events = CalendarApp.getCalendarById(PropertiesService.getScriptProperties().getProperty(`CALENDAR_ID`))
    .getEvents(new Date(2019, 1, 1), new Date(2023, 1, 1));
  console.info(events)
}

/**
 * Add Hours
 * @param {Date} time initial
 * @param {Number} hours to add
 * @returns {Date} new date
 */
const AddHours = (time, h) => {
  const date = new Date(time).getTime();
  return new Date(date + (h * 60 * 60 * 1000));
}

const BuildCalendarFromSheet = () => {
  const lastRow = SHEETS.Events.getLastRow();
  for(let i = 2; i < lastRow + 1; i++) {
    const event = GetRowData(SHEETS.Events, i);
    CreateCalendarEvent(event);
  }
}


const _testCalendar = () => {
  const event = {
      "eventTitle": "Fake Bullshit",
      "date": "2023-06-24T04:00:00Z",
      "city": "San Francisco",
      "venue": "Fake Venue",
      "url": "www.url.com",
      "image": "....",
      "acts": "Fuckface",
      "address": "1234 Fake St."
  }
  EventExists(event);
  // const c = CreateCalendarEvent(event);
}





