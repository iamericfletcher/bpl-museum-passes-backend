# Boston Public Library Museum Pass Notification Application - Back End Repo

I recently joined the Boston Public Library.

Members can reserve museum passes through their [Museum Pass Reservation System](https://www.bpl.org/reserve-a-museum-pass/).

Unfortunately, their current reservation system does not include user notifications so users must continually return to the site to check if a museum pass has become available due to cancellation, etc.

I found this frustrating, so I built a notification application that notifies users when the next pass becomes available via email and/or text (us-based numbers only).

Most of the museum options have plenty of passes available all the time. This application is more helpful for the small number of museums that regularly have no passes available in the near term (Isabella Stewart Gardner Museum, etc.)

Data is deleted from the database whenever a notification is sent out or if a pass doesn't become available by end of the day on the user provided date of visit. Absolutely no data is used for any other purpose such as marketing or advertising.

Link to the front end GitHub repository - https://github.com/iamericfletcher/bpl-museum-passes

## Technology Stack

**Next.js**

**Material UI**

**Prisma to interface with the Heroku PostgreSQL database**

**Twillio for Texts - Note only works for US-based mobile phone numbers**

**Mailgun for Emails**

**Vercel for hosting the front end**

**Digital Ocean for hosting the Node back end**

Started off with Vercel hosting the front end and back end, but very quickly eclipsed their [serverless functions execution timeout](https://vercel.com/docs/concepts/functions/serverless-functions#execution-timeout) threshold. 

There is a ton a web scraping that needs to take place, so my serverless functions were taking between 3-4 minutes to complete. [Nathan @Yofou](https://github.com/Yofou) was gracious enough to help me decouple the back end code from the Next.js codebase. 

**PM2 for process management**

## Description

The application scrapes the [Museum Pass Reservation System](https://www.bpl.org/reserve-a-museum-pass/) website every 1.5 hours. 

With the scraped data, it builds an object the contains:

1. The last time the scraping took place:

```
"lastScraped": "2022-09-12T11:56:45.900Z"
```

2. Museum names used formatted for use in form's select field:

```
"museumNamesForSelectField": [
"Boston Children's Museum ",
"Boston Harbor Islands",
"DCR - Mass Dept of Conservation and Recreation",
"Hale Reservation",
"Harvard Museums of Science and Culture",
"ICA - Institute of Contemporary Art",
"Isabella Stewart Gardner Museum ",
"John F Kennedy Library and Museum",
"Larz Anderson Auto Museum",
"Mass Audubon Wildlife Sanctuary",
"Museum of Fine Arts ",
"Museum of Science ",
"New England Aquarium ",
"Old South Meeting House",
"Peabody Essex Museum",
"Trustees GO Pass",
"USS Constitution Museum",
"Zoo New England"
]
```

3. Museum names unformatted to be used in the scraping process + URL included in the email and/or text notifications:

```
"museumNamesForScraping": [
"Boston Children's Museum (e-ticket)",
"Boston Harbor Islands",
"DCR - Mass Dept of Conservation and Recreation",
"Hale Reservation",
"Harvard Museums of Science and Culture",
"ICA - Institute of Contemporary Art",
"Isabella Stewart Gardner Museum (promo code)",
"John F Kennedy Library and Museum",
"Larz Anderson Auto Museum",
"Mass Audubon Wildlife Sanctuary",
"Museum of Fine Arts (e-voucher)",
"Museum of Science (e-ticket)",
"New England Aquarium (e-coupon)",
"Old South Meeting House",
"Peabody Essex Museum",
"Trustees GO Pass",
"USS Constitution Museum",
"Zoo New England"
]
```

4. Museum name and museum pass counts for each day (museum allows users to select dates that are +60 days in the future - below data is abbreviated). 


```
museumObj": {
"Boston Children's Museum ": {
"2022-09-14": 21,
"2022-09-15": 25,
"2022-09-16": 22,
},
"Boston Harbor Islands": {
"2022-09-16": 3,
"2022-09-23": 6,
"2022-09-30": 8
},
"DCR - Mass Dept of Conservation and Recreation": {
"2022-09-12": 24,
"2022-09-13": 25,
"2022-09-14": 25,
},
"Hale Reservation": {
"2022-09-12": 7,
"2022-09-13": 7,
"2022-09-14": 7,
},
"Harvard Museums of Science and Culture": {
"2022-09-12": 23,
"2022-09-13": 22,
"2022-09-14": 25,
},
"ICA - Institute of Contemporary Art": {
"2022-09-16": 1,
"2022-09-17": 1,
"2022-09-18": 1,
},
"Isabella Stewart Gardner Museum ": {
"2022-09-21": 1,
"2022-09-28": 1,
"2022-10-03": 1,
},
"John F Kennedy Library and Museum": {
"2022-09-15": 2,
"2022-09-16": 3,
"2022-09-17": 2,
},
"Larz Anderson Auto Museum": {
"2022-09-14": 3,
"2022-09-15": 3,
"2022-09-16": 3,
},
"Mass Audubon Wildlife Sanctuary": {
"2022-09-13": 2,
"2022-09-14": 2,
"2022-09-15": 2,
},
"Museum of Fine Arts ": {
"2022-09-12": 21,
"2022-09-15": 23,
"2022-09-16": 20,
},
"Museum of Science ": {
"2022-09-12": 17,
"2022-09-13": 24,
"2022-09-14": 22,
},
"New England Aquarium ": {
"2022-09-13": 2,
"2022-09-14": 12,
"2022-09-15": 18,
},
"Old South Meeting House": {
"2022-09-12": 1,
"2022-09-13": 1,
"2022-09-15": 1,
},
"Peabody Essex Museum": {
"2022-09-12": 1,
"2022-09-14": 1,
"2022-09-15": 1,
},
"Trustees GO Pass": {
"2022-09-12": 1,
"2022-09-13": 2,
"2022-09-14": 2,
},
"USS Constitution Museum": {
"2022-09-12": 22,
"2022-09-13": 24,
"2022-09-14": 24,
},
"Zoo New England": {
"2022-09-15": 3,
"2022-09-16": 1,
"2022-09-19": 5,
}
}
}
```
The scraped object is then compared against the data in the database to determine if:

1. An additional museum pass has become available on or before the user's provided data of visit. 

2. If an email, text, or both email and text should be sent to the user notifying them that a pass has become available. 

Example of user data from the database:

```
  {
    id: 'cl7t93nfi000009l58x2xgvu6',
    createdAt: 2022-09-08T16:15:28.350Z,
    museum: 'Isabella Stewart Gardner Museum ',
    dateOfVisit: '2022-10-01',
    initialNumPasses: 0,
    email: 'foobar@gmail.com',
    phone: '(123) 456-7890',
    url: 'https://www.eventkeeper.com/mars/tkflex.cfm?curOrg=BOSTON&curNumDays=60&curKey2=AVA&curKey1=Isabella Stewart Gardner Museum (promo code)&curPassStartDate=10/01/2022'
  }
```

Data is erased from the database:

1. After a notification is sent to a user.

2. If no additional passes have become available by the user's date of visit (end of day). 

## Author

Eric Fletcher

[LinkedIn](https://www.linkedin.com/in/iamericfletcher/)

[Email](EricFletcher3@gmail.com)


## Acknowledgments

* [web dev and web design Discord server](https://discord.gg/TZC5Rrpt)
* [Nathan @Yofou for his wisdom, guidance, and time](https://github.com/Yofou)
