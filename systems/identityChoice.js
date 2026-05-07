(function () {
  window.SignalSelf = window.SignalSelf || {};
  window.SignalSelf.systems = window.SignalSelf.systems || {};

  function beginAfterBodyFailure() {
    const game = window.SignalSelf;
    game.systems.movement.freeze(2600);
    game.elements.submitMatchesButton.disabled = true;
    game.elements.matchingFeedback.textContent = "Wrong. The body cannot solve itself.";

    window.setTimeout(() => {
      open();
    }, 1700);
  }

  function open() {
    const game = window.SignalSelf;
    game.state.identityChoiceActive = true;
    game.state.identityChoiceStep = 0;
    game.elements.identityChoiceOverlay.classList.remove("hidden");
    game.elements.identityChoiceOverlay.classList.add("fading-in");
    game.elements.identityAnswerButtons.classList.add("hidden");
    game.elements.identityNextButton.classList.add("hidden");
    game.elements.identityQuestionText.textContent = "";

    window.requestAnimationFrame(() => {
      game.elements.identityChoiceOverlay.classList.remove("fading-in");
    });

    window.setTimeout(() => {
      writeFirstQuestion();
    }, 950);
  }

  function writeFirstQuestion() {
    const game = window.SignalSelf;
    game.systems.typewriter.write({
      text: "Who am I?",
      target: game.elements.identityQuestionText,
      button: game.elements.identityNextButton,
      speed: 62,
    });
  }

  function writeSecondQuestion() {
    const game = window.SignalSelf;
    game.systems.typewriter.write({
      text: "Who am I?",
      target: game.elements.identityQuestionText,
      speed: 185,
      onCharacter(character, index) {
        playDeepTypeSound(index);
      },
      onComplete() {
        game.elements.identityAnswerButtons.classList.remove("hidden");
        game.elements.identityAnswerButtons.querySelector("button")?.focus();
      },
    });
  }

  function advance() {
    const game = window.SignalSelf;

    if (!game.state.identityChoiceActive || game.state.identityChoiceStep !== 0) {
      return;
    }

    game.state.identityChoiceStep = 1;
    game.elements.identityNextButton.classList.add("hidden");
    writeSecondQuestion();
  }

  function choose(scoreName) {
    const game = window.SignalSelf;

    if (game.state.virtualTransitionActive) {
      return;
    }

    game.endingScoreSystem.incrementEndingScore(scoreName);
    game.elements.identityAnswerButtons.classList.add("hidden");
    game.elements.identityNextButton.classList.add("hidden");
    game.elements.identityQuestionText.textContent = "";
    game.systems.typewriter.stop();

    game.systems.screenEffects.transitionToArtificialBody(() => {
      game.state.identityChoiceActive = false;
      game.elements.identityChoiceOverlay.classList.add("hidden");
      game.enterArtificialBody();
    });
  }

  function playDeepTypeSound(index) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext || index % 2 !== 0) {
      return;
    }

    const game = window.SignalSelf;
    game.audioContext = game.audioContext || new AudioContext();

    const oscillator = game.audioContext.createOscillator();
    const gain = game.audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 82;
    gain.gain.setValueAtTime(0.035, game.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, game.audioContext.currentTime + 0.08);
    oscillator.connect(gain);
    gain.connect(game.audioContext.destination);
    oscillator.start();
    oscillator.stop(game.audioContext.currentTime + 0.085);
  }

  window.SignalSelf.systems.identityChoice = {
    beginAfterBodyFailure,
    advance,
    choose,
  };
})();
