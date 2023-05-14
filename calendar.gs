/**
 * Create a calendar event from a list of events
 * @param {[event]} events
 */
const CreateCalEvents = (events) => {
  let calendar = CalendarApp.getCalendarById(config.calendarId);
  for (const [index, [key]] of Object.entries(Object.entries(events))) {
    let date = new Date(events[key].date);
    let endTime = new Date(AddHours(events[key].date,3));
    calendar.createEvent(`${events[key].eventTitle} at ${events[key].venue}`, date, endTime, {
        location: events[key].address,
        description: `For tickets: ${events[key].url}`,
      });
    console.info(`Created calendar event for ${events[key].eventTitle}`);
  }
}

/**
 * Add Hours
 * @param {Date} time initial
 * @param {Number} hours to add
 * @returns {Date} new date
 */
const AddHours = (time, h) => {
  let date = new Date(time).getTime();
  let finish = date + (h * 60 * 60 * 1000);
  return new Date(finish);
}