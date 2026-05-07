(function () {
  window.SignalSelf = window.SignalSelf || {};
  window.SignalSelf.systems = window.SignalSelf.systems || {};

  let activeTimer = null;

  function write(options) {
    const target = options.target;
    const button = options.button || null;
    const text = options.text || "";
    const speed = options.speed || 42;
    let index = 0;

    stop();
    target.textContent = "";

    if (button) {
      button.classList.add("hidden");
      button.disabled = true;
    }

    activeTimer = window.setInterval(() => {
      target.textContent += text[index];
      if (options.onCharacter) {
        options.onCharacter(text[index], index);
      }
      index += 1;

      if (index >= text.length) {
        stop();

        if (button) {
          button.disabled = false;
          button.classList.remove("hidden");
          button.focus();
        }

        if (options.onComplete) {
          options.onComplete();
        }
      }
    }, speed);
  }

  function stop() {
    if (!activeTimer) {
      return;
    }

    window.clearInterval(activeTimer);
    activeTimer = null;
  }

  window.SignalSelf.systems.typewriter = {
    write,
    stop,
  };
})();
