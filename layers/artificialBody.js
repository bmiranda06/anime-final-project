(function () {
  window.SignalSelf = window.SignalSelf || {};
  window.SignalSelf.layers = window.SignalSelf.layers || {};

  const shinjiSprite = "sprites/shinji.png";

  const artificialBody = {
    id: "artificial",
    label: "Artificial Body",
    content: null,
    introTimer: null,
    hintTimer: null,
    doublesTimer: null,
    centerMessageTimer: null,
    dreamTransitionTimer: null,
    dreamTransitionSwapTimer: null,
    mirrorActive: false,
    wireStageActive: false,
    wirePuzzleActive: false,
    wiresConnected: false,
    dreamTransitionActive: false,
    shinjiVisible: false,
    entryDialogueComplete: false,
    doublesNoticeShown: false,
    outcomeChosen: false,
    nearbyShinji: false,
    selectedWireId: null,
    connectedWireIds: new Set(),
    mirrorWalls: [
      { id: "wall-1", x: 20, y: 4, w: 4, h: 25 },
      { id: "wall-2", x: 34, y: 20, w: 4, h: 27 },
      { id: "wall-3", x: 48, y: 4, w: 4, h: 24 },
      { id: "wall-4", x: 62, y: 20, w: 4, h: 27 },
      { id: "wall-5", x: 76, y: 4, w: 4, h: 25 },
      { id: "cap-left", x: 4, y: 3, w: 12, h: 4 },
      { id: "cap-right", x: 84, y: 43, w: 12, h: 4 },
    ],
    commandTarget: { x: 90, y: 34 },
    talkTarget: { x: 50, y: 53 },
    wireDoor: { x: 88, y: 18 },
    wireStart: { x: 14, y: 82 },
    wireSources: [
      { id: "self", color: "red", label: "SELF", x: 15, y: 24 },
      { id: "machine", color: "cyan", label: "MACHINE", x: 15, y: 48 },
      { id: "memory", color: "violet", label: "MEMORY", x: 15, y: 72 },
    ],
    wireTargets: [
      { id: "motor", color: "cyan", label: "MOTOR PLUG", x: 84, y: 24 },
      { id: "dream", color: "violet", label: "DREAM PLUG", x: 84, y: 48 },
      { id: "body", color: "red", label: "BODY PLUG", x: 84, y: 72 },
    ],
    entryShinji: {
      x: 62,
      y: 55,
      lines: ["Where are we?", "Why am I here with you?"],
    },
  };

  function onEnter() {
    const game = window.SignalSelf;
    reset();
    ensureContent();
    game.state.player.x = 36;
    game.state.player.y = 55;
    game.state.player.targetX = 36;
    game.state.player.targetY = 55;
    game.systems.movement.renderPlayer();
    game.elements.systemMessage.textContent = "PILOT DETECTED";

    artificialBody.introTimer = window.setTimeout(() => {
      renderEntryShinji();
    }, 950);
  }

  function reset() {
    const game = window.SignalSelf;
    clearTimers();
    artificialBody.mirrorActive = false;
    artificialBody.wireStageActive = false;
    artificialBody.wirePuzzleActive = false;
    artificialBody.wiresConnected = false;
    artificialBody.dreamTransitionActive = false;
    artificialBody.shinjiVisible = false;
    artificialBody.entryDialogueComplete = false;
    artificialBody.doublesNoticeShown = false;
    artificialBody.outcomeChosen = false;
    artificialBody.nearbyShinji = false;
    artificialBody.selectedWireId = null;
    artificialBody.connectedWireIds = new Set();

    game.systems.dialogue.hideShinjiPortrait?.();

    if (artificialBody.content) {
      artificialBody.content.remove();
      artificialBody.content = null;
    }

    game.elements.world.classList.remove(
      "mirror-mode",
      "mirror-transitioning",
      "wire-mode",
      "wires-connected",
      "dream-transitioning"
    );
    game.elements.interactionPrompt.classList.remove("visible");
  }

  function clearTimers() {
    [
      artificialBody.introTimer,
      artificialBody.hintTimer,
      artificialBody.doublesTimer,
      artificialBody.centerMessageTimer,
      artificialBody.dreamTransitionTimer,
      artificialBody.dreamTransitionSwapTimer,
    ].forEach((timer) => {
      if (timer) {
        window.clearTimeout(timer);
      }
    });

    artificialBody.introTimer = null;
    artificialBody.hintTimer = null;
    artificialBody.doublesTimer = null;
    artificialBody.centerMessageTimer = null;
    artificialBody.dreamTransitionTimer = null;
    artificialBody.dreamTransitionSwapTimer = null;
  }

  function ensureContent() {
    const game = window.SignalSelf;

    if (artificialBody.content) {
      return artificialBody.content;
    }

    artificialBody.content = document.createElement("div");
    artificialBody.content.className = "artificial-layer-content";
    game.elements.world.appendChild(artificialBody.content);
    return artificialBody.content;
  }

  function renderEntryShinji() {
    const content = ensureContent();
    artificialBody.shinjiVisible = true;

    const figure = document.createElement("button");
    figure.type = "button";
    figure.className = "artificial-shinji";
    figure.dataset.label = "Shinji";
    figure.style.setProperty("--character-sprite", `url("${shinjiSprite}")`);
    figure.style.left = `${artificialBody.entryShinji.x}%`;
    figure.style.top = `${artificialBody.entryShinji.y}%`;
    figure.setAttribute("aria-label", "Speak to Shinji");
    figure.addEventListener("click", (event) => {
      event.stopPropagation();
      handleShinjiClick();
    });
    content.appendChild(figure);
  }

  function handleShinjiClick() {
    const game = window.SignalSelf;

    if (!isEntryActive()) {
      return;
    }

    const distance = getEntryShinjiDistance();

    if (distance > 8) {
      game.state.player.targetX = game.systems.movement.clamp(artificialBody.entryShinji.x, 3, 97);
      game.state.player.targetY = game.systems.movement.clamp(
        artificialBody.entryShinji.y + 5,
        5,
        95
      );
      game.elements.clickTarget.style.left = `${game.state.player.targetX}%`;
      game.elements.clickTarget.style.top = `${game.state.player.targetY}%`;
      game.elements.clickTarget.classList.add("active");
      game.elements.systemMessage.textContent = "The interface waits until both bodies are close.";
      return;
    }

    openEntryDialogue();
  }

  function openEntryDialogue() {
    const game = window.SignalSelf;

    if (artificialBody.entryDialogueComplete) {
      return;
    }

    game.systems.dialogue.openCustom({
      speaker: "Shinji",
      lines: artificialBody.entryShinji.lines,
      onComplete() {
        artificialBody.entryDialogueComplete = true;
        startMirrorTransition();
      },
    });
  }

  function startMirrorTransition() {
    const game = window.SignalSelf;
    game.elements.clickTarget.classList.remove("active");
    game.elements.interactionPrompt.classList.remove("visible");
    game.systems.movement.freeze(1500);
    game.elements.world.classList.add("mirror-transitioning");

    window.setTimeout(() => {
      game.elements.world.classList.remove("mirror-transitioning");
      startMirrorMode();
    }, 1100);
  }

  function startMirrorMode() {
    const game = window.SignalSelf;
    const content = ensureContent();
    artificialBody.mirrorActive = true;
    content.innerHTML = "";
    game.elements.world.classList.add("mirror-mode");
    game.state.player.x = 10;
    game.state.player.y = 75;
    game.state.player.targetX = 10;
    game.state.player.targetY = 75;
    game.systems.movement.renderPlayer();
    game.elements.systemMessage.textContent = "MIRROR MODE ACTIVE.";

    renderMirrorPuzzle();
    renderMirrorPositions();

    artificialBody.hintTimer = window.setTimeout(() => {
      if (artificialBody.mirrorActive && !artificialBody.outcomeChosen) {
        game.elements.systemMessage.textContent = "Hint: if you move, so does Shinji";
      }
    }, 1400);
  }

  function renderMirrorPuzzle() {
    const content = ensureContent();

    const mirrorSurface = document.createElement("div");
    mirrorSurface.className = "mirror-surface";
    mirrorSurface.innerHTML = `
      <div class="mirror-half mirror-half-top" aria-hidden="true"></div>
      <div class="mirror-half mirror-half-bottom" aria-hidden="true"></div>
      <div class="mirror-axis" aria-hidden="true"></div>
      <div class="mirror-label mirror-label-top">SHINJI</div>
      <div class="mirror-label mirror-label-bottom">PILOT</div>
    `;
    content.appendChild(mirrorSurface);

    artificialBody.mirrorWalls.forEach((wall) => {
      const element = document.createElement("div");
      element.className = "mirror-wall";
      element.style.left = `${wall.x}%`;
      element.style.top = `${wall.y}%`;
      element.style.width = `${wall.w}%`;
      element.style.height = `${wall.h}%`;
      content.appendChild(element);
    });

    const target = document.createElement("div");
    target.className = "mirror-command-target";
    target.textContent = "TARGET";
    target.style.left = `${artificialBody.commandTarget.x}%`;
    target.style.top = `${artificialBody.commandTarget.y}%`;
    content.appendChild(target);

    const talkTarget = document.createElement("div");
    talkTarget.className = "mirror-talk-target";
    talkTarget.textContent = "TALK";
    talkTarget.style.left = `${artificialBody.talkTarget.x}%`;
    talkTarget.style.top = `${artificialBody.talkTarget.y}%`;
    content.appendChild(talkTarget);

    const shinji = document.createElement("div");
    shinji.className = "mirror-shinji";
    shinji.dataset.label = "Shinji";
    shinji.style.setProperty("--character-sprite", `url("${shinjiSprite}")`);
    content.appendChild(shinji);

    const actionPanel = document.createElement("div");
    actionPanel.className = "artificial-action-panel";
    actionPanel.innerHTML = `
      <button type="button" data-artificial-action="follow" disabled>
        FOLLOW COMMANDS
      </button>
      <button type="button" data-artificial-action="refuse">
        REFUSE
      </button>
      <button type="button" data-artificial-action="talk" disabled>
        MOVE TO TALK TO SHINJI IN THE MIRROR
      </button>
    `;
    actionPanel.addEventListener("click", handleActionClick);
    content.appendChild(actionPanel);
  }

  function handleActionClick(event) {
    const button = event.target.closest("button[data-artificial-action]");

    if (!button || button.disabled) {
      return;
    }

    chooseOutcome(button.dataset.artificialAction);
  }

  function update() {
    if (artificialBody.wireStageActive) {
      updateWireStage();
      return;
    }

    if (!artificialBody.mirrorActive || artificialBody.outcomeChosen) {
      return;
    }

    renderMirrorPositions();
    checkDoublesNotice();
    updateActionAvailability();
  }

  function updateWireStage() {
    const game = window.SignalSelf;

    if (
      !artificialBody.wiresConnected ||
      artificialBody.dreamTransitionActive ||
      Math.hypot(artificialBody.wireDoor.x - game.state.player.x, artificialBody.wireDoor.y - game.state.player.y) >
        5.5
    ) {
      return;
    }

    startDreamTransition();
  }

  function renderMirrorPositions() {
    const game = window.SignalSelf;
    const shinji = artificialBody.content?.querySelector(".mirror-shinji");

    if (!shinji) {
      return;
    }

    shinji.style.left = `${game.state.player.x}%`;
    shinji.style.top = `${getMirroredY(game.state.player.y)}%`;
  }

  function checkDoublesNotice() {
    const game = window.SignalSelf;

    if (artificialBody.doublesNoticeShown || game.state.player.x < 50) {
      return;
    }

    artificialBody.doublesNoticeShown = true;
    game.systems.movement.freeze(2600);
    game.elements.clickTarget.classList.remove("active");
    showCenterMessage("DOUBLES DETECTED. WHY ARE THERE TWO OF YOU?", {
      variant: "alert",
      duration: 2300,
    });

    artificialBody.doublesTimer = window.setTimeout(() => {
      if (artificialBody.mirrorActive && !artificialBody.outcomeChosen) {
        game.elements.systemMessage.textContent = "MIRROR MODE ACTIVE.";
      }
    }, 2600);
  }

  function updateActionAvailability() {
    const content = artificialBody.content;

    if (!content) {
      return;
    }

    const followButton = content.querySelector("[data-artificial-action='follow']");
    const talkButton = content.querySelector("[data-artificial-action='talk']");

    if (followButton) {
      followButton.disabled = !isShinjiAtCommandTarget();
    }

    if (talkButton) {
      talkButton.disabled = !isPlayerAtTalkTarget();
    }
  }

  function chooseOutcome(action) {
    const game = window.SignalSelf;
    const scoreByAction = {
      follow: "body",
      refuse: "fragmented",
      talk: "collective",
    };
    const messageByAction = {
      follow: "COMMAND ACCEPTED. The artificial body records obedience as identity.",
      refuse: "REFUSAL LOGGED. The mirror keeps both bodies separate.",
      talk: "SYSTEM CONTACT LOGGED. Shinji and pilot move as one signal.",
    };

    if (artificialBody.outcomeChosen || !scoreByAction[action]) {
      return;
    }

    artificialBody.outcomeChosen = true;
    game.endingScoreSystem.incrementEndingScore(scoreByAction[action]);
    game.elements.systemMessage.textContent = "Artificial Body layer complete.";
    game.elements.clickTarget.classList.remove("active");
    game.systems.movement.freeze(5200);

    if (action === "talk") {
      game.systems.dialogue.showShinjiPortrait?.("robot");
    } else {
      game.systems.dialogue.hideShinjiPortrait?.();
    }

    artificialBody.content
      ?.querySelectorAll(".artificial-action-panel button")
      .forEach((button) => {
        button.disabled = true;
      });

    showCenterMessage(messageByAction[action], {
      variant: "result",
      duration: 2300,
      onComplete: startWireDescent,
    });
  }

  function startWireDescent() {
    const game = window.SignalSelf;
    const content = ensureContent();
    artificialBody.mirrorActive = false;
    artificialBody.wireStageActive = true;
    artificialBody.wirePuzzleActive = false;
    artificialBody.wiresConnected = false;
    artificialBody.dreamTransitionActive = false;
    artificialBody.selectedWireId = null;
    artificialBody.connectedWireIds = new Set();
    content.innerHTML = "";
    game.elements.world.classList.remove("mirror-mode");
    game.elements.world.classList.add("wire-mode");
    game.state.player.x = artificialBody.wireStart.x;
    game.state.player.y = artificialBody.wireStart.y;
    game.state.player.targetX = artificialBody.wireStart.x;
    game.state.player.targetY = artificialBody.wireStart.y;
    game.systems.movement.renderPlayer();
    renderWireStage();
    game.systems.dialogue.showShinjiPortrait?.("neutral");
    showCenterMessageSequence(
      [
        "Hello? This is Shinji!",
        "It seems we are climbing your consciousness, and the only way out is to descend further.",
        "Connect the correct wires to the correct plugs to descend to the next layer!",
        "Good luck! -Shinji",
      ],
      {
        variant: "shinji",
        duration: 2300,
      },
      () => {
        game.systems.dialogue.hideShinjiPortrait?.();
        artificialBody.wirePuzzleActive = true;
        game.elements.systemMessage.textContent =
          "Connect each wire to the plug with the matching color.";
      }
    );
  }

  function showCenterMessageSequence(lines, options, onComplete) {
    let index = 0;

    function showNextLine() {
      if (!artificialBody.wireStageActive || index >= lines.length) {
        onComplete?.();
        return;
      }

      showCenterMessage(lines[index], {
        ...options,
        onComplete() {
          index += 1;
          showNextLine();
        },
      });
    }

    showNextLine();
  }

  function renderWireStage() {
    const content = ensureContent();
    const surface = document.createElement("div");
    surface.className = "wire-stage-surface";
    surface.innerHTML = `
      <svg class="wire-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>
      <div class="wire-stage-label">CONSCIOUSNESS DESCENT</div>
      <div class="wire-walk-path hidden" aria-hidden="true"></div>
    `;
    content.appendChild(surface);

    artificialBody.wireSources.forEach((source) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `wire-node wire-source wire-${source.color}`;
      button.dataset.wireId = source.id;
      button.dataset.wireColor = source.color;
      button.style.left = `${source.x}%`;
      button.style.top = `${source.y}%`;
      button.textContent = source.label;
      button.addEventListener("click", handleWireSourceClick);
      content.appendChild(button);
    });

    artificialBody.wireTargets.forEach((target) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `wire-node wire-target wire-${target.color}`;
      button.dataset.plugId = target.id;
      button.dataset.wireColor = target.color;
      button.style.left = `${target.x}%`;
      button.style.top = `${target.y}%`;
      button.textContent = target.label;
      button.addEventListener("click", handleWireTargetClick);
      content.appendChild(button);
    });

    const door = document.createElement("div");
    door.className = "wire-door";
    door.textContent = "DOOR";
    door.style.left = `${artificialBody.wireDoor.x}%`;
    door.style.top = `${artificialBody.wireDoor.y}%`;
    content.appendChild(door);
  }

  function handleWireSourceClick(event) {
    event.stopPropagation();

    if (!artificialBody.wirePuzzleActive || artificialBody.wiresConnected) {
      return;
    }

    const sourceId = event.currentTarget.dataset.wireId;

    if (artificialBody.connectedWireIds.has(sourceId)) {
      return;
    }

    artificialBody.selectedWireId = sourceId;

    artificialBody.content
      ?.querySelectorAll(".wire-source")
      .forEach((button) => button.classList.toggle("selected", button.dataset.wireId === sourceId));
  }

  function handleWireTargetClick(event) {
    event.stopPropagation();

    if (!artificialBody.wirePuzzleActive || artificialBody.wiresConnected) {
      return;
    }

    const source = artificialBody.wireSources.find(
      (item) => item.id === artificialBody.selectedWireId
    );
    const target = artificialBody.wireTargets.find(
      (item) => item.id === event.currentTarget.dataset.plugId
    );

    if (!source || !target) {
      return;
    }

    if (source.color !== target.color) {
      flashWireError(event.currentTarget);
      artificialBody.selectedWireId = null;
      artificialBody.content
        ?.querySelectorAll(".wire-source")
        .forEach((button) => button.classList.remove("selected"));
      return;
    }

    connectWire(source, target);
  }

  function connectWire(source, target) {
    const lineLayer = artificialBody.content?.querySelector(".wire-lines");

    if (!lineLayer || artificialBody.connectedWireIds.has(source.id)) {
      return;
    }

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const midX = 50;
    path.setAttribute(
      "d",
      `M ${source.x} ${source.y} C ${midX} ${source.y}, ${midX} ${target.y}, ${target.x} ${target.y}`
    );
    path.setAttribute("class", `wire-connection wire-${source.color}`);
    lineLayer.appendChild(path);

    artificialBody.connectedWireIds.add(source.id);
    artificialBody.selectedWireId = null;
    artificialBody.content
      ?.querySelectorAll(".wire-source")
      .forEach((button) => {
        button.classList.remove("selected");
        if (button.dataset.wireId === source.id) {
          button.classList.add("connected");
        }
      });
    artificialBody.content
      ?.querySelectorAll(".wire-target")
      .forEach((button) => {
        if (button.dataset.plugId === target.id) {
          button.classList.add("connected");
        }
      });

    if (artificialBody.connectedWireIds.size === artificialBody.wireSources.length) {
      completeWirePuzzle();
    }
  }

  function flashWireError(target) {
    const game = window.SignalSelf;
    target.classList.add("wire-error");
    game.elements.systemMessage.textContent =
      "Signal rejected. The mind will not descend through a false connection.";

    window.setTimeout(() => {
      target.classList.remove("wire-error");
    }, 420);
  }

  function completeWirePuzzle() {
    const game = window.SignalSelf;
    artificialBody.wiresConnected = true;
    artificialBody.wirePuzzleActive = false;
    game.elements.world.classList.add("wires-connected");
    artificialBody.content?.querySelector(".wire-walk-path")?.classList.remove("hidden");
    artificialBody.content?.querySelector(".wire-door")?.classList.add("active");
    game.state.player.x = artificialBody.wireStart.x;
    game.state.player.y = artificialBody.wireStart.y;
    game.state.player.targetX = artificialBody.wireStart.x;
    game.state.player.targetY = artificialBody.wireStart.y;
    game.systems.movement.renderPlayer();
    game.elements.systemMessage.textContent =
      "The path is wired. Walk the connected signal into the door.";
  }

  function showCenterMessage(text, options = {}) {
    const game = window.SignalSelf;
    const content = ensureContent();
    const existingMessage = content.querySelector(".artificial-center-message");

    if (existingMessage) {
      existingMessage.remove();
    }

    if (artificialBody.centerMessageTimer) {
      window.clearTimeout(artificialBody.centerMessageTimer);
      artificialBody.centerMessageTimer = null;
    }

    const message = document.createElement("div");
    message.className = `artificial-center-message ${options.variant || "alert"}`;
    message.textContent = text;
    content.appendChild(message);

    artificialBody.centerMessageTimer = window.setTimeout(() => {
      message.classList.add("fading-out");

      artificialBody.centerMessageTimer = window.setTimeout(() => {
        message.remove();
        artificialBody.centerMessageTimer = null;

        if (options.onComplete) {
          options.onComplete();
        }
      }, 420);
    }, options.duration || 2200);

    game.systems.movement.freeze(options.duration || 2200);
  }

  function startDreamTransition() {
    const game = window.SignalSelf;
    const content = ensureContent();

    if (artificialBody.dreamTransitionActive || content.querySelector(".dream-transition-overlay")) {
      return;
    }

    artificialBody.dreamTransitionActive = true;
    artificialBody.wireStageActive = false;
    const overlay = document.createElement("div");
    overlay.className = "dream-transition-overlay";
    overlay.innerHTML = `
      <div class="dream-vortex" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <p>Dream signal blooming...</p>
    `;
    content.appendChild(overlay);
    game.elements.world.classList.add("dream-transitioning");
    game.elements.systemMessage.textContent = "Dream layer opening.";
    game.systems.movement.freeze(3200);

    artificialBody.dreamTransitionSwapTimer = window.setTimeout(() => {
      game.setReality("dream", { force: true, restart: true });
    }, 2850);
  }

  function wouldCollide(playerX, playerY) {
    if (artificialBody.wireStageActive) {
      return false;
    }

    if (!artificialBody.mirrorActive || artificialBody.outcomeChosen) {
      return false;
    }

    const shinjiX = playerX;
    const shinjiY = getMirroredY(playerY);
    const shinjiBox = {
      left: shinjiX - 2.1,
      right: shinjiX + 2.1,
      top: shinjiY - 2.1,
      bottom: shinjiY + 2.1,
    };

    return artificialBody.mirrorWalls.some((wall) => {
      const wallBox = {
        left: wall.x,
        right: wall.x + wall.w,
        top: wall.y,
        bottom: wall.y + wall.h,
      };

      return (
        shinjiBox.left < wallBox.right &&
        shinjiBox.right > wallBox.left &&
        shinjiBox.top < wallBox.bottom &&
        shinjiBox.bottom > wallBox.top
      );
    });
  }

  function getCollisionMessage() {
    if (artificialBody.wireStageActive && !artificialBody.wiresConnected) {
      return "The wires are not connected. The artificial body has nowhere to descend.";
    }

    if (!artificialBody.mirrorActive || artificialBody.outcomeChosen) {
      return null;
    }

    return "The artificial body rejects that command. Shinji hits the maze before you do.";
  }

  function adjustClickTarget(x, y) {
    const game = window.SignalSelf;

    if (artificialBody.wireStageActive && !artificialBody.wiresConnected) {
      return {
        x: game.state.player.x,
        y: game.state.player.y,
      };
    }

    if (artificialBody.wireStageActive) {
      return {
        x: clamp(x, 5, 95),
        y: clamp(y, 5, 95),
      };
    }

    if (!artificialBody.mirrorActive || artificialBody.outcomeChosen) {
      return { x, y };
    }

    return {
      x: clamp(x, 5, 95),
      y: clamp(y, 53, 95),
    };
  }

  function getClampedPlayerPosition(x, y) {
    const game = window.SignalSelf;

    if (artificialBody.wireStageActive && !artificialBody.wiresConnected) {
      return {
        x: game.state.player.x,
        y: game.state.player.y,
      };
    }

    if (artificialBody.wireStageActive) {
      return {
        x: clamp(x, 5, 95),
        y: clamp(y, 5, 95),
      };
    }

    if (!artificialBody.mirrorActive || artificialBody.outcomeChosen) {
      return { x, y };
    }

    return {
      x: clamp(x, 5, 95),
      y: clamp(y, 53, 95),
    };
  }

  function updateNearbyFigure() {
    const game = window.SignalSelf;

    if (!isEntryActive()) {
      artificialBody.nearbyShinji = false;
      return;
    }

    artificialBody.nearbyShinji = getEntryShinjiDistance() <= 8;

    artificialBody.content
      ?.querySelector(".artificial-shinji")
      ?.classList.toggle("nearby", artificialBody.nearbyShinji);

    if (artificialBody.nearbyShinji) {
      game.elements.interactionPrompt.textContent = "Press E to speak with Shinji";
      game.elements.interactionPrompt.classList.add("visible");
    }
  }

  function interact() {
    if (artificialBody.nearbyShinji) {
      openEntryDialogue();
      return true;
    }

    return false;
  }

  function isEntryActive() {
    const game = window.SignalSelf;
    return (
      game.state.activeReality === "artificial" &&
      artificialBody.shinjiVisible &&
      !artificialBody.mirrorActive &&
      !artificialBody.entryDialogueComplete
    );
  }

  function getEntryShinjiDistance() {
    const game = window.SignalSelf;
    return Math.hypot(
      artificialBody.entryShinji.x - game.state.player.x,
      artificialBody.entryShinji.y - game.state.player.y
    );
  }

  function isShinjiAtCommandTarget() {
    const game = window.SignalSelf;
    return (
      Math.hypot(
        artificialBody.commandTarget.x - game.state.player.x,
        artificialBody.commandTarget.y - getMirroredY(game.state.player.y)
      ) <= 5.5
    );
  }

  function isPlayerAtTalkTarget() {
    const game = window.SignalSelf;
    return (
      Math.hypot(
        artificialBody.talkTarget.x - game.state.player.x,
        artificialBody.talkTarget.y - game.state.player.y
      ) <= 5
    );
  }

  function getMirroredY(playerY) {
    return 100 - playerY;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  window.SignalSelf.layers.artificialBody = {
    ...artificialBody,
    onEnter,
    reset,
    update,
    updateNearbyFigure,
    interact,
    wouldCollide,
    getCollisionMessage,
    adjustClickTarget,
    getClampedPlayerPosition,
  };
})();
