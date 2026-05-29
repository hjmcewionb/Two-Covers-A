"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TITLE = "NARP NOTES";

const C = {
  paper: "#FBF6EA",
  ink: "#3A2C18",
  accent: "#5C4326",
  highlight: "#A8743C",
};

function delayForTitle(i, ch, prev) {
  if (i === 0) return 700;
  if (ch === " ") return 550;
  if (prev === " ") return 600;
  if (i === TITLE.length - 1) return 480;
  return 350 + Math.round((i % 3) * 30);
}

export default function Landing() {
  const router = useRouter();
  const [titleChars, setTitleChars] = useState([]);
  const [titleCaretGone, setTitleCaretGone] = useState(false);
  const [footerOn, setFooterOn] = useState(false);

  useEffect(() => {
    const timeouts = [];
    let cum = 0;
    for (let i = 0; i < TITLE.length; i++) {
      cum += delayForTitle(i, TITLE[i], i > 0 ? TITLE[i - 1] : "");
      const at = cum;
      const idx = i;
      timeouts.push(setTimeout(() => {
        setTitleChars((prev) => [...prev, { ch: TITLE[idx], i: idx }]);
      }, at));
    }
    const titleDoneAt = cum;
    timeouts.push(setTimeout(() => setTitleCaretGone(true), titleDoneAt + 1400));
    timeouts.push(setTimeout(() => setFooterOn(true), titleDoneAt + 1800));
    return () => timeouts.forEach(clearTimeout);
  }, []);

  function onDoorClick() {
    router.push("/private");
  }

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      <div style={S.center}>
        <div style={S.brand}>
          {titleChars.map(({ ch, i }) => {
            const isDoor = i === 2; // R of NARP
            const base = {
              ...S.charBase,
              ...(ch === " " ? S.charSpace : {}),
            };
            if (isDoor) {
              return (
                <span
                  key={i}
                  onClick={onDoorClick}
                  style={base}
                  className="door"
                  role="link"
                  aria-label="Enter"
                >
                  {ch}
                </span>
              );
            }
            return (
              <span key={i} style={base}>
                {ch === " " ? "\u00a0" : ch}
              </span>
            );
          })}
          {!titleCaretGone && <span style={S.caret} className="caret" />}
        </div>
      </div>

      <footer style={{ ...S.footer, opacity: footerOn ? 1 : 0 }}>
        AB&nbsp;&nbsp;RP
      </footer>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Jost:wght@300;400;500&display=swap');
* { box-sizing: border-box; }
html, body { background: #FBF6EA; margin: 0; padding: 0; overflow-x: hidden; }
input:focus { outline: none; }
@keyframes blink { 50% { opacity: 0; } }
.caret { animation: blink 0.7s steps(2) infinite; }
.door { cursor: pointer; transition: color 0.15s ease-out, transform 0.15s ease-out; display: inline-block; }
.door:active { color: #A8743C; transform: scale(1.08); }
`;

const S = {
  page: {
    minHeight: "100vh",
    background: C.paper,
    color: C.ink,
    fontFamily: "'Jost', system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
    padding: "32px 24px 24px",
    position: "relative",
    overflow: "hidden",
  },
  center: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  brand: {
    fontFamily: "'Fraunces', Georgia, serif",
    fontWeight: 600,
    fontSize: "clamp(28px, 7vw, 44px)",
    letterSpacing: "0.35em",
    color: C.ink,
    minHeight: "1.2em",
    display: "inline-flex",
    alignItems: "baseline",
    justifyContent: "center",
    fontStyle: "normal",
  },
  charBase: { display: "inline-block" },
  charSpace: { width: "0.35em" },
  caret: {
    display: "inline-block",
    width: 2,
    height: "0.95em",
    background: C.ink,
    verticalAlign: "-0.08em",
    marginLeft: 4,
  },
  footer: {
    textAlign: "center",
    fontFamily: "'Fraunces', serif",
    fontStyle: "italic",
    fontSize: 12,
    color: C.accent,
    letterSpacing: 1,
    paddingTop: 20,
    transition: "opacity 1.6s ease-out",
  },
};
