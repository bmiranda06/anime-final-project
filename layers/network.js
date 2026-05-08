(function () {
  window.SignalSelf = window.SignalSelf || {};
  window.SignalSelf.layers = window.SignalSelf.layers || {};

  const fragments = [
    {
      id: "ryu",
      source: "Body — Ryu",
      text: "I hate you. Don't you remember?",
    },
    {
      id: "kai",
      source: "Body — Kai",
      text: "Long time no see, friend.",
    },
    {
      id: "izumi",
      source: "Body — Izumi",
      text: "It's time. Ascend.",
    },
    {
      id: "follow",
      source: "Artificial Body — Pilot",
      text: "Follow the mirror's command.",
    },
    {
      id: "refuse",
      source: "Artificial Body — Pilot",
      text: "Refuse the mirror's command.",
    },
    {
      id: "wire",
      source: "Artificial Body — Wires",
      text: "Memory routes through the dream.",
    },
    {
      id: "kanji-love",
      source: "Dream — Canvas",
      text: "The kanji you drew for love.",
    },
    {
      id: "pulse",
      source: "Dream — Cloud",
      text: "A pulse, warm and temporary.",
    },
    {
      id: "marks",
      source: "Dream — Residue",
      text: "The marks everyone taught me to read.",
    },
  ];

  const orbits = [
    {
      id: "mine",
      label: "MINE",
      score: "body",
      caption: "Claim it. This is my own voice.",
    },
    {
      id: "not-mine",
      label: "NOT MINE",
      score: "fragmented",
      caption: "Reject it. Someone else placed this in me.",
    },
    {
      id: "ours",
      label: "OURS",
      score: "collective",
      caption: "Share it. The channel belongs to everyone on it.",
    },
  ];

  const dollChoices = [
    {
      score: "body",
      label: "This was always my voice. He was borrowing it.",
    },
    {
      score: "fragmented",
      label: "Neither of us owns these words.",
    },
    {
      score: "collective",
      label: "Voices don't have owners.",
    },
  ];

  const finalChoices = [
    { score: "body", label: "I am." },
    { score: "fragmented", label: "I don't know who 'I' is." },
    { score: "collective", label: "We are." },
  ];

  const endings = {
    body: {
      title: "Bodily Ending",
      subtitle: "The signal cuts. Only the body survives.",
      lines: [
        "You log out and lock the door behind you.",
        "The city is empty of every figure but you.",
        "Whatever the network was made of, it stayed in the network.",
        "What survives the dispersal is the body. That is enough.",
      ],
      anime: "Echoing Akira: the self that refused to dissolve.",
    },
    fragmented: {
      title: "Fragmented Ending",
      subtitle: "Four selves run in parallel. None of them are the original.",
      lines: [
        "Body, machine, dream, and net keep running side by side.",
        "None of the four versions claims to be the master copy.",
        "You stop trying to merge them.",
        "The self was never one thing. It was a folder of drafts.",
      ],
      anime: "Echoing Evangelion and Paprika: identity as unresolved overlap.",
    },
    collective: {
      title: "Collective Ending",
      subtitle: "The mesh remembers what the self forgot.",
      lines: [
        "Your single node is one of thousands.",
        "Ryu, Kai, Izumi, Akiko, Shinji — all glow nearby.",
        "You stop searching for the line that separates you.",
        "The net is vast and infinite. You are part of how it sees itself.",
      ],
      anime: "Echoing Ghost in the Shell 2: Innocence: identity as distributed.",
    },
  };

  const network = {
    phase: "idle",
    content: null,
    assignments: {},
    dragId: null,
    centerMessageTimer: null,
    centerMessageExitTimer: null,
  };

  function onEnter() {
    const game = window.SignalSelf;
    reset();
    ensureContent();
    game.elements.systemMessage.textContent =
      "Network reality active. Sort the voices that ended up in your channel.";
    network.phase = "fragments";
    renderFragmentPhase();
  }

  function reset() {
    clearTimers();
    network.phase = "idle";
    network.assignments = {};
    network.dragId = null;

    if (network.content) {
      network.content.remove();
      network.content = null;
    }
  }

  function clearTimers() {
    if (network.centerMessageTimer) {
      window.clearTimeout(network.centerMessageTimer);
      network.centerMessageTimer = null;
    }

    if (network.centerMessageExitTimer) {
      window.clearTimeout(network.centerMessageExitTimer);
      network.centerMessageExitTimer = null;
    }
  }

  function ensureContent() {
    const game = window.SignalSelf;

    if (network.content) {
      return network.content;
    }

    network.content = document.createElement("div");
    network.content.className = "network-layer-content";
    game.elements.world.appendChild(network.content);
    return network.content;
  }

  function isInteractionBlockingMovement() {
    return network.phase !== "idle";
  }

  function renderFragmentPhase() {
    const content = ensureContent();
    content.innerHTML = "";

    const panel = document.createElement("section");
    panel.className = "network-panel network-fragments-panel";
    panel.setAttribute("aria-label", "Distributed self triage");
    panel.innerHTML = `
      <header class="network-panel-header">
        <p class="kicker">Distributed Self</p>
        <h2>Sort the voices the network gave back to you.</h2>
        <p class="network-panel-instructions">
          Drag each fragment from earlier layers into one of the three orbits. The network keeps what you claim, marks what you reject, and shares the rest.
        </p>
      </header>
      <div class="network-fragment-pool" data-pool aria-label="Unsorted fragments"></div>
      <div class="network-orbit-row">
        ${orbits
          .map(
            (orbit) => `
              <div class="network-orbit network-orbit-${orbit.id}" data-orbit="${orbit.id}" data-score="${orbit.score}">
                <p class="network-orbit-label">${orbit.label}</p>
                <p class="network-orbit-caption">${orbit.caption}</p>
                <div class="network-orbit-content"></div>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="network-panel-footer">
        <p class="network-progress" data-progress></p>
        <button type="button" class="network-submit-button" data-action="submit-fragments" disabled>
          Send Signal
        </button>
      </div>
    `;
    content.appendChild(panel);

    panel.addEventListener("click", handleFragmentPanelClick);
    panel.addEventListener("dragover", handlePanelDragOver);
    panel.addEventListener("dragleave", handlePanelDragLeave);
    panel.addEventListener("drop", handlePanelDrop);

    renderFragmentCards();
    updateFragmentProgress();
  }

  function renderFragmentCards() {
    const content = network.content;

    if (!content) {
      return;
    }

    const pool = content.querySelector("[data-pool]");

    if (!pool) {
      return;
    }

    pool.innerHTML = "";
    content
      .querySelectorAll(".network-orbit-content")
      .forEach((element) => {
        element.innerHTML = "";
      });

    fragments.forEach((fragment) => {
      const card = document.createElement("div");
      card.className = "network-fragment-card";
      card.draggable = true;
      card.dataset.fragmentId = fragment.id;
      card.innerHTML = `
        <p class="network-fragment-source">${fragment.source}</p>
        <p class="network-fragment-text">&ldquo;${fragment.text}&rdquo;</p>
      `;
      card.addEventListener("dragstart", handleCardDragStart);
      card.addEventListener("dragend", handleCardDragEnd);

      const targetOrbitId = network.assignments[fragment.id];

      if (targetOrbitId) {
        const orbitContent = content.querySelector(
          `.network-orbit[data-orbit="${targetOrbitId}"] .network-orbit-content`
        );
        (orbitContent || pool).appendChild(card);
      } else {
        pool.appendChild(card);
      }
    });
  }

  function handleCardDragStart(event) {
    network.dragId = event.currentTarget.dataset.fragmentId;
    event.currentTarget.classList.add("dragging");
    event.dataTransfer.setData("text/plain", network.dragId);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleCardDragEnd(event) {
    event.currentTarget.classList.remove("dragging");
    network.dragId = null;
    clearDropHighlights();
  }

  function handlePanelDragOver(event) {
    const dropZone = getDropZone(event.target);

    if (!dropZone) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    clearDropHighlights();
    dropZone.classList.add("over");
  }

  function handlePanelDragLeave(event) {
    const dropZone = getDropZone(event.target);

    if (dropZone && !dropZone.contains(event.relatedTarget)) {
      dropZone.classList.remove("over");
    }
  }

  function handlePanelDrop(event) {
    const dropZone = getDropZone(event.target);
    const fragmentId =
      event.dataTransfer.getData("text/plain") || network.dragId;

    if (!dropZone || !fragmentId) {
      return;
    }

    event.preventDefault();
    clearDropHighlights();

    if (dropZone.classList.contains("network-orbit")) {
      network.assignments[fragmentId] = dropZone.dataset.orbit;
    } else {
      delete network.assignments[fragmentId];
    }

    renderFragmentCards();
    updateFragmentProgress();
  }

  function getDropZone(element) {
    if (!element || !element.closest) {
      return null;
    }

    return (
      element.closest(".network-orbit") ||
      element.closest(".network-fragment-pool")
    );
  }

  function clearDropHighlights() {
    if (!network.content) {
      return;
    }

    network.content
      .querySelectorAll(".network-orbit.over, .network-fragment-pool.over")
      .forEach((element) => element.classList.remove("over"));
  }

  function updateFragmentProgress() {
    if (!network.content) {
      return;
    }

    const assignedCount = Object.keys(network.assignments).length;
    const totalCount = fragments.length;
    const progressEl = network.content.querySelector("[data-progress]");
    const submitButton = network.content.querySelector(
      "[data-action='submit-fragments']"
    );

    if (progressEl) {
      progressEl.textContent = `${assignedCount} / ${totalCount} fragments routed`;
    }

    if (submitButton) {
      submitButton.disabled = assignedCount < totalCount;
    }
  }

  function handleFragmentPanelClick(event) {
    const button = event.target.closest(
      "button[data-action='submit-fragments']"
    );

    if (!button || button.disabled) {
      return;
    }

    submitFragments();
  }

  function submitFragments() {
    const game = window.SignalSelf;

    Object.entries(network.assignments).forEach(([, orbitId]) => {
      const orbit = orbits.find((item) => item.id === orbitId);

      if (orbit) {
        game.endingScoreSystem.incrementEndingScore(orbit.score);
      }
    });

    network.phase = "transition";
    showCenterMessage("All voices logged. The network plays them back.", () => {
      renderDollPhase();
    });
  }

  function renderDollPhase() {
    const game = window.SignalSelf;
    const content = ensureContent();
    network.phase = "doll";
    content.innerHTML = "";

    game.elements.systemMessage.textContent =
      "Ghost dubbing in progress. The pilot speaks Shinji's line.";

    const panel = document.createElement("section");
    panel.className = "network-panel network-doll-panel";
    panel.setAttribute("aria-label", "Ghost dubbing");
    panel.innerHTML = `
      <header class="network-panel-header">
        <p class="kicker">Ghost Dubbing</p>
        <h2>The network replays a line from the body layer &mdash; in your voice.</h2>
      </header>
      <blockquote class="network-doll-quote">
        <span class="network-doll-attribution">PILOT:</span>
        <span class="network-doll-text">&ldquo;I remember how you made me feel.&rdquo;</span>
      </blockquote>
      <p class="network-doll-prompt">Whose voice was that?</p>
      <div class="network-doll-options">
        ${dollChoices
          .map(
            (choice) => `
              <button type="button" data-doll-score="${choice.score}">
                ${choice.label}
              </button>
            `
          )
          .join("")}
      </div>
    `;
    content.appendChild(panel);

    panel.addEventListener("click", handleDollClick);
  }

  function handleDollClick(event) {
    const button = event.target.closest("button[data-doll-score]");

    if (!button) {
      return;
    }

    const game = window.SignalSelf;
    game.endingScoreSystem.incrementEndingScore(button.dataset.dollScore);
    network.content
      ?.querySelectorAll(".network-doll-options button")
      .forEach((element) => {
        element.disabled = true;
      });

    network.phase = "transition";
    showCenterMessage("Channel acknowledged. The question reforms.", () => {
      renderFinalPhase();
    });
  }

  function renderFinalPhase() {
    const game = window.SignalSelf;
    const content = ensureContent();
    network.phase = "final";
    content.innerHTML = "";

    game.elements.systemMessage.textContent =
      "The network returns the original question, transformed.";

    const overlay = document.createElement("section");
    overlay.className = "network-final-overlay";
    overlay.innerHTML = `
      <div class="network-final-panel">
        <p class="network-final-question" data-question></p>
        <div class="network-final-answers hidden" data-answers role="group" aria-label="Final identity choice">
          ${finalChoices
            .map(
              (choice) => `
                <button type="button" data-final-score="${choice.score}">
                  ${choice.label}
                </button>
              `
            )
            .join("")}
        </div>
      </div>
    `;
    content.appendChild(overlay);

    const target = overlay.querySelector("[data-question]");
    const answers = overlay.querySelector("[data-answers]");

    answers.addEventListener("click", handleFinalClick);

    game.systems.typewriter.write({
      text: "Who is asking?",
      target,
      speed: 90,
      onComplete() {
        if (network.phase !== "final") {
          return;
        }

        answers.classList.remove("hidden");
        answers.querySelector("button")?.focus();
      },
    });
  }

  function handleFinalClick(event) {
    const button = event.target.closest("button[data-final-score]");

    if (!button) {
      return;
    }

    const game = window.SignalSelf;
    game.endingScoreSystem.incrementEndingScore(button.dataset.finalScore);
    network.content
      ?.querySelectorAll(".network-final-answers button")
      .forEach((element) => {
        element.disabled = true;
      });

    renderEndingPhase();
  }

  function renderEndingPhase() {
    const game = window.SignalSelf;
    const content = ensureContent();
    network.phase = "ending";
    content.innerHTML = "";

    const [scoreName] = game.endingScoreSystem.getHighestEndingScore();
    const ending = endings[scoreName] || endings.body;
    const scores = game.endingScores;

    game.elements.systemMessage.textContent = `Ending resolved: ${ending.title}.`;

    const panel = document.createElement("section");
    panel.className = `network-panel network-ending-panel ending-${scoreName}`;
    panel.innerHTML = `
      <p class="kicker">Ending &mdash; ${scoreName.toUpperCase()}</p>
      <h2>${ending.title}</h2>
      <p class="network-ending-subtitle">${ending.subtitle}</p>
      <ul class="network-ending-lines">
        ${ending.lines.map((line) => `<li>${line}</li>`).join("")}
      </ul>
      <p class="network-ending-anime">${ending.anime}</p>
      <p class="network-ending-scores">
        <span>Body <strong>${scores.body}</strong></span>
        <span>Fragmented <strong>${scores.fragmented}</strong></span>
        <span>Collective <strong>${scores.collective}</strong></span>
      </p>
      <button type="button" class="network-ending-button" data-action="return-title">
        Return to Title
      </button>
    `;
    content.appendChild(panel);

    panel.addEventListener("click", (event) => {
      const button = event.target.closest(
        "button[data-action='return-title']"
      );

      if (!button) {
        return;
      }

      game.systems.movement.stopGameLoop();
      game.showScreen("title");
    });
  }

  function showCenterMessage(text, onComplete) {
    const content = ensureContent();
    clearTimers();

    const message = document.createElement("div");
    message.className = "network-center-message";
    message.textContent = text;
    content.appendChild(message);

    network.centerMessageTimer = window.setTimeout(() => {
      message.classList.add("fading-out");

      network.centerMessageExitTimer = window.setTimeout(() => {
        message.remove();
        network.centerMessageTimer = null;
        network.centerMessageExitTimer = null;

        if (onComplete) {
          onComplete();
        }
      }, 420);
    }, 2000);
  }

  window.SignalSelf.layers.network = {
    id: "network",
    label: "Network",
    onEnter,
    reset,
    isInteractionBlockingMovement,
  };
})();
