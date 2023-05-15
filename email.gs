const sendEmail = () => {
  const ticketmaster = new TicketmasterFactory();
  let eventsArr = ticketmaster.BuildEventsArray();
  let msgSubjRaw = [];
  let msgSubj = `${SERVICE_NAME} - `;
  if (Object.keys(eventsArr).length === 0) {
    console.warn("No events to add to email.")
    return;
  }
  for (const [index, [key]] of Object.entries(Object.entries(eventsArr))) {
    if (eventsArr[key].acts==""){
      msgSubjRaw.push(eventsArr[key].eventTitle);
      continue;
    }
    let actsArr = eventsArr[key].acts.split(',');
    msgSubjRaw.push(actsArr[0]);
  }
  // remove duplicates from list of acts
  msgSubj += [...new Set(msgSubjRaw)].join(', ');

  new Emailer({
    message: new CreateMessage({events: eventsArr}),
    email: config.email,
    subject: msgSubj,
  });
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
    this.subject = subject.substring(0,249);
    this.SendEmail();
  }

  SendEmail () {
    // const staff = BuildStaff();
    try {
      console.info(`Sending  email to ${this.email}.`);
      GmailApp.sendEmail(this.email, this.subject, "", {
        htmlBody: this.message.defaultMessage,
        from: SUPPORT_ALIAS,
        // cc: this.designspecialistemail,
        // bcc: staff.Chris.email,
        name: SERVICE_NAME,
        noReply: true,
      });
    
    } catch (err) {
      console.error(`${err} : Couldn't send email. Something went wrong.`);
    }
  }
}



/**
 * ----------------------------------------------------------------------------------------------------------------
 * Class for Creating Response Messages
 * Properties accessed via `this.receivedMessage` or `this.failedMessage`
 * @param {string} name
 * @param {string} projectname
 * @param {number} jobnumber
 * @param {string} mat1
 * @param {number} material1Quantity
 * @param {string} material1Name
 * @param {string} mat2
 * @param {number} material2Quantity
 * @param {string} material2Name
 * @param {string} designspecialist
 * @param {string} designspecialistemaillink
 */
class CreateMessage
{
  constructor({
    events : events
  }) {
    this.events = events;
  }

  get defaultMessage() {
    let message = `<style type="text/css">
      .tg {
        border-collapse:collapse;
        border-spacing:0;
        }
      .tg td {
        border-color:black;
        border-style:solid;
        border-width:1px;
        font-family:georgia,times,times new roman,serif;
        font-size:14px;
        overflow:hidden;
        padding:5px 5px;
        word-break:normal;
      }
      .tg th {
        border-color:black;
        border-style:solid;
        border-width:1px;
        font-family:georgia,times,times new roman,serif;
        font-size:14px;
        font-weight:normal;
        overflow:hidden;
        padding:5px 5px;
        word-break:normal;
      }
      .tg .tg-0lax{
        text-align:left;
        vertical-align:top
      }      
    </style>`;
    // top of email
    message += `<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-spacing:0px;padding:0;margin:0;width:100%;background-repeat:repeat;background-position:center top; background-color:#f8f8f8;"`;
    message += `<tbody><tr style="border-collapse: collapse;"><td valign="top" style="padding: 0;Margin: 0;">`
    message += `<table class="tg" align="center" style="border-collapse: collapse;border-spacing: 0px;background-color: #ffffff;width: 750px;"><thead>`
    message += `<tr><td colspan=2><div style="text-align: center;"><br/><br/>`
    message += `<a href="https://github.com/cparsell/music-spider">`
    message += `<img src="https://i.postimg.cc/HkVc4bCq/music-spider-logo-nobg.png" height="22%" width="22%"/></a><br>`;
    message += `<span style="font-family:helvetica, sans-serif;font-size:30px;color:#e9e9e9;">`;
    message += `<strong>${SERVICE_NAME.toLowerCase()}</strong><br><br></span></div></td></tr></thead>`;
    message += `<tbody>`
    // for (const key of Object.keys(this.events)) { 

    // iterate through list of events
    for (const [index, [key]] of Object.entries(Object.entries(this.events))) {
      const {date, city, venue, url, image, eventTitle, acts} = this.events[key];
      let actsArr = [];
      let actsB = [];
      //turn text into array
      if (acts != undefined) actsArr = acts.split(',');
      // look for acts' names in event name - if name is in event name, dont list it again
      for (let i=0;i<actsArr.length;i++) {
        if (!eventTitle.match(actsArr[i])) {
          actsB.push(actsArr[i]);
        }
      }
      let eDate = new Date(key);
      let eventDay = eDate.getDay();
      let eventDayNum = eDate.getDate();
      let eventMonth = eDate.getMonth();
      let eventYear = eDate.getFullYear();
      let eventTime = Utilities.formatDate(eDate, "PST", "h a");
      // Start a new table row every even event
      if (isEven(index)) {
        message += `<tr>`;
      }
      message += `<td class="tg-0lax" style="height:300px;vertical-align:top;"><div style="text-align: left;margin-left: 10px;">`;
      message += `<div class="" style=""><a href='${url}'>`;
      message += `<img src='${image}' class="" style="width:90%;float:center;width:350px;height:200px;object-fit:cover;"/></div>`;
      message += `<span style="font-family: Averta,Helvetica Neue,Helvetica,Arial,sans-serif;">`;
      message += `<a href='${url}' style="text-decoration:none;"><span style="color:#44494c;font-size:20px;"><strong>${eventTitle}</strong></span></a><br/>`;
      let actsUpper = actsB.map(function(x){ return x.toUpperCase(); })
      if (actsUpper.length > 1 || !eventTitle.toUpperCase().match(actsUpper[0])) {
        actsB.forEach((act, index) => {
          if (index == 0) message += `with `;
          if (!eventTitle.toUpperCase().match(act.toUpperCase()) && index < 6) {
            message += (index == actsB.length-1) ?  `${act}` : `${act}, `;
          }
          if (index == 6) message += `...` // truncate list if longer than 5
        })
        message += `<br/>`
      }
      message += `<span style="color:#696969;font-size:12px;font-family:georgia,times,times new roman,serif;">at ${venue}, ${city}<br/> `;
      message += `<strong>${dayNames[eventDay]}, ${monthNames[eventMonth]} ${eventDayNum} ${eventYear}</strong> ${eventTime}</span></span></div>`;
      message += `<br/></td>`;
      if (!isEven(index)) message += `</tr><br/>`; // End table row every odd event
    };
    message += `<br/></tbody></table>`; 
    message += `</td></tr></tbody></table>`;
    return message; 
  }
}






