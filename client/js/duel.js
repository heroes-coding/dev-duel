/* eslint-disable no-undef */
const USER_CLASSES = ['.left', '.right']
const roundPlayer = () => {
  let round = 0
  return () => {
    const roundSound = new Audio('sounds/round.mp3')
    roundSound.play()
    const listener = roundSound.addEventListener('ended', () => {
      round = round === 9 ? 9 : round + 1
      roundSound.removeEventListener('ended', listener)
      new Audio(`sounds/${round}.mp3`).play()
    })
  }
}
const playRound = roundPlayer()

const populateUser = (leftOrRight, userData) => {
  const {
    username,
    name,
    location,
    email,
    bio,
    avatarUrl,
    titles,
    favoriteLanguage,
    publicRepos,
    totalStars,
    highestStarred,
    perfectRepos,
    followers,
    following
  } = userData
  let score = 0
  score += titles.length * 15
  score += following / 2
  score += followers
  score += publicRepos * 1.5
  score += totalStars
  score += perfectRepos * 0.5
  score += name ? 5 : 0
  // default avatar means less points
  score += avatarUrl === 'https://avatars3.githubusercontent.com/u/34743335?v=4' ? 0 : 5
  score += bio ? 5 : 0
  score += email ? 2 : 0
  score += location ? 2 : 0
  $(`${leftOrRight} > ` + '.username').html(username)
  $(`${leftOrRight} > ` + '.full-name').html(name)
  $(`${leftOrRight} > ` + '.location').html(location)
  $(`${leftOrRight} > ` + '.email').html(email)
  $(`${leftOrRight} > ` + '.bio').html(bio)
  $(`${leftOrRight} > ` + '.avatar')[0].src = avatarUrl
  $(`${leftOrRight} > .stats > .stat ` + '.titles').html(titles.length ? titles.join(', ') : 'No titles')
  $(`${leftOrRight} > .stats > .stat ` + '.favorite-language').html(favoriteLanguage || 'Unknown')
  $(`${leftOrRight} > .stats > .stat ` + '.total-stars').html(totalStars)
  $(`${leftOrRight} > .stats > .stat ` + '.highest-starred').html(highestStarred)
  $(`${leftOrRight} > .stats > .stat ` + '.public-repos').html(publicRepos)
  $(`${leftOrRight} > .stats > .stat ` + '.perfect-repos').html(perfectRepos)
  $(`${leftOrRight} > .stats > .stat ` + '.followers').html(followers)
  $(`${leftOrRight} > .stats > .stat ` + '.following').html(following)
  return score
}

const addError = message => {
  $('.duel-error').removeClass('hide-immediate')
  $('.duel-container').addClass('hide')
  $('.error').html(message)
  new Audio('sounds/haha.mp3').play()
}

$('form').submit((e) => {
  $('#audioHolder').html('')
  $('.duel-container').addClass('hide', 1000, 'swing')
  const leftUser = $('input[name=username-left]').val()
  const rightUser = $('input[name=username-right]').val()
  if (!leftUser || !rightUser) {
    addError('Both users need user names')
    return false
  }
  const leftPromise = fetch(`${USER_URL}/${leftUser}`)
  const rightPromise = fetch(`${USER_URL}/${rightUser}`)
  const usernames = [leftUser, rightUser]
  Promise.all([leftPromise, rightPromise]).then(data => {
    const errors = []
    for (let i = 0; i < 2; i++) {
      const response = data[i]
      if (response.status === 400) {
        errors.push(`Invalid username: [${usernames[i]}]`)
      } else if (response.status === 404) {
        errors.push(`[${usernames[i]}] could not be found`)
      } else if (response.status !== 200) {
        console.log(response)
        errors.push(`Unknown error for: [${usernames[i]}]`)
      }
    }
    if (errors.length) {
      addError(errors.join(' and '))
      return false
    }
    Promise.all(data.map(d => d.json())).then(([leftData, rightData]) => {
      const leftScore = populateUser(USER_CLASSES[0], leftData)
      const rightScore = populateUser(USER_CLASSES[1], rightData)
      const winner = leftScore >= rightScore ? 0 : 1
      const scores = [leftScore, rightScore]
      $(USER_CLASSES[winner]).addClass('winner')
      $(USER_CLASSES[1 - winner]).removeClass('winner')
      $(`${USER_CLASSES[winner]} > .outcome`).html(`Winner: ${scores[winner]} points`)
      $(`${USER_CLASSES[1 - winner]} > .outcome`).html(`Loser: ${scores[1 - winner]} points`)
      $('.duel-error').addClass('hide-immediate')
      $('.duel-container').removeClass('hide', 1000, 'swing')
      playRound()
      const userDatas = [leftData, rightData]
      const winnerName = `${userDatas[winner].name || userDatas[winner].username}`
      const winnerTitles = userDatas[winner].titles.join(' ')
      const winnerTitle = winnerName.split(' ')[0] + (winnerTitles ? ` the ${winnerTitles}` : '')
      const loserName = userDatas[1 - winner].name || userDatas[1 - winner].username
      const loserTitles = userDatas[1 - winner].titles.join(' ')
      const loserTitle = loserName.split(' ')[0] + (loserTitles ? ` the ${loserTitles}` : '')
      const spread = Math.abs(leftScore - rightScore)
      let verb
      if (spread < 5) {
        verb = 'nudges ahead of'
      } else if (spread < 10) {
        verb = 'beats'
      } else if (spread < 20) {
        verb = 'pummels'
      } else {
        verb = 'eviscerates'
      }
      const resultText = `${winnerTitle} ${verb} ${loserTitle} by ${spread} points`
      console.log({resultText})
      // a temporary api I set up (exposed only to Pilgrim's ip address) to allow text to speech conversion
      fetch(`http://52.18.68.127:3030/text`, {
        method: 'post',
        body: JSON.stringify({'text': resultText}),
        headers: {
          'Accept': 'audio/wav',
          'Content-Type': 'application/json'
        }
      }).then(response => response.blob())
        .then(blob => {
          const blobObj = window.URL.createObjectURL(blob)
          const resultAudio = new Audio(blobObj)
          resultAudio.play()
          window.resultAudio = resultAudio
          sound = document.createElement('audio')
          sound.id = 'audio-player'
          sound.controls = 'controls'
          sound.src = blobObj
          sound.type = 'audio/mpeg'
          document.getElementById('audioHolder').appendChild(sound)
        })
        .catch(err => console.error(err))
    })
  }).catch(e => {
    // this is an unexpected error
    addError(e.message)
    console.log(e)
  })
  return false // return false to prevent default form submission
})
