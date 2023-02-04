# My reading statistics

⮕ The App is available at ✨ https://derlin.github.io/reading-stats/ ✨


**Table of Contents**

<!-- TOC start -->
- [Context](#context)
- [Running the App](#running-the-app)
  * [Start a development server](#start-a-development-server)
  * [Build the App](#build-the-app)
- [Continuous Deployment](#continuous-deployment)
- [About the code](#about-the-code)
- [I need you!](#i-need-you)
<!-- TOC end -->

## Context

In May 2020, I made a commitment to read for at least 10 minutes every day, and this challenge has had a big impact on my life.
I have gained self-worth and perspective, I sleep better, and I feel overall happier and more productive.

---

<div align=center>

**If you want to know more, I describe my journey here:**

⮕ On my blog: ✨✨✨ [I challenged myself to read every day, and it changed my life 📚](
https://blog.derlin.ch/i-challenged-myself-to-read-every-day-and-it-changed-my-life) ✨✨✨

⮕ On dev.to: ✨ [I challenged myself to read every day, and it changed my life 📚](
https://dev.to/derlin/i-challenged-myself-to-read-every-day-and-it-changed-my-life-2oef) ✨

</div>

---


One of the most important piece when trying to forge new habits is **Monitoring your progress**:
being able to prove your achievements (or to be reminded of your failures 😉) is the best way to stay motivated.
May it be a full-featured habit tracker app or simply an X mark on a calendar, as long as you have a way to "officialize" your progress.

This is why I track my reading habits thoroughly using different tools:

1. I start a timer every time I read using the [Boosted](https://www.boostedproductivity.com) app (one book = one task).
   Knowing that a clock is ticking helps me focus on the reading, and ignore distractions
2. I keep a list of books read (along with some notes) using a custom-made Android app called MyBooks,
   which saves the data as a JSON file in DropBox (I wouldn't remember half of the books I read without it 😆)
3. I maintain two lists on [GoodReads](https://www.goodreads.com/user/show/101290348-lucy): *want-to-read* and *read*
4. I publish all my stats online: https://derlin.github.io/reading-stats/.

This repository is the source code of point 4.

## Running the App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

### Start a development server

In the project directory,run: `npm start`. At starts the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.
Note that the page will reload automatically when you make changes.

### Build the App

Run `npm run build` to build the app for production and output the result into the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.
The build is minified and the filenames include the hashes. You can then deploy the folder as-is!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## Continuous Deployment

The App is hosted on GitHub Pages, and automatically redeployed on every new push to the *main* branch, given the build succeeds
(see .github/workflows/deploy.yaml).

## About the code

The code is a React App that heavily uses [Danfo.js](https://danfo.jsdata.org) to manipulate data in the form of DataFrames.
Danfo.js is currently the best alternative to the excellent Python Pandas library.
The plots are created using [Plotly](https://plotly.com/javascript/).

I am using pure Javascript instead of Typescript mostly because of Danfo.js: I couldn't find good type maps.

The most interesting folder is `src/data`:

1. `all.json` contains one entry for each interval of time I read. It is a nearly exact mapping of the CSV file I export from
   the [Boosted](https://www.boostedproductivity.com) app (just a tiny bit of filtering and cleanup).
2. `meta.json` contains the metadata about all the books I read. They are extracted from GoodReads using [goodreads-metadata-fetcher](
   https://github.com/derlin/goodreads-metadata-fetcher), yet another library I developed. The JSON format matches the one I use in
   my Android App ["MyBooks"](https://github.com/derlin/mybooks-android).
3. `Data.js` contains all the code that manipulate data: it loads the files 1 and 2, and creates meaningful Danfo.js DataFrames that I can
   use to create the texts and plots of the interface.

This was my first try at React, and I am a bit disappointed with the performances (especially the load time).


## I need you!

As someone pointed out in [dev.to](https://dev.to/derlin/i-challenged-myself-to-read-every-day-and-it-changed-my-life-2oef),
it would be interesting to make this little app more generic (and better). I would be thrilled to start a project with any interested
party.

If you are interested, open an issue or leave a comment!
