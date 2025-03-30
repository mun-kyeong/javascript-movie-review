(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const movieStore = {
  page: 1,
  totalPages: 1,
  movies: [],
  searchKeyword: "",
  selectedMovie: 0
};
const DEFAULT_BACK_DROP_URL = "https://media.themoviedb.org/t/p/w440_and_h660_face/";
const toElement = (element) => {
  const template = document.createElement("template");
  template.innerHTML = element;
  const el = template.content;
  if (!el) {
    throw new Error("유효하지 않은 HTML 형식입니다. 값을 다시 확인해주세요.");
  }
  return el;
};
function MovieList(moviesResult) {
  const $ul2 = document.querySelector(".thumbnail-list");
  const $movieListFragment = document.createDocumentFragment();
  $movieListFragment.append(
    ...moviesResult.map((movie) => {
      const backgroundImage = movie.backdrop_path ? `${DEFAULT_BACK_DROP_URL}${movie.backdrop_path}` : "./images/default_thumbnail.jpeg";
      return toElement(`
      <li>
        <div class="item" id=${movie.id}>
          <img
            class="thumbnail"
            src="${backgroundImage}"
            alt="${movie.title}"
          />
          <div class="item-desc">
            <p class="rate loading">
              <img src="./images/star_empty.png" class="star" /><span
                >${movie.vote_average}</span
              >
            </p>
            <strong>${movie.title}</strong>
          </div>
        </div>
      </li>
    `);
    })
  );
  $ul2 == null ? void 0 : $ul2.appendChild($movieListFragment);
  return $ul2;
}
function Skeleton({
  width = null,
  height = null
}) {
  return ` <div class="skeleton" style=
  "width: ${width}; height: ${height};"></div>`;
}
function MovieListSkeleton() {
  const $movieListFragment = document.createDocumentFragment();
  for (let i = 0; i < 20; i++) {
    const $movieItem = toElement(`
      <li>
        <div class="item">
          ${Skeleton({ width: "200px", height: "300px" })}
          <div class="item-desc">
            ${Skeleton({ width: "60px", height: "15px" })}
            ${Skeleton({ width: "150px", height: "20px" })}
          </div>
        </div>
      </li>
      `);
    $movieListFragment.appendChild($movieItem);
  }
  return $movieListFragment;
}
function TopRatedMovie({
  id,
  title,
  voteAverage
}) {
  return toElement(`
    <div class="top-rated-movie" id="top_${id}">
      <div class="rate">
        <img src="./images/star_empty.png" class="star" />
        <span class="rate-value">${voteAverage}</span>
      </div>
      <div class="title">${title}</div>
      <button class="primary detail" id="top-rated-show-more">자세히 보기</button>
    </div>
  `);
}
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
async function fetchWithErrorHandling(url) {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${"eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxNmEwYTdiNzE4ODA4YTVmYTJjZWMxNGYwOTNjZDZjZCIsIm5iZiI6MTc0MjI2MzAzMS41MTYsInN1YiI6IjY3ZDhkMmY3NGYwMjQ2ZGUzOWVlOWZlYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.wYazrK1XQKvh5qGf8BQcnljLKMMRTdUGBv6KcRxAvHw"}`
    }
  };
  return fetch(url, options).then((res) => {
    if (res.ok) return res.json();
    throw new Error(String(res.status));
  });
}
async function getMovies({ page }) {
  const params = new URLSearchParams({
    language: "ko-KR",
    page: String(page)
  });
  const url = `${TMDB_BASE_URL}/movie/popular?${params.toString()}`;
  return fetchWithErrorHandling(url);
}
async function getMovieByName({
  name,
  page
}) {
  const params = new URLSearchParams({
    query: name,
    include_adult: "false",
    language: "ko-KR",
    page: String(page)
  });
  const url = `${TMDB_BASE_URL}/search/movie?${params.toString()}`;
  return fetchWithErrorHandling(url);
}
async function getMovieDetail({ id }) {
  const params = new URLSearchParams({
    language: "ko-KR"
  });
  const url = `${TMDB_BASE_URL}/movie/${id}?${params.toString()}`;
  return fetchWithErrorHandling(url);
}
const updateMovieList = (response) => {
  const summary = response.results.map((movie) => ({
    backdrop_path: movie.backdrop_path,
    title: movie.title,
    vote_average: movie.vote_average,
    id: movie.id
  }));
  movieStore.movies = [...movieStore.movies, ...summary];
  movieStore.totalPages = response.total_pages;
};
const fetchMovieDetail = async () => {
  const movieResponse = await getMovieDetail({
    id: movieStore.selectedMovie
  });
  return {
    backdrop_path: movieResponse.backdrop_path,
    genres: movieResponse.genres,
    id: movieResponse.id,
    overview: movieResponse.overview,
    release_date: movieResponse.release_date,
    title: movieResponse.title,
    vote_average: movieResponse.vote_average
  };
};
const loadTotalList = async () => {
  const moviesResponse = await getMovies({
    page: movieStore.page
  });
  updateMovieList(moviesResponse);
};
const loadSearchList = async () => {
  const moviesResponse = await getMovieByName({
    name: movieStore.searchKeyword,
    page: movieStore.page
  });
  updateMovieList(moviesResponse);
};
const $mainSection = document.querySelector("main section");
const $ul$1 = document.querySelector(".thumbnail-list");
const $error = document.querySelector(".error");
const $h2 = $error == null ? void 0 : $error.querySelector("h2");
const MAX_MOVIE_PAGE = 500;
const ErrorMessages = {
  400: "검색 가능한 페이지 수를 넘겼습니다.",
  401: "사용자 인증 정보가 잘못되었습니다."
};
const errorMessages = (status) => {
  return ErrorMessages[status] ?? "예상치 못한 오류가 발생했습니다.";
};
const changeHeaderBackground = () => {
  const $backgroundContainer = document.querySelector(".background-container");
  if (movieStore.searchKeyword === "") {
    const backgroundImage = movieStore.movies[0].backdrop_path ? `${DEFAULT_BACK_DROP_URL}${movieStore.movies[0].backdrop_path}` : "./images/default_thumbnail.jpeg";
    $backgroundContainer.style.backgroundImage = `url(${backgroundImage})`;
  } else {
    $backgroundContainer.style.backgroundImage = "";
  }
};
const renderHeaderBackground = () => {
  if (!document.querySelector(".top-rated-movie")) {
    const $topRatedContainer2 = document.querySelector(".top-rated-container");
    $topRatedContainer2 == null ? void 0 : $topRatedContainer2.append(
      TopRatedMovie({
        id: movieStore.movies[0].id,
        title: movieStore.movies[0].title,
        voteAverage: movieStore.movies[0].vote_average
      })
    );
  }
};
const renderSkeleton$1 = () => {
  if ($ul$1) {
    $ul$1.appendChild(MovieListSkeleton());
  }
};
const renderErrorPage = (error) => {
  $ul$1 == null ? void 0 : $ul$1.classList.add("close");
  $error == null ? void 0 : $error.classList.remove("close");
  $ul$1 && ($ul$1.innerHTML = "");
  if (!$h2 || !error.message) {
    return;
  }
  $h2.textContent = errorMessages(error.message);
};
const toggleEmptySearchError = () => {
  if (movieStore.movies.length === 0) {
    $ul$1 == null ? void 0 : $ul$1.classList.add("close");
    $error == null ? void 0 : $error.classList.remove("close");
    if ($h2) $h2.textContent = "검색 결과가 없습니다.";
  } else {
    $ul$1 == null ? void 0 : $ul$1.classList.remove("close");
    $error == null ? void 0 : $error.classList.add("close");
  }
};
const renderMoviesList = async () => {
  renderSkeleton$1();
  try {
    if (movieStore.searchKeyword === "") {
      await loadTotalList();
      renderHeaderBackground();
    } else {
      await loadSearchList();
      toggleEmptySearchError();
    }
    changeHeaderBackground();
  } catch (error) {
    if (error instanceof Error) {
      renderErrorPage(error);
    }
  }
  if ($ul$1) $ul$1.innerHTML = "";
  const $movies = MovieList(movieStore.movies);
  if ($movies) $mainSection == null ? void 0 : $mainSection.appendChild($movies);
};
function addEvent({ type, selector, handler }) {
  window.addEventListener(type, (event) => {
    const target = event.target;
    if (selector === "") {
      handler(event);
    } else if (target && target.closest(selector)) {
      handler(event, target.closest(selector));
    }
  });
}
const $title = document.querySelector(".thumbnail-title");
const $ul = document.querySelector(".thumbnail-list");
const $topRatedContainer = document.querySelector(".top-rated-container");
const $overlay = document.querySelector(".overlay");
addEvent({
  type: "click",
  selector: ".show-more",
  handler: () => {
    movieStore.page = movieStore.page + 1;
    renderMoviesList();
  }
});
addEvent({
  type: "submit",
  selector: ".top-rated-search",
  handler: (event, target) => {
    event.preventDefault();
    const value = (target == null ? void 0 : target.querySelector(".top-rated-search-input")).value;
    target.reset();
    if (value) {
      movieStore.searchKeyword = value;
      movieStore.page = 1;
      if ($ul && $title) {
        $ul.innerHTML = "";
        $title.textContent = `"${movieStore.searchKeyword}" 검색 결과`;
      }
      $topRatedContainer == null ? void 0 : $topRatedContainer.classList.add("close");
      $overlay == null ? void 0 : $overlay.classList.add("close");
      movieStore.movies = [];
      renderMoviesList();
    }
  }
});
const ratingMessages = {
  0: "평가해주세요",
  1: "최악이예요",
  2: "별로예요",
  3: "보통이에요",
  4: "재미있어요",
  5: "명작이에요"
};
function Modal({
  id,
  backdrop_path,
  title,
  release_year,
  genres,
  vote_average,
  overview,
  rate_number
}) {
  let dataIndex = 1;
  function loadFilledStar() {
    return Array.from({ length: rate_number }, () => {
      return `<img src="./images/star_filled.png" class="star" data-index="${dataIndex++}" />`;
    }).join("");
  }
  function loadEmptyStar() {
    return Array.from({ length: 5 - rate_number }, () => {
      return `<img src="./images/star_empty.png" class="star" data-index="${dataIndex++}" />`;
    }).join("");
  }
  return toElement(
    /* html */
    `
        <div class="modal-image" >
        <img
            src="${DEFAULT_BACK_DROP_URL}${backdrop_path}"
        />
        </div>
        <div class="modal-description" id=${id}>
          <div class="movie-description-container">
              <h2>${title}</h2>
              <p class="category">
                  ${release_year} · ${genres.join(",")}
              </p>
              <div class="rate-container">
                  <div>평균</div>
                  <p class="rate">
                      <img src="./images/star_filled.png" class="star" />
                      <span>${vote_average}</span>
                  </p>
              </div>
            </div>

            <hr />
            <p class="modal-subtitle">내 별점</p>
            <div class="personal-rate-container">
                <div class="personal-rate">
                  ${loadFilledStar()}
                  ${loadEmptyStar()}
                </div>
                <div class="personal-rate-message">
                    <span class="rating-message">${ratingMessages[rate_number]}</span>
                    <span class="caption"> (${rate_number * 2}/10) </span>
                </div>
            </div>
                

            <hr />
            <p class="modal-subtitle">줄거리</p>
            <p class="detail">
                ${overview}
            </p>
        </div>
    `
  );
}
function ModalSkeleton() {
  return toElement(`
    <div class="modal-skeleton">
        ${Skeleton({ width: "40%", height: "500px" })}
        <skeleton>
            ${Skeleton({ width: "100%", height: "160px" })}
            ${Skeleton({ width: "100%", height: "160px" })}
            ${Skeleton({ width: "100%", height: "160px" })}
        </skeleton>
    </div>
    `);
}
const key = "userRating";
function fetchAllMovieRatings() {
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, "[]");
    return [];
  }
  return JSON.parse(raw);
}
function fetchMovieRatingById(movieId) {
  const movieRatings = fetchAllMovieRatings();
  const existingMovie = movieRatings.find((rating) => rating.id === movieId);
  if (existingMovie) return existingMovie.rate;
  return 0;
}
function saveMovieRatingById({
  movieId,
  movieRate
}) {
  const movieRatings = fetchAllMovieRatings();
  if (!movieRatings) return;
  const existingMovie = movieRatings.find((rating) => rating.id === movieId);
  if (existingMovie) {
    existingMovie.rate = movieRate;
  } else {
    movieRatings.push({ id: movieId, rate: movieRate });
  }
  localStorage.setItem(key, JSON.stringify(movieRatings));
}
const $modalContainer = document.querySelector(".modal-container");
const renderSkeleton = () => {
  if ($modalContainer) {
    $modalContainer.innerHTML = "";
    $modalContainer.appendChild(ModalSkeleton());
  }
};
const movieDetailRenderer = async () => {
  renderSkeleton();
  const {
    backdrop_path,
    genres,
    id,
    overview,
    release_date,
    title,
    vote_average
  } = await fetchMovieDetail();
  const img = new Image();
  img.src = DEFAULT_BACK_DROP_URL + backdrop_path;
  img.alt = "영화 포스터 이미지";
  const localStorageMovieRate = fetchMovieRatingById(Number(id));
  const $modal = Modal({
    id,
    backdrop_path,
    title,
    release_year: Number(release_date.split("-")[0]),
    genres: genres.map((genre) => genre.name),
    vote_average,
    overview,
    rate_number: localStorageMovieRate
  });
  img.onload = () => {
    if ($modalContainer) {
      $modalContainer.innerHTML = "";
      $modalContainer.appendChild($modal);
    }
  };
};
const $modalBackground = document.querySelector("#modalBackground");
function closeModal() {
  $modalBackground == null ? void 0 : $modalBackground.classList.toggle("active");
  document.body.classList.remove("lock-scroll");
}
function opneModal(id) {
  movieStore.selectedMovie = id;
  document.body.classList.add("lock-scroll");
  $modalBackground == null ? void 0 : $modalBackground.classList.toggle("active");
  movieDetailRenderer();
}
addEvent({
  type: "click",
  selector: ".item",
  handler: (event, target) => {
    opneModal(Number(target == null ? void 0 : target.id));
  }
});
addEvent({
  type: "click",
  selector: "#top-rated-show-more",
  handler: () => {
    var _a;
    const movieId = (_a = document.querySelector(".top-rated-movie")) == null ? void 0 : _a.id.split("_")[1];
    opneModal(Number(movieId));
  }
});
addEvent({
  type: "click",
  selector: "#closeModal",
  handler: closeModal
});
addEvent({
  type: "keydown",
  selector: "",
  handler: (event) => {
    if (event.key === "Escape" && $modalBackground && $modalBackground.classList.contains("active")) {
      closeModal();
    }
  }
});
let selectedIndex = 0;
function getTargetIndex(target) {
  const targetIndex = Number(target.dataset.index);
  if (selectedIndex === targetIndex) {
    return 0;
  }
  return targetIndex;
}
addEvent({
  type: "click",
  selector: ".star",
  handler: (event, target) => {
    var _a;
    const $stars = document.querySelectorAll(".personal-rate .star");
    const $rateSubtitle = document.querySelector(".personal-rate-message");
    const movieId = Number((_a = document.querySelector(".modal-description")) == null ? void 0 : _a.id);
    const targetIndex = getTargetIndex(target);
    selectedIndex = targetIndex;
    movieId && saveMovieRatingById({ movieId, movieRate: targetIndex });
    if ($rateSubtitle) {
      $rateSubtitle.innerHTML = `
         <span class="rating-message"> ${ratingMessages[targetIndex]}</span>
        <span class="caption"> (${targetIndex * 2}/10) </span>
        `;
    }
    $stars.forEach((star) => {
      const $starImg = star;
      $starImg.src = Number($starImg.dataset.index) <= targetIndex ? "./images/star_filled.png" : "./images/star_empty.png";
    });
  }
});
let observer;
function createObserver() {
  observer = new IntersectionObserver(handleIntersect, {
    root: null,
    rootMargin: "0px",
    threshold: 0.1
  });
  const sentinel = document.querySelector("#sentinel");
  if (sentinel) observer.observe(sentinel);
}
function handleIntersect(entries) {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    if (movieStore.page >= Math.min(MAX_MOVIE_PAGE, movieStore.totalPages)) {
      observer.unobserve(entry.target);
      return;
    }
    movieStore.page++;
    renderMoviesList();
  });
}
setupUI();
function setupUI() {
  const $container = document.querySelector(".container");
  $container == null ? void 0 : $container.appendChild(toElement(`<div id="sentinel"></div>`));
  renderMoviesList();
  createObserver();
}
