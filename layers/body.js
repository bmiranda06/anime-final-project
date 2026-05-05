(function () {
  window.SignalSelf = window.SignalSelf || {};
  window.SignalSelf.layers = window.SignalSelf.layers || {};

  const body = {
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

  function render() {
    const game = window.SignalSelf;
    game.elements.bodyLayerContent.innerHTML = "";

    body.colliders.forEach((collider) => {
      const barrier = document.createElement("div");
      barrier.className = "body-collider";
      barrier.style.left = `${collider.x}%`;
      barrier.style.top = `${collider.y}%`;
      barrier.style.width = `${collider.w}%`;
      barrier.style.height = `${collider.h}%`;
      game.elements.bodyLayerContent.appendChild(barrier);
    });

    body.figures.forEach((figure) => {
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
      game.elements.bodyLayerContent.appendChild(element);
    });
  }

  function wouldCollide(x, y) {
    const game = window.SignalSelf;

    if (game.state.activeReality !== "body") {
      return false;
    }

    return body.colliders.some((collider) => {
      const playerBox = {
        left: x - game.state.player.radius,
        right: x + game.state.player.radius,
        top: y - game.state.player.radius,
        bottom: y + game.state.player.radius,
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
    const game = window.SignalSelf;
    const figure = getNearbyFigure();
    game.state.nearbyFigureId = figure ? figure.id : null;

    document.querySelectorAll(".memory-figure").forEach((element) => {
      element.classList.toggle("nearby", element.dataset.figure === game.state.nearbyFigureId);
    });

    if (
      figure &&
      game.state.activeReality === "body" &&
      game.elements.matchingOverlay.classList.contains("hidden")
    ) {
      game.elements.interactionPrompt.textContent = `Press E to speak with ${figure.label}`;
      game.elements.interactionPrompt.classList.add("visible");
    } else {
      game.elements.interactionPrompt.classList.remove("visible");
    }
  }

  function getNearbyFigure() {
    const game = window.SignalSelf;

    if (game.state.activeReality !== "body") {
      return null;
    }

    return (
      body.figures.find((figure) => {
        const distance = Math.hypot(figure.x - game.state.player.x, figure.y - game.state.player.y);
        return distance <= 8;
      }) || null
    );
  }

  function handleFigureClick(figure) {
    const game = window.SignalSelf;
    const distance = Math.hypot(figure.x - game.state.player.x, figure.y - game.state.player.y);

    if (game.state.activeReality !== "body" || distance > 8) {
      game.state.player.targetX = game.systems.movement.clamp(figure.x, 3, 97);
      game.state.player.targetY = game.systems.movement.clamp(figure.y + 5, 5, 95);
      game.elements.clickTarget.style.left = `${game.state.player.targetX}%`;
      game.elements.clickTarget.style.top = `${game.state.player.targetY}%`;
      game.elements.clickTarget.classList.add("active");
      game.elements.systemMessage.textContent =
        "Move closer. The body has to be present before memory answers.";
      return;
    }

    game.systems.dialogue.open(figure.id);
  }

  function checkComplete() {
    const game = window.SignalSelf;

    if (
      game.state.bodyChallengeStarted ||
      game.state.spokenFigureIds.size < body.figures.length ||
      game.state.activeReality !== "body"
    ) {
      return;
    }

    game.state.bodyChallengeStarted = true;
    game.elements.systemMessage.textContent = "Everyone has spoken. The body cannot hold the contradiction.";
    game.systems.screenEffects.triggerBodyBreakCutscene();
  }

  window.SignalSelf.layers.body = {
    ...body,
    render,
    wouldCollide,
    updateNearbyFigure,
    getNearbyFigure,
    checkComplete,
  };
})();
