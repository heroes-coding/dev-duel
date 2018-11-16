import { Router } from 'express'
import axios from 'axios'
import validate from 'express-validation'
import token from '../../token'

import validation from './validation'

export default () => {
  let router = Router()

  /** GET /health-check - Check service health */
  router.get('/health-check', (req, res) => res.send('OK'))

  /** GET /api/rate_limit - Get github rate limit for your token */
  router.get('/rate', (req, res) => {
    queryGithubApi(`rate_limit`).then(({ data }) => res.json(data))
  })

  // a helper function that returns a promise for a response for a query to github's api
  const queryGithubApi = query => new Promise((resolve, reject) => {
    console.log(`Github query: ${query}`)
    axios.get(`http://api.github.com/${query}`, {
      headers: {
        'Authorization': token
      }
    }).then(resolve).catch(reject)
  })

  // returns a promise for a page-based list of 100 repos for a given user
  const getRepoListPage = (username, page) => new Promise((resolve, reject) => {
    queryGithubApi(`users/${username}/repos?page=${page}&per_page=100`)
      .then(response => resolve(response.data)).catch(reject)
  })

  const getUserData = username => new Promise((resolve, reject) => {
    let userData
    queryGithubApi(`users/${username}`)
      .then(({ status, data: { email, public_repos: publicRepos, followers, following, avatar_url: avatarUrl, location, name, bio } }) => {
        userData = {
          username,
          name,
          location,
          email,
          bio,
          avatarUrl,
          titles: [],
          favoriteLanguage: null,
          publicRepos,
          totalStars: 0,
          highestStarred: 0,
          perfectRepos: 0,
          followers,
          following
        }
      }).then(() => Promise.all(Array(Math.ceil(userData.publicRepos / 100)).fill(0).map((x, i) => getRepoListPage(username, i + 1))))
      .then(data => {
        const repos = data.reduce((acc, cur) => [...acc, ...cur], [])
        const languages = {}
        let forked = 0
        for (let { language, fork, stargazers_count: stars, open_issues_count: openIssues } of repos) {
          forked += fork ? 1 : 0
          userData.totalStars += stars
          if (stars > userData.highestStarred) {
            userData.highestStarred = stars
          }
          if (!languages.hasOwnProperty(language)) {
            languages[language] = 0
          }
          languages[language] += 1
          userData.perfectRepos += openIssues > 0 ? 0 : 1
        }
        const { publicRepos, following, followers } = userData
        const languagesList = Object.entries(languages)
        languagesList.sort((x, y) => y[1] - x[1])
        if (languagesList.length >= 10) {
          userData.titles.push('Jack of all Trades')
        } else if (languagesList.length >= 6) {
          // My title - 10 is a pretty steep requirement to get a title based on the number of languages, so I made another
          userData.titles.push('Insectoid')
        }
        if (publicRepos && forked / publicRepos > 0.499) {
          userData.titles.push('Forker')
        }
        if (languagesList.length === 1) {
          userData.titles.push('One-Trick-Pony')
        }
        if (following >= followers * 2) {
          userData.titles.push('Stalker')
        } else if (followers >= following * 2) {
          userData.titles.push('Mr. Popular')
        }
        if (languagesList.length) {
          userData.favoriteLanguage = languagesList[0][0]
        }
        resolve(userData)
      }).catch(e => {
        reject(e)
      })
  })

  /** GET /api/user/:username - Get user */
  router.get('/user/:username', validate(validation.user), (req, res) => {
    getUserData(req.params.username).then(data => res.json(data)).catch(e => {
      res.status(404).send('Not found')
    })
  })

  /** GET /api/users? - Get users */
  router.get('/users/', validate(validation.users), async (req, res) => {
    const usernames = req.query.username
    const response = usernames.map(u => `${u} not found!`)
    let checked = 0
    usernames.forEach((username, i) => {
      getUserData(username).then(userData => {
        response[i] = userData
      }).catch(e => {
        if (e.response.status !== 404) {
          console.log(e)
        }
      }).finally(() => {
        checked++
        if (checked === usernames.length) {
          res.json(response)
        }
      })
    })
  })

  return router
}
