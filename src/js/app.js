class Data {
  constructor(base_url_movie = '', base_url_user = '') {
    this.base_url_movie = base_url_movie
    this.base_url_user = base_url_user
  }

  // Request about all data of a category from API
  fetchCategories(category) {
    const response = fetch(`${this.base_url_movie}genre=${category}`)
    return response
  }

  // Request about all movies sort by rating from API
  fetchMoviesByRating(rating, limit) {
    const response = fetch(`${this.base_url_movie}with_rt_ratings=${rating}&limit=${limit}`)
    return response
  }

  // Request about all random users from API
  fetchRandomUsers(nat, limit) {
    const response = fetch(`${this.base_url_user}?nat=${nat}&results=${limit}`)
    return response
  }

  // Request about a movie from API
  fetchMovieByName(movie) {
    const response = fetch(`${this.base_url_movie}?limit=1&query_term=${movie}`)
    return response
  }

  // Get all data about categories
  async getCategories(categories) {
    try{
      const categoriesFetch = categories.map(category => this.fetchCategories(category))
      const categoriesResponse = await Promise.all(categoriesFetch)
      const categoriesData = await Promise.all(categoriesResponse.map(category => category.json()))
      // Using destructuring to clean data to display in the list
      const categoriesResult = categoriesData.map(({data: {movies}}) => movies)
      return categoriesResult
    } catch(error) {
      // This error will launch when the connection fail
      throw new Error("Error 404")
    }
  }

  // Get all data about movies by rating
  async getMoviesByRating(rating, limit) {
    try {
      const moviesResponse = await this.fetchMoviesByRating(rating, limit)
      const {data: {movies}} = await moviesResponse.json()
      return movies
    } catch (error) {
      // This error will launch when the connection fail
      throw new Error("Error 404")
    }
  }

  // Get all data about random users
  async getRandomUsers(nat, limit) {
    try {
      const usersResponse = await this.fetchRandomUsers(nat, limit)
      const {results} = await usersResponse.json()
      return results
    } catch (error) {
      // This error will launch when the connection fail
      throw new Error("Error 404")
    }
  }

  // Get data about a movie
  async getMovieByName(movie) {
    try {
      const movieResponse = await this.fetchMovieByName(movie)
      const {data: {movies, movie_count}} = await movieResponse.json()
      if(movie_count > 0) {
        return movies
      } else {
        // This error will launch when the API couldn't find a movie
        throw new Error("Results not found")
      }
    } catch (error) {
      // This error will launch when the connection fail
      throw new Error("Error 404")
    }
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
      categoriesList = [],
      form = null
    } = {}
  ) {
    super(url_movie)
    this.categories = categories
    this.containers = containers
    this.rating = rating
    this.rating_container = rating_container
    this.limit = limit
    this.categoriesList = categoriesList
    this.form = form
  }

  // This function get data from the API and then display into the category list
  async displayCategories() {
    try {
      const categoriesData = await this.getCategories(this.categories)
      categoriesData.forEach( (category, index) => {
        this.categoriesList.push({
          category: this.categories[index],
          list: category
        })
        this.renderCategories(category, this.categories[index], this.containers[index])
      })
    } catch (error) {
      // Catch the error and then display into each list information about that error
      this.containers.forEach(container => {
        this.renderError404(container)
      })
    }
  }

  // This function get data from the API and then display into the rating list
  async displayMoviesByRating() {
    try {
      const moviesData = await this.getMoviesByRating(this.rating, this.limit)
      this.renderMoviesByRating(moviesData)
    } catch (error) {
      // Catch the error and then display into the list information about that error
      this.renderError404(this.rating_container)
    }
  }

  // This function display all movies of one category into its list
  renderCategories(category, categoryName, categoryContainer){
    // This remove the loading element and its styles
    categoryContainer.firstElementChild.remove()
    categoryContainer.classList.remove('category-loading')
    category.forEach(movie => {
      const movieElement = this.movieByCategoryTemplate(movie, categoryName)
      categoryContainer.appendChild(movieElement)
      // Add an event for the image to display an animation when image will loaded
      const movieImage = movieElement.querySelector('img')
      movieImage.addEventListener('load', (event) => {
        event.target.classList.add('fadeIn')
      })
      // Add a click event for the image to display a modal to show more information about movie
      this.addEventClick(movieImage)
    })
  }

  // This function display all movies of rating list
  renderMoviesByRating(movies) {
    this.rating_container.firstElementChild.remove()
    movies.forEach((movie, index) => {
      const movieElement = this.movieByRatingTemplate(movie, ++index)
      this.rating_container.appendChild(movieElement)
    })
  }

  // This function create a movie template of each category
  movieByCategoryTemplate(movie, category) {
    const movieElement = document.createElement('div')
    movieElement.classList.add('movie')
    // add the data attribute to search by id and category
    movieElement.dataset.category = category
    movieElement.dataset.id = movie.id
    movieElement.innerHTML =
    `
    <figure class="movie--image">
      <img src="${movie.medium_cover_image}" alt="${movie.title}">
    </figure>
    <p class="movie--title">${movie.title}</p>
    `
    return movieElement
  }

  // This function create a movie template of rating list
  movieByRatingTemplate(movie, number) {
    const movieElement = document.createElement('li')
    movieElement.classList.add('sidebar--list-item')
    movieElement.innerHTML =
    `
    <p>${number}. ${movie.title_english}</p>
    `
    return movieElement
  }

  // Get id and category of a movie, then find that movie and finally display into the modal
  showFullInformation(movie) {
    const id = movie.dataset.id
    const category = movie.dataset.category
    const dataMovie = this.findMovie(id, category)
    this.addInformationIntoModal(dataMovie)
  }

  // This function find a movie into the categoriesList[]
  findMovie(id, category) {
    const {list} = this.categoriesList.find(item => item.category === category)
    const dataMovie = list.find(movie => movie.id === parseInt(id, 10))
    return dataMovie
  }

  // This function add all information about a movie into the modal
  addInformationIntoModal(dataMovie) {
    // It's used when the loading active the overlay
    if(!$overlay.classList.contains('active')) {
      this.showOverlay($overlay, $modalContainer)
    }

    // To delete all error elements and its styles
    $modalContainer.classList.remove('modal-error')
    this.deleteErrorContainer($modalContainer)

    // Add information into the modal
    $modalImage.setAttribute('src', dataMovie.medium_cover_image)
    $modalImage.setAttribute('alt', dataMovie.title)
    $modalTitle.textContent = dataMovie.title
    $modalSummary.textContent = dataMovie.summary

    // Those function work to add the genres of a movie
    this.resetInformation($modalInformation)
    this.addGenres(dataMovie.genres, $modalInformation)

    // Those events hide the model when you click in the overlay or the button
    $overlay.addEventListener('click', (ev) => {
      if(ev.target == $overlay) this.hideModal()
    })
    $modalButton.addEventListener('click', () => {
      this.hideModal()
    })
  }

  // Add all genres into the genre container
  addGenres(genres, genreContainer) {
    genres.forEach((genre, index) => {
      if(index === genres.length - 1) {
        // This works when the final genre doesn't need a separator
        const genreElement = document.createElement('a')
        genreElement.textContent = genre
        genreContainer.appendChild(genreElement)
      } else {
        const genreElement = document.createElement('a')
        genreElement.textContent = genre
        const spanElement = document.createElement('span')
        spanElement.textContent = '|'
        genreContainer.appendChild(genreElement)
        genreContainer.appendChild(spanElement)
      }
    })
  }

  // To find a movie through the form
  findMovieByName() {
    $formElement.addEventListener('submit', async (ev) => {
      ev.preventDefault()
      this.showOverlay($overlay, $modalContainer)
      // Add styles for the loading element
      $modalContainer.classList.add('modal-loading')
      try {
        // Create a new object to get the data of the form
        const formData = new FormData($formElement)

        // Get movie by name from the API
        const movieData = await this.getMovieByName(formData.get('movie'))

        // Then delete the loading element and display information
        $modalContainer.classList.remove('modal-loading')
        this.addInformationIntoModal(movieData[0])
      } catch (error) {
        // This works when the API couldn't find a movie
        $modalContainer.classList.remove('modal-loading')
        this.renderErrorFound($modalContainer)
      }
    })
  }

  // Create an event to display more information
  addEventClick(element) {
    element.addEventListener('click', () => {
      this.showFullInformation(element.parentNode.parentNode)
    })
  }

  // Display the overlay and the modal
  showOverlay($overlay, $modalContainer) {
    $overlay.classList.add('active')
    $modalContainer.style.animation = 'modalIn 800ms forwards'
  }

  // Delete all elements (span and a tags) to the genre container
  resetInformation(genreContainer) {
    genreContainer.querySelectorAll('*').forEach(node => {
      if(node.tagName != "P") {
        node.remove()
      }
    })
  }

  // When you click in the button or the overlay hide the modal
  hideModal() {
    $modalContainer.style.animation = 'modalOut 800ms forwards'
    setTimeout(()=> {
      $overlay.classList.remove('active')
    }, 800)
  }

  // When the connection fail, this function will display information about that error
  renderError404(container) {
    const errorContainer = document.createElement('div')
    errorContainer.style = "display: flex; flex-direction: column; justify-content: center; align-items: center; margin-top: 2rem"
    container.firstElementChild.remove()
    const errorImage = document.createElement('img')
    errorImage.setAttribute('src', '/src/images/error-404.svg')
    errorImage.style.width = "200px"
    const errorMessage = document.createElement('p')
    errorMessage.textContent = "Error 404, The connection failed"
    errorMessage.style = "font-weight: 300; margin-top: 1rem;"
    errorContainer.appendChild(errorImage)
    errorContainer.appendChild(errorMessage)
    container.appendChild(errorContainer)
  }

  // When the API cannot find a movie, this function will display information about that error
  renderErrorFound(container){
    this.deleteErrorContainer(container)
    // Add the events to hide the modal
    $overlay.addEventListener('click', (ev) => {
      if(ev.target == $overlay) this.hideModal()
    })
    $modalButton.addEventListener('click', () => {
      this.hideModal()
    })
    const errorContainer = document.createElement('div')
    errorContainer.classList.add('error')
    const errorImage = document.createElement('img')
    errorImage.setAttribute('src', '/src/images/not-found.svg')
    errorImage.style.width = "400px"
    const errorMessage = document.createElement('p')
    errorMessage.textContent = "Results not found"
    container.classList.add('modal-error')
    errorContainer.appendChild(errorImage)
    errorContainer.appendChild(errorMessage)
    container.appendChild(errorContainer)
  }

  // This function delete all error elements that you add into the modal
  deleteErrorContainer(container) {
    const arrayElements = [...container.children]
    arrayElements.forEach(element => {
      if(element.classList.contains('error')) element.remove()
    })
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

  // This function get data from the API and then display into the list
  async displayUsers() {
    try {
      const usersData = await this.getRandomUsers(this.nat, this.limit)
      this.renderRandomUsers(usersData)
    } catch (error) {
      // This function will work when the connection fail
      this.renderError404(this.user_container)
    }
  }

  // This function display a list about all random users
  renderRandomUsers(users) {
    this.user_container.firstElementChild.remove()
    users.forEach((user) => {
      const userElement = this.randomUserTemplate(user)
      this.user_container.appendChild(userElement)
    })
  }

  // This function will create a template for a random user
  randomUserTemplate(user) {
    const userElement = document.createElement('li')
    userElement.classList.add('sidebar--list-item')
    userElement.innerHTML =
    `
    <img src="${user.picture.medium}" alt="${user.name.first} ${user.name.last}" />
    <span>
      ${user.name.first} ${user.name.last}
    </span>
    `
    return userElement
  }

  // When the connection fail, this function will display information about that error
  renderError404(container) {
    const errorContainer = document.createElement('div')
    errorContainer.style = "display: flex; flex-direction: column; justify-content: center; align-items: center; margin-top: 2rem"

    container.firstElementChild.remove()
    const errorImage = document.createElement('img')
    errorImage.setAttribute('src', '/src/images/error-404.svg')
    errorImage.style = "width: 200px; height: 108.5px!important; margin: 0!important;"
    const errorMessage = document.createElement('p')
    errorMessage.textContent = "Error 404, The connection failed"
    errorMessage.style = "font-weight: 300; margin-top: 1rem;"
    errorContainer.appendChild(errorImage)
    errorContainer.appendChild(errorMessage)
    container.appendChild(errorContainer)
  }

}

