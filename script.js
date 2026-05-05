(function () {
  window.SignalSelf = window.SignalSelf || {};

  const game = window.SignalSelf;

  game.state = {
    currentScreen: "title",
    activeReality: "body",
    unlockedRealities: new Set(["body"]),
    player: {
      x: 50,
      y: 55,
      targetX: 50,
      targetY: 55,
      speed: 32,
      radius: 2.2,
    },
    pressedKeys: new Set(),
    animationFrame: null,
    lastFrameTime: 0,
    nearbyFigureId: null,
    activeDialogueFigureId: null,
    dialogueLineIndex: 0,
    spokenFigureIds: new Set(),
    bodyChallengeStarted: false,
    matchingAssignments: new Map(),
    matchAttempt: 0,
    introIndex: 0,
    introActive: false,
    introReady: false,
    selfTalkActive: false,
    selfTalkReady: false,
    selfTalkOnComplete: null,
    movementFreezeUntil: 0,
    identityChoiceActive: false,
    identityChoiceStep: 0,
    virtualTransitionActive: false,
  };

  game.elements = {
    screens: {
      title: document.querySelector("#title-screen"),
      loading: document.querySelector("#loading-screen"),
      game: document.querySelector("#game-screen"),
    },
    startButton: document.querySelector("#start-button"),
    loadingProgress: document.querySelector("#loading-progress"),
    bootLines: document.querySelector("#boot-lines"),
    world: document.querySelector("#world"),
    bodyLayerContent: document.querySelector("#body-layer-content"),
    player: document.querySelector("#player"),
    clickTarget: document.querySelector("#click-target"),
    interactionPrompt: document.querySelector("#interaction-prompt"),
    dialogueBox: document.querySelector("#dialogue-box"),
    dialogueSpeaker: document.querySelector("#dialogue-speaker"),
    dialogueText: document.querySelector("#dialogue-text"),
    dialogueNextButton: document.querySelector("#dialogue-next-button"),
    dialogueCloseButton: document.querySelector("#dialogue-close-button"),
    matchingOverlay: document.querySelector("#matching-overlay"),
    draggablePeople: document.querySelector("#draggable-people"),
    relationshipSlots: document.querySelector("#relationship-slots"),
    matchingFeedback: document.querySelector("#matching-feedback"),
    submitMatchesButton: document.querySelector("#submit-matches-button"),
    introOverlay: document.querySelector("#intro-overlay"),
    introText: document.querySelector("#intro-text"),
    introNextButton: document.querySelector("#intro-next-button"),
    identityChoiceOverlay: document.querySelector("#identity-choice-overlay"),
    identityQuestionText: document.querySelector("#identity-question-text"),
    identityNextButton: document.querySelector("#identity-next-button"),
    identityAnswerButtons: document.querySelector("#identity-answer-buttons"),
    virtualTransitionOverlay: document.querySelector("#virtual-transition-overlay"),
    realityLabel: document.querySelector("#reality-label"),
    realityButtons: document.querySelector("#reality-buttons"),
    systemMessage: document.querySelector("#system-message"),
    returnTitleButton: document.querySelector("#return-title-button"),
  };

  function showScreen(screenName) {
    game.state.currentScreen = screenName;

    Object.entries(game.elements.screens).forEach(([name, screen]) => {
      screen.classList.toggle("active", name === screenName);
    });
  }

  function startBootSequence() {
    resetPrototype();
    showScreen("loading");
    game.elements.loadingProgress.style.width = "0%";
    game.elements.bootLines.innerHTML = "";

    game.config.bootMessages.forEach((message, index) => {
      window.setTimeout(() => {
        const line = document.createElement("li");
        line.textContent = message;
        game.elements.bootLines.appendChild(line);
        game.elements.loadingProgress.style.width =
          `${((index + 1) / game.config.bootMessages.length) * 100}%`;
      }, 420 + index * 520);
    });

    window.setTimeout(() => {
      showScreen("game");
      renderRealityButtons();
      game.layers.body.render();
      setReality("body");
      game.systems.movement.renderPlayer();
      game.elements.world.focus();
      game.systems.movement.startGameLoop();
      startIntroSequence();
    }, 3100);
  }

  function resetPrototype() {
    game.state.activeReality = "body";
    game.state.unlockedRealities = new Set(["body"]);
    game.state.player.x = 50;
    game.state.player.y = 55;
    game.state.player.targetX = 50;
    game.state.player.targetY = 55;
    game.state.pressedKeys.clear();
    game.state.nearbyFigureId = null;
    game.state.activeDialogueFigureId = null;
    game.state.dialogueLineIndex = 0;
    game.state.spokenFigureIds = new Set();
    game.state.bodyChallengeStarted = false;
    game.state.matchingAssignments = new Map();
    game.state.matchAttempt = 0;
    game.state.introIndex = 0;
    game.state.introActive = false;
    game.state.introReady = false;
    game.state.selfTalkActive = false;
    game.state.selfTalkReady = false;
    game.state.selfTalkOnComplete = null;
    game.state.movementFreezeUntil = 0;
    game.state.identityChoiceActive = false;
    game.state.identityChoiceStep = 0;
    game.state.virtualTransitionActive = false;
    game.endingScoreSystem.resetEndingScores();
    game.elements.clickTarget.classList.remove("active");
    game.elements.dialogueBox.classList.add("hidden");
    game.elements.matchingOverlay.classList.add("hidden");
    game.elements.introOverlay.classList.add("hidden");
    game.elements.introNextButton.classList.add("hidden");
    game.elements.identityChoiceOverlay.classList.add("hidden");
    game.elements.identityAnswerButtons.classList.add("hidden");
    game.elements.identityNextButton.classList.add("hidden");
    game.elements.virtualTransitionOverlay.classList.add("hidden");
    game.elements.virtualTransitionOverlay.classList.remove("virtual-transition-active");
    game.elements.interactionPrompt.classList.remove("visible");
    game.systems.screenEffects.setCrackStage(0);
    game.systems.movement.stopGameLoop();
  }

  function renderRealityButtons() {
    game.elements.realityButtons.innerHTML = "";

    game.config.realities.forEach((reality) => {
      const unlocked = game.state.unlockedRealities.has(reality.id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "reality-button";
      button.classList.toggle("locked", !unlocked);
      button.disabled = !unlocked;
      button.textContent = unlocked ? reality.label : "LOCKED";
      button.dataset.key = reality.key;
      button.dataset.reality = reality.id;
      button.style.color = getRealityColor(reality.id);
      button.setAttribute("aria-label", unlocked ? reality.label : `${reality.label} locked`);
      button.addEventListener("click", () => setReality(reality.id));
      game.elements.realityButtons.appendChild(button);
    });

    updateRealityButtonState();
  }

  function setReality(realityId, options = {}) {
    if (game.state.virtualTransitionActive && !options.force) {
      return;
    }

    if (!game.state.unlockedRealities.has(realityId)) {
      game.elements.systemMessage.textContent =
        "Reality layer locked. The body has not broken open yet.";
      return;
    }

    const reality = game.config.realities.find((item) => item.id === realityId);

    if (!reality) {
      return;
    }

    game.state.activeReality = reality.id;
    game.state.nearbyFigureId = null;
    game.elements.world.className = `world ${reality.worldClass}`;
    game.elements.realityLabel.textContent = `Reality: ${reality.label}`;
    game.elements.systemMessage.textContent = reality.message;
    game.elements.dialogueBox.classList.add("hidden");
    updateRealityButtonState();
    game.layers.body.updateNearbyFigure();
  }

  function updateRealityButtonState() {
    Array.from(game.elements.realityButtons.children).forEach((button) => {
      const unlocked = game.state.unlockedRealities.has(button.dataset.reality);
      const reality = game.config.realities.find((item) => item.id === button.dataset.reality);
      button.disabled = !unlocked;
      button.classList.toggle("locked", !unlocked);
      button.classList.toggle("active", button.dataset.reality === game.state.activeReality);
      button.textContent = unlocked ? reality.label : "LOCKED";
      button.setAttribute("aria-label", unlocked ? reality.label : `${reality.label} locked`);
    });
  }

  function unlockReality(realityId) {
    game.state.unlockedRealities.add(realityId);
    renderRealityButtons();
  }

  function getRealityColor(realityId) {
    const colors = {
      body: "var(--red)",
      artificial: "var(--green)",
      dream: "var(--violet)",
      network: "var(--cyan)",
    };

    return colors[realityId] || "var(--ink)";
  }

  function enterArtificialBody() {
    game.elements.matchingOverlay.classList.add("hidden");
    game.systems.screenEffects.setCrackStage(0);
    unlockReality("artificial");
    game.state.player.x = 50;
    game.state.player.y = 55;
    game.state.player.targetX = 50;
    game.state.player.targetY = 55;
    setReality("artificial", { force: true });
    game.layers.artificialBody.onEnter();
    game.systems.movement.renderPlayer();
  }

  function startIntroSequence() {
    game.state.introIndex = 0;
    game.state.introActive = true;
    game.elements.introOverlay.classList.remove("hidden");
    renderIntroLine();
  }

  function renderIntroLine() {
    const introLines = ["Who am I?", "Who are you?", "What is reality?"];
    game.state.introReady = false;
    game.systems.typewriter.write({
      text: introLines[game.state.introIndex],
      target: game.elements.introText,
      button: game.elements.introNextButton,
      speed: 58,
      onComplete() {
        game.state.introReady = true;
      },
    });
  }

  function advanceIntro() {
    if (!game.state.introActive || !game.state.introReady) {
      return;
    }

    game.state.introIndex += 1;

    if (game.state.introIndex < 3) {
      renderIntroLine();
      return;
    }

    finishIntro();
  }

  function finishIntro() {
    game.state.introActive = false;
    game.state.introReady = false;
    game.elements.introNextButton.classList.add("hidden");
    game.elements.world.classList.add("psych-phase");

    window.setTimeout(() => {
      game.elements.introOverlay.classList.add("hidden");
      game.elements.world.classList.remove("psych-phase");
      game.systems.selfTalk.say("Who are all these people? I better go talk to them...");
    }, 1200);
  }

  function handleKeydown(event) {
    const key = event.key.toLowerCase();
    if (game.state.currentScreen !== "game") {
      return;
    }

    if (game.state.introActive) {
      if ((key === "enter" || key === " " || key === "e") && game.state.introReady) {
        event.preventDefault();
        advanceIntro();
      }

      return;
    }

    if (game.state.selfTalkActive) {
      if (key === "enter" || key === " " || key === "e") {
        event.preventDefault();
        game.systems.selfTalk.advance();
      }

      return;
    }

    if (game.state.identityChoiceActive) {
      if ((key === "enter" || key === " " || key === "e") && game.state.identityChoiceStep === 0) {
        event.preventDefault();
        game.systems.identityChoice.advance();
      }

      return;
    }

    if (!game.elements.dialogueBox.classList.contains("hidden")) {
      if (key === "enter" || key === " " || key === "e") {
        event.preventDefault();
        game.systems.dialogue.advance();
      }

      if (key === "escape") {
        game.systems.dialogue.close();
      }

      return;
    }

    if (!game.elements.matchingOverlay.classList.contains("hidden")) {
      return;
    }

    if (key === "e" && game.state.nearbyFigureId) {
      game.systems.dialogue.open(game.state.nearbyFigureId);
      return;
    }

  }

  game.showScreen = showScreen;
  game.setReality = setReality;
  game.unlockReality = unlockReality;
  game.enterArtificialBody = enterArtificialBody;

  game.elements.startButton.addEventListener("click", startBootSequence);
  game.elements.returnTitleButton.addEventListener("click", () => {
    if (game.state.virtualTransitionActive) {
      return;
    }

    game.systems.movement.stopGameLoop();
    showScreen("title");
  });
  game.elements.world.addEventListener("click", game.systems.movement.setClickTarget);
  game.elements.dialogueBox.addEventListener("click", (event) => event.stopPropagation());
  game.elements.introOverlay.addEventListener("click", (event) => event.stopPropagation());
  game.elements.matchingOverlay.addEventListener("click", (event) => event.stopPropagation());
  game.elements.identityChoiceOverlay.addEventListener("click", (event) => event.stopPropagation());
  game.elements.virtualTransitionOverlay.addEventListener("click", (event) => event.stopPropagation());
  game.elements.dialogueNextButton.addEventListener("click", () => {
    if (game.state.selfTalkActive) {
      game.systems.selfTalk.advance();
      return;
    }

    game.systems.dialogue.advance();
  });
  game.elements.dialogueCloseButton.addEventListener("click", game.systems.dialogue.close);
  game.elements.submitMatchesButton.addEventListener("click", game.systems.matchingGame.submit);
  game.elements.introNextButton.addEventListener("click", advanceIntro);
  game.elements.identityNextButton.addEventListener("click", game.systems.identityChoice.advance);
  game.elements.identityAnswerButtons.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-score]");

    if (!button) {
      return;
    }

    game.systems.identityChoice.choose(button.dataset.score);
  });
  window.addEventListener("keydown", handleKeydown);

  showScreen("title");
})();
