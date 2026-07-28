(function (global) {
  "use strict";
  const match = (text, intents) => {
    const normal = global.VDMText.normalize(text);
    return (intents || []).map((intent) => {
      const examples = intent.examples || [];
      const exact = examples.some((x) => global.VDMText.normalize(x) === normal);
      const loose = examples.some((x) => global.VDMText.includesAll(text, x) || global.VDMText.includesAll(x, text));
      return { intent, score: exact ? 3 : loose ? 2 : 0 };
    }).sort((a,b) => b.score-a.score)[0];
  };
  global.VDMIntent = { match };
})(window);
