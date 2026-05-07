(function () {
  window.SignalSelf = window.SignalSelf || {};
  window.SignalSelf.systems = window.SignalSelf.systems || {};

  const shinjiPortraits = {
    confused: "sprites/shinji/confused.png",
    neutral: "sprites/shinji/neutral.png",
    robot: "sprites/shinji/robot.png",
  };
  const randomPersonPortrait = "sprites/randomperson.png";

  function open(figureId) {
    const game = window.SignalSelf;
    const figure = game.layers.body.figures.find((item) => item.id === figureId);

    if (!figure) {
      return;
    }

    game.state.activeDialogueFigureId = figureId;
    game.state.dialogueLineIndex = 0;
    game.state.shinjiDialoguePhase = null;
    game.state.shinjiResponseLines = [];
    game.elements.dialogueCloseButton.classList.add("hidden");
    game.elements.dialogueBox.classList.remove("hidden");

    clearChoiceButtons();

    if (figureId === game.layers.body.assistFigureId) {
      openShinjiDialogue();
      return;
    }

    showRandomPersonPortrait();
    renderLine();
  }

  function openCustom(options) {
    const game = window.SignalSelf;
    game.state.customDialogueActive = true;
    game.state.customDialogueSpeaker = options.speaker || "Signal";
    game.state.customDialogueLines = options.lines || [];
    game.state.customDialogueOnComplete = options.onComplete || null;
    game.state.activeDialogueFigureId = null;
    game.state.dialogueLineIndex = 0;
    game.state.shinjiDialoguePhase = null;
    game.state.shinjiResponseLines = [];
    game.elements.dialogueCloseButton.classList.add("hidden");
    game.elements.dialogueBox.classList.remove("hidden");
    clearChoiceButtons();

    if (game.state.customDialogueSpeaker === "Shinji") {
      showShinjiPortrait(options.portrait || getDefaultShinjiPortrait());
    } else {
      hideShinjiPortrait();
    }

    renderCustomLine();
  }

  function openShinjiDialogue() {
    const game = window.SignalSelf;
    game.state.shinjiDialoguePhase = "intro";
    showShinjiPortrait("confused");
    renderShinjiIntroLine();
  }

  function renderShinjiIntroLine() {
    const game = window.SignalSelf;
    const figure = getActiveFigure();

    if (!figure) {
      close();
      return;
    }

    game.elements.dialogueNextButton.textContent =
      game.state.dialogueLineIndex === figure.lines.length - 1 ? "Answer" : "Continue";
    game.systems.typewriter.write({
      text: figure.lines[game.state.dialogueLineIndex],
      target: game.elements.dialogueText,
      button: game.elements.dialogueNextButton,
      speed: 34,
    });
    game.elements.dialogueSpeaker.textContent = figure.speaker;
  }

  function renderLine() {
    const game = window.SignalSelf;
    const figure = getActiveFigure();

    if (!figure) {
      close();
      return;
    }

    game.elements.dialogueNextButton.textContent =
      game.state.dialogueLineIndex === figure.lines.length - 1 ? "Close" : "Continue";
    game.systems.typewriter.write({
      text: figure.lines[game.state.dialogueLineIndex],
      target: game.elements.dialogueText,
      button: game.elements.dialogueNextButton,
      speed: 34,
    });
    game.elements.dialogueSpeaker.textContent = figure.speaker;
  }

  function advance() {
    const game = window.SignalSelf;

    if (game.state.customDialogueActive) {
      advanceCustomDialogue();
      return;
    }

    const figure = getActiveFigure();

    if (!figure) {
      close();
      return;
    }

    if (figure.id === game.layers.body.assistFigureId) {
      if (
        game.state.shinjiDialoguePhase === "intro" &&
        game.state.dialogueLineIndex < figure.lines.length - 1
      ) {
        game.state.dialogueLineIndex += 1;
        renderShinjiIntroLine();
        return;
      }

      advanceShinjiDialogue();
      return;
    }

    if (game.state.dialogueLineIndex >= figure.lines.length - 1) {
      close();
      return;
    }

    game.state.dialogueLineIndex += 1;
    renderLine();
  }

  function renderCustomLine() {
    const game = window.SignalSelf;
    const line = game.state.customDialogueLines[game.state.dialogueLineIndex];

    if (!line) {
      close();
      return;
    }

    game.elements.dialogueNextButton.textContent =
      game.state.dialogueLineIndex === game.state.customDialogueLines.length - 1
        ? "Close"
        : "Continue";
    game.elements.dialogueSpeaker.textContent = game.state.customDialogueSpeaker;
    game.systems.typewriter.write({
      text: line,
      target: game.elements.dialogueText,
      button: game.elements.dialogueNextButton,
      speed: 34,
    });
  }

  function advanceCustomDialogue() {
    const game = window.SignalSelf;

    if (game.state.dialogueLineIndex >= game.state.customDialogueLines.length - 1) {
      close();
      return;
    }

    game.state.dialogueLineIndex += 1;
    renderCustomLine();
  }

  function advanceShinjiDialogue() {
    const game = window.SignalSelf;

    if (game.state.shinjiDialoguePhase === "intro") {
      showShinjiOptions();
      return;
    }

    if (game.state.shinjiDialoguePhase === "question-response") {
      showShinjiOptions();
      return;
    }

    if (game.state.shinjiDialoguePhase === "help-response") {
      if (game.state.dialogueLineIndex < game.state.shinjiResponseLines.length - 1) {
        game.state.dialogueLineIndex += 1;
        renderShinjiResponseLine();
        return;
      }

      game.state.shinjiHelpAccepted = true;
      close();
    }
  }

  function showShinjiOptions() {
    const game = window.SignalSelf;
    game.state.shinjiDialoguePhase = "choices";
    game.elements.dialogueNextButton.classList.add("hidden");
    game.elements.dialogueText.textContent = "";
    renderChoiceButtons();
  }

  function renderChoiceButtons() {
    const game = window.SignalSelf;
    const choices = [
      { id: "whoAreYou", label: "Who are you?" },
      { id: "whoAmI", label: "Who am I?" },
    ];

    if (game.state.shinjiQuestionsAsked.whoAreYou && game.state.shinjiQuestionsAsked.whoAmI) {
      choices.push({ id: "help", label: "Will you help me?" });
    }

    const choiceWrap = getChoiceWrap();
    choiceWrap.innerHTML = "";

    choices.forEach((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = choice.label;
      button.dataset.shinjiChoice = choice.id;
      button.addEventListener("click", () => chooseShinjiOption(choice.id));
      choiceWrap.appendChild(button);
    });

    choiceWrap.classList.remove("hidden");
    choiceWrap.querySelector("button")?.focus();
  }

  function chooseShinjiOption(choiceId) {
    const game = window.SignalSelf;
    clearChoiceButtons();

    if (choiceId === "whoAreYou") {
      game.state.shinjiQuestionsAsked.whoAreYou = true;
      game.state.shinjiResponseLines = ["I am Shinji. You remember me, don't you?"];
      game.state.shinjiDialoguePhase = "question-response";
      game.state.dialogueLineIndex = 0;
      renderShinjiResponseLine();
      return;
    }

    if (choiceId === "whoAmI") {
      game.state.shinjiQuestionsAsked.whoAmI = true;
      game.state.shinjiResponseLines = ["I am Shinji. You... you know who you are."];
      game.state.shinjiDialoguePhase = "question-response";
      game.state.dialogueLineIndex = 0;
      renderShinjiResponseLine();
      return;
    }

    if (choiceId === "help") {
      game.state.shinjiResponseLines = [
        "You want to get out of here? But... this is where you belong.",
        "This is the reality that we live in.",
        "Look around. This is home. Why would you want to leave?",
        "But I guess I can help if that's really what you want...",
      ];
      game.state.shinjiDialoguePhase = "help-response";
      game.state.dialogueLineIndex = 0;
      renderShinjiResponseLine();
    }
  }

  function renderShinjiResponseLine() {
    const game = window.SignalSelf;
    const line = game.state.shinjiResponseLines[game.state.dialogueLineIndex];

    if (!line) {
      showShinjiOptions();
      return;
    }

    game.elements.dialogueNextButton.textContent =
      game.state.shinjiDialoguePhase === "help-response" &&
      game.state.dialogueLineIndex === game.state.shinjiResponseLines.length - 1
        ? "Close"
        : "Continue";
    game.elements.dialogueSpeaker.textContent = "Shinji";
    game.systems.typewriter.write({
      text: line,
      target: game.elements.dialogueText,
      button: game.elements.dialogueNextButton,
      speed: 34,
    });
  }

  function close() {
    const game = window.SignalSelf;
    const wasCustomDialogue = game.state.customDialogueActive;
    const customOnComplete = game.state.customDialogueOnComplete;
    const finishedFigureId = game.state.activeDialogueFigureId;
    const shouldCountAsFinished =
      finishedFigureId !== game.layers.body.assistFigureId || game.state.shinjiHelpAccepted;
    game.state.activeDialogueFigureId = null;
    game.state.dialogueLineIndex = 0;
    game.state.customDialogueActive = false;
    game.state.customDialogueSpeaker = "";
    game.state.customDialogueLines = [];
    game.state.customDialogueOnComplete = null;
    game.state.shinjiDialoguePhase = null;
    game.state.shinjiResponseLines = [];
    game.systems.typewriter.stop();
    clearChoiceButtons();
    hideShinjiPortrait();
    game.elements.dialogueBox.classList.add("hidden");
    game.elements.dialogueCloseButton.classList.remove("hidden");
    game.systems.movement.freeze(500);
    game.elements.world.focus();

    if (finishedFigureId && shouldCountAsFinished) {
      game.state.spokenFigureIds.add(finishedFigureId);
      game.layers.body.afterDialogue?.(finishedFigureId);
      game.layers.body.checkComplete();
    }

    if (wasCustomDialogue && customOnComplete) {
      customOnComplete();
    }
  }

  function getActiveFigure() {
    const game = window.SignalSelf;
    return game.layers.body.figures.find((item) => item.id === game.state.activeDialogueFigureId);
  }

  function getChoiceWrap() {
    const game = window.SignalSelf;
    let choiceWrap = game.elements.dialogueBox.querySelector(".dialogue-choice-buttons");

    if (!choiceWrap) {
      choiceWrap = document.createElement("div");
      choiceWrap.className = "dialogue-choice-buttons hidden";
      game.elements.dialogueBox.insertBefore(choiceWrap, game.elements.dialogueNextButton);
    }

    return choiceWrap;
  }

  function clearChoiceButtons() {
    const game = window.SignalSelf;
    const choiceWrap = game.elements.dialogueBox.querySelector(".dialogue-choice-buttons");

    if (!choiceWrap) {
      return;
    }

    choiceWrap.innerHTML = "";
    choiceWrap.classList.add("hidden");
  }

  function getDefaultShinjiPortrait() {
    const game = window.SignalSelf;
    return game.state.activeReality === "body" ? "confused" : "neutral";
  }

  function getShinjiPortraitElement() {
    const game = window.SignalSelf;
    let portrait = game.elements.world.querySelector(".dialogue-portrait");

    if (!portrait) {
      portrait = document.createElement("div");
      portrait.className = "dialogue-portrait shinji-dialogue-portrait hidden";
      portrait.setAttribute("aria-hidden", "true");
      game.elements.world.appendChild(portrait);
    }

    return portrait;
  }

  function showShinjiPortrait(mood = "neutral") {
    const portrait = getShinjiPortraitElement();
    const portraitMood = shinjiPortraits[mood] ? mood : "neutral";
    portrait.dataset.mood = portraitMood;
    portrait.style.setProperty("--shinji-portrait", `url("${shinjiPortraits[portraitMood]}")`);
    portrait.classList.remove("hidden");
  }

  function showRandomPersonPortrait() {
    const portrait = getShinjiPortraitElement();
    portrait.dataset.mood = "random-person";
    portrait.style.setProperty("--shinji-portrait", `url("${randomPersonPortrait}")`);
    portrait.classList.remove("hidden");
  }

  function hideShinjiPortrait() {
    const game = window.SignalSelf;
    game.elements.world.querySelector(".dialogue-portrait")?.classList.add("hidden");
  }

  window.SignalSelf.systems.dialogue = {
    open,
    openCustom,
    advance,
    close,
    showShinjiPortrait,
    showRandomPersonPortrait,
    hideShinjiPortrait,
  };
})();
