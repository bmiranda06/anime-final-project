const realities = [
  {
    id: "body",
    label: "Body",
    key: "1",
    worldClass: "reality-body",
    message:
      "Body reality active. The city feels heavy, hot, and physical. Barriers have weight here.",
  },
  {
    id: "artificial",
    label: "Artificial Body",
    key: "2",
    worldClass: "reality-artificial",
    message:
      "Artificial Body reality active. The physical maze collapses into a synthetic green signal.",
  },
  {
    id: "dream",
    label: "Dream",
    key: "3",
    worldClass: "reality-dream",
    message: "Dream reality is still locked.",
  },
  {
    id: "network",
    label: "Network",
    key: "4",
    worldClass: "reality-network",
    message: "Network reality is still locked.",
  },
];

const bootMessages = [
  "Scanning identity fragments...",
  "Mapping alternate-reality channels...",
  "Calibrating movement interface...",
  "Loading Neon Underpass prototype...",
];

const bodyLayer = {
  colliders: [
    { id: "left-block", x: 10, y: 12, w: 12, h: 34 },
    { id: "upper-spine", x: 28, y: 10, w: 7, h: 44 },
    { id: "center-block", x: 46, y: 30, w: 13, h: 11 },
    { id: "center-spine", x: 58, y: 45, w: 7, h: 30 },
    { id: "lower-left", x: 18, y: 62, w: 24, h: 8 },
    { id: "right-block", x: 76, y: 15, w: 10, h: 52 },
    { id: "lower-gate", x: 45, y: 80, w: 33, h: 8 },
  ],
  figures: [
    { id: "figure-1", x: 38, y: 48, label: "Rin", speaker: "Rin", lines: ["..."] },
    { id: "figure-2", x: 70, y: 72, label: "Vale", speaker: "Vale", lines: ["..."] },
    { id: "figure-3", x: 14, y: 56, label: "Mika", speaker: "Mika", lines: ["..."] },
    { id: "figure-4", x: 88, y: 70, label: "Sora", speaker: "Sora", lines: ["..."] },
    { id: "figure-5", x: 63, y: 25, label: "Noa", speaker: "Noa", lines: ["..."] },
  ],
};

const relationshipSlots = [
  { id: "friend", label: "Friend" },
  { id: "partner", label: "Partner" },
  { id: "parent", label: "Parent" },
  { id: "child", label: "Child" },
  { id: "acquaintance", label: "Acquaintance" },
];

const state = {
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
};

const elements = {
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
  realityLabel: document.querySelector("#reality-label"),
  realityButtons: document.querySelector("#reality-buttons"),
  systemMessage: document.querySelector("#system-message"),
  returnTitleButton: document.querySelector("#return-title-button"),
};

function showScreen(screenName) {
  state.currentScreen = screenName;

  Object.entries(elements.screens).forEach(([name, screen]) => {
    screen.classList.toggle("active", name === screenName);
  });
}

function startBootSequence() {
  resetPrototype();
  showScreen("loading");
  elements.loadingProgress.style.width = "0%";
  elements.bootLines.innerHTML = "";

  bootMessages.forEach((message, index) => {
    window.setTimeout(() => {
      const line = document.createElement("li");
      line.textContent = message;
      elements.bootLines.appendChild(line);
      elements.loadingProgress.style.width = `${((index + 1) / bootMessages.length) * 100}%`;
    }, 420 + index * 520);
  });

  window.setTimeout(() => {
    showScreen("game");
    renderRealityButtons();
    renderBodyLayer();
    setReality("body");
    renderPlayer();
    elements.world.focus();
    startGameLoop();
  }, 3100);
}

function resetPrototype() {
  state.activeReality = "body";
  state.unlockedRealities = new Set(["body"]);
  state.player.x = 50;
  state.player.y = 55;
  state.player.targetX = 50;
  state.player.targetY = 55;
  state.pressedKeys.clear();
  state.nearbyFigureId = null;
  state.activeDialogueFigureId = null;
  state.dialogueLineIndex = 0;
  state.spokenFigureIds = new Set();
  state.bodyChallengeStarted = false;
  state.matchingAssignments = new Map();
  state.matchAttempt = 0;
  elements.clickTarget.classList.remove("active");
  elements.dialogueBox.classList.add("hidden");
  elements.matchingOverlay.classList.add("hidden");
  elements.interactionPrompt.classList.remove("visible");
  setCrackStage(0);
  stopGameLoop();
}

