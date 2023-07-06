
const SERVICE_NAME = `Music Spider`;
const SUPPORT_ALIAS = GmailApp.getAliases()[0];

const monthNames = [`Jan`, `Feb`, `Mar`, `Apr`, `May`, `June`, `July`, `Aug`, `Sept`, `Oct`, `Nov`, `Dec`, ];
const dayNames = [`Sun`, `Mon`, `Tues`, `Wed`, `Thur`, `Fri`, `Sat`];

const ARTISTSHEETHEADERNAMES = Object.freeze({
  artists : `Artists`,	
});

const EVENTSHEETHEADERNAMES = Object.freeze({
  title : `Event Title`,	
  venue : `Venue`,	
  city : `City`,	
  date : `Date`,	
  url : `URL`,	
  image : `Image`,	
  acts : `Acts`,
  address : `Address`,																		
});

const SHEETS = Object.freeze({
  Artists : SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty(`SPREADSHEET_ID`)).getSheetByName(`Artists`),
  Events :  SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty(`SPREADSHEET_ID`)).getSheetByName(`Events`),
});

const RESPONSECODES = Object.freeze({
	200 : `OK`,
	201 : `Created`,
	202 : `Accepted`,
	203 : `Non-Authoritative Information`,
	204 : `No Content`,
	205 : `Reset Content`,
	206 : `Partial Content`,
	207 : `Multi-Status (WebDAV)`,
	208 : `Already Reported (WebDAV)`,
	226 : `IM Used`,
	300 : `Multiple Choices`,
	301 : `Moved Permanently`,
	302 : `Found`,
	303 : `See Other`,
	304 : `Not Modified`,
	305 : `Use Proxy`,
	306 : `(Unused)`,
	307 : `Temporary Redirect`,
	308 : `Permanent Redirect (experimental)`,
 	400 : `Bad Request`,
	401 : `Unauthorized`,
	402 : `Payment Required`,
	403 : `Forbidden / Not Authorized`,
	404 : `Not Found`,
	405 : `Method Not Allowed`,
	406 : `Not Acceptable`,
	407 : `Proxy Authentication Required`,
	408 : `Request Timeout`,
	409 : `Conflict`,
	410 : `Gone`,
	411 : `Length Required`,
	412 : `Precondition Failed`,
	413 : `Request Entity Too Large`,
	414 : `Request-URI Too Long`,
	415 : `Unsupported Media Type`,
	416 : `Requested Range Not Satisfiable`,
	417 : `Expectation Failed`,
	418 : `I'm a teapot (RFC 2324)`,
	420 : `Enhance Your Calm (Twitter)`,
	422 : `Unprocessable Entity (WebDAV)`,
	423 : `Locked (WebDAV)`,
	424 : `Failed Dependency (WebDAV)`,
	425 : `Reserved for WebDAV`,
	426 : `Upgrade Required`,
	428 : `Precondition Required`,
	429 : `Too Many Requests`,
	431 : `Request Header Fields Too Large`,
	444 : `No Response (Nginx)`,
	449 : `Retry With (Microsoft)`,
	450 : `Blocked by Windows Parental Controls (Microsoft)`,
	451 : `Unavailable For Legal Reasons`,
	499 : `Client Closed Request (Nginx)`,
	500 : `Internal Server Error`,
	501 : `Not Implemented`,
	502 : `Bad Gateway`,
	503 : `Service Unavailable`,
	504 : `Gateway Timeout`,
	505 : `HTTP Version Not Supported`,
	506 : `Variant Also Negotiates (Experimental)`,
	507 : `Insufficient Storage (WebDAV)`,
	508 : `Loop Detected (WebDAV)`,
	509 : `Bandwidth Limit Exceeded (Apache)`,
	510 : `Not Extended`,
	511 : `Network Authentication Required`,
	598 : `Network read timeout error`,
	599 : `Network connect timeout error`,
});

