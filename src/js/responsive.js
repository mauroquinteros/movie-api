const burgerBtn = document.querySelector('#burger')
const homeSection = document.querySelector('#home')
const categoryContainer = document.querySelector('.category-container')
const categoriesContainer = document.querySelectorAll('.category')

burgerBtn.addEventListener('click', () => {
  homeSection.classList.toggle('active')
})
categoryContainer.addEventListener('click', () => {
  homeSection.classList.remove('active')
})