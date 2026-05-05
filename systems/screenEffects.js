(function () {
  window.SignalSelf = window.SignalSelf || {};
  window.SignalSelf.systems = window.SignalSelf.systems || {};

  function triggerBodyBreakCutscene() {
    const game = window.SignalSelf;
    game.state.pressedKeys.clear();
    game.elements.clickTarget.classList.remove("active");
    setCrackStage(1);
    game.elements.world.classList.add("psych-phase");

    window.setTimeout(() => {
      game.elements.world.classList.remove("psych-phase");
      game.systems.matchingGame.open();
    }, 1800);
  }

  function setCrackStage(stage) {
    const game = window.SignalSelf;
    game.elements.world.classList.remove("crack-stage-1", "crack-stage-2", "crack-stage-3");
    game.elements.matchingOverlay.classList.remove("crack-stage-1", "crack-stage-2", "crack-stage-3");

    if (stage > 0) {
      game.elements.world.classList.add(`crack-stage-${stage}`);
      game.elements.matchingOverlay.classList.add(`crack-stage-${stage}`);
    }
  }

  window.SignalSelf.systems.screenEffects = {
    triggerBodyBreakCutscene,
    setCrackStage,
  };
})();