function renderRealityButtons() {
  elements.realityButtons.innerHTML = "";

  realities.forEach((reality) => {
    const unlocked = state.unlockedRealities.has(reality.id);
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
    elements.realityButtons.appendChild(button);
  });

  updateRealityButtonState();
}

function renderBodyLayer() {
  elements.bodyLayerContent.innerHTML = "";

  bodyLayer.colliders.forEach((collider) => {
    const barrier = document.createElement("div");
    barrier.className = "body-collider";
    barrier.style.left = `${collider.x}%`;
    barrier.style.top = `${collider.y}%`;
    barrier.style.width = `${collider.w}%`;
    barrier.style.height = `${collider.h}%`;
    elements.bodyLayerContent.appendChild(barrier);
  });

  bodyLayer.figures.forEach((figure) => {
    const element = document.createElement("button");
    element.type = "button";
    element.className = "memory-figure";
    element.dataset.figure = figure.id;
    element.dataset.label = figure.label;
    element.style.left = `${figure.x}%`;
    element.style.top = `${figure.y}%`;
    element.setAttribute("aria-label", `Speak to ${figure.label}`);
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      handleFigureClick(figure);
    });
    elements.bodyLayerContent.appendChild(element);
  });
}

function setReality(realityId) {
  if (!state.unlockedRealities.has(realityId)) {
    elements.systemMessage.textContent = "Reality layer locked. The body has not broken open yet.";
    return;
  }

  const reality = realities.find((item) => item.id === realityId);

  if (!reality) {
    return;
  }

  state.activeReality = reality.id;
  state.nearbyFigureId = null;
  elements.world.className = `world ${reality.worldClass}`;
  elements.realityLabel.textContent = `Reality: ${reality.label}`;
  elements.systemMessage.textContent = reality.message;
  elements.dialogueBox.classList.add("hidden");
  updateRealityButtonState();
  updateNearbyFigure();
}

function updateRealityButtonState() {
  Array.from(elements.realityButtons.children).forEach((button) => {
    const unlocked = state.unlockedRealities.has(button.dataset.reality);
    const reality = realities.find((item) => item.id === button.dataset.reality);
    button.disabled = !unlocked;
    button.classList.toggle("locked", !unlocked);
    button.classList.toggle("active", button.dataset.reality === state.activeReality);
    button.textContent = unlocked ? reality.label : "LOCKED";
    button.setAttribute("aria-label", unlocked ? reality.label : `${reality.label} locked`);
  });
}

