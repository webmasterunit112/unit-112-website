/* Starting content for the Unit 112 site. Once the webmaster saves from the admin panel,
   the saved copy (on the server, or in this browser in demo mode) replaces this. */
window.DEFAULT_SITE = {
  version: 1,
  settings: {
    siteName: "ACBL Unit 112",
    tagline: "Duplicate bridge across Central & Western New York",
    logo: "",
    logoAlt: "ACBL Unit 112 logo",
    favicon: "",
    headerStyle: "left",
    showSuits: true,
    font: "atkinson",
    headingFont: "literata",
    baseSize: 20,
    colors: { primary: "#1C4966", secondary: "#2F6B4F", accent: "#C08A2B", bg: "#F3F7F6", surface: "#FFFFFF", text: "#15232B" },
    footerText: "ACBL Unit 112 is a unit of District 4 of the American Contract Bridge League.",
    contactEmail: "",
    showSuggest: true,
    alert: { on: false, level: "urgent", text: "", link: "", until: "" },
    partnerLinks: [
      { id: "p1", name: "American Contract Bridge League", url: "https://www.acbl.org", img: "" },
      { id: "p2", name: "ACBL District 4", url: "https://4acbl.org", img: "" }
    ],
    homeSections: [
      { id: "welcome", label: "Welcome message", show: true },
      { id: "next", label: "Next tournament (with countdown)", show: true },
      { id: "today", label: "Club games today and tomorrow", show: true },
      { id: "results", label: "Latest tournament results", show: true },
      { id: "news", label: "News & announcements", show: true },
      { id: "clubs", label: "Club results quick links", show: true },
      { id: "signup", label: "Email reminder sign-up", show: true }
    ]
  },
  pages: [
    { id: "home", title: "Home", show: true, builtIn: true },
    { id: "tournaments", title: "Tournaments & Results", show: true, builtIn: true },
    { id: "clubs", title: "Clubs", show: true, builtIn: true },
    { id: "newplayers", title: "New Players", show: true, builtIn: true },
    { id: "learn", title: "Learn to Play", show: true, builtIn: true },
    { id: "recognition", title: "Player Recognition", show: true, builtIn: true },
    { id: "gallery", title: "Photos", show: true, builtIn: true },
    { id: "about", title: "About the Unit", show: true, builtIn: true },
    { id: "documents", title: "Board Documents", show: true, builtIn: true },
    { id: "contact", title: "Contact", show: true, builtIn: true }
  ],
  content: {
    welcomeTitle: "Welcome to ACBL Unit 112",
    welcome: "Unit 112 of the American Contract Bridge League serves duplicate bridge players from Rochester, Canandaigua and Geneseo to Syracuse, Oswego, Ithaca, Elmira, Vestal and the Mohawk Valley.\n\nWe run sectional tournaments, support our local clubs, and welcome players at every level, from your first game to your gold points.",
    tournamentsIntro: "Sectional tournaments and district events in and around Unit 112. Results links appear automatically once a tournament begins.",
    clubsIntro: "Find a game near you. Each club posts results to ACBL Live for Clubs, and most also post Common Game hand records and analysis.",
    newplayers: "## New to duplicate bridge?\nYou are welcome at any of our clubs. Most clubs run games for newer players, and directors are happy to help you find a partner.\n\n## Free play for new members\nThe unit offers **free play certificates** for new ACBL members and for players who reach new ranks. Ask your club director or a board member how to get yours.\n\n## Your first sectional\nSectionals are one- or two-day tournaments. Many have events just for newer players, such as **Non-Life Master** and **499er** games, where you play against people at your own level and earn silver points.\n\n## Useful links\n- [Join the ACBL or renew your membership](https://www.acbl.org)\n- [Check your masterpoints on MyACBL](https://my.acbl.org)\n- [District 4 tournaments and news](https://4acbl.org)",
    recognitionIntro: "Congratulations to Unit 112 players on their achievements. Club directors and players can send milestones to the webmaster.",
    about: "Unit 112 is one of the units in ACBL District 4. The unit's board organizes sectional tournaments, supports member clubs, promotes the game, and recognizes player achievements.\n\nBoard meetings are open to unit members. Minutes and other board documents are posted on the Board Documents page.",
    documentsIntro: "Bylaws, meeting minutes, financial reports and other board documents.",
    learn: "Bridge is a card game for four players in two partnerships. It is easy to start and takes a lifetime to master. Lessons are the fastest way in: you learn the basics with other beginners and play your first hands with a teacher nearby.",
    galleryIntro: "Photos from Unit 112 tournaments, club games and celebrations.",
    signupTitle: "Get tournament reminders by email",
    signupText: "We send a short email before each sectional in the unit. No more than a few a month. Unsubscribe any time.",
    suggestTitle: "Suggest a change to the website",
    suggestText: "Spotted a mistake, or have an idea to make the site easier to use? Tell the webmaster here.",
    contact: "Questions about the unit, a tournament or this website? Contact any board member listed below, or ask the director at your club.\n\nTo report a problem with the website or suggest a change, use the form below."
  },
  news: [
    { id: "n1", date: "2026-09-23", title: "Welcome to the new Unit 112 website", body: "The unit's website has a new look with larger text and simpler menus. Use the **A A A** buttons at the top of any page to make the text bigger.", pinned: true, expires: "" },
    { id: "n2", date: "2026-09-06", title: "Rochester I/N Sectional results are posted", body: "Results from the September 4–5 Rochester Intermediate/Novice Sectional are on the Tournaments & Results page.", pinned: false, expires: "" }
  ],
  tournaments: [
    { id: "t1", name: "Rochester I/N Sectional", type: "Sectional", start: "2026-09-04", end: "2026-09-05", city: "Rochester", venue: "", sanction: "2609380", flyerUrl: "", resultsUrl: "", notes: "Intermediate/Novice sectional", address: "", sessions: [], hotels: "", food: "", parking: "", partnership: "", contacts: "", details: "", bulletins: [] },
    { id: "t2", name: "Oswego Non-Life Master / 499er Sectional", type: "Sectional", start: "2026-09-19", end: "2026-09-19", city: "Oswego", venue: "", sanction: "2609350", flyerUrl: "", resultsUrl: "", notes: "", address: "", sessions: [], hotels: "", food: "", parking: "", partnership: "", contacts: "", details: "", bulletins: [] },
    { id: "t3", name: "NAP Flight B District Finals", type: "NAP", start: "2026-10-03", end: "2026-10-03", city: "Canandaigua", venue: "", sanction: "", flyerUrl: "https://4acbl.org/wp-content/uploads/2026/08/NAP-26-B-Canandaigua-Registration.pdf", resultsUrl: "", notes: "North American Pairs, Flight B", address: "", sessions: [], hotels: "", food: "", parking: "", partnership: "", contacts: "", details: "", bulletins: [] },
    { id: "t4", name: "Rochester Fall Sectional", type: "Sectional", start: "2026-10-10", end: "2026-10-11", city: "Rochester", venue: "", sanction: "2610314", flyerUrl: "", resultsUrl: "", notes: "", address: "", sessions: [], hotels: "", food: "", parking: "", partnership: "", contacts: "", details: "", bulletins: [] },
    { id: "t5", name: "NAP Flight C District Finals", type: "NAP", start: "2026-10-24", end: "2026-10-24", city: "Canandaigua", venue: "", sanction: "", flyerUrl: "https://4acbl.org/wp-content/uploads/2026/08/NAP-26-C-Canandaigua-Registration.pdf", resultsUrl: "", notes: "North American Pairs, Flight C", address: "", sessions: [], hotels: "", food: "", parking: "", partnership: "", contacts: "", details: "", bulletins: [] },
    { id: "t6", name: "NAP Flight C District Finals", type: "NAP", start: "2026-10-24", end: "2026-10-24", city: "Elmira", venue: "", sanction: "", flyerUrl: "https://4acbl.org/wp-content/uploads/2026/08/NAP-26-C-Elmira-Registration.pdf", resultsUrl: "", notes: "North American Pairs, Flight C", address: "", sessions: [], hotels: "", food: "", parking: "", partnership: "", contacts: "", details: "", bulletins: [] },
    { id: "t7", name: "Finger Lakes Sectional", type: "Sectional", start: "2026-11-07", end: "2026-11-08", city: "", venue: "", sanction: "2611312", flyerUrl: "", resultsUrl: "", notes: "", address: "", sessions: [], hotels: "", food: "", parking: "", partnership: "", contacts: "", details: "", bulletins: [] }
  ],
  clubs: [
    { id: "c1", name: "Canandaigua", city: "Canandaigua", clubNumber: "128595", schedule: "", address: "", contact: "", website: "", liveUrl: "", tcgUrl: "", noTcg: false, games: [] },
    { id: "c2", name: "Elmira (Wednesday)", city: "Elmira", clubNumber: "255059", schedule: "", address: "", contact: "", website: "", liveUrl: "", tcgUrl: "", noTcg: false, games: [{ day: "Wed", time: "", label: "" }] },
    { id: "c3", name: "Elmira (Friday)", city: "Elmira", clubNumber: "272633", schedule: "", address: "", contact: "", website: "", liveUrl: "", tcgUrl: "", noTcg: false, games: [{ day: "Fri", time: "", label: "" }] },
    { id: "c4", name: "Geneseo", city: "Geneseo", clubNumber: "213629", schedule: "", address: "", contact: "", website: "", liveUrl: "", tcgUrl: "", noTcg: false, games: [] },
    { id: "c5", name: "Ithaca", city: "Ithaca", clubNumber: "117465", schedule: "", address: "", contact: "", website: "", liveUrl: "", tcgUrl: "", noTcg: false, games: [] },
    { id: "c6", name: "Mohawk Valley", city: "Mohawk Valley", clubNumber: "202135", schedule: "", address: "", contact: "", website: "", liveUrl: "", tcgUrl: "", noTcg: true, games: [] },
    { id: "c7", name: "Oswego", city: "Oswego", clubNumber: "120279", schedule: "", address: "", contact: "", website: "", liveUrl: "", tcgUrl: "", noTcg: false, games: [] },
    { id: "c8", name: "Rochester", city: "Rochester", clubNumber: "227546", schedule: "", address: "", contact: "", website: "", liveUrl: "", tcgUrl: "", noTcg: false, games: [] },
    { id: "c9", name: "Greater Rochester", city: "Rochester", clubNumber: "218065", schedule: "", address: "", contact: "", website: "", liveUrl: "", tcgUrl: "", noTcg: false, games: [] },
    { id: "c10", name: "Syracuse", city: "Syracuse", clubNumber: "145870", schedule: "", address: "", contact: "", website: "", liveUrl: "", tcgUrl: "", noTcg: false, games: [] },
    { id: "c11", name: "Vestal", city: "Vestal", clubNumber: "223479", schedule: "", address: "", contact: "", website: "", liveUrl: "https://my.acbl.org/club-results/details/1361353", tcgUrl: "", noTcg: false, games: [] }
  ],
  board: [
    { id: "b1", name: "Betty Youmans", role: "President", email: "" },
    { id: "b2", name: "Noah Bell", role: "Webmaster", email: "" }
  ],
  documents: [],
  learn: {
    teachers: [],
    resources: [
      { id: "l1", title: "ACBL: Learn to play bridge", url: "https://www.acbl.org/learn/" },
      { id: "l2", title: "Free Learn to Play Bridge software (ACBL)", url: "https://web3.acbl.org/newmembers/free-learn-software" },
      { id: "l3", title: "ACBL bridge lesson library", url: "https://www.acbl.org/cg-lessons/" },
      { id: "l4", title: "Play online at Bridge Base Online", url: "https://www.bridgebase.com" }
    ]
  },
  gallery: [],
  recognition: {
    lifeMasters: [],
    milestones: [],
    links: [
      { id: "r1", title: "Ace of Clubs and Mini-McKenney standings (ACBL)", url: "https://www.acbl.org/masterpoints/" }
    ]
  }
};
