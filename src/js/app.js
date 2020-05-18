class Data {
  constructor(base_url_movie = '', base_url_user = '') {
    this.base_url_movie = base_url_movie
    this.base_url_user = base_url_user
  }

  fetchCategories(category) {
    const response = fetch(`${this.base_url_movie}genre=${category}`)
    return response
  }

  fetchMoviesByRating(rating, limit) {
    const response = fetch(`${this.base_url_movie}with_rt_ratings=${rating}&limit=${limit}`)
    return response
  }

  fetchRandomUsers(nat, limit) {
    const response = fetch(`${this.base_url_user}?nat=${nat}&results=${limit}`)
    return response
  }

  async getCategories(categories) {
    const categoriesFetch = categories.map(category => this.fetchCategories(category))
    const categoriesResponse = await Promise.all(categoriesFetch)
    const categoriesData = await Promise.all(categoriesResponse.map(category => category.json()))
    const categoriesResult = categoriesData.map(({data: {movies}}) => movies)
    return categoriesResult
  }

  async getMoviesByRating(rating, limit) {
    const moviesResponse = await this.fetchMoviesByRating(rating, limit)
    const {data: {movies}} = await moviesResponse.json()
    return movies
  }

  async getRandomUsers(nat, limit) {
    const usersResponse = await this.fetchRandomUsers(nat, limit)
    const {results} = await usersResponse.json()
    return results
  }
}

class Movie extends Data{
  constructor(
    {
      categories = [],
      containers = [],
      url_movie = '',
      rating = false,
      rating_container = null,
      limit = 0,
    } = {}
  ) {
    super(url_movie)
    this.categories = categories
    this.containers = containers
    this.rating = rating
    this.rating_container = rating_container
    this.limit =limit
  }

  async displayCategories() {
    const categoriesData = await this.getCategories(this.categories)
    categoriesData.forEach( (category, index) => {
      this.renderCategories(category, this.categories[index], this.containers[index])
    })
  }

  renderCategories(category, categoryName, categoryContainer){
    category.forEach(movie => {
      const movieElement = this.movieByCategoryTemplate(movie, categoryName)
      categoryContainer.appendChild(movieElement)
    })
  }

  movieByCategoryTemplate(movie, category) {
    const movieElement = document.createElement('div')
    movieElement.innerHTML =
    `
    <div class="primaryPlaylistItem" data-id="${movie.id}" data-category="${category}">
      <div class="primaryPlaylistItem-image">
        <img width="100" src="${movie.medium_cover_image}" />
      </div>
      <h4 class="primaryPlaylistItem-title">
        ${movie.title}
      </h4>
    </div>
    `
    return movieElement
  }

  async displayMoviesByRating() {
    const moviesData = await this.getMoviesByRating(this.rating, this.limit)
    this.renderMoviesByRating(moviesData)
  }

  renderMoviesByRating(movies) {
    movies.forEach(movie => {
      const movieElement = this.movieByRatingTemplate(movie)
      this.rating_container.appendChild(movieElement)
    })
  }

  movieByRatingTemplate(movie) {
    const movieElement = document.createElement('li')
    movieElement.innerHTML =
    `
    <a href="${movie.url}">
      <span>
        ${movie.title_english}
      </span>
    </a>
    `
    return movieElement
  }

}

class User extends Data{
  constructor ({
    nat = '',
    limit = 0,
    user_container = null,
    url_user = ''
  } = {}) {
    super('', url_user)
    this.nat = nat
    this.limit = limit
    this.user_container = user_container
  }

  async displayUsers() {
    const usersData = await this.getRandomUsers(this.nat, this.limit)
    this.renderRandomUsers(usersData)
  }

  renderRandomUsers(users) {
    users.forEach(user => {
      const userElement = this.randomUserTemplate(user)
      this.user_container.appendChild(userElement)
    })
  }

  randomUserTemplate(user) {
    const userElement = document.createElement('li')
    userElement.innerHTML =
    `
    <div>
      <img width="70" src="${user.picture.medium}" alt="${user.name.first} ${user.name.last}" />
      <span>
        ${user.name.first} ${user.name.last}
      </span>
    </div>
    `
    return userElement
  }

}

const base_url_movie = 'https://yts.mx/api/v2/list_movies.json?'
const base_url_user = 'https://randomuser.me/api/'

const $actionContainer = document.querySelector('#action')
const $comedyContainer = document.querySelector('#comedy')
const $horrorContainer = document.querySelector('#horror')
const $movieByRatingContainer = document.querySelector('#movie-list')
const $randomUserContainer = document.querySelector('#user-list')

const categories = new Movie({
  categories: ['action','comedy','horror'],
  containers: [$actionContainer, $comedyContainer, $horrorContainer],
  url_movie: base_url_movie,
})
console.log(categories)
categories.displayCategories()

const moviesByRating = new Movie({
  rating: true,
  rating_container: $movieByRatingContainer,
  limit: 10,
  url_movie: base_url_movie,
})
console.log(moviesByRating)
moviesByRating.displayMoviesByRating()

const randomUsers = new User({
  nat: 'us',
  limit: 10,
  user_container: $randomUserContainer,
  url_user: base_url_user,
})
console.log(randomUsers)
randomUsers.displayUsers()