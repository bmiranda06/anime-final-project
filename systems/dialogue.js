(function () {
  window.SignalSelf = window.SignalSelf || {};
  window.SignalSelf.systems = window.SignalSelf.systems || {};

  function open(figureId) {
    const game = window.SignalSelf;
    const figure = game.layers.body.figures.find((item) => item.id === figureId);

    if (!figure) {
      return;
    }

    game.state.activeDialogueFigureId = figureId;
    game.state.dialogueLineIndex = 0;
    game.elements.dialogueCloseButton.classList.add("hidden");
    game.elements.dialogueBox.classList.remove("hidden");
    renderLine();
  }

  function renderLine() {
    const game = window.SignalSelf;
    const figure = game.layers.body.figures.find(
      (item) => item.id === game.state.activeDialogueFigureId
    );

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
    const figure = game.layers.body.figures.find(
      (item) => item.id === game.state.activeDialogueFigureId
    );

    if (!figure || game.state.dialogueLineIndex >= figure.lines.length - 1) {
      close();
      return;
    }

    game.state.dialogueLineIndex += 1;
    renderLine();
  }

  function close() {
    const game = window.SignalSelf;
    const finishedFigureId = game.state.activeDialogueFigureId;
    game.state.activeDialogueFigureId = null;
    game.state.dialogueLineIndex = 0;
    game.systems.typewriter.stop();
    game.elements.dialogueBox.classList.add("hidden");
    game.elements.dialogueCloseButton.classList.remove("hidden");
    game.systems.movement.freeze(500);
    game.elements.world.focus();

    if (finishedFigureId) {
      game.state.spokenFigureIds.add(finishedFigureId);
      game.layers.body.checkComplete();
    }
  }

  window.SignalSelf.systems.dialogue = {
    open,
    advance,
    close,
  };
})();
