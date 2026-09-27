/* @ds-bundle: {"format":4,"namespace":"Daybook","components":[{"name":"Logo"},{"name":"Icon"},{"name":"Button"},{"name":"RatingScale"},{"name":"Score"},{"name":"FlagToggle"},{"name":"Chip"},{"name":"TargetProgress"},{"name":"PracticeCard"},{"name":"EntryCard"},{"name":"LadderRung"},{"name":"BottomNav"},{"name":"EmptyState"},{"name":"NotificationCard"},{"name":"CrisisFooter"},{"name":"SyncStatus"}]} */
(function () {
  var React = window.React, h = React.createElement;
  var ICONS = {"practice-hierarchy": "<path d=\"M7 3v18M17 3v18M7 7.5h10M7 12h10M7 16.5h10\"/>", "practice-feelings": "<path d=\"M3.5 12.2V5.5a2 2 0 0 1 2-2h6.7l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-6.6 6.6a1.5 1.5 0 0 1-2.1 0z\"/><circle cx=\"8.2\" cy=\"8.2\" r=\"1.4\"/>", "practice-gratitude": "<path d=\"M8.6 20.3c-3.6-1.9-4.6-6.8-2.2-10.9s7.9-6.1 11.5-4.2 4.6 6.8 2.2 10.9-7.9 6.1-11.5 4.2z\"/><path d=\"M9.3 16.6c.9-3.6 3-6.3 6.6-8\"/>", "nav-today": "<rect x=\"4\" y=\"5\" width=\"16\" height=\"15\" rx=\"3\"/><path d=\"M8.5 3v4M15.5 3v4M4 10h16\"/><circle cx=\"12\" cy=\"15\" r=\"1.6\"/>", "nav-practices": "<rect x=\"4\" y=\"9\" width=\"16\" height=\"11\" rx=\"3\"/><path d=\"M6.5 5.8h11M9 2.8h6\"/>", "nav-sessions": "<path d=\"M4 6.5a2.5 2.5 0 0 1 2.5-2.5h7A2.5 2.5 0 0 1 16 6.5v4a2.5 2.5 0 0 1-2.5 2.5H9l-3.5 3v-3A2.5 2.5 0 0 1 4 10.5z\"/><path d=\"M19 9.5a1.5 1.5 0 0 1 1 1.4v4a2.5 2.5 0 0 1-2.5 2.6v3l-3.5-3h-3\"/>", "nav-history": "<path d=\"M3.8 12a8.2 8.2 0 1 0 2.6-6\"/><path d=\"M4 3.8v4.4h4.4\"/><path d=\"M12 7.5V12l3 2\"/>", "nav-settings": "<path d=\"M4 7h9M19 7h1M4 17h3M11 17h9\"/><circle cx=\"16\" cy=\"7\" r=\"2.5\"/><circle cx=\"9\" cy=\"17\" r=\"2.5\"/>", "flag": "<path d=\"M6 21V3.5\"/><path d=\"M6 4h11.5l-3.2 4.7 3.2 4.8H6z\"/>", "plus": "<path d=\"M12 5v14M5 12h14\"/>", "check": "<path d=\"M5 12.5l4.5 4.5L19 7.5\"/>", "chevron-right": "<path d=\"M9.5 5.5l6.5 6.5-6.5 6.5\"/>", "bell": "<path d=\"M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z\"/><path d=\"M10 20.5h4\"/>", "saved-local": "<rect x=\"7\" y=\"2.5\" width=\"10\" height=\"19\" rx=\"2.5\"/><path d=\"M9.5 12.5l2 2 3.5-4\"/>", "archive": "<rect x=\"3.5\" y=\"4\" width=\"17\" height=\"4.5\" rx=\"1.5\"/><path d=\"M5 8.5v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9M10 12.5h4\"/>", "phone": "<path d=\"M5 4.5h3.5l1.5 4-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5z\"/>", "close": "<path d=\"M6 6l12 12M18 6L6 18\"/>", "back": "<path d=\"M15 5l-7 7 7 7\"/>", "share": "<path d=\"M12 3v12M8 7l4-4 4 4M6 11H5v10h14V11h-1\"/>", "download": "<path d=\"M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14\"/>", "info": "<path d=\"M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM12 11v5M12 8h.01\"/>", "cloud": "<path d=\"M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z\"/>", "pause": "<path d=\"M8 5v14M16 5v14\"/>", "chevron-down": "<path d=\"M6 9l6 6 6-6\"/>"};
  var WORD = "M247.59992269037494 12.0Q183 12 133.20003865481252 -20.299961345187477Q83.40007730962505 -52.59992269037495 55.70003865481252 -112.39988403556242Q28.0 -172.1998453807499 28.0 -252.59992269037497Q28.0 -333.59992269037497 56.0 -391.09992269037497Q84.0 -448.59992269037497 133.5 -479.59992269037497Q183.0 -510.59992269037497 247.59992269037494 -510.59992269037497Q286.20023192887516 -510.59992269037497 329.50019327406267 -490.69984538074993Q372.8001546192501 -470.79976807112484 397.40007730962503 -429.1998453807499V-708.0H557.1990722844994V-194.59992269037494Q557.1990722844994 -155.8001546192501 560.6990722844994 -104.8001546192501Q564.1990722844994 -53.800154619250094 574.1990722844994 0.0H421.40007730962503L402.40007730962503 -63.0Q368.40007730962503 -22.400077309625047 327.1001159644376 -5.2000386548125235Q285.80015461925007 12.0 247.59992269037494 12.0ZM299.5995361422497 -111.39930421337456Q327.79976807112484 -111.39930421337456 351.69984538074993 -124.69945883262466Q375.59992269037497 -137.99961345187475 390.2999613451875 -168.59972941631233Q405.0 -199.1998453807499 405.0 -249.59992269037494Q405.0 -324.40007730962503 373.3998840355624 -356.1003092385002Q341.79976807112484 -387.80054116737534 299.5995361422497 -387.80054116737534Q256.39930421337453 -387.80054116737534 224.79918824893699 -353.30034789331273Q193.19907228449944 -318.8001546192501 193.19907228449944 -252.59992269037497Q193.19907228449944 -185.99961345187475 224.79918824893699 -148.69945883262466Q256.39930421337453 -111.39930421337456 299.5995361422497 -111.39930421337456Z M791.1998453807499 12.0Q741.8001546192501 12.0 702.2002319288752 -6.0Q662.6003092385001 -24.0 639.9002705836876 -56.79996134518748Q617.2002319288752 -89.59992269037495 617.2002319288752 -134.0Q617.2002319288752 -193.59992269037494 658.1003092385001 -230.4998067259374Q699.0003865481252 -267.3996907614998 773.9004638577503 -287.19965210668727Q848.8005411673753 -306.9996134518748 950.0003865481252 -312.79976807112484V-327.59992269037497Q950.0003865481252 -368.40007730962503 927.6003092385001 -385.6003092385002Q905.2002319288752 -402.80054116737534 865.599922690375 -402.80054116737534Q836.3996907614999 -402.80054116737534 813.1996521066874 -388.30054116737534Q789.9996134518748 -373.80054116737534 781.9996134518748 -346.80015461925007L646.8005411673753 -394.0Q671.4004638577503 -443.40007730962503 729.8003478933127 -477.0Q788.2002319288752 -510.59992269037497 874.1998453807499 -510.59992269037497Q983.3996907614999 -510.59992269037497 1043.3994974874372 -463.2999613451875Q1103.3993042133745 -416.0 1103.3993042133745 -308.3993042133746V-188.60069578662544Q1103.3993042133745 -154.8009277155006 1105.3993042133745 -118.70081175106301Q1107.3993042133745 -82.60069578662544 1111.3993042133745 -51.40046385775029Q1115.3993042133745 -20.200231928875144 1120.3993042133745 0.0H971.0003865481252L953.6003092385001 -59.40007730962505Q926.2002319288752 -19.200231928875144 884.3001546192501 -3.600115964437572Q842.400077309625 12.0 791.1998453807499 12.0ZM848.7997680711248 -96.19945883262466Q879.1998453807499 -96.19945883262466 902.0 -105.5995361422497Q924.8001546192502 -114.99961345187475 937.4002705836876 -138.59972941631233Q950.0003865481252 -162.1998453807499 950.0003865481252 -204.0V-218.6003092385002Q862.4008504058755 -213.20023192887516 823.099922690375 -195.50038654812525Q783.7989949748744 -177.80054116737534 783.7989949748744 -146.79976807112484Q783.7989949748744 -123.99961345187475 802.2991882489371 -110.0995361422497Q820.7993815229996 -96.19945883262466 848.7997680711248 -96.19945883262466Z M1210.4004638577503 162.0V46.000773096250484H1249.599922690375Q1279.599922690375 46.000773096250484 1296.9998067259376 43.20081175106301Q1314.3996907614999 40.40085040587553 1324.3996907614999 32.30073444143796Q1334.3996907614999 24.200618477000386 1340.1998453807498 8.800154619250097L1345.1998453807498 -3.599922690374952L1154 -496H1324.7989949748744L1418.7993815229997 -194.39891766524931L1510.7997680711248 -496.0H1682.198685736374L1490.3989176652494 -1.199845380749906Q1471.7989949748744 46.40007730962505 1453.999033629687 78.20003865481252Q1436.1990722844994 110.0 1413.3991109393119 128.5Q1390.5991495941244 147.0 1357.3993042133745 154.5Q1324.1994588326247 162.0 1275.7997680711248 162.0Z M2041.3993042133745 12.0Q2016.5991495941244 12.0 1987.8991109393119 3.799961345187476Q1959.1990722844994 -4.400077309625048 1933.6990722844994 -21.60011596443757Q1908.1990722844994 -38.800154619250094 1891.5991495941244 -66.40007730962505L1873.1990722844994 0.0H1731.8001546192502V-708.0H1891.5991495941244V-429.1998453807499Q1908.1990722844994 -457.19984538074993 1933.6990722844994 -474.8998840355624Q1959.1990722844994 -492.59992269037497 1987.8991109393119 -501.59992269037497Q2016.5991495941244 -510.59992269037497 2041.3993042133745 -510.59992269037497Q2106.5991495941244 -510.59992269037497 2156.0991495941244 -479.59992269037497Q2205.5991495941244 -448.59992269037497 2233.299188248937 -391.09992269037497Q2260.9992269037493 -333.59992269037497 2260.9992269037493 -252.59992269037497Q2260.9992269037493 -171.59992269037494 2233.299188248937 -112.09992269037494Q2205.5991495941244 -52.59992269037495 2156.0991495941244 -20.299961345187477Q2106.5991495941244 12.0 2041.3993042133745 12.0ZM1990.3996907614999 -111.39930421337456Q2032.599922690375 -111.39930421337456 2064.2000386548125 -148.69945883262466Q2095.80015461925 -185.99961345187475 2095.80015461925 -252.59992269037497Q2095.80015461925 -318.8001546192501 2064.2000386548125 -353.30034789331273Q2032.599922690375 -387.80054116737534 1990.3996907614999 -387.80054116737534Q1947.7993815229997 -387.80054116737534 1915.8993042133748 -355.80034789331273Q1883.9992269037496 -323.8001546192501 1883.9992269037496 -249.59992269037494Q1883.9992269037496 -199.1998453807499 1898.699265558562 -168.59972941631233Q1913.3993042133745 -137.99961345187475 1937.7993815229997 -124.69945883262466Q1962.1994588326247 -111.39930421337456 1990.3996907614999 -111.39930421337456Z M2570.3996907614996 12.0Q2518.3996907614996 12.0 2470.799768071125 -3.7999613451874765Q2423.19984538075 -19.599922690374953 2385.599922690375 -51.89988403556243Q2348.0 -84.1998453807499 2326.5 -133.6998453807499Q2305.0 -183.1998453807499 2305.0 -250.1998453807499Q2305.0 -317.59992269037497 2326.5 -366.59992269037497Q2348.0 -415.59992269037497 2385.599922690375 -447.59992269037497Q2423.19984538075 -479.59992269037497 2470.799768071125 -495.09992269037497Q2518.3996907614996 -510.59992269037497 2570.3996907614996 -510.59992269037497Q2622.9996134518747 -510.59992269037497 2670.299574797062 -495.09992269037497Q2717.5995361422497 -479.59992269037497 2755.1994588326247 -447.59992269037497Q2792.7993815229997 -415.59992269037497 2814.2993815229997 -366.59992269037497Q2835.7993815229997 -317.59992269037497 2835.7993815229997 -250.1998453807499Q2835.7993815229997 -183.1998453807499 2814.2993815229997 -133.6998453807499Q2792.7993815229997 -84.1998453807499 2755.1994588326247 -51.89988403556243Q2717.5995361422497 -19.599922690374953 2670.299574797062 -3.7999613451874765Q2622.9996134518747 12.0 2570.3996907614996 12.0ZM2570.3996907614996 -110.79938152299961Q2600.3996907614996 -110.79938152299961 2623.3998840355625 -125.49922690374953Q2646.400077309625 -140.19907228449944 2659.700231928875 -171.09914959412447Q2673.0003865481253 -201.9992269037495 2673.0003865481253 -250.1998453807499Q2673.0003865481253 -299.0003865481252 2659.4002705836874 -329.3005411673753Q2645.80015461925 -359.6006957866254 2622.7999613451875 -373.7006184770004Q2599.799768071125 -387.80054116737534 2570.3996907614996 -387.80054116737534Q2541.5995361422497 -387.80054116737534 2518.2993815229993 -373.7006184770004Q2494.9992269037493 -359.6006957866254 2481.399110939312 -329.3005411673753Q2467.7989949748744 -299.0003865481252 2467.7989949748744 -250.1998453807499Q2467.7989949748744 -201.9992269037495 2481.0991495941244 -171.09914959412447Q2494.3993042133748 -140.19907228449944 2517.6994588326247 -125.49922690374953Q2540.9996134518747 -110.79938152299961 2570.3996907614996 -110.79938152299961Z M3145.3996907614996 12.0Q3093.3996907614996 12.0 3045.799768071125 -3.7999613451874765Q2998.19984538075 -19.599922690374953 2960.599922690375 -51.89988403556243Q2923.0 -84.1998453807499 2901.5 -133.6998453807499Q2880.0 -183.1998453807499 2880.0 -250.1998453807499Q2880.0 -317.59992269037497 2901.5 -366.59992269037497Q2923.0 -415.59992269037497 2960.599922690375 -447.59992269037497Q2998.19984538075 -479.59992269037497 3045.799768071125 -495.09992269037497Q3093.3996907614996 -510.59992269037497 3145.3996907614996 -510.59992269037497Q3197.9996134518747 -510.59992269037497 3245.299574797062 -495.09992269037497Q3292.5995361422497 -479.59992269037497 3330.1994588326247 -447.59992269037497Q3367.7993815229997 -415.59992269037497 3389.2993815229997 -366.59992269037497Q3410.7993815229997 -317.59992269037497 3410.7993815229997 -250.1998453807499Q3410.7993815229997 -183.1998453807499 3389.2993815229997 -133.6998453807499Q3367.7993815229997 -84.1998453807499 3330.1994588326247 -51.89988403556243Q3292.5995361422497 -19.599922690374953 3245.299574797062 -3.7999613451874765Q3197.9996134518747 12.0 3145.3996907614996 12.0ZM3145.3996907614996 -110.79938152299961Q3175.3996907614996 -110.79938152299961 3198.3998840355625 -125.49922690374953Q3221.400077309625 -140.19907228449944 3234.700231928875 -171.09914959412447Q3248.0003865481253 -201.9992269037495 3248.0003865481253 -250.1998453807499Q3248.0003865481253 -299.0003865481252 3234.4002705836874 -329.3005411673753Q3220.80015461925 -359.6006957866254 3197.7999613451875 -373.7006184770004Q3174.799768071125 -387.80054116737534 3145.3996907614996 -387.80054116737534Q3116.5995361422497 -387.80054116737534 3093.2993815229993 -373.7006184770004Q3069.9992269037493 -359.6006957866254 3056.399110939312 -329.3005411673753Q3042.7989949748744 -299.0003865481252 3042.7989949748744 -250.1998453807499Q3042.7989949748744 -201.9992269037495 3056.0991495941244 -171.09914959412447Q3069.3993042133748 -140.19907228449944 3092.6994588326247 -125.49922690374953Q3115.9996134518747 -110.79938152299961 3145.3996907614996 -110.79938152299961Z M3478.80015461925 0.0V-708.0H3638.5991495941244V-312.19945883262466L3800.9996134518747 -496.0H3989.998453807499L3795.798608426749 -287.8001546192501L4003.798608426749 0.0H3814.799768071125L3689.9992269037493 -175.0007730962505L3638.5991495941244 -120.20061847700038V0.0Z";
  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(" "); }
  function diff(n) {
    if (n == null) return {};
    var s = { "--c": "var(--difficulty-" + n + ")" };
    if (n === 8) s["--on"] = "var(--ink-inverse)";
    return s;
  }

  function Icon(p) {
    var body = ICONS[p.name] || "";
    if (p.name === "flag" && p.filled) body = body.replace('<path d="M6 4h', '<path fill="var(--marigold)" d="M6 4h');
    return h("svg", { className: cx("db-icon", p.className), viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": p.label ? undefined : "true", role: p.label ? "img" : undefined, "aria-label": p.label, style: p.size ? { width: p.size, height: p.size } : undefined, dangerouslySetInnerHTML: { __html: body } });
  }

  function Mark(p) {
    var s = p.size || 40;
    return h("svg", { viewBox: "0 0 48 48", width: s, height: s, "aria-hidden": "true", dangerouslySetInnerHTML: { __html:
      '<rect x="7.5" y="5" width="33" height="38.5" rx="8" fill="var(--paper-raised)" stroke="var(--ink)" stroke-width="3"/>' +
      '<path d="M15.5 5.5v37.5" stroke="var(--ink)" stroke-width="3"/>' +
      '<path d="M28 3.5h7.5v17.5l-3.75-3.2L28 21z" fill="var(--apricot)" stroke="var(--ink)" stroke-width="2.25" stroke-linejoin="round"/>' +
      '<path d="M21 27.5h12.5M21 34h8" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>' } });
  }
  function Logo(p) {
    var s = p.size || 40, variant = p.variant || "lockup";
    if (variant === "mark") return h("span", { role: "img", "aria-label": "Daybook", style: { display: "inline-flex" } }, h(Mark, { size: s }));
    var wordEl = h("svg", { viewBox: "0 -820 4015 1100", height: s, width: s * 4015 / 1100, "aria-hidden": "true", dangerouslySetInnerHTML: { __html: '<path fill="var(--ink)" d="' + WORD + '"/>' } });
    if (variant === "word") return h("span", { role: "img", "aria-label": "Daybook", style: { display: "inline-flex" } }, wordEl);
    return h("span", { role: "img", "aria-label": "Daybook", style: { display: "inline-flex", alignItems: "center", gap: s * 0.12 } }, h(Mark, { size: s }), wordEl);
  }

  function Button(p) {
    var v = p.variant || "primary";
    return h("button", { type: p.type || "button", onClick: p.onClick, disabled: p.disabled, className: cx("db db-btn", "db-btn-" + v, p.block && "db-btn-block", p.size === "lg" && "db-btn-lg", p.className) },
      p.icon ? h(Icon, { name: p.icon }) : null, p.children);
  }

  function RatingScale(p) {
    var st = React.useState(p.defaultValue == null ? null : p.defaultValue);
    var controlled = p.value !== undefined;
    var val = controlled ? p.value : st[0];
    var max = p.max == null ? 8 : p.max;
    var id = React.useId ? React.useId() : "r";
    function pick(n) { if (!controlled) st[1](n); if (p.onChange) p.onChange(n); }
    function key(e) {
      var cur = val == null ? -1 : val;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); pick(Math.min(max, cur + 1)); }
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); pick(Math.max(0, cur - 1)); }
    }
    var cells = [];
    for (var i = 0; i <= max; i++) (function (n) {
      var on = val === n;
      cells.push(h("button", { key: n, type: "button", role: "radio", "aria-checked": on, "aria-label": n + " of " + max, tabIndex: (val == null ? n === 0 : on) ? 0 : -1, className: cx("db-rating-cell", on && "is-on"), style: diff(n), onClick: function () { pick(n); }, onKeyDown: key }, n));
    })(i);
    return h("div", { className: cx("db db-rating", p.className) },
      h("div", { className: "db-rating-head" },
        h("div", null, h("div", { className: "db-rating-label", id: id }, p.label || "Difficulty"), p.hint ? h("div", { className: "db-meta" }, p.hint) : null),
        p.showValue === false ? null : h("div", { className: cx("db-rating-value", val == null && "is-empty"), "aria-hidden": "true" }, val == null ? "–" : val)),
      h("div", { className: "db-rating-track", role: "radiogroup", "aria-labelledby": id }, cells),
      p.ends === false ? null : h("div", { className: "db-rating-ends" }, h("span", null, p.lowLabel || "0 · none"), h("span", null, p.highLabel || "8 · most intense")));
  }

  function Score(p) {
    return h("span", { className: cx("db-score", p.size === "sm" && "db-score-sm", p.ghost && "db-score-ghost"), style: diff(p.value), title: p.title }, p.value);
  }

  function FlagToggle(p) {
    var st = React.useState(!!p.defaultOn);
    var controlled = p.on !== undefined;
    var on = controlled ? p.on : st[0];
    return h("button", { type: "button", "aria-pressed": on, onClick: function () { if (!controlled) st[1](!on); if (p.onChange) p.onChange(!on); }, className: cx("db db-flag", on && "is-on", p.compact && "db-flag-compact", p.className), style: p.compact ? { position: "relative" } : undefined },
      h(Icon, { name: "flag", filled: on }),
      h("span", { className: "db-flag-text" }, on ? "Flagged for session" : "Bring to session"));
  }

  function Chip(p) {
    return h("button", { type: "button", "aria-pressed": !!p.selected, onClick: p.onClick, className: cx("db db-chip", p.selected && "is-on") }, p.icon ? h(Icon, { name: p.icon, size: 18 }) : null, p.children);
  }

  function TargetProgress(p) {
    var pips = [];
    for (var i = 0; i < p.of; i++) pips.push(h("span", { key: i, className: cx("db-target-pip", i < p.done && "is-on") }));
    var met = p.done >= p.of;
    return h("div", { className: cx("db db-target", met && "is-met") },
      h("span", { className: "db-target-pips", "aria-hidden": "true" }, pips),
      h("span", { className: "db-target-text" }, h("b", null, p.done + " of " + p.of), " " + (p.period || "this week")));
  }

  var TILE = { hierarchy: "practice-hierarchy", feelings: "practice-feelings", gratitude: "practice-gratitude" };
  function PracticeIcon(p) { return h("span", { className: cx("db-tile", "db-tile-" + p.type) }, h(Icon, { name: TILE[p.type] || "nav-practices" })); }

  function PracticeCard(p) {
    return h("button", { type: "button", onClick: p.onClick, className: cx("db db-card db-practice", p.className) },
      h(PracticeIcon, { type: p.type }),
      h("span", { className: "db-practice-body" },
        p.due ? h("span", { className: "db-due" }, p.due) : null,
        h("span", { className: "db-title" }, p.name),
        p.meta ? h("span", { className: "db-meta db-practice-meta" }, p.meta) : null,
        h("span", { className: "db-meta" }, p.lastLogged ? "Last logged " + p.lastLogged : "Not logged yet"),
        p.target ? h("span", { className: "db-practice-foot" }, h(TargetProgress, p.target)) : null),
      h(Icon, { name: "chevron-right", className: "db-meta" }));
  }

  function EntryCard(p) {
    var scores = [];
    function pair(key, label, value, ghost) { return h("span", { key: key, className: "db-entry-pair" }, h("span", { className: "db-rating-label" }, label), h(Score, { value: value, size: "sm", ghost: ghost })); }
    if (p.predicted != null) scores.push(pair("p", "Predicted", p.predicted, true));
    if (p.actual != null) scores.push(pair("a", "Actual", p.actual));
    if (p.remaining != null) scores.push(pair("r", "Remaining", p.remaining));
    if (p.intensity != null) scores.push(pair("i", "Intensity", p.intensity));
    return h("article", { className: cx("db db-card db-entry", p.className) },
      h("div", { className: "db-entry-top" },
        h(PracticeIcon, { type: p.type }),
        h("div", { className: "db-entry-body" },
          h("div", { className: "db-title" }, p.title),
          h("div", { className: "db-meta" }, p.time, p.attempt ? " · " : "", p.attempt ? h("span", { className: "db-attempt" }, "Attempt") : null)),
        h(FlagToggle, { compact: true, on: p.flagged, onChange: p.onFlag })),
      scores.length ? h("div", { className: "db-entry-scores" }, scores) : null,
      p.note ? h("div", { className: "db-entry-note" }, p.note) : null);
  }

  function Tally(p) {
    var marks = [];
    for (var i = 0; i < p.reps; i++) marks.push(h("i", { key: "r" + i }));
    for (var j = 0; j < (p.attempts || 0); j++) marks.push(h("i", { key: "a" + j, className: "is-attempt" }));
    var label = p.reps + (p.reps === 1 ? " rep" : " reps") + (p.attempts ? ", " + p.attempts + (p.attempts === 1 ? " attempt" : " attempts") : "");
    return h("span", { className: "db-tally", role: "img", "aria-label": label }, marks, h("span", { className: "db-tally-n" }, p.reps + (p.attempts ? " + " + p.attempts : "")));
  }

  function LadderRung(p) {
    var cur = p.remaining != null ? p.remaining : null;
    var done = p.done || (cur != null && cur < 4);
    var empty = cur == null;
    var when = done ? (p.completedOn ? "Done " + p.completedOn : "Done") : (p.targetDate ? "By " + p.targetDate : "");
    return h("button", { type: "button", onClick: p.onClick, className: cx("db db-rung", done && "is-done", empty && "is-empty"), style: { textAlign: "left", width: "100%", cursor: "pointer" } },
      h("span", { className: "db-rung-score", style: empty ? {} : diff(cur), "aria-label": empty ? "Not tried yet" : "Remaining difficulty " + cur }, empty ? "new" : cur),
      h("span", null,
        h("span", { className: "db-rung-name", style: { display: "block" } }, p.name),
        h("span", { className: "db-rung-row" },
          h("span", { className: "db-meta" }, "Predicted " + p.predicted + (when ? " · " + when : "")),
          h("span", { className: "db-rung-end" },
            (p.reps || p.attempts) ? h(Tally, { reps: p.reps || 0, attempts: p.attempts }) : h("span", { className: "db-meta" }, "Not tried yet"),
            p.right != null && p.right !== "" ? h("span", { className: "db-rung-right" }, p.right) : null))));
  }

  var NAV = [["today", "Today", "nav-today"], ["practices", "Practices", "nav-practices"], ["sessions", "Sessions", "nav-sessions"], ["history", "History", "nav-history"], ["settings", "Settings", "nav-settings"]];
  function BottomNav(p) {
    return h("nav", { className: "db db-nav", "aria-label": "Main" }, NAV.map(function (n) {
      var on = p.active === n[0];
      var badge = p.badges && p.badges[n[0]];
      return h("button", { key: n[0], type: "button", className: cx("db-nav-item", on && "is-on"), "aria-current": on ? "page" : undefined, onClick: function () { p.onNavigate && p.onNavigate(n[0]); } },
        h("span", { className: "db-nav-pill" }, h(Icon, { name: n[2] }), badge ? h("span", { className: "db-nav-badge", "aria-label": badge + " flagged" }, badge) : null),
        n[1]);
    }));
  }

  function EmptyState(p) {
    return h("div", { className: cx("db db-empty", p.className) },
      h("span", { className: "db-empty-mark" }, h(Icon, { name: p.icon || "plus" })),
      h("div", { className: "db-empty-title" }, p.title),
      p.body ? h("div", { className: "db-empty-body" }, p.body) : null,
      p.action ? h(Button, { variant: "primary", icon: "plus", onClick: p.onAction }, p.action) : null);
  }

  function NotificationCard(p) {
    return h("div", { className: "db db-notif" },
      h("span", { className: "db-notif-icon" }, h(Mark, { size: 30 })),
      h("div", { className: "db-notif-body" },
        h("div", { className: "db-notif-top" }, h("span", { className: "db-notif-app" }, "Daybook"), h("span", null, p.time || "now")),
        p.title ? h("div", { className: "db-notif-title" }, p.title) : null,
        h("div", { className: "db-notif-text" }, p.body),
        p.actions && p.actions.length ? h("div", { className: "db-notif-actions" }, p.actions.map(function (a, i) { return h("button", { key: i, type: "button", onClick: p.onAction ? function () { p.onAction(i); } : undefined }, a); })) : null));
  }

  function CrisisFooter() {
    return h("aside", { className: "db db-crisis" },
      h(Icon, { name: "phone" }),
      h("div", { className: "db-crisis-body" },
        h("p", { style: { margin: 0 } }, "This is a logbook, not emergency support. If you need someone now, these are free and open all hours:"),
        h("div", { className: "db-crisis-links" },
          h("a", { href: "tel:116123" }, "Samaritans 116 123"),
          h("a", { href: "sms:85258?body=SHOUT" }, "Text SHOUT to 85258"),
          h("a", { href: "tel:111" }, "NHS 111, mental health option"),
          h("a", { href: "tel:999" }, "999 if you're in danger"))));
  }

  function SyncStatus(p) {
    var synced = p.state === "synced";
    return h("span", { className: cx("db db-sync", synced && "is-synced"), role: "status" },
      h(Icon, { name: synced ? "check" : "saved-local" }),
      synced ? "Synced" : (p.count ? p.count + " saved on this phone, will sync" : "Saved on this phone, will sync"));
  }

  window.Daybook = Object.assign(window.Daybook || {}, { Logo: Logo, Icon: Icon, Button: Button, RatingScale: RatingScale, Score: Score, FlagToggle: FlagToggle, Chip: Chip, TargetProgress: TargetProgress, PracticeCard: PracticeCard, EntryCard: EntryCard, LadderRung: LadderRung, BottomNav: BottomNav, EmptyState: EmptyState, NotificationCard: NotificationCard, CrisisFooter: CrisisFooter, SyncStatus: SyncStatus, ICONS: ICONS });
})();
