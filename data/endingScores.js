(function () {
  window.SignalSelf = window.SignalSelf || {};

  function resetEndingScores() {
    window.body = 0;
    window.fragmented = 0;
    window.collective = 0;

    window.SignalSelf.endingScores = {
      body: window.body,
      fragmented: window.fragmented,
      collective: window.collective,
    };
  }

  function incrementEndingScore(scoreName) {
    if (scoreName === "body") {
      window.body += 1;
    }

    if (scoreName === "fragmented") {
      window.fragmented += 1;
    }

    if (scoreName === "collective") {
      window.collective += 1;
    }

    window.SignalSelf.endingScores.body = window.body;
    window.SignalSelf.endingScores.fragmented = window.fragmented;
    window.SignalSelf.endingScores.collective = window.collective;
  }

  function getHighestEndingScore() {
    const entries = Object.entries(window.SignalSelf.endingScores);
    return entries.reduce((highest, current) => {
      return current[1] > highest[1] ? current : highest;
    });
  }

  resetEndingScores();

  window.SignalSelf.endingScoreSystem = {
    resetEndingScores,
    incrementEndingScore,
    getHighestEndingScore,
  };
})();
