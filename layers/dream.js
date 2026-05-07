(function () {
  window.SignalSelf = window.SignalSelf || {};
  window.SignalSelf.layers = window.SignalSelf.layers || {};

  const shinjiSprite = "sprites/shinji.png";

  const dream = {
    id: "dream",
    label: "Dream",
    content: null,
    upperContent: null,
    transitionTimer: null,
    transitionSwapTimer: null,
    drawingStage: 0,
    drawingActive: false,
    questionnaireActive: false,
    questionnaireStage: 0,
    questionnaireAnswers: [],
    drawing: false,
    tool: "pencil",
    context: null,
    nearbyShinji: false,
    dialogueComplete: false,
    shinji: {
      x: 56,
      y: 54,
      lines: [
        "Where... are we?",
        "This place... every time I touch these clouds...",
        "...I catch a glimpse of a memory.",
        "A dream.",
        "Our dreams.",
      ],
    },
    prompts: [
      "Draw what represents yourself.",
      "Draw the kanji for what represents yourself",
      "Draw the kanji for love.",
    ],
    questions: [
      {
        prompt: "When the dream gives you a face, where does it begin?",
        answers: [
          { score: "body", label: "In the skin that wakes up" },
          { score: "fragmented", label: "In the pieces that refuse to fit" },
          { score: "collective", label: "In the room that remembers me" },
        ],
      },
      {
        prompt: "A cloud opens and shows you love. What shape does it keep?",
        answers: [
          { score: "body", label: "A pulse, warm and temporary" },
          { score: "fragmented", label: "A symbol rewritten in sleep" },
          { score: "collective", label: "A voice answered by another voice" },
        ],
      },
      {
        prompt: "When you leave the dream, what follows you out?",
        answers: [
          { score: "body", label: "The hand that drew the mark" },
          { score: "fragmented", label: "The mark without one meaning" },
          { score: "collective", label: "The marks everyone taught me to read" },
        ],
      },
    ],
  };

  function onEnter() {
    const game = window.SignalSelf;
    reset();
    ensureContent();
    game.state.player.x = 42;
    game.state.player.y = 58;
    game.state.player.targetX = 42;
    game.state.player.targetY = 58;
    game.systems.movement.renderPlayer();
    renderShinji();
    game.elements.systemMessage.textContent =
      "Dream reality active. The symbol waits for a hand to make it true.";
  }

  function reset() {
    const game = window.SignalSelf;
    clearTimers();
    dream.drawingStage = 0;
    dream.drawingActive = false;
    dream.questionnaireActive = false;
    dream.questionnaireStage = 0;
    dream.questionnaireAnswers = [];
    dream.drawing = false;
    dream.tool = "pencil";
    dream.context = null;
    dream.nearbyShinji = false;
    dream.dialogueComplete = false;

    if (dream.content) {
      dream.content.remove();
      dream.content = null;
    }

    if (dream.upperContent) {
      dream.upperContent.remove();
      dream.upperContent = null;
    }

    game.elements.world.classList.remove(
      "dream-canvas-active",
      "dream-questionnaire-active",
      "dream-surreal-transitioning"
    );
    game.elements.interactionPrompt.classList.remove("visible");
    game.systems.dialogue?.hideShinjiPortrait?.();
  }

  function clearTimers() {
    [dream.transitionTimer, dream.transitionSwapTimer].forEach((timer) => {
      if (timer) {
        window.clearTimeout(timer);
      }
    });

    dream.transitionTimer = null;
    dream.transitionSwapTimer = null;
  }

  function ensureContent() {
    const game = window.SignalSelf;

    if (dream.content) {
      return dream.content;
    }

    dream.content = document.createElement("div");
    dream.content.className = "dream-layer-content";
    game.elements.world.appendChild(dream.content);
    renderAtmosphere();
    return dream.content;
  }

  function getStage() {
    return ensureContent().querySelector(".dream-stage-layer");
  }

  function renderAtmosphere() {
    const game = window.SignalSelf;
    dream.content.innerHTML = `
      <div class="dream-atmosphere" aria-hidden="true">
        <div class="dream-aurora dream-aurora-one"></div>
        <div class="dream-aurora dream-aurora-two"></div>
        <div class="dream-moon-orbit"></div>
        <div class="dream-symbol-field">
          <span>love</span><span>self</span><span>memory</span><span>signal</span>
        </div>
        <div class="dream-cloud-layer dream-cloud-layer-back"></div>
      </div>
      <div class="dream-stage-layer"></div>
    `;

    dream.upperContent = document.createElement("div");
    dream.upperContent.className = "dream-cloud-layer dream-cloud-layer-front";
    dream.upperContent.setAttribute("aria-hidden", "true");
    game.elements.world.appendChild(dream.upperContent);

    populateClouds(dream.content.querySelector(".dream-cloud-layer-back"), 8, "back");
    populateClouds(dream.upperContent, 6, "front");
  }

  function populateClouds(container, count, depth) {
    for (let index = 0; index < count; index += 1) {
      const cloud = document.createElement("span");
      cloud.className = `dream-cloud dream-cloud-${depth}`;
      cloud.style.setProperty(
        "--cloud-y",
        `${8 + ((index * 17 + (depth === "front" ? 9 : 0)) % 78)}%`
      );
      cloud.style.setProperty("--cloud-size", `${90 + ((index * 37) % 110)}px`);
      cloud.style.setProperty("--cloud-duration", `${18 + ((index * 5) % 16)}s`);
      cloud.style.setProperty("--cloud-delay", `${-1 * ((index * 3) % 17)}s`);
      cloud.style.setProperty("--cloud-opacity", `${depth === "front" ? 0.64 : 0.42}`);
      container.appendChild(cloud);
    }
  }

  function renderShinji() {
    const content = getStage();
    const figure = document.createElement("button");
    figure.type = "button";
    figure.className = "dream-shinji";
    figure.dataset.label = "Shinji";
    figure.style.left = `${dream.shinji.x}%`;
    figure.style.top = `${dream.shinji.y}%`;
    figure.style.setProperty("--character-sprite", `url("${shinjiSprite}")`);
    figure.setAttribute("aria-label", "Speak to Shinji");
    figure.addEventListener("click", (event) => {
      event.stopPropagation();
      handleShinjiClick();
    });
    content.appendChild(figure);
  }

  function handleShinjiClick() {
    const game = window.SignalSelf;

    if (dream.dialogueComplete || dream.drawingActive || game.state.activeReality !== "dream") {
      return;
    }

    const distance = getShinjiDistance();

    if (distance > 8) {
      game.state.player.targetX = game.systems.movement.clamp(dream.shinji.x, 3, 97);
      game.state.player.targetY = game.systems.movement.clamp(dream.shinji.y + 5, 5, 95);
      game.elements.clickTarget.style.left = `${game.state.player.targetX}%`;
      game.elements.clickTarget.style.top = `${game.state.player.targetY}%`;
      game.elements.clickTarget.classList.add("active");
      game.elements.systemMessage.textContent =
        "Move closer. Dreams still need a body before they can answer.";
      return;
    }

    openShinjiDialogue();
  }

  function openShinjiDialogue() {
    const game = window.SignalSelf;

    game.systems.dialogue.openCustom({
      speaker: "Shinji",
      lines: dream.shinji.lines,
      portrait: "neutral",
      onComplete() {
        dream.dialogueComplete = true;
        startSurrealTransition();
      },
    });
  }

  function startSurrealTransition() {
    const game = window.SignalSelf;
    const content = getStage();
    game.elements.clickTarget.classList.remove("active");
    game.elements.interactionPrompt.classList.remove("visible");
    game.elements.world.classList.add("dream-surreal-transitioning");
    game.systems.movement.freeze(2700);

    const overlay = document.createElement("div");
    overlay.className = "dream-surreal-cut";
    overlay.innerHTML = `
      <div class="dream-eye" aria-hidden="true"></div>
      <div class="dream-symbol-rain" aria-hidden="true">
        <span>&#x611B;</span><span>?</span><span>&#x79C1;</span><span>&#x5922;</span><span>&#x611B;</span>
      </div>
      <p>meaning loses its outline...</p>
    `;
    content.appendChild(overlay);

    dream.transitionTimer = window.setTimeout(() => {
      overlay.classList.add("fading-out");
      dream.transitionSwapTimer = window.setTimeout(() => {
        content.innerHTML = "";
        game.elements.world.classList.remove("dream-surreal-transitioning");
        showDrawingCanvas();
      }, 480);
    }, 2200);
  }

  function showDrawingCanvas() {
    const game = window.SignalSelf;
    const content = getStage();
    dream.drawingStage = 0;
    dream.drawingActive = true;
    dream.tool = "pencil";
    game.elements.clickTarget.classList.remove("active");
    game.state.player.targetX = game.state.player.x;
    game.state.player.targetY = game.state.player.y;
    game.elements.world.classList.add("dream-canvas-active");
    game.elements.systemMessage.textContent =
      "Dream canvas active. The drawing is not a test. It is a confession in symbols.";

    const panel = document.createElement("section");
    panel.className = "dream-canvas-panel";
    panel.setAttribute("aria-label", "Dream drawing canvas");
    panel.innerHTML = `
      <div class="dream-canvas-header">
        <p class="kicker">Dream Drawing Ritual</p>
        <h2 id="dream-canvas-title">${dream.prompts[dream.drawingStage]}</h2>
      </div>
      <div class="dream-canvas-shell">
        <canvas class="dream-drawing-canvas" width="512" height="512" aria-label="Draw symbol"></canvas>
      </div>
      <div class="dream-canvas-toolbar" aria-label="Drawing tools">
        <button type="button" data-tool="pencil" class="active">Pencil</button>
        <button type="button" data-tool="eraser">Eraser</button>
        <button type="button" data-action="clear">Clear</button>
      </div>
      <p class="dream-canvas-feedback" aria-live="polite"></p>
      <button type="button" class="dream-submit-button" data-action="submit">Submit</button>
      <button type="button" class="dream-skip-button" data-action="skip">Skip Drawing</button>
    `;
    panel.addEventListener("click", handlePanelClick);
    panel.addEventListener("pointerdown", (event) => event.stopPropagation());
    content.appendChild(panel);

    setupCanvas(panel.querySelector(".dream-drawing-canvas"));
  }

  function setupCanvas(canvas) {
    dream.context = canvas.getContext("2d");
    resetCanvasSurface();

    canvas.addEventListener("pointerdown", startDrawing);
    canvas.addEventListener("pointermove", draw);
    canvas.addEventListener("pointerup", stopDrawing);
    canvas.addEventListener("pointerleave", stopDrawing);
    canvas.addEventListener("pointercancel", stopDrawing);
  }

  function resetCanvasSurface() {
    if (!dream.context) {
      return;
    }

    const canvas = dream.context.canvas;
    dream.context.fillStyle = "rgba(247, 251, 255, 0.98)";
    dream.context.fillRect(0, 0, canvas.width, canvas.height);
    dream.context.lineCap = "round";
    dream.context.lineJoin = "round";
  }

  function startDrawing(event) {
    event.preventDefault();
    dream.drawing = true;
    draw(event);
  }

  function draw(event) {
    if (!dream.drawing || !dream.context) {
      return;
    }

    const canvas = dream.context.canvas;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    const size = dream.tool === "eraser" ? 34 : 12;
    dream.context.fillStyle = dream.tool === "eraser" ? "rgba(247, 251, 255, 0.98)" : "#111827";
    dream.context.beginPath();
    dream.context.arc(x, y, size, 0, Math.PI * 2);
    dream.context.fill();
  }

  function stopDrawing() {
    dream.drawing = false;
  }

  function handlePanelClick(event) {
    event.stopPropagation();
    const button = event.target.closest("button");

    if (!button) {
      return;
    }

    const panel = button.closest(".dream-canvas-panel");

    if (button.dataset.tool) {
      setTool(panel, button.dataset.tool);
      return;
    }

    if (button.dataset.action === "clear") {
      resetCanvasSurface();
      setFeedback(panel, "");
      return;
    }

    if (button.dataset.action === "submit") {
      submitDrawing(panel);
      return;
    }

    if (button.dataset.action === "skip") {
      startQuestionnaire("Drawing skipped. The dream asks directly.");
    }
  }

  function setTool(panel, tool) {
    dream.tool = tool;
    panel.querySelectorAll("[data-tool]").forEach((button) => {
      button.classList.toggle("active", button.dataset.tool === tool);
    });
  }

  function submitDrawing(panel) {
    if (dream.drawingStage < dream.prompts.length - 1) {
      dream.drawingStage += 1;
      panel.querySelector("#dream-canvas-title").textContent = dream.prompts[dream.drawingStage];
      resetCanvasSurface();
      setFeedback(panel, "Accepted. The dream changes the question.");
      return;
    }

    startQuestionnaire("Love drawn. The dream answers with questions.");
  }

  function setFeedback(panel, text) {
    panel.querySelector(".dream-canvas-feedback").textContent = text;
  }

  function startQuestionnaire(message) {
    const game = window.SignalSelf;
    const content = getStage();
    dream.drawingActive = false;
    dream.questionnaireActive = true;
    dream.questionnaireStage = 0;
    dream.questionnaireAnswers = [];
    game.elements.world.classList.remove("dream-canvas-active");
    game.elements.world.classList.add("dream-questionnaire-active");
    game.elements.systemMessage.textContent = message;
    content.innerHTML = "";
    game.systems.dialogue.hideShinjiPortrait?.();
    renderQuestionnaire();
  }

  function renderQuestionnaire() {
    const content = getStage();
    const question = dream.questions[dream.questionnaireStage];
    const panel = document.createElement("section");
    panel.className = "dream-questionnaire-panel";
    panel.setAttribute("aria-label", "Dream questionnaire");
    panel.innerHTML = `
      <p class="kicker">Dream Residue</p>
      <h2>${question.prompt}</h2>
      <div class="dream-questionnaire-options">
        ${question.answers
          .map(
            (answer) => `
              <button type="button" data-dream-score="${answer.score}">
                ${answer.label}
              </button>
            `
          )
          .join("")}
      </div>
      <p class="dream-questionnaire-count">
        Question ${dream.questionnaireStage + 1} / ${dream.questions.length}
      </p>
    `;
    panel.addEventListener("click", handleQuestionnaireClick);
    content.innerHTML = "";
    content.appendChild(panel);
  }

  function handleQuestionnaireClick(event) {
    event.stopPropagation();
    const button = event.target.closest("button[data-dream-score]");

    if (!button) {
      return;
    }

    dream.questionnaireAnswers.push(button.dataset.dreamScore);
    dream.questionnaireStage += 1;

    if (dream.questionnaireStage < dream.questions.length) {
      renderQuestionnaire();
      return;
    }

    finishQuestionnaire();
  }

  function finishQuestionnaire() {
    const game = window.SignalSelf;
    const scoreName = getQuestionnaireScore();
    dream.questionnaireActive = false;
    game.elements.world.classList.remove("dream-questionnaire-active");
    game.endingScoreSystem.incrementEndingScore(scoreName);
    getStage().innerHTML = "";
    game.elements.systemMessage.textContent =
      "The dream keeps one answer and lets the others dissolve.";
  }

  function getQuestionnaireScore() {
    const totals = {
      body: 0,
      fragmented: 0,
      collective: 0,
    };

    dream.questionnaireAnswers.forEach((scoreName) => {
      totals[scoreName] += 1;
    });

    return Object.entries(totals).reduce(
      (highest, current) => {
        if (current[1] > highest[1]) {
          return current;
        }

        if (
          current[1] === highest[1] &&
          dream.questionnaireAnswers[dream.questionnaireAnswers.length - 1] === current[0]
        ) {
          return current;
        }

        return highest;
      },
      ["body", -1]
    )[0];
  }

  function updateNearbyFigure() {
    const game = window.SignalSelf;

    if (
      game.state.activeReality !== "dream" ||
      dream.dialogueComplete ||
      dream.drawingActive ||
      dream.questionnaireActive
    ) {
      dream.nearbyShinji = false;
      game.elements.interactionPrompt.classList.remove("visible");
      dream.content?.querySelector(".dream-shinji")?.classList.remove("nearby");
      return;
    }

    dream.nearbyShinji = getShinjiDistance() <= 8;
    dream.content?.querySelector(".dream-shinji")?.classList.toggle("nearby", dream.nearbyShinji);

    if (dream.nearbyShinji) {
      game.elements.interactionPrompt.textContent = "Press E to speak with Shinji";
      game.elements.interactionPrompt.classList.add("visible");
    } else {
      game.elements.interactionPrompt.classList.remove("visible");
    }
  }

  function interact() {
    if (dream.nearbyShinji) {
      openShinjiDialogue();
    }
  }

  function isInteractionBlockingMovement() {
    return dream.drawingActive || dream.questionnaireActive;
  }

  function getShinjiDistance() {
    const game = window.SignalSelf;
    return Math.hypot(dream.shinji.x - game.state.player.x, dream.shinji.y - game.state.player.y);
  }

  window.SignalSelf.layers.dream = {
    ...dream,
    onEnter,
    reset,
    updateNearbyFigure,
    interact,
    isInteractionBlockingMovement,
  };
})();
