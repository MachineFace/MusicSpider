const sendEmail = async () => {
  try {
    let events = Emailer.BuildEventsArrayForEmail();
    let comedyEvents = Emailer.BuildComedyEventsArrayForEmail();

    if (Object.keys(events).length == 0) throw new Error("No events to add to email.");
    const email = PropertiesService.getScriptProperties().getProperty(`MY_EMAIL`);
    const message = new CreateMessage({ 
      events : events,
      comedyEvents : comedyEvents,
    });
    const emailer = new Emailer({
      message : message,
      email: email,
    });
    emailer.SendEmail();

    return 0;
  } catch(err) {
    console.error(`"sendEmail()" failed: ${err}`);
    return 1;
  }
}

const _test_send_email = () => {
  sendEmail();
}

/**
 * -----------------------------------------------------------------------------------------------------------------
 * Send an Email
 * @required {string} Student Email
 * @required {string} Status
 */
class Emailer {
  constructor({ 
    email : email = `Unknown Email`, 
    message : message = ``,
    subject: subject = `${SERVICE_NAME} : Event Update`,
  }) {
    this.email = email;
    this.message = message;
  }

  /**
   * Build an Array of Events for Email
   */
  static BuildEventsArrayForEmail() {
    try {
      let events = {};
      for (let i = 2; i < SHEETS.Events.getLastRow(); i++) {
        let rowData = SheetService.GetRowData(SHEETS.Events, i);
        let { id } = rowData;
        events[id] = rowData;
      }

      if (Object.entries(events).length <= 1) throw new Error(`No events found- unable to build array of Events`);
      let ordered = Object.keys(events)
        .sort()
        .reduce((obj, key) => { 
          obj[key] = events[key]; 
          return obj;
        },{}
      );
      return ordered;
    } catch(err) {
      console.error(`"BuildEventsArrayForEmail()" failed: ${err}`);
      return 1;
    }
  }

  /**
   * Build an Array of Events for Email
   */
  static BuildComedyEventsArrayForEmail() {
    try {
      let events = {};
      for (let i = 2; i < SHEETS.ComedyEvents.getLastRow(); i++) {
        let rowData = SheetService.GetRowData(SHEETS.ComedyEvents, i);
        let { id } = rowData;
        events[id] = rowData;
      }

      if (Object.entries(events).length <= 1) throw new Error(`No events found- unable to build array of Events`);
      let ordered = Object.keys(events)
        .sort()
        .reduce((obj, key) => { 
          obj[key] = events[key]; 
          return obj;
        },{}
      );
      return ordered;
    } catch(err) {
      console.error(`"BuildComedyEventsArrayForEmail()" failed: ${err}`);
      return 1;
    }
  }

  SendEmail() {
    try {
      console.info(`Sending  email to ${this.email}.`);
      GmailApp.sendEmail(this.email, this.message.subjectLine, "", {
        htmlBody: this.message.defaultMessage,
        from: SUPPORT_ALIAS,
        // cc: this.designspecialistemail,
        // bcc: staff.Chris.email,
        name: SERVICE_NAME,
        noReply: true,
      });
      console.info(`Email sent to ${this.email}`);
    } catch (err) {
      console.error(`"SendEmail()" failed : ${err}`);
    }
  }
}