function unlockReality(realityId) {
  state.unlockedRealities.add(realityId);
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

function startGameLoop() {
  if (state.animationFrame) {
    return;
  }

  state.lastFrameTime = performance.now();
  state.animationFrame = window.requestAnimationFrame(update);
}

function stopGameLoop() {
  if (!state.animationFrame) {
    return;
  }

  window.cancelAnimationFrame(state.animationFrame);
  state.animationFrame = null;
}

function update(timestamp) {
  const deltaSeconds = Math.min((timestamp - state.lastFrameTime) / 1000, 0.05);
  state.lastFrameTime = timestamp;

  if (!isInteractionBlockingMovement()) {
    updateMovement(deltaSeconds);
  }

  updateNearbyFigure();
  renderPlayer();

  state.animationFrame = window.requestAnimationFrame(update);
}

function isInteractionBlockingMovement() {
  return (
    !elements.dialogueBox.classList.contains("hidden") ||
    !elements.matchingOverlay.classList.contains("hidden")
  );
}

function updateMovement(deltaSeconds) {
  const input = getMovementInput();

  if (input.x !== 0 || input.y !== 0) {
    const length = Math.hypot(input.x, input.y);
    attemptPlayerMove(
      (input.x / length) * state.player.speed * deltaSeconds,
      (input.y / length) * state.player.speed * deltaSeconds
    );
    state.player.targetX = state.player.x;
    state.player.targetY = state.player.y;
    elements.clickTarget.classList.remove("active");
  } else {
    moveTowardClickTarget(deltaSeconds);
  }
}

function getMovementInput() {
  let x = 0;
  let y = 0;

  if (state.pressedKeys.has("a") || state.pressedKeys.has("arrowleft")) {
    x -= 1;
  }

  if (state.pressedKeys.has("d") || state.pressedKeys.has("arrowright")) {
    x += 1;
  }

  if (state.pressedKeys.has("w") || state.pressedKeys.has("arrowup")) {
    y -= 1;
  }

  if (state.pressedKeys.has("s") || state.pressedKeys.has("arrowdown")) {
    y += 1;
  }

  return { x, y };
}

function moveTowardClickTarget(deltaSeconds) {
  const dx = state.player.targetX - state.player.x;
  const dy = state.player.targetY - state.player.y;
  const distance = Math.hypot(dx, dy);

  if (distance < 0.4) {
    elements.clickTarget.classList.remove("active");
    return;
  }

  const step = state.player.speed * deltaSeconds;
  const moved = attemptPlayerMove(
    (dx / distance) * Math.min(step, distance),
    (dy / distance) * Math.min(step, distance)
  );

  if (!moved) {
    elements.clickTarget.classList.remove("active");
    elements.systemMessage.textContent =
      "Your body refuses the path. The obstruction is not symbolic in this layer.";
  }
}

function attemptPlayerMove(deltaX, deltaY) {
  const nextX = clamp(state.player.x + deltaX, 3, 97);
  const nextY = clamp(state.player.y + deltaY, 5, 95);
  let moved = false;

  if (!wouldCollide(nextX, state.player.y)) {
    state.player.x = nextX;
    moved = moved || Math.abs(deltaX) > 0;
  }

  if (!wouldCollide(state.player.x, nextY)) {
    state.player.y = nextY;
    moved = moved || Math.abs(deltaY) > 0;
  }

  return moved;
}

function wouldCollide(x, y) {
  if (state.activeReality !== "body") {
    return false;
  }

  return bodyLayer.colliders.some((collider) => {
    const playerBox = {
      left: x - state.player.radius,
      right: x + state.player.radius,
      top: y - state.player.radius,
      bottom: y + state.player.radius,
    };

    const colliderBox = {
      left: collider.x,
      right: collider.x + collider.w,
      top: collider.y,
      bottom: collider.y + collider.h,
    };

    return (
      playerBox.left < colliderBox.right &&
      playerBox.right > colliderBox.left &&
      playerBox.top < colliderBox.bottom &&
      playerBox.bottom > colliderBox.top
    );
  });
}

function updateNearbyFigure() {
  const figure = getNearbyFigure();
  state.nearbyFigureId = figure ? figure.id : null;

  document.querySelectorAll(".memory-figure").forEach((element) => {
    element.classList.toggle("nearby", element.dataset.figure === state.nearbyFigureId);
  });

  if (figure && state.activeReality === "body" && elements.matchingOverlay.classList.contains("hidden")) {
    elements.interactionPrompt.textContent = `Press E to speak with ${figure.label}`;
    elements.interactionPrompt.classList.add("visible");
  } else {
    elements.interactionPrompt.classList.remove("visible");
  }
}

function getNearbyFigure() {
  if (state.activeReality !== "body") {
    return null;
  }

  return (
    bodyLayer.figures.find((figure) => {
      const distance = Math.hypot(figure.x - state.player.x, figure.y - state.player.y);
      return distance <= 8;
    }) || null
  );
}

function handleFigureClick(figure) {
  const distance = Math.hypot(figure.x - state.player.x, figure.y - state.player.y);

  if (state.activeReality !== "body" || distance > 8) {
    state.player.targetX = clamp(figure.x, 3, 97);
    state.player.targetY = clamp(figure.y + 5, 5, 95);
    elements.clickTarget.style.left = `${state.player.targetX}%`;
    elements.clickTarget.style.top = `${state.player.targetY}%`;
    elements.clickTarget.classList.add("active");
    elements.systemMessage.textContent = "Move closer. The body has to be present before memory answers.";
    return;
  }

  openDialogue(figure.id);
}

function openDialogue(figureId) {
  const figure = bodyLayer.figures.find((item) => item.id === figureId);

  if (!figure) {
    return;
  }

  state.activeDialogueFigureId = figureId;
  state.dialogueLineIndex = 0;
  elements.dialogueBox.classList.remove("hidden");
  renderDialogueLine();
}

function renderDialogueLine() {
  const figure = bodyLayer.figures.find((item) => item.id === state.activeDialogueFigureId);

  if (!figure) {
    closeDialogue();
    return;
  }

  elements.dialogueSpeaker.textContent = figure.speaker;
  elements.dialogueText.textContent = figure.lines[state.dialogueLineIndex];
  elements.dialogueNextButton.textContent =
    state.dialogueLineIndex === figure.lines.length - 1 ? "Close" : "Continue";
}

function advanceDialogue() {
  const figure = bodyLayer.figures.find((item) => item.id === state.activeDialogueFigureId);

  if (!figure || state.dialogueLineIndex >= figure.lines.length - 1) {
    closeDialogue();
    return;
  }

  state.dialogueLineIndex += 1;
  renderDialogueLine();
}

function closeDialogue() {
  const finishedFigureId = state.activeDialogueFigureId;
  state.activeDialogueFigureId = null;
  state.dialogueLineIndex = 0;
  elements.dialogueBox.classList.add("hidden");
  elements.world.focus();

  if (finishedFigureId) {
    state.spokenFigureIds.add(finishedFigureId);
    checkBodyLayerComplete();
  }
}

function checkBodyLayerComplete() {
  if (
    state.bodyChallengeStarted ||
    state.spokenFigureIds.size < bodyLayer.figures.length ||
    state.activeReality !== "body"
  ) {
    return;
  }

  state.bodyChallengeStarted = true;
  elements.systemMessage.textContent = "Everyone has spoken. The body cannot hold the contradiction.";
  triggerBodyBreakCutscene();
}

function triggerBodyBreakCutscene() {
  state.pressedKeys.clear();
  elements.clickTarget.classList.remove("active");
  setCrackStage(1);
  elements.world.classList.add("psych-phase");

  window.setTimeout(() => {
    elements.world.classList.remove("psych-phase");
    openMatchingGame();
  }, 1800);
}

function openMatchingGame() {
  state.matchingAssignments = new Map();
  state.matchAttempt = 0;
  setCrackStage(0);
  elements.matchingOverlay.classList.remove("hidden");
  renderMatchingGame();
}

function renderMatchingGame() {
  elements.draggablePeople.innerHTML = "";
  elements.relationshipSlots.innerHTML = "";
  elements.matchingFeedback.textContent = `Attempt ${state.matchAttempt + 1} / 3`;
  elements.submitMatchesButton.disabled = true;

  bodyLayer.figures.forEach((figure) => {
    const card = document.createElement("div");
    card.className = "person-card";
    card.draggable = true;
    card.dataset.person = figure.id;
    card.textContent = figure.label;
    card.addEventListener("dragstart", handleDragStart);
    card.addEventListener("dragend", handleDragEnd);
    elements.draggablePeople.appendChild(card);
  });

  relationshipSlots.forEach((slot) => {
    const slotElement = document.createElement("div");
    slotElement.className = "relationship-slot";
    slotElement.dataset.slot = slot.id;
    slotElement.textContent = slot.label;
    slotElement.addEventListener("dragover", handleSlotDragOver);
    slotElement.addEventListener("dragleave", handleSlotDragLeave);
    slotElement.addEventListener("drop", handleSlotDrop);
    elements.relationshipSlots.appendChild(slotElement);
  });
}

function handleDragStart(event) {
  event.dataTransfer.setData("text/plain", event.currentTarget.dataset.person);
  event.currentTarget.classList.add("dragging");
}

function handleDragEnd(event) {
  event.currentTarget.classList.remove("dragging");
}

function handleSlotDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add("over");
}

