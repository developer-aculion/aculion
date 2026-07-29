import React, { useState, useEffect, useRef } from "react";

const LANGUAGES = [
  { code: "EN", name: "English",  text: "AI Analytics Dashboard",       color: "#00D8FF" },
  { code: "HI", name: "Hindi",    text: "\u090f\u0906\u0908 \u090f\u0928\u093e\u0932\u093f\u091f\u093f\u0915\u094d\u0938 \u0921\u0948\u0936\u092c\u094b\u0930\u094d\u0921",         color: "#0099FF" },
  { code: "TA", name: "Tamil",    text: "AI \u0baa\u0b95\u0bc1\u0baa\u0bcd\u0baa\u0bbe\u0baf\u0bcd\u0bb5\u0bc1 \u0b9f\u0bbe\u0bb7\u0bcd\u0baa\u0bcb\u0bb0\u0bcd\u0b9f\u0bcd",     color: "#00D8FF" },
  { code: "ES", name: "Espa\u00f1ol",  text: "Panel de An\u00e1lisis IA",          color: "#00BFFF" },
  { code: "FR", name: "Fran\u00e7ais", text: "Tableau de Bord Analytique",    color: "#0099FF" },
  { code: "DE", name: "Deutsch",  text: "KI-Analyse-Dashboard",           color: "#00D8FF" },
  { code: "AR", name: "Arabic",   text: "\u0644\u0648\u062d\u0629 \u062a\u062d\u0644\u064a\u0644\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a",  color: "#00BFFF" },
  { code: "JA", name: "\u65e5\u672c\u8a9e",   text: "AI\u30c0\u30c3\u30b7\u30e5\u30dc\u30fc\u30c9",                color: "#0099FF" },
  { code: "ZH", name: "\u4e2d\u6587",     text: "AI\u6570\u636e\u5206\u6790\u4eea\u8868\u677f",               color: "#00D8FF" },
];

const FEATURES = [
  { icon: "fa-bolt",        label: "Real-Time Translation"    },
  { icon: "fa-table-cells", label: "Multi-Language Dashboard" },
  { icon: "fa-file-lines",  label: "Localized Reports"        },
  { icon: "fa-brain",       label: "AI Context Awareness"     },
  { icon: "fa-earth-asia",  label: "Global Accessibility"     },
];

const NODE_POSITIONS = [
  { top: "5%",  left: "40%" },
  { top: "16%", left: "74%" },
  { top: "42%", left: "86%" },
  { top: "70%", left: "74%" },
  { top: "80%", left: "40%" },
  { top: "70%", left: "6%"  },
  { top: "42%", left: "-4%" },
  { top: "16%", left: "6%"  },
  { top: "50%", left: "40%" },
];

export default function GlobalLanguageIntelligence({ isActive }) {
  const [activeLangIdx, setActiveLangIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;
    intervalRef.current = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setActiveLangIdx(prev => (prev + 1) % LANGUAGES.length);
        setFading(false);
      }, 350);
    }, 2200);
    return () => clearInterval(intervalRef.current);
  }, [isActive]);

  const activeLang = LANGUAGES[activeLangIdx];

  return (
    React.createElement("div", { className: "preview-panel " + (isActive ? "active" : "") },
      React.createElement("span", { className: "preview-panel-title" },
        React.createElement("i", { className: "fa-solid fa-earth-asia text-cyan" }),
        " Global Language Intelligence \u2014 AI Translation Engine"
      ),
      React.createElement("div", { className: "gli-container" },
        React.createElement("img", {
          src: "/src/assets/global_language_intelligence.png",
          alt: "Holographic globe with AI language translation network",
          className: "gli-bg-img"
        }),
        React.createElement("div", { className: "gli-bg-scrim" }),
        React.createElement("div", { className: "gli-globe-wrap" },
          React.createElement("div", { className: "gli-globe" },
            React.createElement("div", { className: "gli-globe-ring gli-ring-1" }),
            React.createElement("div", { className: "gli-globe-ring gli-ring-2" }),
            React.createElement("div", { className: "gli-globe-ring gli-ring-3" }),
            React.createElement("div", { className: "gli-globe-core" }),
            React.createElement("div", { className: "gli-globe-pulse" })
          ),
          LANGUAGES.map((lang, i) =>
            React.createElement("div", {
              key: lang.code,
              className: "gli-lang-node" + (activeLangIdx === i ? " active-node" : ""),
              style: { top: NODE_POSITIONS[i].top, left: NODE_POSITIONS[i].left, "--node-color": lang.color, animationDelay: (i * -0.55) + "s" },
              onClick: () => setActiveLangIdx(i)
            },
              React.createElement("span", { className: "gli-node-code" }, lang.code),
              React.createElement("span", { className: "gli-node-name" }, lang.name)
            )
          ),
          React.createElement("svg", { className: "gli-arcs", viewBox: "0 0 300 200", preserveAspectRatio: "none" },
            LANGUAGES.map((lang, i) => {
              const pos = NODE_POSITIONS[i];
              const x1 = parseFloat(pos.left) / 100 * 300;
              const y1 = parseFloat(pos.top) / 100 * 200;
              return React.createElement("line", {
                key: lang.code,
                x1: x1, y1: y1, x2: 150, y2: 100,
                stroke: activeLangIdx === i ? "#00D8FF" : "rgba(0,216,255,0.1)",
                strokeWidth: activeLangIdx === i ? 1.5 : 0.5,
                strokeDasharray: activeLangIdx === i ? "4 3" : "2 5",
                style: { transition: "stroke 0.4s ease, stroke-width 0.4s ease" }
              });
            })
          )
        ),
        React.createElement("div", { className: "gli-translate-strip" + (fading ? " fading" : "") },
          React.createElement("span", { className: "gli-translate-from" },
            React.createElement("span", { className: "gli-lang-badge", style: { background: "rgba(0,82,255,0.3)", borderColor: "#0052ff" } }, "EN"),
            " AI Analytics Dashboard"
          ),
          React.createElement("span", { className: "gli-arrow" },
            React.createElement("i", { className: "fa-solid fa-arrow-right-arrow-left" })
          ),
          React.createElement("span", { className: "gli-translate-to", style: { color: activeLang.color } },
            React.createElement("span", { className: "gli-lang-badge", style: { background: "rgba(0,216,255,0.15)", borderColor: activeLang.color } }, activeLang.code),
            " " + activeLang.text
          )
        ),
        React.createElement("div", { className: "gli-features-row" },
          FEATURES.map(feat =>
            React.createElement("div", { className: "gli-feature-pill", key: feat.label },
              React.createElement("i", { className: "fa-solid " + feat.icon }),
              React.createElement("span", null, feat.label)
            )
          )
        ),
        React.createElement("div", { className: "privacy-data-stream" },
          React.createElement("span", { className: "stream-dot" }),
          "AI Translation Engine Active \u2014 9 Languages \u2014 Zero Latency"
        )
      )
    )
  );
}