// Base URL for APIs
const base_url_movie = 'https://yts.mx/api/v2/list_movies.json?'
const base_url_user = 'https://randomuser.me/api/'

// Container Elements
const $actionContainer = document.querySelector('#action')
const $animationContainer = document.querySelector('#animation')
const $comedyContainer = document.querySelector('#comedy')
const $horrorContainer = document.querySelector('#horror')
const $movieByRatingContainer = document.querySelector('#movie-list')
const $randomUserContainer = document.querySelector('#friend-list')

// Modal Elements
const $overlay = document.querySelector('#overlay')
const $modalContainer = document.querySelector('#modal')
const $modalImage = $modalContainer.querySelector('.modal--image img')
const $modalTitle = $modalContainer.querySelector('.modal--title')
const $modalSummary = $modalContainer.querySelector('.modal--summary')
const $modalInformation = $modalContainer.querySelector('.modal--information')
const $modalButton = $modalContainer.querySelector('#hide-modal')

// Form Elements
const $formElement = document.querySelector('#search')
const $loader = document.querySelectorAll('.loading')[0]

// This object will get all movies by category
const categories = new Movie({
  categories: ['action','animation','comedy','horror'],
  containers: [$actionContainer, $animationContainer, $comedyContainer, $horrorContainer],
  url_movie: base_url_movie,
})
categories.displayCategories()

// This object will get the first ten movies sort by rating
const moviesByRating = new Movie({
  rating: true,
  rating_container: $movieByRatingContainer,
  limit: 10,
  url_movie: base_url_movie,
})
moviesByRating.displayMoviesByRating()

// This object will get all random users
const randomUsers = new User({
  nat: 'us',
  limit: 10,
  user_container: $randomUserContainer,
  url_user: base_url_user,
})
randomUsers.displayUsers()

// This object will find a movie through the form
const movieByName = new Movie({
  url_movie: base_url_movie,
  form: $formElement,
})
movieByName.findMovieByName()