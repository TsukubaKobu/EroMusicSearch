function setLang(lang) {
  document.querySelectorAll("[data-lang]").forEach(function (el) {
    el.classList.toggle("active", el.dataset.lang === lang);
  });
  document.querySelectorAll(".lang-btn").forEach(function (btn, i) {
    btn.classList.toggle("active", ["ja", "zh", "en"][i] === lang);
  });
  document.documentElement.lang = lang;
  localStorage.setItem("lang", lang);
}

var saved = localStorage.getItem("lang");
if (saved && saved !== "ja") {
  setLang(saved);
}

var version = document.documentElement.dataset.version;
if (version) {
  var vEls = document.querySelectorAll(".js-version-text");
  vEls.forEach(function (el) {
    el.textContent = "v" + version;
  });
  var badges = document.querySelectorAll(".js-version-badge");
  badges.forEach(function (el) {
    el.src = "https://img.shields.io/badge/version-" + version + "-333";
  });
  var dls = document.querySelectorAll(".js-dl-link");
  dls.forEach(function (el) {
    var asset = el.dataset.asset;
    if (asset) {
      el.href = "https://github.com/TsukubaKobu/EroMusicSearch/releases/latest/download/" + asset.replace("VERSION", version);
    }
  });
}

var observer = new IntersectionObserver(
  function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll(".reveal").forEach(function (el) {
  observer.observe(el);
});
