"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const TITLE = "TWO COVERS";
const TAGLINE = "A restaurant journal for two.";
const FOOTER = "A.E.B. \u00b7 R.E.P.";
const CONFIRM = "THANK YOU.";

const C = {
  paper: "#FBF6EA",
  ink: "#3A2C18",
  inkSoft: "#6E5C42",
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
function delayForConfirm(i, ch) {
  if (i === 0) return 500;
  if (ch === " ") return 400;
  if (ch === ".") return 350;
  return 280 + Math.round((i % 3) * 25);
}

export default function Landing() {
  const router = useRouter();
  const [titleChars, setTitleChars] = useState([]);
  const [titleCaretGone, setTitleCaretGone] = useState(false);
  const [taglineChars, setTaglineChars] = useState([]);
  const [taglineCaretVisible, setTaglineCaretVisible] = useState(false);
  const [taglineCaretGone, setTaglineCaretGone] = useState(false);
  const [formOn, setFormOn] = useState(false);
  const [footerOn, setFooterOn] = useState(false);
  const [falling, setFalling] = useState(false);
  const [confirmChars, setConfirmChars] = useState([]);
  const [confirmCaretVisible, setConfirmCaretVisible] = useState(false);
  const [confirmCaretGone, setConfirmCaretGone] = useState(false);

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

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
    timeouts.push(setTimeout(() => setTitleCaretGone(true), titleDoneAt + 700));
    timeouts.push(setTimeout(() => setTaglineCaretVisible(true), titleDoneAt + 1100));

    const TAGLINE_PER = 55;
    const TAGLINE_PUNCT = 220;
    let tcum = titleDoneAt + 1400;
    for (let i = 0; i < TAGLINE.length; i++) {
      const ch = TAGLINE[i];
      const isPunct = ch === "." || ch === ",";
      tcum += TAGLINE_PER + (isPunct ? TAGLINE_PUNCT : 0);
      const at = tcum;
      const idx = i;
      timeouts.push(setTimeout(() => {
        setTaglineChars((prev) => [...prev, { ch: TAGLINE[idx], i: idx }]);
      }, at));
    }
    const taglineDoneAt = tcum;
    timeouts.push(setTimeout(() => setTaglineCaretGone(true), taglineDoneAt + 600));
    timeouts.push(setTimeout(() => setFormOn(true), taglineDoneAt + 1000));
    timeouts.push(setTimeout(() => setFooterOn(true), taglineDoneAt + 1300));

    return () => timeouts.forEach(clearTimeout);
  }, []);

  function onDoorClick() {
    router.push("/private");
  }

  async function submit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});

    setFalling(true);
    setTimeout(() => {
      setConfirmCaretVisible(true);
      let ccum = 0;
      for (let i = 0; i < CONFIRM.length; i++) {
        ccum += delayForConfirm(i, CONFIRM[i]);
        const at = ccum;
        const idx = i;
        setTimeout(() => {
          setConfirmChars((prev) => [...prev, { ch: CONFIRM[idx], i: idx }]);
        }, at);
      }
      setTimeout(() => setConfirmCaretGone(true), ccum + 1200);
    }, 2200);
  }

  function fallStyle(seed) {
    if (!falling) return {};
    const r = mulberry32(seed);
    const delay = r() * 600;
    const rotate = (r() - 0.5) * 60;
    const tx = (r() - 0.5) * 60;
    const distance = (typeof window !== "undefined" ? window.innerHeight : 800) + 100;
    return {
      transform: `translate(${tx}px, ${distance}px) rotate(${rotate}deg)`,
      opacity: 0,
      transition: `transform 1.6s cubic-bezier(0.55,0,0.7,0.6) ${delay}ms, opacity 1.6s ease-in ${delay}ms`,
    };
  }

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      <div style={{ ...S.center, opacity: falling ? 0 : 1, transition: "opacity 1.4s ease-out 1.6s" }}>
        <div style={S.brand}>
          {titleChars.map(({ ch, i }) => {
            const isDoor = i === 5;
            const base = {
              ...S.charBase,
              ...(ch === " " ? S.charSpace : {}),
              ...fallStyle(i + 1),
            };
            if (isDoor) {
              return (
                <span key={i} onClick={onDoorClick} style={base}
                  className="door" role="link" aria-label="Private entrance">
                  {ch === " " ? "\u00a0" : ch}
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

        <div style={S.lower}>
          <p style={{ ...S.tagline, minHeight: "1.3em" }}>
            {taglineChars.map(({ ch, i }) => (
              <span key={i} style={{
                ...S.charBase,
                ...(ch === " " ? S.charSpaceSmall : {}),
                ...fallStyle(100 + i),
              }}>
                {ch === " " ? "\u00a0" : ch}
              </span>
            ))}
            {taglineCaretVisible && !taglineCaretGone &&
              <span style={S.caretSmall} className="caret" />}
          </p>

          <div style={{
            ...S.form,
            opacity: formOn ? 1 : 0,
            transform: formOn ? "translateY(0)" : "translateY(8px)",
          }}>
            {!falling ? (
              <form onSubmit={submit} style={{ display: "flex", gap: 10, width: "100%" }}>
                <input type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your email" style={S.input}
                  aria-label="Email address" required />
                <button type="submit" style={S.btn}>Join</button>
              </form>
            ) : (
              <div style={{ display: "flex", gap: 10, width: "100%" }}>
                <input type="email" value={email} readOnly
                  style={{ ...S.input, ...fallStyle(900) }} />
                <button type="button" style={{ ...S.btn, ...fallStyle(901) }}>Join</button>
              </div>
            )}
          </div>
          {error && <p style={S.errorText}>{error}</p>}
        </div>
      </div>

      <footer style={{ ...S.footer, opacity: footerOn ? 1 : 0 }}>
        {FOOTER.split("").map((ch, i) => (
          <span key={i} style={{
            ...S.charBase,
            ...(ch === " " ? S.charSpaceSmall : {}),
            ...fallStyle(500 + i),
          }}>
            {ch === " " ? "\u00a0" : ch}
          </span>
        ))}
      </footer>

      {falling && (
        <div style={S.confirmCenter}>
          <div style={S.confirmText}>
            {confirmChars.map(({ ch, i }) => (
              <span key={i} style={{
                ...S.charBase,
                ...(ch === " " ? S.charSpace : {}),
              }}>
                {ch === " " ? "\u00a0" : ch}
              </span>
            ))}
            {confirmCaretVisible && !confirmCaretGone &&
              <span style={S.caret} className="caret" />}
          </div>
        </div>
      )}
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
.door { cursor: pointer; transition: color 0.15s ease-out, transform 0.15s ease-out; }
.door:active { color: #A8743C; transform: scale(1.08); }
`;

const S = {
  page: { minHeight: "100vh", background: C.paper, color: C.ink,
    fontFamily: "'Jost', system-ui, sans-serif", display: "flex",
    flexDirection: "column", padding: "32px 24px 24px",
    position: "relative", overflow: "hidden" },
  center: { flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    textAlign: "center", gap: "6vh" },
  brand: { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600,
    fontSize: "clamp(28px, 7vw, 44px)", letterSpacing: "0.35em",
    color: C.ink, minHeight: "1.2em", display: "inline-flex",
    alignItems: "baseline", justifyContent: "center", fontStyle: "normal" },
  charBase: { display: "inline-block" },
  charSpace: { width: "0.35em" },
  charSpaceSmall: { width: "0.25em" },
  caret: { display: "inline-block", width: 2, height: "0.95em",
    background: C.ink, verticalAlign: "-0.08em", marginLeft: 4 },
  caretSmall: { display: "inline-block", width: 2, height: "0.9em",
    background: C.ink, verticalAlign: "-0.05em", marginLeft: 3 },
  lower: { maxWidth: 420, width: "100%" },
  tagline: { fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic",
    fontWeight: 400, fontSize: "clamp(17px, 4.2vw, 22px)", color: C.ink,
    margin: "0 0 28px", lineHeight: 1.3, display: "inline-block" },
  form: { display: "flex", gap: 10, alignItems: "stretch",
    maxWidth: 360, margin: "0 auto",
    transition: "opacity 1.2s ease-out, transform 1.2s ease-out" },
  input: { flex: 1, background: "transparent", border: "none",
    borderBottom: `1px solid ${C.ink}`, padding: "8px 4px",
    fontSize: 14, color: C.ink, fontFamily: "'Jost', sans-serif",
    textAlign: "center", minWidth: 0 },
  btn: { background: "none", border: `1px solid ${C.ink}`, color: C.ink,
    padding: "6px 16px", fontFamily: "'Fraunces', serif", fontStyle: "italic",
    fontSize: 14, cursor: "pointer", flexShrink: 0 },
  errorText: { fontFamily: "'Fraunces', serif", fontStyle: "italic",
    fontSize: 12.5, color: "#A5443A", marginTop: 10 },
  footer: { textAlign: "center", fontFamily: "'Fraunces', serif",
    fontStyle: "italic", fontSize: 12, color: C.accent,
    letterSpacing: 1, paddingTop: 20, transition: "opacity 1.6s ease-out" },
  confirmCenter: { position: "absolute", inset: 0, display: "flex",
    alignItems: "center", justifyContent: "center", pointerEvents: "none" },
  confirmText: { fontFamily: "'Fraunces', Georgia, serif", fontStyle: "normal",
    fontWeight: 600, fontSize: "clamp(22px, 5vw, 30px)", color: C.ink,
    letterSpacing: "0.35em", textTransform: "uppercase",
    fontVariationSettings: '"ital" 0, "wght" 600' },
};

function mulberry32(seed) {
  let t = seed;
  return function () {
    t |= 0; t = (t + 0x6D2B79F5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
