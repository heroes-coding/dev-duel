/* eslint-disable no-undef */
$('.inspect').click((e) => {
  e.preventDefault()
  $('.page-container').toggle('clip', 1000)
  const final = new Audio('sounds/final.mp3')
  final.play()
  final.addEventListener('ended', () => {
    location.href = './inspect.html'
    final.removeEventListener('ended')
  })
})
$('.duel').click((e) => {
  e.preventDefault()
  $('.page-container').toggle('bounce', 1000)
  const fight = new Audio('sounds/fight.mp3')
  fight.play()
  fight.addEventListener('ended', () => {
    location.href = './duel.html'
    fight.removeEventListener('ended')
  })
})
