/**
 * Create a calendar event from a list of events
 * @param {[event]} events
 */
const CreateCalendarEvents = (events) => {
  events.forEach(event => CreateCalendarEvent(event));
}

/**
 * Create a Single Calendar Event
 * @param {object} event format: {
      "eventTitle": "",
      "date": "2023-06-24T04:00:00Z",
      "city": "",
      "venue": "",
      "url": "",
      "image": "",
      "acts": "",
      "address": ""
  }
 */
const CreateCalendarEvent = (event) => {
  try {
    console.info(`EVENT -----> ${event}`);
    // const date = new Date(event[key].date);
    // const endTime = new Date(AddHours(event[key].date, 3));
    // CalendarApp.getCalendarById(PropertiesService.getScriptProperties().getProperty(`calendarId`))
    //   .createEvent(
    //     `${event[key].eventTitle} at ${event[key].venue}`, 
    //     date, 
    //     endTime, {
    //       location: event[key].address,
    //       description: `Tickets: ${event[key].url}`,
    //     },
    //   );
    // console.warn(`Created calendar event for ${event[key].eventTitle}`);
    // return 0;
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
const AddHours = (time, h) => {
  const date = new Date(time).getTime();
  return new Date(date + (h * 60 * 60 * 1000));
}