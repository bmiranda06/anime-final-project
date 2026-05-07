(function () {
  window.SignalSelf = window.SignalSelf || {};
  window.SignalSelf.layers = window.SignalSelf.layers || {};

  const spriteAspects = {
    building1: 1122 / 1402,
    building2: 1,
    building3: 1448 / 1086,
    building4: 1122 / 1402,
    building5: 1402 / 1122,
    building6: 1,
  };

  const shinjiSprite = "sprites/shinji.png";
  const randomFigureSprites = [
    "sprites/random1.png",
    "sprites/random2.png",
    "sprites/random3.png",
    "sprites/random4.png",
  ];

  const body = {
    assistFigureId: "figure-1",
    assistBarrierOpen: false,
    lastBlockedColliderId: null,
    colliders: [],
    buildings: [
      {
        id: "left-block",
        src: "sprites/Physical/building1.png",
        aspect: spriteAspects.building1,
        x: 2,
        y: 12,
        h: 30,
      },
      {
        id: "upper-spine",
        src: "sprites/Physical/building2.png",
        aspect: spriteAspects.building2,
        x: 25,
        y: 0,
        h: 26,
      },
      {
        id: "center-block",
        src: "sprites/Physical/building3.png",
        aspect: spriteAspects.building3,
        x: 38,
        y: 12,
        h: 35,
      },
      {
        id: "center-spine",
        src: "sprites/Physical/building4.png",
        aspect: spriteAspects.building4,
        x: 56,
        y: 39,
        h: 37,
        assistRequired: true,
      },
      {
        id: "lower-middle-block",
        src: "sprites/Physical/building5.png",
        aspect: spriteAspects.building5,
        x: 4,
        y: 56,
        h: 42,
      },
      {
        id: "right-block",
        src: "sprites/Physical/building6.png",
        aspect: spriteAspects.building6,
        x: 71,
        y: 0,
        h: 40,
      },
      {
        id: "lower-gate",
        src: "sprites/Physical/building3.png",
        aspect: spriteAspects.building3,
        x: 54,
        y: 77,
        h: 30,
      },
      {
        id: "far-right-stack",
        src: "sprites/Physical/building2.png",
        aspect: spriteAspects.building2,
        x: 82,
        y: 43,
        h: 22,
      },
    ],
    figures: [
      {
        id: "figure-1",
        x: 38,
        y: 48,
        label: "Shinji",
        speaker: "Shinji",
        sprite: shinjiSprite,
        lines: [
          "I remember you.",
          "I remember how you made me feel.",
        ],
      },
      {
        id: "figure-2",
        x: 70,
        y: 66,
        label: "Ryu",
        speaker: "Ryu",
        lines: [
          "I hate you.",
          "Don't you remember? What you and your friends did to me?",
          "It was cruel.",
        ],
      },
      {
        id: "figure-3",
        x: 14,
        y: 52,
        label: "Kai",
        speaker: "Kai",
        lines: [
          "Hey, how have you been?",
          "Long time no see, friend.",
          "How's work? The wife? The kids?",
        ],
      },
      {
        id: "figure-4",
        x: 88,
        y: 70,
        label: "Izumi",
        speaker: "Izumi",
        lines: [
          "Have you been cured?",
          "Have they helped you like they helped me?",
          "It's time. Ascend.",
        ],
      },
      {
        id: "figure-5",
        x: 70,
        y: 53,
        label: "Akiko",
        speaker: "Akiko",
        lines: ["Hi, nice to meet you.", "Wait... do I know you?"],
      },
    ],
  };

  function roundPercent(value) {
    return Math.round(value * 100) / 100;
  }

  function getWorldAspect() {
    const game = window.SignalSelf;
    const rect = game.elements?.world?.getBoundingClientRect();

    if (!rect || rect.height <= 0) {
      return 1.55;
    }

    return rect.width / rect.height;
  }

  function getLayoutBoxes() {
    const worldAspect = getWorldAspect();

    return body.buildings.map((building) => {
      const height = Number.isFinite(building.h)
        ? building.h
        : (building.w * worldAspect) / building.aspect;
      const width = Number.isFinite(building.w)
        ? building.w
        : (height * building.aspect) / worldAspect;

      return {
        ...building,
        w: roundPercent(width),
        h: roundPercent(height),
      };
    });
  }

  function syncColliders(layoutBoxes) {
    body.colliders = layoutBoxes.map((box) => ({
      id: box.id,
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      assistRequired: box.assistRequired,
    }));
  }

  function applyBoxStyle(element, box) {
    element.style.left = `${box.x}%`;
    element.style.top = `${box.y}%`;
    element.style.width = `${box.w}%`;
    element.style.height = `${box.h}%`;
  }

  function getRandomFigureSprite() {
    return randomFigureSprites[Math.floor(Math.random() * randomFigureSprites.length)];
  }

  function render() {
    const game = window.SignalSelf;
    body.assistBarrierOpen = false;
    body.lastBlockedColliderId = null;
    game.elements.bodyLayerContent.innerHTML = "";
    const layoutBoxes = getLayoutBoxes();
    syncColliders(layoutBoxes);

    layoutBoxes.forEach((building) => {
      const sprite = document.createElement("img");
      sprite.className = "body-building-sprite";
      sprite.src = building.src;
      sprite.alt = "";
      sprite.dataset.building = building.id;

      if (building.assistRequired) {
        sprite.classList.add("assist-building");
      }

      applyBoxStyle(sprite, building);
      game.elements.bodyLayerContent.appendChild(sprite);
    });

    body.colliders.forEach((collider) => {
      const barrier = document.createElement("div");
      barrier.className = "body-collider";
      barrier.dataset.collider = collider.id;

      if (collider.assistRequired) {
        barrier.classList.add("assist-barrier");
        barrier.dataset.label = "Needs help";
      }

      applyBoxStyle(barrier, collider);
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
      element.style.setProperty(
        "--character-sprite",
        `url("${figure.sprite || getRandomFigureSprite()}")`
      );

      if (figure.sprite) {
        element.classList.add("fixed-character-sprite");
      }

      element.setAttribute("aria-label", `Speak to ${figure.label}`);
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        handleFigureClick(figure);
      });
      game.elements.bodyLayerContent.appendChild(element);
    });
  }

  function refreshLayout() {
    const game = window.SignalSelf;

    if (game.state.activeReality !== "body" || !game.elements.bodyLayerContent.children.length) {
      return;
    }

    const layoutBoxes = getLayoutBoxes();
    syncColliders(layoutBoxes);

    layoutBoxes.forEach((box) => {
      const sprite = game.elements.bodyLayerContent.querySelector(
        `.body-building-sprite[data-building="${box.id}"]`
      );
      const collider = game.elements.bodyLayerContent.querySelector(
        `.body-collider[data-collider="${box.id}"]`
      );

      if (sprite) {
        applyBoxStyle(sprite, box);
      }

      if (collider) {
        applyBoxStyle(collider, box);
      }
    });
  }

  function wouldCollide(x, y) {
    const game = window.SignalSelf;

    if (game.state.activeReality !== "body") {
      return false;
    }

    return body.colliders.some((collider) => {
      if (collider.assistRequired && body.assistBarrierOpen) {
        return false;
      }

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

      const hit =
        playerBox.left < colliderBox.right &&
        playerBox.right > colliderBox.left &&
        playerBox.top < colliderBox.bottom &&
        playerBox.bottom > colliderBox.top;

      if (hit) {
        body.lastBlockedColliderId = collider.id;
      }

      return hit;
    });
  }

  function getCollisionMessage() {
    if (body.lastBlockedColliderId === "center-spine" && !body.assistBarrierOpen) {
      return "This barrier needs more than one body. Someone nearby might remember owing you help.";
    }

    return "Your body refuses the path. Some obstructions need another person's weight.";
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

  function afterDialogue(figureId) {
    const game = window.SignalSelf;

    if (
      figureId !== body.assistFigureId ||
      body.assistBarrierOpen ||
      !game.state.shinjiHelpAccepted
    ) {
      return;
    }

    body.assistBarrierOpen = true;
    body.lastBlockedColliderId = null;

    document
      .querySelectorAll(".body-collider.assist-barrier")
      .forEach((element) => element.classList.add("open"));
    document
      .querySelectorAll(".body-building-sprite.assist-building")
      .forEach((element) => element.classList.add("open"));

    game.elements.systemMessage.textContent =
      "Shinji braces against the barrier with you. Two bodies move what one body could not.";
    game.systems.movement.freeze(900);
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
    refreshLayout,
    wouldCollide,
    getCollisionMessage,
    updateNearbyFigure,
    getNearbyFigure,
    afterDialogue,
    checkComplete,
  };
})();
