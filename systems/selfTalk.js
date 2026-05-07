(function () {
  window.SignalSelf = window.SignalSelf || {};
  window.SignalSelf.systems = window.SignalSelf.systems || {};

  function say(text, onComplete) {
    const game = window.SignalSelf;
    game.state.selfTalkActive = true;
    game.elements.dialogueSpeaker.textContent = "You";
    game.elements.dialogueText.textContent = "";
    game.elements.dialogueNextButton.textContent = "Next";
    game.elements.dialogueNextButton.classList.add("hidden");
    game.elements.dialogueCloseButton.classList.add("hidden");
    game.elements.dialogueBox.classList.remove("hidden");

    game.systems.typewriter.write({
      text,
      target: game.elements.dialogueText,
      button: game.elements.dialogueNextButton,
      speed: 34,
      onComplete() {
        game.state.selfTalkReady = true;
      },
    });

    game.state.selfTalkOnComplete = onComplete || null;
  }

  function advance() {
    const game = window.SignalSelf;

    if (!game.state.selfTalkActive || !game.state.selfTalkReady) {
      return false;
    }

    close();
    return true;
  }

  function close() {
    const game = window.SignalSelf;
    const onComplete = game.state.selfTalkOnComplete;
    game.systems.typewriter.stop();
    game.state.selfTalkActive = false;
    game.state.selfTalkReady = false;
    game.state.selfTalkOnComplete = null;
    game.elements.dialogueBox.classList.add("hidden");
    game.elements.dialogueNextButton.classList.remove("hidden");
    game.elements.dialogueCloseButton.classList.remove("hidden");
    game.systems.movement.freeze(500);
    game.elements.world.focus();

    if (onComplete) {
      onComplete();
    }
  }

  window.SignalSelf.systems.selfTalk = {
    say,
    advance,
    close,
  };
})();
