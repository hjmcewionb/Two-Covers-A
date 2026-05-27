"use client";
import React, { useState, useEffect, useMemo } from "react";
import { CATEGORIES, totalOf, fmt, fmtScore, prettyDate } from "../lib/data";
import { S } from "../lib/styles";
import { ScoreBadge, Empty, EntryFormModal, DetailModal, RestaurantMap } from "../lib/components";

export default function Home() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("list");
  const [detail, setDetail] = useState(null);
  const [formMode, setFormMode] = useState(null);

  async function load() {
    try {
      const res = await fetch("/api/restaurants");
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch {
      setData([]);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const TABS = {
    list: "The Visits", ranks: "The Ranking", map: "The Places", trends: "The Findings",
  };

  function afterSave() {
    setFormMode(null);
    setDetail(null);
    setLoading(true);
    load();
  }

  return (
    <div style={S.app}>
      <header style={S.header}>
        <div style={S.mastRule} />
        <div style={S.masthead}>TWO COVERS</div>
        <div style={S.mastRule} />
        <div style={S.initials}>A.E.B. &nbsp;&middot;&nbsp; R.E.P.</div>
      </header>

      <main style={S.main}>
        <div style={S.pageTitleRow}>
          <div style={S.pageTitleLeft}>
            <h1 style={S.pageTitle}>{TABS[tab]}</h1>
          </div>
        </div>

        {loading ? (
          <div style={S.loading}>Setting the table&hellip;</div>
        ) : (
          <>
            {tab === "list" && <ListView data={data} onOpen={setDetail} />}
            {tab === "ranks" && <RankView data={data} onOpen={setDetail} />}
            {tab === "map" && <MapView data={data} onOpen={setDetail} />}
            {tab === "trends" && <TrendView data={data} />}
          </>
        )}
      </main>

      <nav style={S.nav}>
        {[
          { k: "list", label: "Visits" },
          { k: "ranks", label: "Ranking" },
          { k: "map", label: "Places" },
          { k: "trends", label: "Findings" },
        ].map(({ k, label }) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ ...S.navBtn, ...(tab === k ? S.navActive : {}) }}>
            <span style={{ ...S.navLabel,
              fontWeight: tab === k ? 500 : 400,
              fontFamily: tab === k ? "'Fraunces', serif" : undefined,
              fontStyle: tab === k ? "italic" : undefined,
              textTransform: tab === k ? "none" : "uppercase",
              fontSize: tab === k ? 13 : 9 }}>
              {label}
            </span>
          </button>
        ))}
      </nav>

      <button onClick={() => setFormMode("new")} style={S.fab} aria-label="Record a visit">
        <span style={{ fontSize: 26, lineHeight: 1 }}>+</span>
      </button>

      {formMode && (
        <EntryFormModal
          existing={formMode === "new" ? null : formMode}
          onClose={() => setFormMode(null)}
          onSaved={afterSave}
        />
      )}
      {detail && (
        <DetailModal
          entry={detail}
          onClose={() => setDetail(null)}
          onEdit={(e) => { setDetail(null); setFormMode(e); }}
          onDeleted={afterSave}
        />
      )}
    </div>
  );
}

function ListView({ data, onOpen }) {
  const sorted = [...data].sort((a, b) =>
    (b.visit_date || "").localeCompare(a.visit_date || ""));
  if (!data.length)
    return <Empty msg={"No visits recorded. Tap the + button to begin the ledger."} />;
  return (
    <div>
      <p style={S.lede}>
        {data.length} {data.length === 1 ? "establishment" : "establishments"} committed
        to record, most recent first.
      </p>
      {sorted.map((e, i) => (
        <button key={e.id} onClick={() => onOpen(e)} style={S.card} className="entry">
          <div style={S.cardTop}>
            <span style={S.cardNo}>{String(i + 1).padStart(2, "0")}</span>
            <span style={S.cardRule} />
            {e.visit_date && <span style={S.cardDate}>{prettyDate(e.visit_date)}</span>}
          </div>
          <div style={S.cardBody}>
            <div style={S.cardLeft}>
              <div style={S.cardName}>{e.name}</div>
              <div style={S.cardMeta}>
                {e.city}{e.cuisine ? ` \u2014 ${e.cuisine}` : ""}
              </div>
            </div>
            <ScoreBadge score={totalOf(e.scores)} />
          </div>
        </button>
      ))}
    </div>
  );
}

