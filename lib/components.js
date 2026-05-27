"use client";
import React, { useState, useEffect, useRef } from "react";
import { CATEGORIES, totalOf, fmt, fmtScore, geocode } from "./data";
import { S, serif } from "./styles";

export function ScoreBadge({ score, small, large }) {
  const size = large ? 72 : small ? 40 : 52;
  const font = large ? 26 : small ? 15 : 19;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      border: "1px solid #5C4326", color: "#3A2C18", fontWeight: 500, fontSize: font,
      fontFamily: serif, background: "#F4ECD8",
    }}>
      {fmt(score)}
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label style={S.field}>
      <span style={S.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

export function Empty({ msg }) {
  return (
    <div style={S.empty}>
      <div style={S.emptyMark}>{"\u2014"}</div>
      <p style={S.emptyText}>{msg}</p>
    </div>
  );
}

export function RestaurantMap({ restaurants, onPick }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    function init(L) {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const withCoords = restaurants.filter(
        (r) => typeof r.lat === "number" && typeof r.lng === "number"
      );
      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
      });
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "\u00a9 OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      if (withCoords.length) {
        const markers = withCoords.map((r) => {
          const m = L.marker([r.lat, r.lng]).addTo(map);
          m.bindTooltip(r.name, { permanent: false });
          m.on("click", () => onPick && onPick(r));
          return m;
        });
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.3));
        if (withCoords.length === 1) map.setZoom(13);
      } else {
        map.setView([20, 0], 1);
      }
    }

    if (typeof window !== "undefined") {
      if (window.L) {
        init(window.L);
      } else {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => init(window.L);
        document.body.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [restaurants, onPick]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%", height: 280, border: "1px solid #5C4326",
        background: "#F4ECD8",
      }}
    />
  );
}