function handleSlotDragLeave(event) {
  event.currentTarget.classList.remove("over");
}

function handleSlotDrop(event) {
  event.preventDefault();
  const personId = event.dataTransfer.getData("text/plain");
  const slot = event.currentTarget;

  if (!personId) {
    return;
  }

  state.matchingAssignments.forEach((assignedPersonId, slotId) => {
    if (assignedPersonId === personId) {
      state.matchingAssignments.delete(slotId);
    }
  });

  state.matchingAssignments.set(slot.dataset.slot, personId);
  renderSlotAssignments();
}

function renderSlotAssignments() {
  document.querySelectorAll(".relationship-slot").forEach((slotElement) => {
    slotElement.classList.remove("over");
    slotElement.querySelector(".slot-card")?.remove();

    const assignedPersonId = state.matchingAssignments.get(slotElement.dataset.slot);

    if (!assignedPersonId) {
      return;
    }

    const card = document.createElement("span");
    card.className = "slot-card";
    card.textContent = getPersonLabel(assignedPersonId);
    slotElement.appendChild(card);
  });

  elements.submitMatchesButton.disabled = state.matchingAssignments.size !== relationshipSlots.length;
}

function getPersonLabel(personId) {
  const figure = bodyLayer.figures.find((item) => item.id === personId);
  return figure ? figure.label : "???";
}

