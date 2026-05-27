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
  const [filter, setFilter] = useState("total");
  if (!data.length)
    return <Empty msg="Findings emerge once the ledger holds entries." />;

  const valueFor = (e) => (filter === "total" ? totalOf(e.scores) : e.scores?.[filter]);
  const filterLabel = filter === "total"
    ? "Total" : CATEGORIES.find((c) => c.key === filter)?.label;

  const ranked = [...data]
    .map((e) => ({ entry: e, v: valueFor(e) }))
    .sort((a, b) => {
      const av = typeof a.v === "number" ? a.v : -1;
      const bv = typeof b.v === "number" ? b.v : -1;
      return bv - av;
    });

  const catAvgs = CATEGORIES.map((c) => {
    const vals = data.map((e) => e.scores?.[c.key]).filter((v) => typeof v === "number");
    return { ...c, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
  });
  const overallAvg = data.reduce((a, e) => a + totalOf(e.scores), 0) / data.length;

  return (
    <div>
      <p style={S.lede}>Rank the ledger by any measure, and see how it all averages out.</p>

      <section style={S.panel}>
        <h3 style={S.panelTitle}>Rank by</h3>
        <div style={S.filterWrap}>
          <Chip label="Total" active={filter === "total"} onClick={() => setFilter("total")} />
          {CATEGORIES.map((c) => (
            <Chip key={c.key} label={c.label}
              active={filter === c.key} onClick={() => setFilter(c.key)} />
          ))}
        </div>
        <div>
          {ranked.map(({ entry, v }, i) => (
            <div key={entry.id} style={S.rankByRow}>
              <span style={S.rankByNum}>{String(i + 1).padStart(2, "0")}</span>
              <span style={S.rankByName}>{entry.name}</span>
              <span style={S.rankByDots} />
              <span style={{ ...S.rankByVal,
                color: typeof v === "number" ? "#3A2C18" : "#A8987C" }}>
                {fmtScore(v)}
              </span>
            </div>
          ))}
        </div>
        <p style={S.rankByCaption}>
          Ranked by <span style={S.italicInline}>{filterLabel}</span>.
        </p>
      </section>

      <section style={S.panel}>
        <h3 style={S.panelTitle}>Average by Category</h3>
        {catAvgs.map((c) => (
          <div key={c.key} style={S.barRow}>
            <span style={S.barLabel}>{c.label}</span>
            <div style={S.barTrack}>
              <div style={{ ...S.barFill, width: `${c.avg * 10}%` }} />
            </div>
            <span style={S.barVal}>{fmt(c.avg)}</span>
          </div>
        ))}
        <div style={{ ...S.barRow, marginTop: 6, paddingTop: 12,
          borderTop: "1px solid #D8C9A8" }}>
          <span style={{ ...S.barLabel, fontFamily: "'Fraunces', serif",
            fontStyle: "italic", textTransform: "none", fontSize: 14 }}>Overall</span>
          <div style={S.barTrack}>
            <div style={{ ...S.barFill, width: `${overallAvg * 10}%` }} />
          </div>
          <span style={S.barVal}>{fmt(overallAvg)}</span>
        </div>
      </section>
    </div>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} className="chip"
      style={{ ...S.chip, ...(active ? S.chipActive : {}) }}>
      {label}
    </button>
  );
}