function RankView({ data, onOpen }) {
  if (!data.length)
    return <Empty msg="A ranking requires entries. None yet recorded." />;
  const ranked = [...data].sort((a, b) => totalOf(b.scores) - totalOf(a.scores));
  return (
    <div>
      <p style={S.lede}>Every establishment, ordered by total standing.</p>
      {ranked.map((e, i) => (
        <button key={e.id} onClick={() => onOpen(e)} style={S.rankRow} className="entry">
          <div style={S.rankNum}>{i + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.cardName}>{e.name}</div>
            <div style={S.cardMeta}>{e.city}</div>
          </div>
          <ScoreBadge score={totalOf(e.scores)} />
        </button>
      ))}
    </div>
  );
}

function MapView({ data, onOpen }) {
  const byCity = useMemo(() => {
    const m = {};
    data.forEach((e) => {
      const c = e.city || "Unknown";
      (m[c] = m[c] || []).push(e);
    });
    return Object.entries(m)
      .map(([city, items]) => [
        city,
        [...items].sort((a, b) => totalOf(b.scores) - totalOf(a.scores)),
      ])
      .sort((a, b) => b[1].length - a[1].length);
  }, [data]);

  if (!data.length)
    return <Empty msg="The places visited will gather here in time." />;

  const pinned = data.filter(
    (r) => typeof r.lat === "number" && typeof r.lng === "number"
  ).length;

  return (
    <div>
      <p style={S.lede}>
        {byCity.length} {byCity.length === 1 ? "city" : "cities"} on record.
        Tap a pin to open its record.
      </p>

      <div style={S.mapWrap}>
        <RestaurantMap restaurants={data} onPick={onOpen} />
        {pinned < data.length && (
          <p style={{ ...S.geoStatusText, marginTop: 8 }}>
            {data.length - pinned} establishment(s) not yet pinned {"\u2014"} amend an
            entry and tap {"\u201c"}Find on map{"\u201d"} to place it.
          </p>
        )}
      </div>

      {byCity.map(([city, items]) => {
        const cityAvg = items.reduce((a, e) => a + totalOf(e.scores), 0) / items.length;
        return (
          <div key={city} style={S.cityBlock}>
            <div style={S.cityHead}>
              <span style={S.cityName}>{city}</span>
              <span style={S.cityAvg}>{fmt(cityAvg)} &middot; {items.length}</span>
            </div>
            <div style={S.cityRule} />
            {items.map((e, i) => (
              <button key={e.id} onClick={() => onOpen(e)} style={S.cityItem} className="entry">
                <span style={S.cityItemLeft}>
                  <span style={S.cityItemRank}>{i + 1}</span>
                  <span style={S.cityItemName}>{e.name}</span>
                </span>
                <ScoreBadge score={totalOf(e.scores)} small />
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function TrendView({ data }) {
  if (!data.length)
    return <Empty msg="Findings emerge once the ledger holds entries." />;

  return (
    <div>
      <p style={S.lede}>The ledger, read closely.</p>
      <RecordsSection data={data} />
      <CategorySection data={data} />
      <ScatterSection data={data} />
      <TimeSection data={data} />
      <LeagueSection data={data} />
    </div>
  );
}

function RecordsSection({ data }) {
  const ranked = [...data].sort((a, b) => totalOf(b.scores) - totalOf(a.scores));
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];

  const catAvgs = CATEGORIES.map((c) => {
    const vals = data.map((e) => e.scores?.[c.key]).filter((v) => typeof v === "number");
    return { ...c, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
  }).filter((c) => c.avg > 0);
  const toughest = catAvgs.length
    ? catAvgs.reduce((a, b) => (b.avg < a.avg ? b : a)) : null;
  const kindest = catAvgs.length
    ? catAvgs.reduce((a, b) => (b.avg > a.avg ? b : a)) : null;

  const dated = [...data].filter((e) => e.visit_date)
    .sort((a, b) => b.visit_date.localeCompare(a.visit_date));
  const mostRecent = dated[0];

  const cards = [
    best && { label: "Highest Rated", value: best.name, sub: fmt(totalOf(best.scores)) },
    worst && data.length > 1 && { label: "Lowest Rated", value: worst.name, sub: fmt(totalOf(worst.scores)) },
    toughest && { label: "Toughest Category", value: toughest.label, sub: `${fmt(toughest.avg)} avg` },
    kindest && { label: "Most Generous", value: kindest.label, sub: `${fmt(kindest.avg)} avg` },
    mostRecent && { label: "Most Recent", value: mostRecent.name, sub: prettyDate(mostRecent.visit_date) },
    { label: "Establishments", value: String(data.length), sub: "on the ledger" },
  ].filter(Boolean);

  return (
    <section style={S.panel}>
      <h3 style={S.panelTitle}>The Records</h3>
      <div style={S.statGrid}>
        {cards.map((c, i) => (
          <div key={i} style={S.statCard}>
            <div style={S.statLabel}>{c.label}</div>
            <div style={S.statValue}>{c.value}</div>
            <div style={S.statSub}>{c.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategorySection({ data }) {
  const [selA, setSelA] = useState(data[0]?.id || "");
  const [selB, setSelB] = useState("");

  const entryA = data.find((e) => e.id === selA) || data[0];
  const entryB = data.find((e) => e.id === selB);

  const catAvgs = CATEGORIES.map((c) => {
    const vals = data.map((e) => e.scores?.[c.key]).filter((v) => typeof v === "number");
    return { ...c, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
  });

  return (
    <section style={S.panel}>
      <h3 style={S.panelTitle}>Category Shape</h3>
      <p style={S.subtleNote}>
        Each establishment{"\u2019"}s fingerprint across the six measures.
        Pick a second to overlay and compare.
      </p>

      <Radar entryA={entryA} entryB={entryB} />

      <div style={S.radarLegend}>
        <span style={{ ...S.radarKey, color: "#5C4326" }}>
          <span style={{ ...S.radarSwatch, background: "#5C4326" }} />
          {entryA?.name || "\u2014"}
        </span>
        {entryB && (
          <span style={{ ...S.radarKey, color: "#A8743C" }}>
            <span style={{ ...S.radarSwatch, background: "#A8743C" }} />
            {entryB.name}
          </span>
        )}
      </div>

      <div style={S.selectRow}>
        <Picker label="Establishment" value={selA} onChange={setSelA} data={data} />
        <Picker label="Compare with" value={selB} onChange={setSelB} data={data}
          allowNone />
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={S.subPanelTitle}>Average by category</div>
        {catAvgs.map((c) => (
          <div key={c.key} style={S.barRow}>
            <span style={S.barLabel}>{c.label}</span>
            <div style={S.barTrack}>
              <div style={{ ...S.barFill, width: `${c.avg * 10}%` }} />
            </div>
            <span style={S.barVal}>{fmt(c.avg)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Picker({ label, value, onChange, data, allowNone }) {
  return (
    <label style={S.pickerWrap}>
      <span style={S.pickerLabel}>{label}</span>
      <select style={S.pickerSelect} value={value}
        onChange={(e) => onChange(e.target.value)}>
        {allowNone && <option value="">{"\u2014 none \u2014"}</option>}
        {data.map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>
    </label>
  );
}

function Radar({ entryA, entryB }) {
  const size = 240, cx = size / 2, cy = size / 2, R = 82;
  const n = CATEGORIES.length;
  const pt = (i, radius) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
  };
  const rings = [0.25, 0.5, 0.75, 1];

  const shapeFor = (entry) => {
    if (!entry) return null;
    return CATEGORIES.map((c, i) => {
      const v = entry.scores?.[c.key];
      const r = typeof v === "number" ? (v / 10) * R : 0;
      return pt(i, r);
    });
  };
  const toPath = (pts) =>
    pts ? pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + "Z" : "";

  const shapeA = shapeFor(entryA);
  const shapeB = shapeFor(entryB);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }}>
      {rings.map((r, i) => (
        <polygon key={i}
          points={CATEGORIES.map((_, idx) => pt(idx, R * r).join(",")).join(" ")}
          fill="none" stroke="#D8C9A8" strokeWidth="1" />
      ))}
      {CATEGORIES.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#D8C9A8" strokeWidth="1" />;
      })}
      {CATEGORIES.map((c, i) => {
        const [x, y] = pt(i, R + 16);
        return (
          <text key={c.key} x={x} y={y} fontSize="9" fill="#6E5C42"
            textAnchor="middle" dominantBaseline="middle"
            fontFamily="'Jost', sans-serif" letterSpacing="0.5">
            {c.label.toUpperCase()}
          </text>
        );
      })}
      {shapeB && (
        <path d={toPath(shapeB)} fill="rgba(168,116,60,0.18)"
          stroke="#A8743C" strokeWidth="1.75" strokeLinejoin="round" />
      )}
      {shapeA && (
        <path d={toPath(shapeA)} fill="rgba(92,67,38,0.20)"
          stroke="#5C4326" strokeWidth="1.75" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function ScatterSection({ data }) {
  const [xCat, setXCat] = useState("food");
  const [yCat, setYCat] = useState("vibes");

  const pts = data
    .map((e) => ({
      name: e.name,
      x: e.scores?.[xCat],
      y: e.scores?.[yCat],
    }))
    .filter((p) => typeof p.x === "number" && typeof p.y === "number");

  const size = 260, pad = 32;
  const scale = (v) => pad + ((v - 0) / 10) * (size - 2 * pad);
  const yScale = (v) => size - pad - ((v - 0) / 10) * (size - 2 * pad);

  return (
    <section style={S.panel}>
      <h3 style={S.panelTitle}>Category Against Category</h3>
      <p style={S.subtleNote}>
        Each dot an establishment. See whether two measures move together.
      </p>

      <div style={S.selectRow}>
        <CatPicker label="Horizontal" value={xCat} onChange={setXCat} />
        <CatPicker label="Vertical" value={yCat} onChange={setYCat} />
      </div>

      {pts.length < 2 ? (
        <p style={{ ...S.subtleNote, marginTop: 14 }}>Two scored establishments are needed to plot.</p>
      ) : (
        <svg viewBox={`0 0 ${size} ${size}`}
          style={{ width: "100%", maxWidth: 320, display: "block", margin: "12px auto 0" }}>
          {[0, 2.5, 5, 7.5, 10].map((g) => (
            <g key={g}>
              <line x1={scale(g)} y1={pad} x2={scale(g)} y2={size - pad}
                stroke="#E4D8BD" strokeWidth="1" />
              <line x1={pad} y1={yScale(g)} x2={size - pad} y2={yScale(g)}
                stroke="#E4D8BD" strokeWidth="1" />
            </g>
          ))}
          <line x1={pad} y1={size - pad} x2={size - pad} y2={size - pad}
            stroke="#3A2C18" strokeWidth="1.5" />
          <line x1={pad} y1={pad} x2={pad} y2={size - pad}
            stroke="#3A2C18" strokeWidth="1.5" />
          {pts.map((p, i) => (
            <g key={i}>
              <circle cx={scale(p.x)} cy={yScale(p.y)} r="4.5"
                fill="#5C4326" />
              <text x={scale(p.x)} y={yScale(p.y) - 9} fontSize="8.5"
                fill="#6E5C42" textAnchor="middle" fontFamily="'Jost', sans-serif">
                {p.name}
              </text>
            </g>
          ))}
        </svg>
      )}
    </section>
  );
}

function CatPicker({ label, value, onChange }) {
  return (
    <label style={S.pickerWrap}>
      <span style={S.pickerLabel}>{label}</span>
      <select style={S.pickerSelect} value={value}
        onChange={(e) => onChange(e.target.value)}>
        {CATEGORIES.map((c) => (
          <option key={c.key} value={c.key}>{c.label}</option>
        ))}
      </select>
    </label>
  );
}

function TimeSection({ data }) {
  const dated = [...data].filter((e) => e.visit_date)
    .sort((a, b) => a.visit_date.localeCompare(b.visit_date));

  const byYear = {};
  dated.forEach((e) => {
    const y = e.visit_date.slice(0, 4);
    (byYear[y] = byYear[y] || []).push(totalOf(e.scores));
  });
  const years = Object.entries(byYear)
    .map(([y, arr]) => ({ y, avg: arr.reduce((a, b) => a + b, 0) / arr.length, n: arr.length }))
    .sort((a, b) => a.y.localeCompare(b.y));

  return (
    <section style={S.panel}>
      <h3 style={S.panelTitle}>Across Time</h3>
      {dated.length < 2 ? (
        <p style={S.subtleNote}>Two dated visits are needed to trace a line.</p>
      ) : (
        <TimeLine points={dated.map((e) => ({
          v: totalOf(e.scores), name: e.name,
        }))} />
      )}

      {years.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={S.subPanelTitle}>Average by year</div>
          {years.map((y) => (
            <div key={y.y} style={S.barRow}>
              <span style={S.barLabel}>{y.y}</span>
              <div style={S.barTrack}>
                <div style={{ ...S.barFill, width: `${y.avg * 10}%` }} />
              </div>
              <span style={S.barVal}>{fmt(y.avg)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TimeLine({ points }) {
  const w = 300, h = 110, pad = 14;
  const min = 0, max = 10;
  const x = (i) => pad + (i * (w - 2 * pad)) / (points.length - 1);
  const y = (v) => h - pad - ((v - min) / (max - min)) * (h - 2 * pad);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.v)}`).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto" }}>
        <path d={path} fill="none" stroke="#5C4326" strokeWidth="1.75"
          strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.v)} r="3"
            fill="#FBF6EA" stroke="#5C4326" strokeWidth="1.5" />
        ))}
      </svg>
      <div style={S.sparkLabels}>
        <span>{points[0].name}</span>
        <span>{points[points.length - 1].name}</span>
      </div>
    </div>
  );
}

function LeagueSection({ data }) {
  const leagueBy = (field) => {
    const m = {};
    data.forEach((e) => {
      const k = (e[field] || "").trim();
      if (!k) return;
      (m[k] = m[k] || []).push(totalOf(e.scores));
    });
    return Object.entries(m)
      .map(([k, arr]) => ({ k, avg: arr.reduce((a, b) => a + b, 0) / arr.length, n: arr.length }))
      .sort((a, b) => b.avg - a.avg);
  };
  const cities = leagueBy("city");
  const cuisines = leagueBy("cuisine");

  return (
    <section style={S.panel}>
      <h3 style={S.panelTitle}>League Tables</h3>

      <div style={S.subPanelTitle}>By city</div>
      {cities.length ? cities.map((c, i) => (
        <div key={c.k} style={S.leagueRow}>
          <span style={S.leagueRank}>{i + 1}</span>
          <span style={S.leagueName}>{c.k}</span>
          <span style={S.leagueDots} />
          <span style={S.leagueMeta}>{c.n} {c.n === 1 ? "visit" : "visits"}</span>
          <span style={S.leagueVal}>{fmt(c.avg)}</span>
        </div>
      )) : <p style={S.subtleNote}>No cities recorded.</p>}

      <div style={{ ...S.subPanelTitle, marginTop: 20 }}>By cuisine</div>
      {cuisines.length ? cuisines.map((c, i) => (
        <div key={c.k} style={S.leagueRow}>
          <span style={S.leagueRank}>{i + 1}</span>
          <span style={S.leagueName}>{c.k}</span>
          <span style={S.leagueDots} />
          <span style={S.leagueMeta}>{c.n} {c.n === 1 ? "visit" : "visits"}</span>
          <span style={S.leagueVal}>{fmt(c.avg)}</span>
        </div>
      )) : <p style={S.subtleNote}>No cuisines recorded.</p>}
    </section>
  );
}
