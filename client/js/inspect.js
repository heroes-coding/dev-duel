/* eslint-disable no-undef */
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

$('form').submit(() => {
  $('.user-results').addClass('hide', 400, 'swing')
  const username = $('form input').val()
  console.log(`examining ${username}`)
  if (!username) {
    $('.user-error').removeClass('hide-immediate')
    $('.user-results').addClass('hide')
    $('.error').html('You need to type a username above')
    new Audio('sounds/haha.mp3').play()
    return false
  }
  // Fetch data for given user
  // (https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
  fetch(`${USER_URL}/${username}`)
    .then(response => {
      if (response.status === 200) {
        return response.json()
      }
      if (response.status === 400) {
        throw new Error(`Invalid username: ${username}`)
      } else if (response.status === 404) {
        throw new Error(`[${username}] not found.`)
      } else {
        console.log(response)
        throw new Error('Unknown error for ' + username)
      }
    }) // Returns parsed json data from response body as promise
    .then(data => {
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
      } = data
      $('.username').html(username)
      $('.full-name').html(name)
      $('.location').html(location)
      $('.email').html(email)
      $('.bio').html(bio)
      $('.avatar')[0].src = avatarUrl
      $('.titles').html(titles.length ? titles.join(', ') : 'No titles')
      $('.favorite-language').html(favoriteLanguage || 'Unknown')
      $('.total-stars').html(totalStars)
      $('.most-starred').html(highestStarred)
      $('.public-repos').html(publicRepos)
      $('.perfect-repos').html(perfectRepos)
      $('.followers').html(followers)
      $('.following').html(following)
      $('.user-error').addClass('hide-immediate')
      $('.user-results').removeClass('hide', 400, 'swing') // Display '.user-results' element
      playRound()
    }).catch(e => {
      $('.user-error').removeClass('hide-immediate')
      $('.user-results').addClass('hide', 400, 'swing')
      $('.error').html(e.message)
      new Audio('sounds/haha.mp3').play()
    })
  return false // return false to prevent default form submission
})
