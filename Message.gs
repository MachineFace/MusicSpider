/**
 * ----------------------------------------------------------------------------------------------------------------
 * Class for Creating Response Messages
 * @param {Array} Events
 * @param {Array} Comedy
 */
class CreateMessage {
  constructor({
    events : events,
    comedyEvents : comedyEvents,
  }) {
    /** @private */
    this.events = events;
    /** @private */
    this.comedyEvents = comedyEvents;
  }

  /**
   * Subject Line
   */
  get subjectLine() {
    let allEvents = { ...this.events, ...this.comedyEvents, }
    let msgSubjRaw = [];
    let msgSubj = `${SERVICE_NAME} - `;
    if (Object.keys(allEvents).length === 0) return ``;

    Object.entries(allEvents).forEach(([key, { id, title, venue, city, date, url, image, acts, address, sheetName, row, }], idx) => {
      if (!acts) msgSubjRaw.push(title);
      const split = acts.split(',');
      msgSubjRaw.push(split[0]);
    });
    msgSubj += [...new Set(msgSubjRaw)]
      .join(`, `)
      .substring(0, 100)
      .concat(`...`);
    console.info(msgSubj);
    return msgSubj;
  }

  get defaultMessage() {
    let message = ``;
    message += this.style;
    message += `<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-spacing:0px;padding:0;margin:0;width:100%;background-repeat:repeat;background-position:center top; background-color:#f8f8f8;"`;
    message += `<tbody><tr style="border-collapse: collapse;"><td valign="top" style="padding: 0;Margin: 0;">`
    message += `<table class="tg" align="center" style="border-collapse: collapse;border-spacing: 0px;background-color: #ffffff;width: 750px;"><thead>`;
    message += `<tr><td colspan=2><div style="text-align: center;"><br/><br/>`
    message += `<a href="https://github.com/MachineFace/MusicSpider">`
    message += `<img src="https://i.postimg.cc/HkVc4bCq/music-spider-logo-nobg.png" height="22%" width="22%"/></a><br>`;
    message += `<span style="font-family:helvetica, sans-serif;font-size:30px;color:#e9e9e9;">`;
    message += `<strong>fucking ${SERVICE_NAME.toLowerCase()}</strong><br><br></span></div></td></tr></thead>`;

    // ARTIST TABLE
    message += `<span style="font-family:helvetica, sans-serif;font-size:30px;color:#e9e9e9;"><strong>Music</strong><br><br></span>`;
    message += `<hr>`;
    message += `<br/>`;
    message += `<tbody>`

    Object.entries(this.events).forEach(([key, { id, date, city, venue, url, image, title, acts }], idx) => {
      let actsArray = [...new Set(acts.split(','))]
        .map(x => x.toUpperCase());

      const eDate = new Date(date);
      const eventDay = eDate.getDay(), eventDayNum = eDate.getDate(), eventMonth = eDate.getMonth(), eventYear = eDate.getFullYear();
      const eventTime = Utilities.formatDate(eDate, "PST", "h a");
      
      if (Common.isEven(idx)) message += `<tr>`;   // Start a new table row every even event
      message += `<td class="tg-0lax" style="height:300px;vertical-align:top;"><div style="text-align: left;margin-left: 10px;">`;
      message += `<div class="" style=""><a href='${url}'>`;
      message += `<img src='${image}' class="" style="width:90%;float:center;width:350px;height:200px;object-fit:cover;"/></div>`;
      message += `<span style="font-family: Averta,Helvetica Neue,Helvetica,Arial,sans-serif;">`;
      message += `<a href='${url}' style="text-decoration:none;"><span style="color:#44494c;font-size:20px;"><strong>${title}</strong></span></a><br/>`;
      
      if (actsArray.length > 1 || !title.match(actsArray[0])) {
        actsArray.forEach((act, index) => {
          if (index == 0) message += `with `;
          if (!title.match(act) && index < 6) {
            message += (index == acts.length - 1) ?  `${act}` : `${act}, `;
          }
          if (index == 6) message += `...` // truncate list if longer than 5
        })
        message += `<br/>`
      }
      message += `<span style="color:#696969;font-size:12px;font-family:georgia,times,times new roman,serif;">at ${venue}, ${city}<br/> `;
      message += `<strong>${dayNames[eventDay]}, ${monthNames[eventMonth]} ${eventDayNum} ${eventYear}</strong> ${eventTime}</span></span></div>`;
      message += `<br/></td>`;
      if (Common.isOdd(idx)) message += `</tr><br/>`; // End table row every odd event
    });
    message += `<br/></tbody></table>`; 
    

    // COMEDY TABLE
    message += `<table class="tg" align="center" style="border-collapse: collapse;border-spacing: 0px;background-color: #ffffff;width: 750px;"><thead>`;
    message += `<span style="font-family:helvetica, sans-serif;font-size:30px;color:#e9e9e9;"><strong>Comedy</strong><br><br></span>`;
    message += `<hr>`;
    message += `<tbody>`
    // iterate through list of events
    Object.entries(this.comedyEvents).forEach(([key, { id, date, city, venue, url, image, title, acts }], idx) => {
      let actsArray = [...new Set(acts.split(','))]
        .map(x => x.toUpperCase());

      const eDate = new Date(date);
      const eventDay = eDate.getDay(), eventDayNum = eDate.getDate(), eventMonth = eDate.getMonth(), eventYear = eDate.getFullYear();
      const eventTime = Utilities.formatDate(eDate, "PST", "h a");
      
      if (Common.isEven(idx)) message += `<tr>`;    // Start a new table row every even event
      message += `<td class="tg-0lax" style="height:300px;vertical-align:top;"><div style="text-align: left;margin-left: 10px;">`;
      message += `<div class="" style=""><a href='${url}'>`;
      message += `<img src='${image}' class="" style="width:90%;float:center;width:350px;height:200px;object-fit:cover;"/></div>`;
      message += `<span style="font-family: Averta,Helvetica Neue,Helvetica,Arial,sans-serif;">`;
      message += `<a href='${url}' style="text-decoration:none;"><span style="color:#44494c;font-size:20px;"><strong>${title}</strong></span></a><br/>`;
      
      if (actsArray.length > 1 || !title.match(actsArray[0])) {
        actsArray.forEach((act, index) => {
          if (index == 0) message += `with `;
          if (!title.match(act) && index < 6) {
            message += (index == acts.length - 1) ?  `${act}` : `${act}, `;
          }
          if (index == 6) message += `...` // truncate list if longer than 5
        })
        message += `<br/>`
      }
      message += `<span style="color:#696969;font-size:12px;font-family:georgia,times,times new roman,serif;">at ${venue}, ${city}<br/> `;
      message += `<strong>${dayNames[eventDay]}, ${monthNames[eventMonth]} ${eventDayNum} ${eventYear}</strong> ${eventTime}</span></span></div>`;
      message += `<br/></td>`;
      if (Common.isOdd(idx)) message += `</tr><br/>`; // End table row every odd event
    });
    message += `<br/></tbody></table>`; 

    message += `</td></tr></tbody></table>`; // End of Document table

    return message; 
  }

  /** @private */
  get style() {
    return `<style type="text/css">
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
    </style>`
  }

}



const _test_message = () => {
  let events = Emailer.BuildEventsArrayForEmail();
  let comedyEvents = Emailer.BuildComedyEventsArrayForEmail();

  const message = new CreateMessage({
    events : events,
    comedyEvents : comedyEvents,
  });
  console.info(message.subjectLine)

}









