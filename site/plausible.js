window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
plausible.init({
  endpoint: "https://agentvolumes.org/api/event"
})
var docs404;function docsTrack404(){document.querySelector(".not-found-container")&&location.pathname!==docs404&&(docs404=location.pathname,plausible("404"))}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",docsTrack404,{once:!0}):docsTrack404(),addEventListener("popstate",docsTrack404),new MutationObserver(docsTrack404).observe(document.documentElement,{childList:!0,subtree:!0});
