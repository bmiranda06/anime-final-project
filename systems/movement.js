(function () {
  window.SignalSelf = window.SignalSelf || {};
  window.SignalSelf.systems = window.SignalSelf.systems || {};

  function startGameLoop() {
    const game = window.SignalSelf;

    if (game.state.animationFrame) {
      return;
    }

    game.state.lastFrameTime = performance.now();
    game.state.animationFrame = window.requestAnimationFrame(update);
  }

  function stopGameLoop() {
    const game = window.SignalSelf;

    if (!game.state.animationFrame) {
      return;
    }

    window.cancelAnimationFrame(game.state.animationFrame);
    game.state.animationFrame = null;
  }

  function update(timestamp) {
    const game = window.SignalSelf;
    const deltaSeconds = Math.min((timestamp - game.state.lastFrameTime) / 1000, 0.05);
    game.state.lastFrameTime = timestamp;

    if (!isInteractionBlockingMovement()) {
      updateMovement(deltaSeconds);
    }

    game.layers.body.updateNearbyFigure();
    renderPlayer();

    game.state.animationFrame = window.requestAnimationFrame(update);
  }

  function isInteractionBlockingMovement() {
    const game = window.SignalSelf;

    return (
      performance.now() < game.state.movementFreezeUntil ||
      game.state.introActive ||
      game.state.identityChoiceActive ||
      game.state.virtualTransitionActive ||
      !game.elements.dialogueBox.classList.contains("hidden") ||
      !game.elements.matchingOverlay.classList.contains("hidden")
    );
  }

  function freeze(durationMs) {
    const game = window.SignalSelf;
    game.state.movementFreezeUntil = Math.max(
      game.state.movementFreezeUntil,
      performance.now() + durationMs
    );
  }

  function updateMovement(deltaSeconds) {
    moveTowardClickTarget(deltaSeconds);
  }

  function moveTowardClickTarget(deltaSeconds) {
    const game = window.SignalSelf;
    const dx = game.state.player.targetX - game.state.player.x;
    const dy = game.state.player.targetY - game.state.player.y;
    const distance = Math.hypot(dx, dy);

    if (distance < 0.4) {
      game.elements.clickTarget.classList.remove("active");
      return;
    }

    const step = game.state.player.speed * deltaSeconds;
    const moved = attemptPlayerMove(
      (dx / distance) * Math.min(step, distance),
      (dy / distance) * Math.min(step, distance)
    );

    if (!moved) {
      game.elements.clickTarget.classList.remove("active");
      game.elements.systemMessage.textContent =
        "Your body refuses the path. The obstruction is not symbolic in this layer.";
    }
  }

  function attemptPlayerMove(deltaX, deltaY) {
    const game = window.SignalSelf;
    const nextX = clamp(game.state.player.x + deltaX, 3, 97);
    const nextY = clamp(game.state.player.y + deltaY, 5, 95);
    let moved = false;

    if (!game.layers.body.wouldCollide(nextX, game.state.player.y)) {
      game.state.player.x = nextX;
      moved = moved || Math.abs(deltaX) > 0;
    }

    if (!game.layers.body.wouldCollide(game.state.player.x, nextY)) {
      game.state.player.y = nextY;
      moved = moved || Math.abs(deltaY) > 0;
    }

    return moved;
  }

  function renderPlayer() {
    const game = window.SignalSelf;
    game.elements.player.style.left = `${game.state.player.x}%`;
    game.elements.player.style.top = `${game.state.player.y}%`;
  }

  function setClickTarget(event) {
    const game = window.SignalSelf;

    if (isInteractionBlockingMovement()) {
      return;
    }

    const rect = game.elements.world.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    game.state.player.targetX = clamp(x, 3, 97);
    game.state.player.targetY = clamp(y, 5, 95);

    game.elements.clickTarget.style.left = `${game.state.player.targetX}%`;
    game.elements.clickTarget.style.top = `${game.state.player.targetY}%`;
    game.elements.clickTarget.classList.add("active");
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  window.SignalSelf.systems.movement = {
    startGameLoop,
    stopGameLoop,
    freeze,
    isInteractionBlockingMovement,
    renderPlayer,
    setClickTarget,
    clamp,
  };
})();