function submitMatches() {
  if (state.matchingAssignments.size !== relationshipSlots.length) {
    return;
  }

  state.matchAttempt += 1;
  setCrackStage(state.matchAttempt);

  if (state.matchAttempt === 1) {
    elements.matchingFeedback.textContent = "Wrong. The screen cracks, but the body demands another arrangement.";
    resetMatchingAssignments();
    return;
  }

  if (state.matchAttempt === 2) {
    elements.matchingFeedback.textContent = "Wrong again. The fracture spreads. One more try.";
    resetMatchingAssignments();
    return;
  }

  elements.matchingFeedback.textContent = "Wrong. The body cannot solve itself.";
  window.setTimeout(enterArtificialBody, 1100);
}

function resetMatchingAssignments() {
  state.matchingAssignments = new Map();
  renderSlotAssignments();
  elements.submitMatchesButton.disabled = true;
}

function setCrackStage(stage) {
  elements.world.classList.remove("crack-stage-1", "crack-stage-2", "crack-stage-3");
  elements.matchingOverlay.classList.remove("crack-stage-1", "crack-stage-2", "crack-stage-3");

  if (stage > 0) {
    elements.world.classList.add(`crack-stage-${stage}`);
    elements.matchingOverlay.classList.add(`crack-stage-${stage}`);
  }
}

function enterArtificialBody() {
  elements.matchingOverlay.classList.add("hidden");
  setCrackStage(0);
  unlockReality("artificial");
  state.player.x = 50;
  state.player.y = 55;
  state.player.targetX = 50;
  state.player.targetY = 55;
  setReality("artificial");
  renderPlayer();
}

function renderPlayer() {
  elements.player.style.left = `${state.player.x}%`;
  elements.player.style.top = `${state.player.y}%`;
}

function setClickTarget(event) {
  if (isInteractionBlockingMovement()) {
    return;
  }

  const rect = elements.world.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;

  state.player.targetX = clamp(x, 3, 97);
  state.player.targetY = clamp(y, 5, 95);

  elements.clickTarget.style.left = `${state.player.targetX}%`;
  elements.clickTarget.style.top = `${state.player.targetY}%`;
  elements.clickTarget.classList.add("active");
}

function handleKeydown(event) {
  const key = event.key.toLowerCase();
  const movementKeys = ["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright"];

  if (state.currentScreen !== "game") {
    return;
  }

  if (!elements.dialogueBox.classList.contains("hidden")) {
    if (key === "enter" || key === " " || key === "e") {
      event.preventDefault();
      advanceDialogue();
    }

    if (key === "escape") {
      closeDialogue();
    }

    return;
  }

  if (!elements.matchingOverlay.classList.contains("hidden")) {
    return;
  }

  const matchingReality = realities.find((reality) => reality.key === key);

  if (matchingReality) {
    setReality(matchingReality.id);
    return;
  }

  if (key === "e" && state.nearbyFigureId) {
    openDialogue(state.nearbyFigureId);
    return;
  }

  if (movementKeys.includes(key)) {
    event.preventDefault();
    state.pressedKeys.add(key);
  }
}

function handleKeyup(event) {
  state.pressedKeys.delete(event.key.toLowerCase());
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

elements.startButton.addEventListener("click", startBootSequence);
elements.returnTitleButton.addEventListener("click", () => {
  stopGameLoop();
  showScreen("title");
});
elements.world.addEventListener("click", setClickTarget);
elements.dialogueNextButton.addEventListener("click", advanceDialogue);
elements.dialogueCloseButton.addEventListener("click", closeDialogue);
elements.submitMatchesButton.addEventListener("click", submitMatches);
window.addEventListener("keydown", handleKeydown);
window.addEventListener("keyup", handleKeyup);

showScreen("title");