function ScoreRow({ label, value, onSet }) {
  const isNA = value === null;
  return (
    <div style={S.scoreRow}>
      <div style={S.scoreRowHead}>
        <span style={S.scoreRowLabel}>{label}</span>
        <button type="button" onClick={() => onSet(isNA ? undefined : null)}
          style={{ ...S.naBtn, ...(isNA ? S.naBtnActive : {}) }}>n/a</button>
      </div>
      <div style={S.numRow}>
        {[1,2,3,4,5,6,7,8,9,10].map((n) => {
          const active = value === n;
          return (
            <button key={n} type="button" onClick={() => onSet(n)}
              style={{ ...S.numBtn, ...(active ? S.numBtnActive : {}), ...(isNA ? S.numBtnDim : {}) }}>
              {n}
            </button>
          );
        })}
      </div>
      <div style={{ ...S.numRow, marginTop: 4 }}>
        {[1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5].map((n) => {
          const active = value === n;
          return (
            <button key={n} type="button" onClick={() => onSet(n)}
              style={{ ...S.numBtnHalf, ...(active ? S.numBtnActive : {}), ...(isNA ? S.numBtnDim : {}) }}>
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function EntryFormModal({ existing, onClose, onSaved }) {
  const editing = !!existing;
  const [name, setName] = useState(existing?.name || "");
  const [city, setCity] = useState(existing?.city || "");
  const [cuisine, setCuisine] = useState(existing?.cuisine || "");
  const [date, setDate] = useState(
    existing?.visit_date || new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState(existing?.notes || "");
  const [scores, setScores] = useState(existing?.scores || {});
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [lat, setLat] = useState(
    typeof existing?.lat === "number" ? existing.lat : null
  );
  const [lng, setLng] = useState(
    typeof existing?.lng === "number" ? existing.lng : null
  );
  const [geoStatus, setGeoStatus] = useState("");
  const [geoBusy, setGeoBusy] = useState(false);

  const valid = name.trim() && city.trim() && password;
  const previewTotal = totalOf(scores);
  const hasPin = typeof lat === "number" && typeof lng === "number";

  async function findLocation() {
    setGeoBusy(true);
    setGeoStatus("");
    const query = [name, city].filter(Boolean).join(", ");
    const result = await geocode(query);
    if (result) {
      setLat(result.lat);
      setLng(result.lng);
      setGeoStatus("Location found and pinned.");
    } else {
      const cityResult = await geocode(city);
      if (cityResult) {
        setLat(cityResult.lat);
        setLng(cityResult.lng);
        setGeoStatus("Pinned to the city (couldn't find the exact spot).");
      } else {
        setGeoStatus("Couldn't find that location. Try a clearer name.");
      }
    }
    setGeoBusy(false);
  }

  async function save() {
    setBusy(true);
    setError("");
    const payload = {
      name, city, cuisine, visit_date: date, notes, scores, password,
      lat, lng,
    };
    const url = editing ? `/api/restaurants/${existing.id}` : "/api/restaurants";
    const method = editing ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong.");
        setBusy(false);
        return;
      }
      onSaved();
    } catch {
      setError("Could not reach the server. Check your connection.");
      setBusy(false);
    }
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={S.sheetHead}>
          <span style={S.sheetKicker}>{editing ? "Amend Entry" : "New Entry"}</span>
          <button onClick={onClose} style={S.iconBtn} aria-label="Close">{"\u2715"}</button>
        </div>
        <div style={S.sheetBody}>
          <Field label="The Establishment">
            <input style={S.input} value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Carbone" />
          </Field>
          <Field label="Location">
            <input style={S.input} value={city} onChange={(e) => setCity(e.target.value)}
              placeholder="London, UK" />
          </Field>

          <div style={S.geoRow}>
            <button type="button" onClick={findLocation}
              disabled={geoBusy || !city.trim()}
              style={{ ...S.geoBtn, opacity: geoBusy || !city.trim() ? 0.4 : 1 }}>
              {geoBusy ? "Searching\u2026" : hasPin ? "Re-find on map" : "Find on map"}
            </button>
            <span style={S.geoStatusText}>
              {geoStatus || (hasPin ? "Pinned." : "Not yet pinned.")}
            </span>
          </div>

          <div style={S.fieldRow}>
            <Field label="Cuisine">
              <input style={S.input} value={cuisine} onChange={(e) => setCuisine(e.target.value)}
                placeholder="Italian" />
            </Field>
            <Field label="Date">
              <input style={S.input} type="date" value={date}
                onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>

          <div style={S.scoreGroup}>
            <div style={S.scoreGroupHead}>
              <span style={S.scoreGroupTitle}>The Scoring</span>
              <span style={S.scoreGroupTotal}>Total {fmt(previewTotal)}</span>
            </div>
            <p style={S.scoreHint}>
              Tap a whole or half number. Tap {'\u201c'}n/a{'\u201d'} to exclude a category from the total.
            </p>
            {CATEGORIES.map((c) => (
              <ScoreRow key={c.key} label={c.label}
                value={scores[c.key]}
                onSet={(v) => setScores({ ...scores, [c.key]: v })} />
            ))}
          </div>

          <Field label="Notes">
            <textarea style={{ ...S.input, minHeight: 70, resize: "vertical" }} value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Standout dishes, the verdict..." />
          </Field>

          <Field label="Editor's Password">
            <input style={S.input} type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Required to save" />
          </Field>
          {error && <div style={S.errorText}>{error}</div>}
        </div>
        <div style={S.sheetFoot}>
          <button disabled={!valid || busy} onClick={save}
            style={{ ...S.saveBtn, opacity: valid && !busy ? 1 : 0.35 }}>
            {busy ? "Saving..." : editing ? "Save Amendments" : "Save Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DetailModal({ entry, onClose, onEdit, onDeleted }) {
  const [confirm, setConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function doDelete() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/restaurants/${entry.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Could not delete.");
        setBusy(false);
        return;
      }
      onDeleted();
    } catch {
      setError("Could not reach the server.");
      setBusy(false);
    }
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={S.sheetHead}>
          <button onClick={onClose} style={S.iconBtn} aria-label="Back">{"\u2039"}</button>
          <span style={S.sheetKicker}>The Record</span>
          <span style={{ width: 24 }} />
        </div>
        <div style={S.sheetBody}>
          <div style={S.detailHead}>
            <h2 style={S.detailName}>{entry.name}</h2>
            <p style={S.detailMeta}>
              {entry.city}{entry.cuisine ? ` \u2014 ${entry.cuisine}` : ""}
            </p>
          </div>

          <div style={S.detailScoreRow}>
            <ScoreBadge score={totalOf(entry.scores)} large />
            <span style={S.detailScoreCaption}>Total<br/>Standing</span>
          </div>

          <div style={S.detailRule} />

          <div style={S.detailScores}>
            {CATEGORIES.map((c) => {
              const v = entry.scores?.[c.key];
              return (
                <div key={c.key} style={S.detailCatRow}>
                  <span style={S.detailCatLabel}>{c.label}</span>
                  <span style={S.detailCatDots} />
                  <span style={{ ...S.detailCatVal,
                    color: typeof v === "number" ? "#3A2C18" : "#A8987C" }}>
                    {fmtScore(v)}
                  </span>
                </div>
              );
            })}
          </div>

          {entry.notes && <blockquote style={S.notesBox}>{entry.notes}</blockquote>}

          <div style={{ ...S.editRow, marginTop: 20 }}>
            <button style={S.editBtn} onClick={() => onEdit(entry)}>Amend</button>
            <button style={S.editBtn} onClick={() => setConfirm(true)}>Strike</button>
          </div>

          {confirm && (
            <div style={S.confirmBox}>
              <span>Strike this entry from the record? Enter the password to confirm.</span>
              <input style={S.input} type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="Editor's password" />
              {error && <div style={S.errorText}>{error}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setConfirm(false)} style={S.confirmCancel}>Keep</button>
                <button onClick={doDelete} disabled={!password || busy}
                  style={{ ...S.confirmDelete, opacity: password && !busy ? 1 : 0.4 }}>
                  {busy ? "..." : "Strike"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
