(function () {
  window.SignalSelf = window.SignalSelf || {};
  window.SignalSelf.systems = window.SignalSelf.systems || {};

  function open() {
    const game = window.SignalSelf;
    game.state.matchingAssignments = new Map();
    game.state.matchAttempt = 0;
    game.systems.screenEffects.setCrackStage(0);
    game.elements.matchingOverlay.classList.remove("hidden");
    render();
  }

  function render() {
    const game = window.SignalSelf;
    game.elements.draggablePeople.innerHTML = "";
    game.elements.relationshipSlots.innerHTML = "";
    game.elements.matchingFeedback.textContent = `Attempt ${game.state.matchAttempt + 1} / 3`;
    game.elements.submitMatchesButton.disabled = true;

    game.layers.body.figures.forEach((figure) => {
      const card = document.createElement("div");
      card.className = "person-card";
      card.draggable = true;
      card.dataset.person = figure.id;
      card.textContent = figure.label;
      card.addEventListener("dragstart", handleDragStart);
      card.addEventListener("dragend", handleDragEnd);
      game.elements.draggablePeople.appendChild(card);
    });

    game.config.relationshipSlots.forEach((slot) => {
      const slotElement = document.createElement("div");
      slotElement.className = "relationship-slot";
      slotElement.dataset.slot = slot.id;
      slotElement.textContent = slot.label;
      slotElement.addEventListener("dragover", handleSlotDragOver);
      slotElement.addEventListener("dragleave", handleSlotDragLeave);
      slotElement.addEventListener("drop", handleSlotDrop);
      game.elements.relationshipSlots.appendChild(slotElement);
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
    const game = window.SignalSelf;
    event.preventDefault();
    const personId = event.dataTransfer.getData("text/plain");
    const slot = event.currentTarget;

    if (!personId) {
      return;
    }

    game.state.matchingAssignments.forEach((assignedPersonId, slotId) => {
      if (assignedPersonId === personId) {
        game.state.matchingAssignments.delete(slotId);
      }
    });

    game.state.matchingAssignments.set(slot.dataset.slot, personId);
    renderSlotAssignments();
  }

  function renderSlotAssignments() {
    const game = window.SignalSelf;

    document.querySelectorAll(".relationship-slot").forEach((slotElement) => {
      slotElement.classList.remove("over");
      slotElement.querySelector(".slot-card")?.remove();

      const assignedPersonId = game.state.matchingAssignments.get(slotElement.dataset.slot);

      if (!assignedPersonId) {
        return;
      }

      const card = document.createElement("span");
      card.className = "slot-card";
      card.textContent = getPersonLabel(assignedPersonId);
      slotElement.appendChild(card);
    });

    game.elements.submitMatchesButton.disabled =
      game.state.matchingAssignments.size !== game.config.relationshipSlots.length;
  }

  function getPersonLabel(personId) {
    const game = window.SignalSelf;
    const figure = game.layers.body.figures.find((item) => item.id === personId);
    return figure ? figure.label : "???";
  }

  function submit() {
    const game = window.SignalSelf;

    if (game.state.matchingAssignments.size !== game.config.relationshipSlots.length) {
      return;
    }

    game.state.matchAttempt += 1;
    game.systems.screenEffects.setCrackStage(game.state.matchAttempt);

    if (game.state.matchAttempt === 1) {
      game.elements.matchingFeedback.textContent =
        "Wrong. The screen cracks, but the body demands another arrangement.";
      resetAssignments();
      return;
    }

    if (game.state.matchAttempt === 2) {
      game.elements.matchingFeedback.textContent = "Wrong again. The fracture spreads. One more try.";
      resetAssignments();
      return;
    }

    game.systems.identityChoice.beginAfterBodyFailure();
  }

  function resetAssignments() {
    const game = window.SignalSelf;
    game.state.matchingAssignments = new Map();
    renderSlotAssignments();
    game.elements.submitMatchesButton.disabled = true;
  }

  window.SignalSelf.systems.matchingGame = {
    open,
    submit,
  };
})();
