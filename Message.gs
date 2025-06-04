/**
 * ----------------------------------------------------------------------------------------------------------------
 * Class for Creating Response Messages
 * @param {Array} Events
 * @param {Array} Comedy
 */
class CreateMessage {
  constructor({
    events : events = {},
    comedyEvents : comedyEvents = {},
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

    Object.entries(allEvents).forEach(([key, entry], idx) => {
      let { id, title, venue, city, date, priceRange, url, image, acts, address } = entry;
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

  /**
   * Generate a styled HTML email message with music and comedy events
   * @returns {string} - Full HTML email string
   */
  get defaultMessage() {
    let html = [];

    // Function for building Table
    function BuildTableSection(label = ``, events = {}) {
      let rows = [];

      events.forEach((entry, idx) => {
        const { title, venue, city, date, priceRange, url, image, acts } = entry;
        const actsArray = [...new Set(acts.split(','))].map(x => x.trim().toUpperCase());

        const eDate = new Date(date);
        const eventTime = Utilities.formatDate(eDate, 'PST', 'h a');
        const eventPriceRange = priceRange ? `$${priceRange}` : `$??`;

        const formattedDate = `${dayNames[eDate.getDay()]}, ${monthNames[eDate.getMonth()]} ${eDate.getDate()} ${eDate.getFullYear()}`;

        const actsList = actsArray.length > 1 || !title.match(actsArray[0])
          ? 'with ' + actsArray.slice(0, 6).filter(act => !title.match(act)).join(', ') + (actsArray.length > 6 ? '...' : '')
          : '';

        const cell = `
          <td class="tg-0lax" style="height:300px;vertical-align:top;">
            <div style="text-align: left;margin-left: 10px;">
              <div><a href='${url}'><img src='${image}' style="width:350px;height:200px;object-fit:cover;"/></a></div>
              <span style="font-family: Averta, Helvetica Neue, Helvetica, Arial, sans-serif;">
                <a href='${url}' style="text-decoration:none;">
                  <span style="color:#44494c;font-size:20px;"><strong>${title}</strong></span>
                </a><br/>
                ${actsList ? actsList + '<br/>' : ''}
                <span style="color:#696969;font-size:12px;font-family:georgia, times, times new roman, serif;">
                  at ${venue}, ${city}<br/>
                  <strong>${formattedDate}</strong> ${eventTime}<br/>
                  <h4>${eventPriceRange}</h4>
                </span>
              </span>
            </div><br/>
          </td>`;

        if (idx % 2 === 0) rows.push('<tr>' + cell);
        else rows[rows.length - 1] += cell + '</tr>';
      });

      return `
        <table class="tg" align="center" style="border-collapse:collapse;border-spacing:0;background-color:#ffffff;width:750px;">
          <thead>
            <tr><td colspan="2">
              <span style="font-family:helvetica, sans-serif;font-size:30px;color:#e9e9e9;"><strong>${label}</strong></span><hr><br/>
            </td></tr>
          </thead>
          <tbody>
            ${rows.join('\n')}
          </tbody>
        </table>`;
    }

    html.push(`
      ${this.style}
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-spacing:0;width:100%;background-color:#f8f8f8;">
        <tbody>
          <tr><td valign="top">
            <table align="center" style="border-collapse:collapse;border-spacing:0;background-color:#ffffff;width:750px;">
              <thead>
                <tr><td colspan="2" style="text-align:center;padding:40px 0;">
                  <a href="https://github.com/MachineFace/MusicSpider">
                    <img src="https://i.postimg.cc/HkVc4bCq/music-spider-logo-nobg.png" width="22%" height="22%"/></a><br/>
                  <span style="font-family:helvetica, sans-serif;font-size:30px;color:#e9e9e9;">
                    <strong>fucking ${SERVICE_NAME.toLowerCase()}</strong><br><br/>
                  </span>
                </td></tr>
              </thead>
            </table>`);

    html.push(BuildTableSection('Music', Object.values(this.events)));
    html.push(BuildTableSection('Comedy', Object.values(this.comedyEvents)));
    html.push(`</td></tr></tbody></table>`);

    return html.join('\n');
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









