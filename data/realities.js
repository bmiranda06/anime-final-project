(function () {
  window.SignalSelf = window.SignalSelf || {};

  window.SignalSelf.config = {
    realities: [
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
    ],
    bootMessages: [
      "Scanning identity fragments...",
      "Mapping alternate-reality channels...",
      "Calibrating movement interface...",
      "Loading Neon Underpass prototype...",
    ],
    relationshipSlots: [
      { id: "friend", label: "Friend" },
      { id: "partner", label: "Partner" },
      { id: "parent", label: "Parent" },
      { id: "child", label: "Child" },
      { id: "acquaintance", label: "Acquaintance" },
    ],
  };
})();
