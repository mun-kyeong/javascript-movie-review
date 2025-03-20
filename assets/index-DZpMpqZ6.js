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
function Button({ className, textContent }) {
  const $button = document.createElement("button");
  $button.className = `${className} primary`;
  $button.textContent = textContent;
  return $button;
}
const store = {
  page: 1,
  totalPages: 1,
  movies: [],
  searchKeyword: ""
};
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
  const url = `https://api.themoviedb.org/3/movie/popular?language=ko-KR&page=${page}`;
  return fetchWithErrorHandling(url);
}
async function getMovieByName({
  name,
  page
}) {
  const url = `https://api.themoviedb.org/3/search/movie?query=${name}&include_adult=false&language=ko-KR&page=${page}`;
  return fetchWithErrorHandling(url);
}
const MAX_MOVIE_PAGE = 500;
const DEFAULT_BACK_DROP_URL = "https://media.themoviedb.org/t/p/w440_and_h660_face/";
function MovieList(moviesResult) {
  const $ul2 = document.querySelector(".thumbnail-list");
  moviesResult.forEach((movieResult) => {
    const $li = document.createElement("li");
    const backgroundImage = movieResult.backdrop_path ? `${DEFAULT_BACK_DROP_URL}${movieResult.backdrop_path}` : "./images/default_thumbnail.jpeg";
    $li.innerHTML = /*html*/
    `
        <div class="item">
          <img
            class="thumbnail"
            src="${backgroundImage}"
            alt="${movieResult.title}"
          />
          <div class="item-desc">
            <p class="rate loading">
              <img src="./images/star_empty.png" class="star" /><span
                >${movieResult.vote_average}</span
              >
            </p>
            <strong>${movieResult.title}</strong>
          </div>
        </div>
    `;
    $ul2 == null ? void 0 : $ul2.appendChild($li);
  });
  return $ul2;
}
function Skeleton({ width, height }) {
  const $skeletonContainer = document.createElement("div");
  $skeletonContainer.className = "skeleton";
  $skeletonContainer.style.width = `${width}px`;
  $skeletonContainer.style.height = `${height}px`;
  return $skeletonContainer;
}
function MovieListSkeleton() {
  const $ul2 = document.querySelector(".thumbnail-list");
  for (let i = 0; i < 20; i++) {
    const $li = document.createElement("li");
    const $item = document.createElement("div");
    $item.className = "item";
    const $imageSkeleton = Skeleton({ width: 200, height: 300 });
    const $voteAverageSkeleton = Skeleton({ width: 60, height: 15 });
    const $titleSkeleton = Skeleton({ width: 150, height: 20 });
    const $itemDesc = document.createElement("div");
    $itemDesc.className = "item-desc";
    $itemDesc.append($voteAverageSkeleton, $titleSkeleton);
    $item.append($imageSkeleton);
    $item.append($itemDesc);
    $li.append($item);
    $ul2 == null ? void 0 : $ul2.append($li);
  }
  return $ul2;
}
function TopRatedMovie({
  title,
  voteAverage
}) {
  const $topRatedMovie = document.createElement("div");
  $topRatedMovie.className = "top-rated-movie";
  $topRatedMovie.innerHTML = `
    <div class="rate">
      <img src="./images/star_empty.png" class="star" />
      <span class="rate-value">${voteAverage}</span>
    </div>
    <div class="title">${title}</div>
    <button class="primary detail">자세히 보기</button>
  `;
  return $topRatedMovie;
}
const $mainSection = document.querySelector("main section");
const $ul = document.querySelector(".thumbnail-list");
const $error = document.querySelector(".error");
const $h2 = $error == null ? void 0 : $error.querySelector("h2");
const changeHeaderBackground = () => {
  const $backgroundContainer = document.querySelector(".background-container");
  if (store.searchKeyword === "") {
    const backgroundImage = store.movies[0].backdrop_path ? `${DEFAULT_BACK_DROP_URL}${store.movies[0].backdrop_path}` : "./images/default_thumbnail.jpeg";
    $backgroundContainer.style.backgroundImage = `url(${backgroundImage})`;
  } else {
    $backgroundContainer.style.backgroundImage = "";
  }
};
const renderHeaderBackground = () => {
  if (!document.querySelector(".top-rated-movie")) {
    const $topRatedContainer = document.querySelector(".top-rated-container");
    $topRatedContainer == null ? void 0 : $topRatedContainer.append(
      TopRatedMovie({
        title: store.movies[0].title,
        voteAverage: store.movies[0].vote_average
      })
    );
  }
};
const renderTotalList = async () => {
  const moviesResponse = await getMovies({ page: store.page });
  store.movies = [...store.movies, ...moviesResponse.results];
  store.totalPages = moviesResponse.total_pages;
  renderHeaderBackground();
  changeHeaderBackground();
};
const renderSearchList = async () => {
  changeHeaderBackground();
  const moviesResponse = await getMovieByName({
    name: store.searchKeyword,
    page: store.page
  });
  store.movies = [...store.movies, ...moviesResponse.results];
  store.totalPages = moviesResponse.total_pages;
  if (store.movies.length === 0) {
    $ul == null ? void 0 : $ul.classList.add("close");
    $error == null ? void 0 : $error.classList.remove("close");
    if ($h2) $h2.textContent = "검색 결과가 없습니다.";
  } else {
    $ul == null ? void 0 : $ul.classList.remove("close");
    $error == null ? void 0 : $error.classList.add("close");
  }
};
const renderMoviesList = async () => {
  const $skeleton = MovieListSkeleton();
  if ($skeleton) $mainSection == null ? void 0 : $mainSection.appendChild($skeleton);
  try {
    if (store.searchKeyword === "") await renderTotalList();
    else await renderSearchList();
  } catch (error) {
    $ul == null ? void 0 : $ul.classList.add("close");
    $error == null ? void 0 : $error.classList.remove("close");
    if ($ul) $ul.innerHTML = "";
    if (error.message === "400" && $h2)
      $h2.textContent = "검색 가능한 페이지 수를 넘겼습니다.";
    if (error.message === "401" && $h2)
      $h2.textContent = "사용자 인증 정보가 잘못되었습니다.";
    return;
  }
  const $showMore = document.querySelector(".show-more");
  if (store.page !== Math.min(MAX_MOVIE_PAGE, store.totalPages))
    $showMore == null ? void 0 : $showMore.classList.add("open");
  else $showMore == null ? void 0 : $showMore.classList.remove("open");
  if ($ul) $ul.innerHTML = "";
  const $movies = MovieList(store.movies);
  if ($movies) $mainSection == null ? void 0 : $mainSection.appendChild($movies);
};
const isElement = (target) => {
  return target instanceof Element;
};
window.addEventListener("click", async (event) => {
  const { target } = event;
  if (isElement(target) && target.closest(".show-more")) {
    store.page = store.page + 1;
    renderMoviesList();
  }
});
window.addEventListener("submit", async (event) => {
  event.preventDefault();
  const { target } = event;
  if (isElement(target) && target.closest(".top-rated-search")) {
    const $searchInput = target.querySelector(
      ".top-rated-search-input"
    );
    const value = $searchInput == null ? void 0 : $searchInput.value;
    target.reset();
    if (value) {
      store.searchKeyword = value;
      store.page = 1;
      const $title = document.querySelector(".thumbnail-title");
      if ($title) $title.textContent = `"${store.searchKeyword}" 검색 결과`;
      const $ul2 = document.querySelector(".thumbnail-list");
      if ($ul2) $ul2.innerHTML = "";
      const $topRatedContainer = document.querySelector(".top-rated-container");
      const $overlay = document.querySelector(".overlay");
      $topRatedContainer == null ? void 0 : $topRatedContainer.classList.add("close");
      $overlay == null ? void 0 : $overlay.classList.add("close");
      store.movies = [];
      renderMoviesList();
    }
  }
});
addEventListener("load", async () => {
  const $container = document.querySelector(".container");
  $container == null ? void 0 : $container.appendChild(
    Button({ className: "show-more", textContent: "더 보기" })
  );
  renderMoviesList();
});