const ARTISTS = [
  `1200 Micrograms`,
  `4TLR`,
  `65daysofstatic`,
  `A Silver Mt. Zion`,
  `A Tribe Called Quest`,
  `AFI`,
  `AFX`,
  `ANNA`,
  `Abigail Wyles`,
  `Abner Jay`,
  `Ace Creator`,
  `Aceyalone`,
  `Adem`,
  `Adventure Time`,
  `Aesop Rock`,
  `Air`,
  `Alarm Will Sound`,
  `Album Artwork`,
  `Alessandro Cortini`,
  `Alex Somers`,
  `Alexisonfire`,
  `Ali Farka Toure`,
  `Alice Coltrane`,
  `All That Remains`,
  `Alpaca`,
  `Amadou & Mariam`,
  `Amadou + Mariam`,
  `Amnesia Scanner`,
  `Amon Tobin`,
  `Anal Cunt`,
  `Analog Brothers`,
  `Ananda Shankar`,
  `André Bratten`,
  `Andy Stott`,
  `Animal Collective`,
  `Animals As Leaders`,
  `Antibalas`,
  `Aphex Twin`,
  `Apparat`,
  `Arca`,
  `Arctic Monkeys`,
  `Arecibo`,
  `Armor For Sleep`,
  `As Tall As Lions`,
  `Asobi Seksu`,
  `At The Drive-In`,
  `Atoms for Peace`,
  `Autechre`,
  `Auto Aggression`,
  `Automatically Add to iTunes`,
  `Avey Tare`,
  `Aïsha Devi`,
  `BABii`,
  `Bad Brains`,
  `Badly Drawn Boy`,
  `Balmorhea`,
  `Band of Horses`,
  `Banton`,
  `Bark Psychosis`,
  `Bassobese`,
  `Battle of Mice`,
  `Battles`,
  `Beach House`,
  `Beats Antique`,
  `Beirut`,
  `Ben Chatwin`,
  `Ben Frost`,
  `Ben Kamen`,
  `Ben Lukas Boysen`,
  `Ben Salisbury`,
  `Bendik Giske`,
  `Benga`,
  `Benga & Coki`,
  `Benga & Walsh`,
  `Benjamin Damage`,
  `Benoit Pioulard`,
  `Bernd Ruf`,
  `Bicep`,
  `Big Brother & The Holding Company`,
  `Bikini Kill`,
  `Bill Hicks`,
  `Billie Holiday`,
  `Birdy Nam Nam`,
  `Bishop Nehru`,
  `Bjork`,
  `Black Flag`,
  `Black Moth Super Rainbow`,
  `Black Sabbath`,
  `Black Taffy`,
  `Blackdown`,
  `BlakRoc`,
  `Blanck Mass`,
  `Bloc Party`,
  `Blonde Redhead`,
  `Blu & Exile`,
  `Bo Burnham`,
  `Boards of Canada`,
  `Bohren & Der Club Of Gore`,
  `Bohren und der Club of Gore`,
  `Bonobo`,
  `Books`,
  `Born In Flamez`,
  `Bosnian Rainbows`,
  `Bouncing Souls`,
  `Boxcutter`,
  `Brandt Brauer Frick`,
  `Brian Eno`,
  `Bright Eyes`,
  `Burial`,
  `Burial & Four Tet`,
  `Calenda`,
  `Calexico`,
  `Cambodian Rocks`,
  `Captain Beefheart`,
  `Captain Murphy`,
  `Cardiacs`,
  `Caribou`,
  `Carla dal Forno`,
  `Carolina Eyck`,
  `Carter Tutti Void`,
  `Casey MQ`,
  `Cat Power`,
  `Caterina Barbieri`,
  `Cerys Matthews`,
  `Cesaria Evora`,
  `Charles Bradley`,
  `Charlotte Gainsbourg`,
  `Chelsea Wolfe`,
  `Chris Carter`,
  `Christian Löffler`,
  `Christian Scott aTunde Adjuah`,
  `Circa Survive`,
  `City And Colour`,
  `Clams Casino`,
  `Clara La San`,
  `Clark`,
  `Clint Mansell`,
  `Clubroot`,
  `CocoRosie`,
  `Cocteau Twins`,
  `Cocteau Twins & Harold Budd`,
  `Coki`,
  `Colin Benders`,
  `Colin Stetson`,
  `Colin Stetson`,
  `Sarah Neufeld`,
  `Context Chameleon`,
  `Corpo-Mente`,
  `Cory Wong`,
  `Cosmin TRG`,
  `Cranes`,
  `Crendore`,
  `Crendore & Glitchy 'n Scratchy`,
  `Croatian Amor`,
  `Crystal Castles`,
  `Cult of Luna`,
  `Cut Copy`,
  `Cuushe`,
  `DAVID AUGUST`,
  `DJ Krave`,
  `DJ Movement`,
  `DJ Shadow`,
  `DJ Spooky`,
  `Daedelus`,
  `Daft Punk`,
  `Dam-Funk`,
  `Dan the Automator`,
  `Danger Mouse And Sparklehorse`,
  `Daniel Avery`,
  `Darkstar`,
  `David Bowie`,
  `David Byrne & St. Vincent`,
  `David Christiansen`,
  `David Sylvian`,
  `David Thomas Broughton`,
  `De La Sol`,
  `Dead Kennedys`,
  `Deadbeat`,
  `Death Cab For Cutie`,
  `Death Grips`,
  `Deep Purple`,
  `Deerhoof`,
  `Deerhunter`,
  `Delorean`,
  `Deltron`,
  `Dengue Fever`,
  `Detroit Grease Vol. 1`,
  `Dictaphone`,
  `Digital Mystikz`,
  `Dillinger Escape Plan`,
  `Dimlite`,
  `Disclosure`,
  `Distance`,
  `Djrum`,
  `Do Make Say Think`,
  `Dobrawa Czocher`,
  `Doc Daneeka`,
  `Does It Offend You, Yeah`,
  `Domo Genesis`,
  `Dr. Dooom`,
  `Dr. Dre`,
  `Dr. Octagon`,
  `Dropkick Murphys`,
  `EPROM`,
  `ERICKSON Roky`,
  `Eartheater`,
  `Echo Collective`,
  `Echo Go Away`,
  `Eddie Gale`,
  `Edvard Grieg`,
  `Eels`,
  `El Perro del Mar`,
  `El Ten Eleven`,
  `Eli Keszler`,
  `Eliot Lipp`,
  `Ellen Allien`,
  `Emeralds`,
  `Emika`,
  `Emmure`,
  `Emptyset`,
  `Eno_Wobble`,
  `Essential Mix`,
  `Eurythmics`,
  `Eversines`,
  `Ex Eye`,
  `Exile`,
  `Exit Order`,
  `Explosions in the Sky`,
  `Eyedea & Abilities`,
  `Eyes Set To Kill`,
  `FIDLAR`,
  `FJAAK`,
  `Fear Before the March of Flames`,
  `Fela Kuti`,
  `Fela Ransome Kuti`,
  `Fennesz`,
  `Fever`,
  `Fever Ray`,
  `First Aid Kit`,
  `Fizzarum`,
  `Flavien Berger`,
  `Flight of the Conchords`,
  `Floating Points`,
  `Flogging Molly`,
  `Florence and The Machine`,
  `Flying Lotus`,
  `Foals`,
  `Forest Swords`,
  `Four Tet`,
  `Frameworks`,
  `Frank Ocean`,
  `Frank Wiedemann`,
  `Frankie Rose`,
  `Free The Robots`,
  `Frequencies [Hz]`,
  `Fripp & Eno`,
  `From A Second Story Window`,
  `From Monument to Masses`,
  `Fuck Buttons`,
  `Funkadelic`,
  `G.B. Beckers`,
  `GZA`,
  `Gaslamp Killer`,
  `Gayngs`,
  `Geeneus`,
  `Geiom`,
  `Geoff Barrow`,
  `Gesaffelstein`,
  `Gescom`,
  `Ghislain Poirier`,
  `Ghost`,
  `Ghost BC`,
  `Ghostface Killah`,
  `Gidge`,
  `Gil Scott-Heron`,
  `Ginger Bake`,
  `God Is An Astronaut`,
  `Godspeed You Black Emperor!`,
  `Gogol Bordello`,
  `Gojira`,
  `Gotan Project`,
  `Gravediggaz`,
  `Grouper`,
  `Gui Boratto`,
  `Gustavo Cerati`,
  `HORSE the Band`,
  `HVOB`,
  `Hallucinogen`,
  `Hania Rani`,
  `Hans Zimmer`,
  `Harrys Gym`,
  `Hatcha & Benga`,
  `Headhunter`,
  `Health`,
  `Heliocentrics`,
  `Her Space Holiday`,
  `Hernan Cattaneo`,
  `Herr Jazz`,
  `Hidden Orchestra`,
  `Hieroglyphics`,
  `High On Fire`,
  `Hijak`,
  `Hiro Kone`,
  `Hodgy Beats`,
  `Holly Herndon`,
  `Holy Fuck`,
  `How To Destroy Angels`,
  `Howling`,
  `Hudson Mohawke`,
  `Hyperdub`,
  `I, Robot`,
  `Iggy Pop`,
  `Iglooghost`,
  `Ikonika`,
  `Imaad Wasif`,
  `Immortal Technique`,
  `Imogen Heap`,
  `Information`,
  `Interpol`,
  `Intronaut`,
  `Iron And Wine`,
  `Isaac Hayes`,
  `Isan`,
  `Ital Tek`,
  `J Dilla`,
  `Jack White`,
  `Jackson And His Computer Band`,
  `Jacques Greene`,
  `Jaga Jazzist`,
  `James Blake`,
  `James Brown`,
  `James Holden`,
  `Jan Davis`,
  `Japandroids`,
  `Jason Richardson`,
  `Jazzanova`,
  `Jel`,
  `Jim O'Rourke`,
  `Jinadu`,
  `Jlin`,
  `Jogger`,
  `John Cage`,
  `John Coltrane`,
  `Johnny Fortune`,
  `Joker`,
  `Jon Batiste`,
  `Jon Hopkins`,
  `Jono McCleery`,
  `Joy Division`,
  `Joy Orbison`,
  `JuJu`,
  `Juana Molina`,
  `Julia Holter`,
  `Julia Jacklin`,
  `Julia Kent, Jean D.L.`,
  `Julianna Barwick`,
  `Justice`,
  `KEVIN JOHANSEN`,
  `Kai Engel`,
  `Kaitlyn Aurelia Smith`,
  `Kamasi Washington`,
  `Kangding Ray`,
  `Kashiwa Daisuke`,
  `Keiji Haino`,
  `Kelly Moran`,
  `Kiasmos`,
  `Kieran Hebden`,
  `King Midas Sound`,
  `Kings Of Leon`,
  `Klaxons`,
  `Kode 9`,
  `Kode9`,
  `Kode9 & The Spaceape`,
  `Kool Keith`,
  `Kraak & Smaak`,
  `Kraftwerk`,
  `Kristjan Järvi`,
  `Kromestar`,
  `Kronos Quartet`,
  `LA Vampires`,
  `LAAKE`,
  `Labrinth`,
  `Ladytron`,
  `Lambert`,
  `Laundromat Robbery`,
  `Lauryn Hill`,
  `Lazerhawk`,
  `Led Zeppelin`,
  `Lee Scratch Perry`,
  `Lemontrip`,
  `Liars`,
  `Lightnin' Hopkins`,
  `Liima`,
  `Liminal`,
  `Lindstrøm`,
  `Lisa Morgenstern`,
  `Loefah`,
  `Lokey`,
  `Lorde`,
  `Lorn`,
  `Lorna Shore`,
  `Loscil`,
  `Low`,
  `Low End Theory`,
  `Lower Spectrum`,
  `Luke Abbott`,
  `Luke Lalonde`,
  `Luke Slater`,
  `Lustmord`,
  `Lux and Ivy's Favorites`,
  `M. Geddes Gengras`,
  `M.I.A`,
  `M83`,
  `MA.MOYO`,
  `MAD PROFESSOR & LEE PERRY`,
  `MEGASOID`,
  `MF DOOM`,
  `MF Doom`,
  `MSTRKRFT`,
  `MVMNT`,
  `Machinefabriek`,
  `Mad Professor & Lee Scratcher Perry`,
  `Madlib`,
  `Madvillain`,
  `Maer`,
  `Magnetic Man`,
  `Makeness`,
  `Maktub`,
  `Malibu`,
  `Mammal Hands`,
  `Manu Chao`,
  `Maps and Atlases`,
  `Marc Moulin`,
  `Marconi Union`,
  `Maribou State`,
  `Marilyn Manson`,
  `Marnie Stern`,
  `Martin Roth`,
  `Mary Anne Hobbs`,
  `Massive Attack`,
  `Masters of Illusion`,
  `Mastodon`,
  `Matt Helders`,
  `Matthew Halsall`,
  `Matty G`,
  `Max Cooper`,
  `Max Payne 3`,
  `Maxime Delpierre`,
  `May The Muse`,
  `Mayer Hawthorne`,
  `Meat Beat Manifesto`,
  `Meshuggah`,
  `Melt Banana`,
  `Melvins`,
  `Merzbow`,
  `Metallica`,
  `Mgmt`,
  `Mice Parade`,
  `Miguel Atwood-Ferguson`,
  `Mike Clark`,
  `Miles Davis`,
  `Minor Threat`,
  `Misfits`,
  `Moderat`,
  `Modeselektor`,
  `Mogwai`,
  `Molero`,
  `Mono`,
  `Mono poly`,
  `Morphine`,
  `Morrissey`,
  `Mos Def`,
  `Mosca`,
  `Mosh`,
  `Mouth Of The Architect`,
  `Movement`,
  `Mr. Oizo`,
  `Mr. Yote`,
  `Mulatu Astatke`,
  `Mulatu Astatke & The Heliocentrics`,
  `Murcof`,
  `Murder City Devils`,
  `Murlo`,
  `M|O|O|N`,
  `N-Type`,
  `N.A.S.A`,
  `N.W.A.`,
  `Narcosis`,
  `Nathan Fake`,
  `National Philharmonic Orchestra`,
  `Neutral Milk Hotel`,
  `Nevermen`,
  `New York Dolls`,
  `Nick Cave`,
  `Nick Cave & The Bad Seeds`,
  `Nick Cave and the Bad Seeds`,
  `Niels Broos`,
  `Nils Frahm`,
  `Nina Simone`,
  `Nine Inch Nails`,
  `No Idols`,
  `No lo soporto`,
  `Nobody`,
  `Nordic Pulse Ensemble`,
  `Nosaj Thing`,
  `OFWGKTA`,
  `Ocoeur`,
  `Odd Future`,
  `Odd Nosdam`,
  `Oklou`,
  `Olga Wojciechowska`,
  `Oliver Coates`,
  `Om Unit`,
  `One Little Plane`,
  `Oneohtrix Point Never`,
  `Operation Ivy`,
  `Orbit`,
  `Orbital`,
  `Original Soundtrack`,
  `Otis Redding`,
  `Otzeki`,
  `Owen Pallett`,
  `Oxbow`,
  `Pan Sonic`,
  `Panasonic`,
  `Panda Bear`,
  `Pantera`,
  `Pascal Schumacher`,
  `Patricia`,
  `Patrick O'Hearn`,
  `Paul Kalkbrenner`,
  `Peanut Butter Wolf`,
  `Percussions`,
  `Peter Gregson`,
  `Peter Talisman`,
  `Phantogram`,
  `Philip Glass`,
  `Philip Glass & the Kronos Quartet`,
  `Photay`,
  `Pinback`,
  `Pinch & Distance`,
  `Plaid`,
  `Plasticman`,
  `Polka Dot Slim`,
  `Polvo`,
  `Polyphia`,
  `Populous`,
  `Portico Quartet`,
  `Portishead`,
  `Portugal. The Man`,
  `Prefuse 73`,
  `Pressure & Warrior Queen`,
  `Previous iTunes Libraries`,
  `Primitive Man`,
  `Primus`,
  `Prince Rama`,
  `Proem`,
  `Public Enemy`,
  `Purity Ring`,
  `RJD2`,
  `Rachel Sermanni`,
  `Radiohead`,
  `Random Trio`,
  `Ras G`,
  `Ratatat`,
  `Ravi Shankar`,
  `Refused`,
  `Reggie Watts`,
  `Remembering Never`,
  `Reso`,
  `Richard D James`,
  `Rival Consoles`,
  `Rob Lewis`,
  `Rob Zombie`,
  `Robert Fripp`,
  `Robert Plant`,
  `Robot Koch`,
  `Roger Doyle`,
  `Roky Erickson`,
  `Roky Erickson & The Aliens`,
  `Roll the Dice`,
  `Roly Porter`,
  `Ronnie Dawson`,
  `Roska`,
  `Roy Orbison`,
  `Royksopp`,
  `Rusko & Caspa`,
  `Rødhåd`,
  `S U R V I V E`,
  `SHXCXCHCXSH`,
  `SUN RA`,
  `Samiyam`,
  `Samuel Organ`,
  `Saosin`,
  `Sasha`,
  `Saul Williams`,
  `Say Anything`,
  `Say Hi To Your Mom`,
  `Scary Kids Scaring Kids`,
  `Screamin' Jay Hawkins`,
  `Scuba`,
  `Sebastien Tellier`,
  `Secret Chiefs 3`,
  `Secret Frequency Crew`,
  `Seda`,
  `Seefeel`,
  `Serge Gainsbourg`,
  `Sex Pistols`,
  `Shackleton`,
  `Sheltered`,
  `Shingo Suzuki`,
  `Shlohmo`,
  `Shpongle`,
  `Silkie`,
  `Silver Mt. Zion Memorial Orchestra & Tra`,
  `Siriusmo`,
  `Sisters Of Transistors`,
  `Skream`,
  `Slagsmalsklubben`,
  `Slaughterhouse`,
  `Slayer`,
  `Sleep Token`,
  `Sleeping People`,
  `Slick Rick`,
  `Slipknot`,
  `Slugabed`,
  `Sneaker Pimps`,
  `Social Distortion`,
  `Solomon Grey`,
  `Sonic Youth`,
  `Soul Position`,
  `Sparklehorse`,
  `Sparta`,
  `Spoon`,
  `Squarepusher`,
  `St. Vincent`,
  `Stars of the Lid`,
  `Steffi`,
  `Steve Hauschildt`,
  `Steve Reich`,
  `Steve Roach`,
  `Steve Roach & Jeffrey Fayman`,
  `Stick To Your Guns`,
  `Stimming`,
  `Stone Giants`,
  `Stone Temple Pilots`,
  `Strangeloop`,
  `String Quartet`,
  `Sub Version`,
  `Sufjan Stevens`,
  `Suicide`,
  `Sunda Arc`,
  `Sunny Day Real Estate`,
  `Swans`,
  `T.S.O.L`,
  `TOKiMONSTA`,
  `TOOL`,
  `TV On The Radio`,
  `Talib Kweli`,
  `Tangents`,
  `Tangerine Dream`,
  `Tao Jones`,
  `Tayo Meets Acid Rockers Uptown`,
  `Teargas`,
  `Teebs`,
  `Telos`,
  `Tera Melos`,
  `Terakaft`,
  `Terence McKenna`,
  `Terror`,
  `Terry Riley`,
  `Tes La Rok`,
  `The Arcade Fire`,
  `The Automator`,
  `The Beach Boys`,
  `The Beastie Boys`,
  `The Beatles`,
  `The Beta Band`,
  `The Black Angels`,
  `The Black Dahlia Murder`,
  `The Black Keys`,
  `The Books`,
  `The Brian Jonestown Massacre`,
  `The Bronx`,
  `The Bug`,
  `The Cherokees`,
  `The Cinematic Orchestra`,
  `The Collins Kids`,
  `The Comet Is Coming`,
  `The Cramps`,
  `The Cure`,
  `The Dead Weather`,
  `The Dear Hunter`,
  `The Decemberists`,
  `The Doors`,
  `The Fall`,
  `The Fall Of Troy`,
  `The Fire Theft`,
  `The Flaming Lips`,
  `The Future Sound Of London`,
  `The Gaslamp Killer`,
  `The Gentleman Losers`,
  `The Glitch Mob`,
  `The Hong Kongs`,
  `The Horrors`,
  `The Human Abstract`,
  `The Hunt For Yoshi`,
  `The Kilimanjaro Darkjazz Ensemble`,
  `The Kinks`,
  `The Knife`,
  `The Long Lost`,
  `The Mae Shi`,
  `The Mars Volta`,
  `The Misfits`,
  `The Murder City Devils`,
  `The Mysterons`,
  `The Others`,
  `The Phat Conductor`,
  `The Pixies`,
  `The Pogues`,
  `The Polyphonic Spree`,
  `The Raconteurs`,
  `The Ramones`,
  `The Receiving End Of Sirens`,
  `The Sensational Nightingales`,
  `The Shins`,
  `The Silver Mt. Zion`,
  `The Sleeping`,
  `The Smashing Pumpkins`,
  `The Smiths`,
  `The Sound Of Animals Fighting`,
  `The Stooges`,
  `The Strokes`,
  `The Used`,
  `The Velvet Underground`,
  `The White Stripes`,
  `The XX`,
  `Thee Oh Sees`,
  `Thee Silver Mountain Reveries`,
  `Thievery Corporation`,
  `Thom Yorke`,
  `Thrice`,
  `Throbbing Gristle`,
  `Throwing Snow`,
  `Thursday`,
  `Thys`,
  `Tiger Lou`,
  `Tim Hecker`,
  `Tobacco`,
  `Tokyo Police Club`,
  `Tom Findlay, Andy Cato`,
  `Tom Waits`,
  `Tomoki Sanders`,
  `Tool`,
  `Tor`,
  `Toro Y Moi`,
  `Tortoise`,
  `Trentemoller`,
  `Trigg & Gusset`,
  `Tristan De Liege`,
  `Tron Legacy - Soundtrack by Daft Punk`,
  `Two Gallants`,
  `Ty Segall`,
  `Tycho`,
  `Tyler, The Creator`,
  `Ulrich Schnauss`,
  `Ultra`,
  `Ultramagnetic MC's`,
  `Ultramagnetic MCs`,
  `Under The Influence of Giants`,
  `Underoath`,
  `Untold`,
  `Vampire Weekend`,
  `Vangelis`,
  `Vatican Shadow`,
  `Velvet Underground`,
  `Venetian Snares`,
  `Vieux Farka Toure`,
  `Violent Femmes`,
  `Vittoria Fleet`,
  `Voices Of East Harlem`,
  `Wavves`,
  `Wax Tailor`,
  `We Are Scientists`,
  `Weird Dreams`,
  `Weval`,
  `White Rabbits`,
  `White Zombie`,
  `WhoMadeWho`,
  `Willi Boskovsky`,
  `William Basinski`,
  `William Orbit`,
  `Windhand`,
  `Winston Marshall`,
  `Wolf`,
  `Wu-Tang`,
  `X-Ray_Spex`,
  `Yair Elazar Glotman`,
  `Yamila`,
  `Yeah Yeah Yeahs`,
  `Yeasayer`,
  `Young Magic`,
  `Yves Tumor`,
  `Z Trip`,
  `Zach Hill`,
  `Zendaya`,
  `Zomby`,
  `alva noto`,
  `as i lay dying`,
  `elliott smith`,
  `genghis tron`,
  `good kid, m.A.A.d city`,
  `jonny cash`,
  `monty`,
  `xBishopx`,
  `･ ･－･ ･－ ･･･ ･ －･･`,
];








