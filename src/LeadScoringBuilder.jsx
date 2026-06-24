import { useState, useEffect, useCallback } from "react";

const INDUSTRIES = [
  "Accommodation & Food Services","Advertising & Marketing","Agriculture","Arts & Crafts",
  "Automotive","Banking","Biotechnology","Broadcasting","Civil Engineering","Computer Hardware",
  "Computer Software","Construction","Consumer Goods","Defense & Space","Education",
  "Environmental Services","Finance","Food Production","Government","Healthcare",
  "Hospitality","Human Resources","Import & Export","Industrial Automation","Insurance",
  "Internet","Legal Services","Logistics & Supply Chain","Management Consulting","Manufacturing",
  "Media","Mining & Metals","Non-profit","Oil & Energy","Pharmaceuticals","Public Relations",
  "Real Estate","Retail","Staffing & Recruiting","Technology","Telecommunications",
  "Transportation","Utilities","Venture Capital","Wholesale","Other"
];
const ANNUAL_REVENUES = [
  "$0–$250K","$250K–$1M","$1M–$10M","$10M–$50M","$50M–$100M",
  "$100M–$250M","$250M–$500M","$500M–$1B","$1B–$10B","$10B+","Any / Not a criteria"
];
const COMPANY_SIZES = ["1–10 employees","11–50 employees","51–200 employees","201–500 employees","501–1,000 employees","1,000+ employees"];
const TITLES = ["C-Suite (CEO, CFO, COO)","VP / Director","Manager","Individual Contributor","Business Owner","Other"];
const NA_LOCATIONS = ["Canada","United States","Australia","New Zealand","United Kingdom","Other"];

const DEFAULT_FIT = [
  { label: "Job title matches target job title", points: 20, included: false, maxTimes: 1 },
  { label: "Company size in target range", points: 15, included: false, maxTimes: 1 },
  { label: "Industry is a fit", points: 15, included: false, maxTimes: 1 },
  { label: "Geography matches target market", points: 10, included: false, maxTimes: 1 },
  { label: "Annual revenue in target range", points: 10, included: false, maxTimes: 1 },
];
const DEFAULT_BEHAVIOR = [
  { label: "Requested a demo", points: 25, included: false, maxTimes: 1 },
  { label: "Completed our Contact Form", points: 15, included: false, maxTimes: 1 },
  { label: "Visited pricing page", points: 15, included: false, maxTimes: 3 },
  { label: "Downloaded a case study", points: 10, included: false, maxTimes: 3 },
  { label: "Attended a webinar", points: 10, included: false, maxTimes: 5 },
  { label: "Signed up for Our Newsletter", points: 8, included: false, maxTimes: 1 },
  { label: "Opened a One to One Sales Email", points: 5, included: false, maxTimes: 5 },
  { label: "Form Fill (General)", points: 5, included: false, maxTimes: 3 },
  { label: "Interacted with an Ad", points: 3, included: false, maxTimes: 5 },
  { label: "Clicked a link in an email", points: 3, included: false, maxTimes: 5 },
  { label: "General website visit (any page)", points: 2, included: false, maxTimes: 5 },
  { label: "Opened a Marketing Email", points: 1, included: false, maxTimes: 5 },
  { label: "Social media click", points: 1, included: false, maxTimes: 5 },
];
const DEFAULT_FIT_NEGATIVE = [
  { label: "Competitor email domain", points: -20, included: false, maxTimes: 1 },
  { label: "Freemail or .edu email domain (Gmail, Yahoo, Hotmail, Outlook, .edu, etc.)", points: -15, included: false, maxTimes: 1 },
  { label: "Job title indicates Student, Intern, or Volunteer", points: -15, included: false, maxTimes: 1 },
];
const DEFAULT_ENGAGEMENT_NEGATIVE = [
  { label: "Unsubscribed from emails", points: -15, included: false, maxTimes: 1 },
  { label: "Email hard bounce", points: -10, included: false, maxTimes: 1 },
  { label: "No engagement in 90+ days", points: -10, included: false, maxTimes: 1 },
];

const TOTAL_STEPS = 7;

// ─── State encode / decode ────────────────────────────────────────────────────

function encodeState(state) {
  try {
    const json = JSON.stringify(state);
    return btoa(unescape(encodeURIComponent(json)));
  } catch { return null; }
}

function decodeState(hash) {
  try {
    const raw = hash.startsWith("#") ? hash.slice(1) : hash;
    const json = decodeURIComponent(escape(atob(raw)));
    return JSON.parse(json);
  } catch { return null; }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Tag({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 14px", borderRadius: "20px",
      border: active ? "2px solid #F8CD56" : "2px solid #D8D5D0",
      background: active ? "#F8CD56" : "#FAFAF8",
      color: "#1A1A18", fontSize: "13px", cursor: "pointer",
      fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
      fontWeight: active ? "600" : "400",
    }}>{children}</button>
  );
}

// Reusable multi-entry "Other" pill input
function MultiOtherInput({ values, setValues, inputVal, setInputVal, placeholder }) {
  const add = () => {
    const v = inputVal.trim();
    if (v) { setValues(p => [...p, v]); setInputVal(""); }
  };
  return (
    <div style={{ marginTop: "10px" }}>
      {values.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
          {values.map((v, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 10px 5px 12px", borderRadius: "20px", background: "#F8CD56", fontSize: "13px", fontWeight: "600", color: "#1A1A18" }}>
              {v}
              <button onClick={() => setValues(p => p.filter((_,idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", padding: "0 2px", color: "#7A5C00", lineHeight: 1 }}>✕</button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: "8px" }}>
        <input value={inputVal} onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") add(); }}
          placeholder={placeholder}
          style={{ flex: 1, padding: "9px 12px", borderRadius: "8px", border: "1px solid #D8D5D0", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
        <button onClick={add} style={{ padding: "9px 14px", borderRadius: "8px", background: "#F8CD56", border: "none", fontSize: "18px", lineHeight: 1, cursor: "pointer", fontWeight: "700" }}>+</button>
      </div>
    </div>
  );
}

function CriteriaRow({ item, index, onChange, onToggle, onChangeMax, onDelete, onChangeLabel, isNegative, showMax = true }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.label);

  const commitEdit = () => {
    if (draft.trim()) onChangeLabel(index, draft.trim());
    else setDraft(item.label);
    setEditing(false);
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px",
      borderRadius: "8px", background: item.included ? "#FAFAF8" : "#F4F4F2",
      border: `1px solid ${item.included ? "#F0D4A0" : "#E4E4E0"}`,
      marginBottom: "8px", opacity: item.included ? 1 : 0.55, transition: "all 0.15s",
    }}>
      <input type="checkbox" checked={item.included} onChange={() => onToggle(index)}
        style={{ accentColor: "#F8CD56", width: "16px", height: "16px", cursor: "pointer", flexShrink: 0 }} />

      {editing ? (
        <input value={draft} onChange={e => setDraft(e.target.value)} onBlur={commitEdit}
          onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") { setDraft(item.label); setEditing(false); } }}
          autoFocus
          style={{ flex: 1, fontSize: "13px", fontFamily: "'DM Sans', sans-serif", padding: "3px 8px", borderRadius: "6px", border: "1.5px solid #F8CD56", outline: "none" }} />
      ) : (
        <span onClick={() => { setDraft(item.label); setEditing(true); }} title="Click to edit label"
          style={{ flex: 1, fontSize: "13px", color: "#333", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4, cursor: "text" }}>{item.label}</span>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
        <span style={{ fontSize: "12px", color: isNegative ? "#C0392B" : "#1A1A18", fontWeight: "700" }}>{isNegative ? "-" : "+"}</span>
        <input type="number" value={Math.abs(item.points)} min={1} max={100} disabled={!item.included}
          onChange={e => onChange(index, isNegative ? -Math.abs(parseInt(e.target.value)||0) : Math.abs(parseInt(e.target.value)||0))}
          style={{ width: "46px", padding: "4px 5px", borderRadius: "6px", border: "1px solid #D0D0CC", fontSize: "13px", fontFamily: "monospace", textAlign: "center", background: item.included ? "#fff" : "#eee", color: isNegative ? "#C0392B" : "#1A1A18", fontWeight: "700" }} />
        <span style={{ fontSize: "11px", color: "#999" }}>pts</span>
      </div>

      {showMax && (
        <div style={{ display: "flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
          <span style={{ fontSize: "11px", color: "#aaa", whiteSpace: "nowrap" }}>max</span>
          <input type="number" value={item.maxTimes} min={1} max={99} disabled={!item.included}
            onChange={e => onChangeMax(index, parseInt(e.target.value)||1)}
            style={{ width: "40px", padding: "4px 5px", borderRadius: "6px", border: "1px solid #D0D0CC", fontSize: "13px", fontFamily: "monospace", textAlign: "center", background: item.included ? "#fff" : "#eee", color: "#555", fontWeight: "600" }} />
          <span style={{ fontSize: "11px", color: "#aaa" }}>x</span>
        </div>
      )}

      {onDelete && (
        <button onClick={() => onDelete(index)} title="Remove this item"
          style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: "15px", padding: "2px 4px", lineHeight: 1, flexShrink: 0, transition: "color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#C0392B"}
          onMouseLeave={e => e.currentTarget.style.color = "#ccc"}>✕</button>
      )}
    </div>
  );
}

function AddCriteriaRow({ onAdd, isNegative, showMax = true }) {
  const [label, setLabel] = useState("");
  const [points, setPoints] = useState(10);
  const [maxTimes, setMaxTimes] = useState(1);
  const [open, setOpen] = useState(false);
  const handleAdd = () => {
    if (!label.trim()) return;
    onAdd({ label: label.trim(), points: isNegative ? -Math.abs(points) : Math.abs(points), included: true, maxTimes });
    setLabel(""); setPoints(10); setMaxTimes(1); setOpen(false);
  };
  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ fontSize: "12px", color: "#1A1A18", background: "none", border: "1px dashed #F0C840", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", width: "100%", marginTop: "4px" }}>+ Add custom criteria</button>
  );
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "8px", flexWrap: "wrap" }}>
      <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Criteria description..."
        style={{ flex: 1, minWidth: "160px", padding: "8px 10px", borderRadius: "8px", border: "1px solid #C8C8C4", fontSize: "13px", fontFamily: "'DM Sans', sans-serif" }} />
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span style={{ fontSize: "11px", color: "#999" }}>pts</span>
        <input type="number" value={points} min={1} max={100} onChange={e => setPoints(parseInt(e.target.value)||0)}
          style={{ width: "46px", padding: "8px 5px", borderRadius: "8px", border: "1px solid #C8C8C4", fontSize: "13px", textAlign: "center", fontFamily: "monospace" }} />
      </div>
      {showMax && (
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "11px", color: "#999" }}>max×</span>
          <input type="number" value={maxTimes} min={1} max={99} onChange={e => setMaxTimes(parseInt(e.target.value)||1)}
            style={{ width: "40px", padding: "8px 5px", borderRadius: "8px", border: "1px solid #C8C8C4", fontSize: "13px", textAlign: "center", fontFamily: "monospace" }} />
        </div>
      )}
      <button onClick={handleAdd} style={{ padding: "8px 14px", borderRadius: "8px", background: "#F8CD56", border: "none", color: "#1A1A18", fontSize: "12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Add</button>
      <button onClick={() => setOpen(false)} style={{ padding: "8px 10px", borderRadius: "8px", background: "none", border: "1px solid #D0D0CC", color: "#999", fontSize: "12px", cursor: "pointer" }}>✕</button>
    </div>
  );
}

// ─── Save Progress Modal ───────────────────────────────────────────────────────

function SaveProgressModal({ url, onClose }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    const doCopy = (text) => {
      try {
        navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); }).catch(() => fallback(text));
      } catch { fallback(text); }
    };
    const fallback = (text) => {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    };
    doCopy(url);
  };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(26,26,24,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "16px", padding: "28px 24px", maxWidth: "500px", width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.22)", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#F8CD56", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>🔗</div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#1A1A18" }}>Progress saved!</div>
              <div style={{ fontSize: "12px", color: "#999" }}>Your answers are encoded in the link below</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#bbb", lineHeight: 1, padding: "4px", marginLeft: "8px" }}>✕</button>
        </div>
        <p style={{ fontSize: "13px", color: "#666", marginBottom: "14px", lineHeight: 1.65 }}>Bookmark this link, email it to yourself, or share it with a colleague — opening it will restore exactly where you left off.</p>
        <div style={{ background: "#F6F4F0", borderRadius: "10px", padding: "12px 14px", marginBottom: "14px", wordBreak: "break-all", fontSize: "11.5px", color: "#555", fontFamily: "monospace", lineHeight: 1.55, border: "1px solid #E4E0D8", maxHeight: "72px", overflowY: "auto" }}>{url}</div>
        <button onClick={handleCopy} style={{ width: "100%", padding: "13px", borderRadius: "10px", background: copied ? "#2ECC71" : "#F8CD56", border: "none", color: copied ? "#fff" : "#1A1A18", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "background 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          {copied ? "✓  Copied to clipboard!" : "📋  Copy Link"}
        </button>
        <p style={{ textAlign: "center", fontSize: "11px", color: "#bbb", marginTop: "12px", lineHeight: 1.5 }}>Tip: you can also just bookmark this page — the URL already reflects your current progress after clicking Copy.</p>
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

// ─── HTML Export ──────────────────────────────────────────────────────────────

function exportToHTML(data) {
  const fmtPts = (pts) => pts < 0 ? `-${Math.abs(pts)} pts` : `+${pts} pts`;
  const { fitThresholds: ft, engagementThresholds: et } = data;

  const notifVal = data.salesNotify
    ? (data.notifyTypes||[]).map(t =>
        t === "owner" ? "Contact Owner" :
        t === "other" ? `Other: ${(data.notifyOtherDescriptions||[]).join(", ")||"—"}` :
        `Email: ${(data.notifyEmails||[]).join(", ")||"—"}`
      ).join(", ")
    : "None";

  const fitRows = data.fitCriteria.filter(r => r.included).map((r, i) => `
    <tr style="background:${i%2===0?"#fff":"#f9f8f6"}">
      <td style="padding:9px 12px;font-size:13px;color:#333;">${r.label}</td>
      <td style="padding:9px 12px;font-size:13px;font-weight:700;text-align:right;color:${r.points<0?"#C0392B":"#1A1A18"};">${fmtPts(r.points)}</td>
      <td style="padding:9px 12px;font-size:12px;color:#999;text-align:right;">1x</td>
    </tr>`).join("");

  const behRows = data.behaviorCriteria.filter(r => r.included).map((r, i) => `
    <tr style="background:${i%2===0?"#fff":"#f9f8f6"}">
      <td style="padding:9px 12px;font-size:13px;color:#333;">${r.label}</td>
      <td style="padding:9px 12px;font-size:13px;font-weight:700;text-align:right;color:#1A1A18;">+${r.points} pts</td>
      <td style="padding:9px 12px;font-size:12px;color:#999;text-align:right;">max ${r.maxTimes}x</td>
    </tr>`).join("");

  const allNeg = [...(data.fitNegativeCriteria||[]), ...(data.engagementNegativeCriteria||[])];
  const negRows = allNeg.filter(r => r.included).map((r, i) => `
    <tr style="background:${i%2===0?"#fff":"#f9f8f6"}">
      <td style="padding:9px 12px;font-size:13px;color:#333;">${r.label}</td>
      <td style="padding:9px 12px;font-size:13px;font-weight:700;text-align:right;color:#C0392B;">-${Math.abs(r.points)} pts</td>
      <td style="padding:9px 12px;font-size:12px;color:#999;text-align:right;">max ${r.maxTimes}x</td>
    </tr>`).join("");

  const sectionTable = (title, rows, titleColor = "#1A1A18") => !rows ? "" : `
    <div style="margin-bottom:20px;">
      <div style="background:#1A1A18;padding:8px 12px;border-radius:6px 6px 0 0;">
        <span style="font-size:11px;font-weight:700;color:${titleColor};letter-spacing:1.5px;text-transform:uppercase;">${title}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E4E0D8;border-top:none;">
        <thead><tr style="background:#F6F4F0;">
          <th style="padding:8px 12px;font-size:11px;color:#999;text-align:left;font-weight:600;">Criteria</th>
          <th style="padding:8px 12px;font-size:11px;color:#999;text-align:right;font-weight:600;">Points</th>
          <th style="padding:8px 12px;font-size:11px;color:#999;text-align:right;font-weight:600;">Max Times</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  const notesBlock = (label, text) => !text?.trim() ? "" : `
    <div style="background:#F6F4F0;border:1px solid #E4E0D8;border-radius:8px;padding:14px 16px;margin-bottom:16px;">
      <div style="font-size:11px;font-weight:700;color:#999;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">${label}</div>
      <div style="font-size:13px;color:#555;line-height:1.65;white-space:pre-wrap;">${text}</div>
    </div>`;

  const thresholdSection = `
    <div style="background:#F8CD56;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:700;color:#7A5C00;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;">Score Thresholds</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:16px;">
        <div>
          <div style="font-size:11px;font-weight:700;color:#7A5C00;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Fit Tiers (A=High, B=Med, C=Low)</div>
          ${[["A — High",ft.A],["B — Medium",ft.B],["C — Low",ft.C]].map(([l,v])=>`
          <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid rgba(0,0,0,0.08);">
            <span style="font-weight:600;">${l}</span><span style="font-weight:700;">&ge; ${v} pts</span>
          </div>`).join("")}
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#7A5C00;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Engagement Tiers (1=Highest)</div>
          ${[["Tier 1",et.T1],["Tier 2",et.T2],["Tier 3",et.T3]].map(([l,v])=>`
          <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid rgba(0,0,0,0.08);">
            <span style="font-weight:600;">${l}</span><span style="font-weight:700;">&ge; ${v} pts</span>
          </div>`).join("")}
        </div>
      </div>
      <div style="font-size:11px;color:#7A5C00;">Fit tier + Engagement tier → Category (e.g. A1 = High Fit + Highest Engagement)</div>
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>${data.companyName} - Lead Scoring Model</title>
<style>@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;background:#F6F4F0;color:#1A1A18}
@media print{body{background:#fff}.no-print{display:none}}</style></head>
<body><div style="max-width:720px;margin:0 auto;padding:32px 20px;">
<div style="background:#1A1A18;border-radius:12px;padding:24px 28px;margin-bottom:24px;">
  <div style="font-family:'DM Serif Display',serif;font-size:22px;color:#F8CD56;line-height:1.2;">Lead Scoring Model</div>
  <div style="font-size:13px;color:#aaa;margin-top:3px;">${data.companyName} · Generated by ThinkFuel</div>
</div>
${thresholdSection}
${fitRows ? sectionTable("Demographic / Fit", fitRows, "#F8CD56") : ""}
${notesBlock("Fit Scoring Notes", data.fitNotes)}
${behRows ? sectionTable("Behavioural / Engagement", behRows, "#F8CD56") : ""}
${notesBlock("Engagement Notes", data.engagementNotes)}
${negRows ? sectionTable("Negative Signals", negRows, "#ff8a80") : ""}
${notesBlock("ICP Notes", data.icpNotes)}
${notesBlock("Score Decay Notes", data.decayNotes)}
${notesBlock("Threshold & Implementation Notes", data.thresholdNotes)}
<div class="no-print" style="text-align:center;margin-top:24px;">
  <button onclick="window.print()" style="padding:12px 28px;background:#F8CD56;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;">Print / Save as PDF</button>
</div>
</div></body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = (data.companyName || "Company").replace(/\s+/g, "_") + "_Lead_Scoring_Model.html";
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ─── XLSX Export ──────────────────────────────────────────────────────────────

function exportToXLSX(data) {
  const XLSXUtils = window.XLSX.utils;
  const XLSXWrite = window.XLSX.write;
  const wb = XLSXUtils.book_new();
  const { fitThresholds: ft, engagementThresholds: et } = data;

  const notifyDisplay = data.salesNotify
    ? (data.notifyTypes||[]).map(t =>
        t === "owner" ? "Contact Owner" :
        t === "other" ? `Other: ${(data.notifyOtherDescriptions||[]).join(", ")||"—"}` :
        `Email: ${(data.notifyEmails||[]).join(", ")||"—"}`
      ).join(", ")
    : "No";

  const summaryRows = [
    ["LEAD SCORING MODEL","",""],
    ["Generated by ThinkFuel","",""],
    ["","",""],
    ["COMPANY PROFILE","",""],
    ["Company Name", data.companyName,""],
    ["Target Industries", data.targetIndustries.join(", "),""],
    ["Target Company Sizes", data.targetSizes.join(", "),""],
    ["Target Job Titles", data.targetTitles.join(", "),""],
    ["Target Locations", data.targetLocations.join(", "),""],
    ["Target Annual Revenue", (data.targetRevenues||[]).join(", "),""],
  ];

  if (data.icpNotes?.trim()) {
    summaryRows.push(["","",""]);
    summaryRows.push(["ICP NOTES","",""]);
    summaryRows.push(["", data.icpNotes, ""]);
  }

  summaryRows.push(
    ["","",""],
    ["FIT SCORE THRESHOLDS","","A = High, B = Medium, C = Low"],
    ["A — High Fit (≥ pts)", ft.A, data.maxFitScore > 0 ? `${Math.round((ft.A/data.maxFitScore)*100)}% of max fit score (${data.maxFitScore} pts)` : ""],
    ["B — Medium Fit (≥ pts)", ft.B, data.maxFitScore > 0 ? `${Math.round((ft.B/data.maxFitScore)*100)}% of max fit score` : ""],
    ["C — Low Fit (≥ pts)", ft.C, data.maxFitScore > 0 ? `${Math.round((ft.C/data.maxFitScore)*100)}% of max fit score` : ""],
    ["","",""],
    ["ENGAGEMENT SCORE THRESHOLDS","","Tier 1 = Highest, Tier 3 = Lowest"],
    ["Tier 1 — Highest (≥ pts)", et.T1, data.maxEngagementScore > 0 ? `${Math.round((et.T1/data.maxEngagementScore)*100)}% of max engagement score (${data.maxEngagementScore} pts)` : ""],
    ["Tier 2 (≥ pts)", et.T2, data.maxEngagementScore > 0 ? `${Math.round((et.T2/data.maxEngagementScore)*100)}% of max engagement score` : ""],
    ["Tier 3 — Lowest (≥ pts)", et.T3, data.maxEngagementScore > 0 ? `${Math.round((et.T3/data.maxEngagementScore)*100)}% of max engagement score` : ""],
    ["","",""],
    ["SCORE SETTINGS","",""],
    ["Score Decay", `${data.decayPercent}% at ${data.decayMonths} months`, `Scores reach 0 at ${data.decayMonths*2} months`],
  );

  if (data.decayNotes?.trim()) {
    summaryRows.push(["","",""]);
    summaryRows.push(["SCORE DECAY NOTES","",""]);
    summaryRows.push(["", data.decayNotes, ""]);
  }

  summaryRows.push(
    ["","",""],
    ["MQL DEFINITION","",""],
    ["When is a Contact an MQL?", data.mqlCriteria||"—",""],
    ["","",""],
    ["SALES NOTIFICATION","",""],
    ["Notify Sales?", data.salesNotify ? "Yes" : "No",""],
    ...(data.salesNotify ? [
      ["Notify", notifyDisplay,""],
      ["Fields", (data.notifyFields||[]).join(", "),""],
    ] : []),
  );

  if (data.fitNotes?.trim()) {
    summaryRows.push(["","",""]);
    summaryRows.push(["FIT SCORING NOTES","",""]);
    summaryRows.push(["", data.fitNotes, ""]);
  }
  if (data.engagementNotes?.trim()) {
    summaryRows.push(["","",""]);
    summaryRows.push(["ENGAGEMENT NOTES","",""]);
    summaryRows.push(["", data.engagementNotes, ""]);
  }
  if (data.thresholdNotes?.trim()) {
    summaryRows.push(["","",""]);
    summaryRows.push(["THRESHOLD & IMPLEMENTATION NOTES","",""]);
    summaryRows.push(["", data.thresholdNotes, ""]);
  }

  const ws1 = XLSXUtils.aoa_to_sheet(summaryRows);
  ws1["!cols"] = [{wch:30},{wch:42},{wch:48}];
  XLSXUtils.book_append_sheet(wb, ws1, "Summary");

  const modelRows = [
    ["LEAD SCORING MODEL — FULL CRITERIA","","","",""],
    ["","","","",""],
    ["CATEGORY","CRITERIA","POINT VALUE","MAX TIMES TO SCORE","MAX TOTAL POINTS"],
  ];
  data.fitCriteria.filter(r=>r.included).forEach(r =>
    modelRows.push(["Demographic / Fit", r.label, r.points<0?"-"+Math.abs(r.points):Math.abs(r.points), 1, r.points<0?"-"+Math.abs(r.points):Math.abs(r.points)])
  );
  modelRows.push(["","","","",""]);
  data.behaviorCriteria.filter(r=>r.included).forEach(r =>
    modelRows.push(["Behavioural / Engagement", r.label, Math.abs(r.points), r.maxTimes, Math.abs(r.points)*r.maxTimes])
  );
  modelRows.push(["","","","",""]);
  const allNeg = [...(data.fitNegativeCriteria||[]), ...(data.engagementNegativeCriteria||[])];
  allNeg.filter(r=>r.included).forEach(r =>
    modelRows.push(["Negative Signal", r.label, "-"+Math.abs(r.points), r.maxTimes, "-"+(Math.abs(r.points)*r.maxTimes)])
  );
  modelRows.push(["","","","",""]);
  modelRows.push(["","FIT THRESHOLD A (High)", `≥ ${ft.A} pts`,"",""]);
  modelRows.push(["","FIT THRESHOLD B (Medium)", `≥ ${ft.B} pts`,"",""]);
  modelRows.push(["","FIT THRESHOLD C (Low)", `≥ ${ft.C} pts`,"",""]);
  modelRows.push(["","ENGAGEMENT TIER 1 (Highest)", `≥ ${et.T1} pts`,"",""]);
  modelRows.push(["","ENGAGEMENT TIER 2", `≥ ${et.T2} pts`,"",""]);
  modelRows.push(["","ENGAGEMENT TIER 3 (Lowest)", `≥ ${et.T3} pts`,"",""]);
  modelRows.push(["","SCORE DECAY", `${data.decayPercent}% at ${data.decayMonths} months`,"",`Reaches 0 at ${data.decayMonths*2} months`]);

  const ws2 = XLSXUtils.aoa_to_sheet(modelRows);
  ws2["!cols"] = [{wch:26},{wch:46},{wch:14},{wch:22},{wch:18}];
  XLSXUtils.book_append_sheet(wb, ws2, "Scoring Model");

  const checklistRows = [
    ["HUBSPOT IMPLEMENTATION CHECKLIST","",""],
    ["","",""],
    ["STEP","ACTION","DONE?"],
    ["1","Go to HubSpot → Marketing → Lead Scoring","[ ]"],
    ["2","Create or open your HubSpot Score property","[ ]"],
    ["3","Add all Demographic / Fit criteria","[ ]"],
    ["4","Add all Behavioural / Engagement criteria","[ ]"],
    ["5","Add all Negative Signal criteria","[ ]"],
    ["6","Set max times to score per the Scoring Model tab","[ ]"],
    ["7",`Configure Fit thresholds: A ≥ ${ft.A} pts, B ≥ ${ft.B} pts, C ≥ ${ft.C} pts in your lifecycle workflows`,"[ ]"],
    ["8",`Configure Engagement thresholds: Tier 1 ≥ ${et.T1} pts, Tier 2 ≥ ${et.T2} pts, Tier 3 ≥ ${et.T3} pts`,"[ ]"],
    ["9",`Configure score decay: ${data.decayPercent}% at ${data.decayMonths} months`,"[ ]"],
    ...(data.salesNotify ? [["10","Set up sales notification when a contact reaches an MQL category threshold","[ ]"]] : []),
  ];

  if (data.salesNotify) {
    checklistRows.push(["","",""]);
    checklistRows.push(["REVIEW SCHEDULE","",""]);
    checklistRows.push(["30 days","Review MQL-to-opportunity conversion rate","[ ]"]);
    checklistRows.push(["60 days","Compare scores of closed-won vs closed-lost contacts","[ ]"]);
    checklistRows.push(["90 days","Adjust point values and thresholds based on data","[ ]"]);
    checklistRows.push(["Ongoing","Add new behaviors as you learn what predicts a sale","[ ]"]);
  }

  const ws3 = XLSXUtils.aoa_to_sheet(checklistRows);
  ws3["!cols"] = [{wch:14},{wch:55},{wch:10}];
  XLSXUtils.book_append_sheet(wb, ws3, "HubSpot Checklist");

  const wbout = XLSXWrite(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = (data.companyName||"Company").replace(/\s+/g,"_")+"_Lead_Scoring_Model.xlsx";
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ─── Shared style constants ───────────────────────────────────────────────────

const notesStyle = { width:"100%", padding:"10px 14px", borderRadius:"10px", border:"1px solid #D8D5D0", fontSize:"13px", fontFamily:"'DM Sans', sans-serif", boxSizing:"border-box", outline:"none", resize:"vertical", minHeight:"80px", lineHeight:1.6 };
const cardStyle = {background:"#fff",borderRadius:"12px",padding:"20px",border:"1px solid #E4E0D8",marginBottom:"16px"};
const subLabel = {margin:"0 0 12px",fontSize:"12px",fontWeight:"700",color:"#999",textTransform:"uppercase",letterSpacing:"1px"};

function SectionLabel({text}) {
  return <p style={{margin:"0 0 6px",fontSize:"11px",color:"#1A1A18",letterSpacing:"2px",textTransform:"uppercase",fontWeight:"700"}}>{text}</p>;
}

function NegativeDivider({ title }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"10px", margin:"24px 0 14px" }}>
      <div style={{ height:"1px", flex:1, background:"#E4E0D8" }} />
      <span style={{ fontSize:"10px", color:"#C0392B", fontWeight:"700", letterSpacing:"1.5px", textTransform:"uppercase", whiteSpace:"nowrap" }}>⛔ {title}</span>
      <div style={{ height:"1px", flex:1, background:"#E4E0D8" }} />
    </div>
  );
}

function NotesField({ label, hint, value, onChange, placeholder }) {
  return (
    <div style={{ marginTop: "8px" }}>
      <label style={{ display:"block", fontSize:"13px", fontWeight:"600", color:"#333", marginBottom:"6px" }}>{label}</label>
      {hint && <p style={{ margin:"0 0 8px", fontSize:"12px", color:"#999" }}>{hint}</p>}
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={notesStyle} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LeadScoringBuilder() {
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [targetIndustries, setTargetIndustries] = useState([]);
  const [targetSizes, setTargetSizes] = useState([]);
  const [targetTitles, setTargetTitles] = useState([]);
  const [targetLocations, setTargetLocations] = useState([]);
  const [targetRevenues, setTargetRevenues] = useState([]);
  // Multi-entry "Other" for ICP fields
  const [otherIndustries, setOtherIndustries] = useState([]);
  const [otherIndustryInput, setOtherIndustryInput] = useState("");
  const [otherTitles, setOtherTitles] = useState([]);
  const [otherTitleInput, setOtherTitleInput] = useState("");
  const [otherLocations, setOtherLocations] = useState([]);
  const [otherLocationInput, setOtherLocationInput] = useState("");
  const [icpNotes, setIcpNotes] = useState("");
  // Scoring
  const [fitCriteria, setFitCriteria] = useState(DEFAULT_FIT.map(r => ({ ...r })));
  const [behaviorCriteria, setBehaviorCriteria] = useState(DEFAULT_BEHAVIOR.map(r => ({ ...r })));
  const [fitNegativeCriteria, setFitNegativeCriteria] = useState(DEFAULT_FIT_NEGATIVE.map(r => ({ ...r })));
  const [engagementNegativeCriteria, setEngagementNegativeCriteria] = useState(DEFAULT_ENGAGEMENT_NEGATIVE.map(r => ({ ...r })));
  const [fitNotes, setFitNotes] = useState("");
  const [engagementNotes, setEngagementNotes] = useState("");
  // Decay (now Step 4)
  const [decayPercent, setDecayPercent] = useState(50);
  const [decayMonths, setDecayMonths] = useState(12);
  const [decayNotes, setDecayNotes] = useState("");
  // Thresholds (now Step 5)
  const [fitThresholds, setFitThresholds] = useState({ A: null, B: null, C: null });
  const [engagementThresholds, setEngagementThresholds] = useState({ T1: null, T2: null, T3: null });
  const [mqlCriteria, setMqlCriteria] = useState("");
  const [thresholdNotes, setThresholdNotes] = useState("");
  // Notifications — notifyTypes is now an array (multi-select)
  const [salesNotify, setSalesNotify] = useState(null);
  const [notifyTypes, setNotifyTypes] = useState([]);
  const [notifyEmails, setNotifyEmails] = useState([]);
  const [notifyEmailInput, setNotifyEmailInput] = useState("");
  const [notifyOtherDescriptions, setNotifyOtherDescriptions] = useState([]);
  const [notifyOtherDescriptionInput, setNotifyOtherDescriptionInput] = useState("");
  const [notifyFields, setNotifyFields] = useState([]);
  const [otherNotifyFields, setOtherNotifyFields] = useState([]);
  const [otherNotifyFieldInput, setOtherNotifyFieldInput] = useState("");
  // Modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveUrl, setSaveUrl] = useState("");

  // ── Restore from URL hash ─────────────────────────────────────────────────
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash.length < 5) return;
    const r = decodeState(hash);
    if (!r) return;
    if (r.step !== undefined) setStep(r.step);
    if (r.companyName !== undefined) setCompanyName(r.companyName);
    if (r.targetIndustries) setTargetIndustries(r.targetIndustries);
    if (r.targetSizes) setTargetSizes(r.targetSizes);
    if (r.targetTitles) setTargetTitles(r.targetTitles);
    if (r.targetLocations) setTargetLocations(r.targetLocations);
    if (r.targetRevenues) setTargetRevenues(r.targetRevenues);
    if (r.otherIndustries) setOtherIndustries(r.otherIndustries);
    else if (r.otherIndustry) setOtherIndustries([r.otherIndustry]);
    if (r.otherTitles) setOtherTitles(r.otherTitles);
    else if (r.otherTitle) setOtherTitles([r.otherTitle]);
    if (r.otherLocations) setOtherLocations(r.otherLocations);
    else if (r.otherLocation) setOtherLocations([r.otherLocation]);
    if (r.icpNotes !== undefined) setIcpNotes(r.icpNotes);
    if (r.fitCriteria) setFitCriteria(r.fitCriteria);
    if (r.behaviorCriteria) setBehaviorCriteria(r.behaviorCriteria);
    if (r.fitNegativeCriteria) setFitNegativeCriteria(r.fitNegativeCriteria);
    if (r.engagementNegativeCriteria) setEngagementNegativeCriteria(r.engagementNegativeCriteria);
    if (r.fitNotes !== undefined) setFitNotes(r.fitNotes);
    if (r.engagementNotes !== undefined) setEngagementNotes(r.engagementNotes);
    if (r.decayPercent !== undefined) setDecayPercent(r.decayPercent);
    if (r.decayMonths !== undefined) setDecayMonths(r.decayMonths);
    if (r.decayNotes !== undefined) setDecayNotes(r.decayNotes);
    if (r.fitThresholds) setFitThresholds(r.fitThresholds);
    if (r.engagementThresholds) setEngagementThresholds(r.engagementThresholds);
    if (r.thresholdNotes !== undefined) setThresholdNotes(r.thresholdNotes);
    if (r.salesNotify !== undefined) setSalesNotify(r.salesNotify);
    if (r.notifyTypes) setNotifyTypes(r.notifyTypes);
    else if (r.notifyType) setNotifyTypes([r.notifyType]);
    if (r.notifyEmails) setNotifyEmails(r.notifyEmails);
    else if (r.notifyEmail) setNotifyEmails([r.notifyEmail]);
    if (r.notifyOtherDescriptions) setNotifyOtherDescriptions(r.notifyOtherDescriptions);
    else if (r.notifyOtherDescription) setNotifyOtherDescriptions([r.notifyOtherDescription]);
    if (r.mqlCriteria !== undefined) setMqlCriteria(r.mqlCriteria);
    if (r.notifyFields) setNotifyFields(r.notifyFields);
    if (r.otherNotifyFields) setOtherNotifyFields(r.otherNotifyFields);
    else if (r.otherNotifyField) setOtherNotifyFields([r.otherNotifyField]);
  }, []);

  // ── Snapshot ──────────────────────────────────────────────────────────────
  const getSnapshot = useCallback(() => ({
    step, companyName,
    targetIndustries, targetSizes, targetTitles, targetLocations, targetRevenues,
    otherIndustries, otherTitles, otherLocations, icpNotes,
    fitCriteria, behaviorCriteria, fitNegativeCriteria, engagementNegativeCriteria,
    fitNotes, engagementNotes,
    decayPercent, decayMonths, decayNotes,
    fitThresholds, engagementThresholds, thresholdNotes,
    salesNotify, notifyTypes, notifyEmails, notifyOtherDescriptions, notifyFields, otherNotifyFields,
    mqlCriteria,
  }), [
    step, companyName, targetIndustries, targetSizes, targetTitles, targetLocations, targetRevenues,
    otherIndustries, otherTitles, otherLocations, icpNotes,
    fitCriteria, behaviorCriteria, fitNegativeCriteria, engagementNegativeCriteria,
    fitNotes, engagementNotes,
    decayPercent, decayMonths, decayNotes,
    fitThresholds, engagementThresholds, thresholdNotes, mqlCriteria,
    salesNotify, notifyTypes, notifyEmails, notifyOtherDescriptions, notifyFields, otherNotifyFields,
  ]);

  const handleSaveProgress = () => {
    const encoded = encodeState(getSnapshot());
    if (!encoded) return;
    const base = window.location.href.split("#")[0];
    const full = `${base}#${encoded}`;
    window.history.replaceState(null, "", `#${encoded}`);
    setSaveUrl(full);
    setShowSaveModal(true);
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const rawFitMax = fitCriteria.filter(r => r.included && r.points > 0).reduce((s,r) => s + r.points, 0);
  const rawEngMax = behaviorCriteria.filter(r => r.included).reduce((s,r) => s + r.points * r.maxTimes, 0);

  // Scores are always normalized to a max of 100 each
  const maxFitScore = rawFitMax > 0 ? 100 : 0;
  const maxEngagementScore = rawEngMax > 0 ? 100 : 0;
  const fitScale = rawFitMax > 0 ? 100 / rawFitMax : 1;
  const engScale = rawEngMax > 0 ? 100 / rawEngMax : 1;

  // Returns normalized display points for a criterion
  const normFit = (pts) => Math.round(pts * fitScale);
  const normEng = (pts) => Math.round(pts * engScale);

  const eFit = {
    A: fitThresholds.A ?? 70,
    B: fitThresholds.B ?? 50,
    C: fitThresholds.C ?? 30,
  };
  // Tier 1 = highest, Tier 3 = lowest
  const eEng = {
    T1: engagementThresholds.T1 ?? 70,
    T2: engagementThresholds.T2 ?? 50,
    T3: engagementThresholds.T3 ?? 30,
  };

  const canAdvance = () => {
    if (step === 0) return companyName.trim().length > 0;
    if (step === 1) return targetIndustries.length > 0 && targetSizes.length > 0 && targetTitles.length > 0 && targetLocations.length > 0 && targetRevenues.length > 0;
    if (step === 5) { // Thresholds + Notification (now step 5)
      if (salesNotify === null) return false;
      if (salesNotify === true) {
        if (notifyTypes.length === 0) return false;
        if (notifyTypes.includes("email") && notifyEmails.length === 0) return false;
        if (notifyTypes.includes("other") && notifyOtherDescriptions.length === 0) return false;
        if (notifyFields.length === 0) return false;
      }
      return true;
    }
    return true;
  };

  const toggle = (arr, setArr, i) => { const n=[...arr]; n[i]={...n[i],included:!n[i].included}; setArr(n); };
  const changePoints = (arr, setArr, i, v) => { const n=[...arr]; n[i]={...n[i],points:v}; setArr(n); };
  const changeMax = (arr, setArr, i, v) => { const n=[...arr]; n[i]={...n[i],maxTimes:v}; setArr(n); };
  const changeLabel = (arr, setArr, i, v) => { const n=[...arr]; n[i]={...n[i],label:v}; setArr(n); };
  const deleteRow = (arr, setArr, i) => setArr(arr.filter((_,idx) => idx !== i));
  const addRow = (arr, setArr, item) => setArr([...arr, item]);
  const toggleNotifyType = (val) => setNotifyTypes(p => p.includes(val) ? p.filter(x => x !== val) : [...p, val]);

  const progressPct = (step / (TOTAL_STEPS - 1)) * 100;

  const buildData = () => ({
    companyName,
    targetIndustries: [...targetIndustries.filter(i => i !== "Other"), ...otherIndustries],
    targetRevenues, targetSizes,
    targetTitles: [...targetTitles.filter(t => t !== "Other"), ...otherTitles],
    targetLocations: [...targetLocations.filter(l => l !== "Other"), ...otherLocations],
    icpNotes,
    fitCriteria: fitCriteria.map(r => ({...r, points: r.points < 0 ? -normFit(Math.abs(r.points)) : normFit(r.points)})),
    behaviorCriteria: behaviorCriteria.map(r => ({...r, points: normEng(r.points)})),
    fitNegativeCriteria: fitNegativeCriteria.map(r => ({...r, points: -normFit(Math.abs(r.points))})),
    engagementNegativeCriteria: engagementNegativeCriteria.map(r => ({...r, points: -normEng(Math.abs(r.points))})),
    decayPercent, decayMonths, decayNotes,
    fitThresholds: eFit, engagementThresholds: eEng,
    maxFitScore, maxEngagementScore,
    salesNotify, notifyTypes, notifyEmails, notifyOtherDescriptions, mqlCriteria,
    notifyFields: [...notifyFields.filter(f => f !== "Other"), ...otherNotifyFields],
    fitNotes, engagementNotes, thresholdNotes,
  });

  if (typeof window.XLSX === "undefined") {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    document.head.appendChild(s);
  }

  return (
    <div style={{fontFamily:"'DM Sans', 'Segoe UI', sans-serif",background:"#F6F4F0",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />

      {showSaveModal && <SaveProgressModal url={saveUrl} onClose={() => setShowSaveModal(false)} />}

      {/* Top bar */}
      <div style={{background:"#fff",borderBottom:"1px solid #E4E0D8",padding:"16px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{width:"36px",height:"36px",borderRadius:"8px",background:"#F8CD56",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px"}}>🎯</div>
          <div>
            <div style={{fontSize:"14px",fontWeight:"700",color:"#1A1A18",letterSpacing:"-0.2px"}}>Lead Scoring Builder</div>
            <div style={{fontSize:"11px",color:"#999"}}>Powered by ThinkFuel</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
          <button onClick={handleSaveProgress} style={{padding:"8px 16px",borderRadius:"8px",border:"1.5px solid #D8D5D0",background:"#fff",color:"#555",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"'DM Sans', sans-serif",display:"flex",alignItems:"center",gap:"6px"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#F8CD56";e.currentTarget.style.color="#1A1A18";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#D8D5D0";e.currentTarget.style.color="#555";}}>
            🔗 Save Progress
          </button>
          <div style={{fontSize:"12px",color:"#999"}}>Step {step+1} of {TOTAL_STEPS}</div>
        </div>
      </div>
      <div style={{height:"3px",background:"#E4E0D8"}}>
        <div style={{height:"100%",width:`${progressPct}%`,background:"#F8CD56",transition:"width 0.4s ease"}} />
      </div>

      <div style={{flex:1,display:"flex",justifyContent:"center",padding:"40px 20px"}}>
        <div style={{width:"100%",maxWidth:"640px"}}>

          {/* ── STEP 0: Welcome ─────────────────────────────────────────────── */}
          {step === 0 && (
            <div>
              <SectionLabel text="Welcome" />
              <h1 style={{margin:"0 0 12px",fontSize:"32px",fontFamily:"'DM Serif Display', serif",color:"#1A1A18",lineHeight:1.2}}>Let's build your lead scoring model.</h1>
              <p style={{margin:"0 0 32px",fontSize:"15px",color:"#666",lineHeight:1.7}}>
                This tool walks you through creating a lead scoring model that reflects your ideal customer — so HubSpot can surface the right leads at the right time.<br/><br/>
                Takes about <strong>5–10 minutes</strong>. At the end you'll get a ready-to-use spreadsheet and PDF.
              </p>
              <label style={{display:"block",fontSize:"13px",fontWeight:"600",color:"#333",marginBottom:"8px"}}>What's your company name?</label>
              <input value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="e.g. Acme Corp"
                style={{width:"100%",padding:"12px 16px",borderRadius:"10px",border:"2px solid #D8D5D0",fontSize:"15px",fontFamily:"'DM Sans', sans-serif",outline:"none",boxSizing:"border-box"}}
                onKeyDown={e=>e.key==="Enter"&&canAdvance()&&setStep(1)} />
            </div>
          )}

          {/* ── STEP 1: ICP ─────────────────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <SectionLabel text="Ideal Customer Profile" />
              <h2 style={{margin:"0 0 12px",fontSize:"28px",fontFamily:"'DM Serif Display', serif",color:"#1A1A18"}}>Who is your ideal customer?</h2>
              <p style={{margin:"0 0 28px",fontSize:"14px",color:"#666",lineHeight:1.7}}>Select all that apply. These become your <strong>demographic fit criteria</strong>.</p>

              {/* Industries */}
              <div style={{marginBottom:"24px"}}>
                <label style={{display:"block",fontSize:"13px",fontWeight:"600",color:"#333",marginBottom:"10px"}}>Target Industries</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
                  {INDUSTRIES.map(i=><Tag key={i} active={targetIndustries.includes(i)} onClick={()=>setTargetIndustries(p=>p.includes(i)?p.filter(x=>x!==i):[...p,i])}>{i}</Tag>)}
                </div>
                {targetIndustries.includes("Other") && (
                  <MultiOtherInput values={otherIndustries} setValues={setOtherIndustries} inputVal={otherIndustryInput} setInputVal={setOtherIndustryInput} placeholder="Add an industry..." />
                )}
              </div>

              {/* Company Sizes */}
              <div style={{marginBottom:"24px"}}>
                <label style={{display:"block",fontSize:"13px",fontWeight:"600",color:"#333",marginBottom:"10px"}}>Target Company Sizes</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
                  {COMPANY_SIZES.map(s=><Tag key={s} active={targetSizes.includes(s)} onClick={()=>setTargetSizes(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s])}>{s}</Tag>)}
                </div>
              </div>

              {/* Job Titles */}
              <div style={{marginBottom:"24px"}}>
                <label style={{display:"block",fontSize:"13px",fontWeight:"600",color:"#333",marginBottom:"10px"}}>Target Job Titles / Roles</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
                  {TITLES.map(t=><Tag key={t} active={targetTitles.includes(t)} onClick={()=>setTargetTitles(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])}>{t}</Tag>)}
                </div>
                {targetTitles.includes("Other") && (
                  <MultiOtherInput values={otherTitles} setValues={setOtherTitles} inputVal={otherTitleInput} setInputVal={setOtherTitleInput} placeholder="Add a custom job title or role..." />
                )}
              </div>

              {/* Locations */}
              <div style={{marginBottom:"24px"}}>
                <label style={{display:"block",fontSize:"13px",fontWeight:"600",color:"#333",marginBottom:"10px"}}>Target Company Locations</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
                  {NA_LOCATIONS.map(l=><Tag key={l} active={targetLocations.includes(l)} onClick={()=>setTargetLocations(p=>p.includes(l)?p.filter(x=>x!==l):[...p,l])}>{l}</Tag>)}
                </div>
                {targetLocations.includes("Other") && (
                  <MultiOtherInput values={otherLocations} setValues={setOtherLocations} inputVal={otherLocationInput} setInputVal={setOtherLocationInput} placeholder="Add a country or region..." />
                )}
              </div>

              {/* Revenue */}
              <div style={{marginBottom:"24px"}}>
                <label style={{display:"block",fontSize:"13px",fontWeight:"600",color:"#333",marginBottom:"10px"}}>Target Annual Revenue</label>
                <p style={{margin:"0 0 10px",fontSize:"12px",color:"#999"}}>Select "Any / Not a criteria" if revenue isn't a factor in your ICP.</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
                  {ANNUAL_REVENUES.map(r=><Tag key={r} active={targetRevenues.includes(r)} onClick={()=>setTargetRevenues(p=>p.includes(r)?p.filter(x=>x!==r):[...p,r])}>{r}</Tag>)}
                </div>
              </div>

              {/* ICP Notes */}
              <NotesField
                label="Notes"
                hint="Capture any context about your ICP — nuances, exceptions, or how this will be applied in HubSpot."
                value={icpNotes}
                onChange={setIcpNotes}
                placeholder="e.g. Primary ICP is SMB SaaS companies, secondary is mid-market professional services..."
              />
            </div>
          )}

          {/* ── STEP 2: Fit criteria + Fit Negatives ────────────────────────── */}
          {step === 2 && (
            <div>
              <SectionLabel text="Demographic / Fit Scoring" />
              <h2 style={{margin:"0 0 12px",fontSize:"28px",fontFamily:"'DM Serif Display', serif",color:"#1A1A18"}}>Score who they are.</h2>
              <p style={{margin:"0 0 8px",fontSize:"14px",color:"#666",lineHeight:1.7}}>Check the criteria that apply and adjust point values. Click any label to edit it.</p>
              <div style={{background:"#FFF8EC",border:"1px solid #F0D88A",borderRadius:"10px",padding:"10px 14px",marginBottom:"16px",fontSize:"12px",color:"#7A5C00"}}>
                💡 Fit criteria score once per contact. Enter relative weights — points are automatically normalized to a max of 100 in the final model.
              </div>
              <div style={cardStyle}>
                {fitCriteria.map((item,i)=>(
                  <CriteriaRow key={i} item={item} index={i} isNegative={item.points<0} showMax={false}
                    onToggle={idx=>toggle(fitCriteria,setFitCriteria,idx)}
                    onChange={(idx,val)=>changePoints(fitCriteria,setFitCriteria,idx,val)}
                    onChangeMax={(idx,val)=>changeMax(fitCriteria,setFitCriteria,idx,val)}
                    onChangeLabel={(idx,val)=>changeLabel(fitCriteria,setFitCriteria,idx,val)}
                    onDelete={idx=>deleteRow(fitCriteria,setFitCriteria,idx)} />
                ))}
                <AddCriteriaRow isNegative={false} showMax={false} onAdd={item=>addRow(fitCriteria,setFitCriteria,item)} />
              </div>
              <div style={{background:"#FFFAE8",borderRadius:"10px",padding:"12px 14px",fontSize:"12px",color:"#1A1A18",marginBottom:"8px"}}>
                ✅ Fit subtotal (positive): <strong>{fitCriteria.filter(r=>r.included&&r.points>0).reduce((s,r)=>s+r.points,0)} pts</strong>
              </div>

              <NegativeDivider title="Fit Negative Signals" />
              <p style={{margin:"0 0 12px",fontSize:"13px",color:"#666",lineHeight:1.6}}>These reduce a contact's score based on <strong>who they are</strong> — poor-fit indicators regardless of engagement. Click any label to edit it.</p>
              <div style={cardStyle}>
                {fitNegativeCriteria.map((item,i)=>(
                  <CriteriaRow key={i} item={item} index={i} isNegative={true} showMax={false}
                    onToggle={idx=>toggle(fitNegativeCriteria,setFitNegativeCriteria,idx)}
                    onChange={(idx,val)=>changePoints(fitNegativeCriteria,setFitNegativeCriteria,idx,val)}
                    onChangeMax={(idx,val)=>changeMax(fitNegativeCriteria,setFitNegativeCriteria,idx,val)}
                    onChangeLabel={(idx,val)=>changeLabel(fitNegativeCriteria,setFitNegativeCriteria,idx,val)}
                    onDelete={idx=>deleteRow(fitNegativeCriteria,setFitNegativeCriteria,idx)} />
                ))}
                <AddCriteriaRow isNegative={true} showMax={false} onAdd={item=>addRow(fitNegativeCriteria,setFitNegativeCriteria,item)} />
              </div>
              <div style={{background:"#FFF0EE",borderRadius:"10px",padding:"12px 14px",fontSize:"12px",color:"#C0392B",marginBottom:"20px"}}>
                ⛔ Fit negative subtotal: <strong>{fitNegativeCriteria.filter(r=>r.included).reduce((s,r)=>s+r.points,0)} pts</strong>
              </div>

              <NotesField
                label="Notes"
                hint="Capture any context about these criteria — how they'll be used in HubSpot, exceptions, etc."
                value={fitNotes}
                onChange={setFitNotes}
                placeholder="e.g. Job title match depends on the HubSpot contact property 'Job Title' being populated..."
              />
            </div>
          )}

          {/* ── STEP 3: Behavioural + Engagement Negatives ──────────────────── */}
          {step === 3 && (
            <div>
              <SectionLabel text="Behavioural Scoring" />
              <h2 style={{margin:"0 0 12px",fontSize:"28px",fontFamily:"'DM Serif Display', serif",color:"#1A1A18"}}>Score what they do.</h2>
              <p style={{margin:"0 0 8px",fontSize:"14px",color:"#666",lineHeight:1.7}}>High-intent actions like demo requests should score much higher than passive ones. The <strong>max×</strong> field limits how many times an action can score per contact. Click any label to edit it.</p>
              <div style={{background:"#FFF8EC",border:"1px solid #F0D88A",borderRadius:"10px",padding:"10px 14px",marginBottom:"16px",fontSize:"12px",color:"#7A5C00"}}>
                💡 Enter relative weights — points are automatically normalized to a max of 100 in the final model. The max× field limits how many times an action can score per contact.
              </div>
              <div style={cardStyle}>
                {behaviorCriteria.map((item,i)=>(
                  <CriteriaRow key={i} item={item} index={i} isNegative={false}
                    onToggle={idx=>toggle(behaviorCriteria,setBehaviorCriteria,idx)}
                    onChange={(idx,val)=>changePoints(behaviorCriteria,setBehaviorCriteria,idx,val)}
                    onChangeMax={(idx,val)=>changeMax(behaviorCriteria,setBehaviorCriteria,idx,val)}
                    onChangeLabel={(idx,val)=>changeLabel(behaviorCriteria,setBehaviorCriteria,idx,val)}
                    onDelete={idx=>deleteRow(behaviorCriteria,setBehaviorCriteria,idx)} />
                ))}
                <AddCriteriaRow isNegative={false} onAdd={item=>addRow(behaviorCriteria,setBehaviorCriteria,item)} />
              </div>
              <div style={{background:"#FFFAE8",borderRadius:"10px",padding:"12px 14px",fontSize:"12px",color:"#1A1A18",marginBottom:"8px"}}>
                ✅ Behaviour subtotal: <strong>{behaviorCriteria.filter(r=>r.included).reduce((s,r)=>s+r.points,0)} pts</strong>
              </div>

              <NegativeDivider title="Engagement Negative Signals" />
              <p style={{margin:"0 0 12px",fontSize:"13px",color:"#666",lineHeight:1.6}}>These reduce a contact's score based on <strong>how they engage</strong> — disengagement or signal quality issues. Click any label to edit it.</p>
              <div style={cardStyle}>
                {engagementNegativeCriteria.map((item,i)=>(
                  <CriteriaRow key={i} item={item} index={i} isNegative={true} showMax={true}
                    onToggle={idx=>toggle(engagementNegativeCriteria,setEngagementNegativeCriteria,idx)}
                    onChange={(idx,val)=>changePoints(engagementNegativeCriteria,setEngagementNegativeCriteria,idx,val)}
                    onChangeMax={(idx,val)=>changeMax(engagementNegativeCriteria,setEngagementNegativeCriteria,idx,val)}
                    onChangeLabel={(idx,val)=>changeLabel(engagementNegativeCriteria,setEngagementNegativeCriteria,idx,val)}
                    onDelete={idx=>deleteRow(engagementNegativeCriteria,setEngagementNegativeCriteria,idx)} />
                ))}
                <AddCriteriaRow isNegative={true} onAdd={item=>addRow(engagementNegativeCriteria,setEngagementNegativeCriteria,item)} />
              </div>
              <div style={{background:"#FFF0EE",borderRadius:"10px",padding:"12px 14px",fontSize:"12px",color:"#C0392B",marginBottom:"20px"}}>
                ⛔ Engagement negative subtotal: <strong>{engagementNegativeCriteria.filter(r=>r.included).reduce((s,r)=>s+r.points,0)} pts</strong>
              </div>

              <NotesField
                label="Notes"
                hint="Capture any context about these criteria — how they map to HubSpot activities, edge cases, etc."
                value={engagementNotes}
                onChange={setEngagementNotes}
                placeholder="e.g. 'Met at a trade show' maps to HubSpot Marketing Events integration..."
              />
            </div>
          )}

          {/* ── STEP 4: Score Decay (moved before thresholds) ───────────────── */}
          {step === 4 && (
            <div>
              <SectionLabel text="Score Decay" />
              <h2 style={{margin:"0 0 12px",fontSize:"28px",fontFamily:"'DM Serif Display', serif",color:"#1A1A18"}}>Set your score decay.</h2>
              <p style={{margin:"0 0 16px",fontSize:"14px",color:"#666",lineHeight:1.7}}>
                In HubSpot, <strong>score decay decreases scores incrementally over time</strong>. This keeps scores fresh and prevents old activity from keeping a contact as a hot lead indefinitely.
              </p>
              <div style={{background:"#EBF5FB",border:"1px solid #AED6F1",borderRadius:"10px",padding:"12px 14px",marginBottom:"20px",fontSize:"12px",color:"#1A5276",lineHeight:1.65}}>
                <strong>ℹ️ Decay applies to Engagement scores only.</strong> Fit scores (based on who someone is — job title, industry, company size) don't decay, since those attributes don't change with time.
              </div>
              <div style={{background:"#FFFAE8",border:"1px solid #F0D4A0",borderRadius:"10px",padding:"14px 16px",marginBottom:"24px",fontSize:"13px",color:"#7A5C00",lineHeight:1.7}}>
                <strong>How decay works:</strong> Points are gradually reduced starting at your decay period.<br/>
                With <strong>{decayPercent}% decay at {decayMonths} months</strong>:<br/>
                • Points added {decayMonths} months ago will have dropped by <strong>{decayPercent}%</strong><br/>
                • Points added {decayMonths*2} months ago will have dropped to <strong>zero</strong>
              </div>
              <div style={cardStyle}>
                <div style={{marginBottom:"24px"}}>
                  <label style={{display:"block",fontSize:"13px",fontWeight:"600",color:"#333",marginBottom:"12px"}}>Decay percentage</label>
                  <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
                    <input type="range" min={10} max={100} step={5} value={decayPercent} onChange={e=>setDecayPercent(parseInt(e.target.value))} style={{flex:1,accentColor:"#F8CD56"}}/>
                    <div style={{fontSize:"24px",fontWeight:"700",color:"#1A1A18",minWidth:"60px",textAlign:"right",fontFamily:"monospace"}}>{decayPercent}%</div>
                  </div>
                </div>
                <div>
                  <label style={{display:"block",fontSize:"13px",fontWeight:"600",color:"#333",marginBottom:"12px"}}>Decay period</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
                    {[3,6,9,12,18,24].map(m=>(
                      <button key={m} onClick={()=>setDecayMonths(m)} style={{padding:"10px 18px",borderRadius:"20px",border:`2px solid ${decayMonths===m?"#F8CD56":"#D8D5D0"}`,background:decayMonths===m?"#F8CD56":"#FAFAF8",color:"#1A1A18",fontSize:"13px",cursor:"pointer",fontFamily:"'DM Sans', sans-serif",fontWeight:decayMonths===m?"700":"400"}}>{m} months</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{background:"#F8CD56",borderRadius:"10px",padding:"14px 16px",fontSize:"13px",color:"#1A1A18",lineHeight:1.7,marginBottom:"20px"}}>
                <strong>Your decay setting:</strong> {decayPercent}% at {decayMonths} months → scores reach zero at {decayMonths*2} months
              </div>

              <NotesField
                label="Notes"
                hint="Capture any context about your decay settings — rationale, exceptions, or how this will be configured in HubSpot."
                value={decayNotes}
                onChange={setDecayNotes}
                placeholder="e.g. Chose 12 months based on our typical sales cycle length. May revisit after 90 days of data..."
              />
            </div>
          )}

          {/* ── STEP 5: Set Your Thresholds + Sales Notification ─────────────── */}
          {step === 5 && (
            <div>
              <SectionLabel text="Thresholds & Notifications" />
              <h2 style={{margin:"0 0 12px",fontSize:"28px",fontFamily:"'DM Serif Display', serif",color:"#1A1A18"}}>Set your thresholds.</h2>
              <p style={{margin:"0 0 16px",fontSize:"14px",color:"#666",lineHeight:1.7}}>
                Set separate thresholds for fit and engagement scores. These combine into categories like <strong>A1</strong> (High Fit + Highest Engagement) that you can use in HubSpot workflows and views.
              </p>

              <div style={{background:"#EBF5FB",border:"1px solid #AED6F1",borderRadius:"10px",padding:"12px 14px",marginBottom:"20px",fontSize:"12px",color:"#1A5276",lineHeight:1.65}}>
                <strong>ℹ️ About HubSpot scores:</strong> Your scores don't need to add up to 100. HubSpot's classic scoring used a 0–100 scale but that's a legacy behaviour — modern HubSpot scoring supports any point range. Set thresholds based on what's meaningful for your business.
              </div>

              {/* Fit Thresholds */}
              <div style={{...cardStyle,marginBottom:"16px"}}>
                <p style={{...subLabel,marginBottom:"4px"}}>Fit Score Tiers</p>
                <p style={{margin:"0 0 14px",fontSize:"12px",color:"#999"}}>
                  <strong>A = High, B = Medium, C = Low</strong>
                  {rawFitMax > 0 ? " · Scores are normalized to a max of 100" : " · Enable fit criteria on step 2 to see your max score"}
                </p>
                {[
                  { key:"A", label:"A — High Fit" },
                  { key:"B", label:"B — Medium Fit" },
                  { key:"C", label:"C — Low Fit" },
                ].map(({ key, label }) => {
                  const val = eFit[key];
                  return (
                    <div key={key} style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"10px",padding:"12px 14px",borderRadius:"8px",background:"#FAFAF8",border:"1px solid #E4E0D8"}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:"14px",fontWeight:"700",color:"#1A1A18"}}>{label}</div>
                        <div style={{fontSize:"11px",color:"#aaa",marginTop:"2px"}}>{val} out of 100</div>
                      </div>
                      <span style={{fontSize:"13px",color:"#666"}}>≥</span>
                      <input type="number" value={val} min={0} max={100}
                        onChange={e=>setFitThresholds(prev=>({...prev,[key]:parseInt(e.target.value)||0}))}
                        style={{width:"64px",padding:"7px 8px",borderRadius:"8px",border:"1.5px solid #D0D0CC",fontSize:"15px",fontFamily:"monospace",textAlign:"center",fontWeight:"700",outline:"none"}} />
                      <span style={{fontSize:"12px",color:"#999"}}>pts</span>
                    </div>
                  );
                })}
              </div>

              {/* Engagement Thresholds — Tier 1 = highest */}
              <div style={{...cardStyle,marginBottom:"16px"}}>
                <p style={{...subLabel,marginBottom:"4px"}}>Engagement Score Tiers</p>
                <p style={{margin:"0 0 14px",fontSize:"12px",color:"#999"}}>
                  <strong>Tier 1 = Highest, Tier 3 = Lowest</strong>
                  {rawEngMax > 0 ? " · Scores are normalized to a max of 100" : " · Enable engagement criteria on step 3 to see your max score"}
                </p>
                {[
                  { key:"T1", label:"Tier 1 — Highest" },
                  { key:"T2", label:"Tier 2 — Medium" },
                  { key:"T3", label:"Tier 3 — Lowest" },
                ].map(({ key, label }) => {
                  const val = eEng[key];
                  return (
                    <div key={key} style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"10px",padding:"12px 14px",borderRadius:"8px",background:"#FAFAF8",border:"1px solid #E4E0D8"}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:"14px",fontWeight:"700",color:"#1A1A18"}}>{label}</div>
                        <div style={{fontSize:"11px",color:"#aaa",marginTop:"2px"}}>{val} out of 100</div>
                      </div>
                      <span style={{fontSize:"13px",color:"#666"}}>≥</span>
                      <input type="number" value={val} min={0} max={100}
                        onChange={e=>setEngagementThresholds(prev=>({...prev,[key]:parseInt(e.target.value)||0}))}
                        style={{width:"64px",padding:"7px 8px",borderRadius:"8px",border:"1.5px solid #D0D0CC",fontSize:"15px",fontFamily:"monospace",textAlign:"center",fontWeight:"700",outline:"none"}} />
                      <span style={{fontSize:"12px",color:"#999"}}>pts</span>
                    </div>
                  );
                })}
              </div>

              {/* Matrix preview */}
              <div style={{...cardStyle,marginBottom:"20px"}}>
                <p style={subLabel}>How categories combine</p>
                <p style={{margin:"0 0 14px",fontSize:"12px",color:"#999"}}>Fit tier + Engagement tier → Category. Use these in HubSpot workflows, views, and segments.</p>
                <div style={{overflowX:"auto"}}>
                  <table style={{borderCollapse:"collapse",width:"100%",fontSize:"13px"}}>
                    <thead>
                      <tr>
                        <th style={{padding:"8px 10px",background:"#F6F4F0",border:"1px solid #E4E0D8",fontSize:"11px",color:"#999",fontWeight:"600",textAlign:"left"}}></th>
                        {["Tier 3 (Lowest)","Tier 2","Tier 1 (Highest)"].map(t=>(
                          <th key={t} style={{padding:"8px 10px",background:"#F6F4F0",border:"1px solid #E4E0D8",fontSize:"11px",color:"#666",fontWeight:"600",textAlign:"center"}}>{t}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[{fit:"A",label:"A — High Fit"},{fit:"B",label:"B — Medium Fit"},{fit:"C",label:"C — Low Fit"}].map(({fit,label})=>(
                        <tr key={fit}>
                          <td style={{padding:"8px 10px",background:"#F6F4F0",border:"1px solid #E4E0D8",fontSize:"12px",fontWeight:"700",whiteSpace:"nowrap"}}>{label}</td>
                          {[3,2,1].map(n=>(
                            <td key={n} style={{padding:"10px",border:"1px solid #E4E0D8",textAlign:"center",fontWeight:"700",fontSize:"14px",color:"#1A1A18",background:"#fff"}}>{fit}{n}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MQL Threshold Notification + Sales Notification (combined card) */}
              <div style={{...cardStyle,marginBottom:"20px"}}>
                <p style={{...subLabel,marginBottom:"4px"}}>MQL Threshold Notification</p>
                <p style={{margin:"0 0 12px",fontSize:"13px",color:"#666",lineHeight:1.6}}>Define when a contact is considered an MQL (Marketing Qualified Lead) based on their score combination.</p>
                <label style={{display:"block",fontSize:"13px",fontWeight:"600",color:"#333",marginBottom:"8px"}}>When is a contact considered an MQL?</label>
                <input value={mqlCriteria} onChange={e=>setMqlCriteria(e.target.value)} placeholder="e.g. Fit tier A or B AND Engagement Tier 1 or 2 (i.e. A1, A2, B1, B2)"
                  style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:"1.5px solid #D8D5D0",fontSize:"13px",fontFamily:"'DM Sans', sans-serif",boxSizing:"border-box",outline:"none",marginBottom:"20px"}} />

                <div style={{height:"1px",background:"#E4E0D8",margin:"4px 0 20px"}} />

                <p style={{margin:"0 0 14px",fontSize:"14px",fontWeight:"700",color:"#1A1A18"}}>Should sales be notified when a contact reaches an MQL threshold?</p>
                <div style={{display:"flex",gap:"10px",marginBottom:"16px"}}>
                  {[{label:"Yes",val:true},{label:"No",val:false}].map(({label,val})=>(
                    <button key={String(val)} onClick={()=>{setSalesNotify(val);if(!val){setNotifyTypes([]);setNotifyEmails([]);setNotifyEmailInput("");setNotifyOtherDescriptions([]);setNotifyOtherDescriptionInput("");setNotifyFields([]);setOtherNotifyFields([]);}}}
                      style={{flex:1,padding:"12px",borderRadius:"10px",border:`2px solid ${salesNotify===val?"#F8CD56":"#D8D5D0"}`,background:salesNotify===val?"#FFFAE8":"#fff",cursor:"pointer",fontFamily:"'DM Sans', sans-serif",fontSize:"14px",fontWeight:"600",color:"#1A1A18"}}>{label}</button>
                  ))}
                </div>

                {salesNotify===true&&(
                  <div>
                    <p style={{margin:"0 0 10px",fontSize:"13px",fontWeight:"600",color:"#333"}}>Who should the notification go to? <span style={{fontWeight:"400",color:"#999"}}>(select all that apply)</span></p>
                    <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"16px"}}>
                      {[
                        {label:"Contact Owner",val:"owner"},
                        {label:"A specific email address",val:"email"},
                        {label:"Other (e.g. Sales Owner property)",val:"other"},
                      ].map(({label,val})=>(
                        <button key={val} onClick={()=>toggleNotifyType(val)}
                          style={{flex:1,minWidth:"160px",padding:"11px 12px",borderRadius:"10px",border:`2px solid ${notifyTypes.includes(val)?"#F8CD56":"#D8D5D0"}`,background:notifyTypes.includes(val)?"#FFFAE8":"#fff",cursor:"pointer",fontFamily:"'DM Sans', sans-serif",fontSize:"13px",fontWeight:"600",color:"#1A1A18",textAlign:"center"}}>{label}</button>
                      ))}
                    </div>

                    {notifyTypes.includes("email")&&(
                      <div style={{marginBottom:"16px"}}>
                        <label style={{display:"block",fontSize:"13px",fontWeight:"600",color:"#333",marginBottom:"8px"}}>Notification email address(es)</label>
                        <MultiOtherInput
                          values={notifyEmails}
                          setValues={setNotifyEmails}
                          inputVal={notifyEmailInput}
                          setInputVal={setNotifyEmailInput}
                          placeholder="e.g. sales@company.com"
                        />
                      </div>
                    )}

                    {notifyTypes.includes("other")&&(
                      <div style={{marginBottom:"16px"}}>
                        <label style={{display:"block",fontSize:"13px",fontWeight:"600",color:"#333",marginBottom:"8px"}}>Who should the notification go to?</label>
                        <p style={{margin:"0 0 8px",fontSize:"12px",color:"#999"}}>e.g. "Sales Owner property on the contact record" or "Slack integration via HubSpot workflow".</p>
                        <MultiOtherInput
                          values={notifyOtherDescriptions}
                          setValues={setNotifyOtherDescriptions}
                          inputVal={notifyOtherDescriptionInput}
                          setInputVal={setNotifyOtherDescriptionInput}
                          placeholder="e.g. Sales Owner property (HubSpot user property)"
                        />
                      </div>
                    )}

                    {notifyTypes.length>0&&(
                      <div>
                        <p style={{margin:"0 0 10px",fontSize:"13px",fontWeight:"600",color:"#333"}}>What contact info should be included?</p>
                        <p style={{margin:"0 0 12px",fontSize:"12px",color:"#999"}}>Select all that apply</p>
                        <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
                          {["First Name","Last Name","Email","Phone Number","Company Name","Job Title","HubSpot Score","Lifecycle Stage","Last Activity Date","Other"].map(field=>{
                            const active=notifyFields.includes(field);
                            return <button key={field} onClick={()=>setNotifyFields(p=>p.includes(field)?p.filter(f=>f!==field):[...p,field])}
                              style={{padding:"8px 14px",borderRadius:"20px",border:`2px solid ${active?"#F8CD56":"#D8D5D0"}`,background:active?"#F8CD56":"#FAFAF8",color:"#1A1A18",fontSize:"13px",cursor:"pointer",fontFamily:"'DM Sans', sans-serif",fontWeight:active?"600":"400"}}>{field}</button>;
                          })}
                        </div>
                        {notifyFields.includes("Other")&&(
                          <div style={{marginTop:"10px"}}>
                            {otherNotifyFields.length > 0 && (
                              <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"8px"}}>
                                {otherNotifyFields.map((f,i)=>(
                                  <span key={i} style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"5px 10px 5px 12px",borderRadius:"20px",background:"#F8CD56",fontSize:"13px",fontWeight:"600",color:"#1A1A18"}}>
                                    {f}
                                    <button onClick={()=>setOtherNotifyFields(p=>p.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",fontSize:"12px",padding:"0 2px",color:"#7A5C00",lineHeight:1}}>✕</button>
                                  </span>
                                ))}
                              </div>
                            )}
                            <div style={{display:"flex",gap:"8px"}}>
                              <input value={otherNotifyFieldInput} onChange={e=>setOtherNotifyFieldInput(e.target.value)}
                                onKeyDown={e=>{if(e.key==="Enter"&&otherNotifyFieldInput.trim()){setOtherNotifyFields(p=>[...p,otherNotifyFieldInput.trim()]);setOtherNotifyFieldInput("");}}}
                                placeholder="Add a custom field..."
                                style={{flex:1,padding:"9px 12px",borderRadius:"8px",border:"1px solid #D8D5D0",fontSize:"13px",fontFamily:"'DM Sans', sans-serif",outline:"none"}} />
                              <button onClick={()=>{if(otherNotifyFieldInput.trim()){setOtherNotifyFields(p=>[...p,otherNotifyFieldInput.trim()]);setOtherNotifyFieldInput("");}}}
                                style={{padding:"9px 14px",borderRadius:"8px",background:"#F8CD56",border:"none",fontSize:"18px",lineHeight:1,cursor:"pointer",fontWeight:"700"}}>+</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Threshold Notes */}
              <NotesField
                label="Notes"
                hint="How will these thresholds be used? e.g. which categories trigger workflows, which appear in views, how sales will use the tiers."
                value={thresholdNotes}
                onChange={setThresholdNotes}
                placeholder="e.g. A1 and A2 contacts go directly to sales. B1 contacts enter a nurture sequence. C-tier contacts stay in marketing..."
              />
            </div>
          )}

          {/* ── STEP 6: Summary + Download ───────────────────────────────────── */}
          {step === 6 && (
            <div>
              <SectionLabel text="Your Lead Scoring Model" />
              <h2 style={{margin:"0 0 6px",fontSize:"28px",fontFamily:"'DM Serif Display', serif",color:"#1A1A18"}}>Here's what you're scoring.</h2>
              <p style={{margin:"0 0 24px",fontSize:"14px",color:"#666",lineHeight:1.7}}>Review your model below and download when you're ready. Share with your ThinkFuel specialist to get it set up in HubSpot.</p>

              <div style={{background:"#F8CD56",borderRadius:"12px",padding:"20px",marginBottom:"16px"}}>
                <div style={{fontSize:"13px",fontWeight:"700",color:"#1A1A18",marginBottom:"4px"}}>{companyName}</div>
                <div style={{fontSize:"11px",color:"#7A5C00",marginBottom:"16px"}}>Lead Scoring Model · Generated by ThinkFuel</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                  {[
                    {label:"Max Fit Score",val:`${maxFitScore} pts`},
                    {label:"Max Engagement Score",val:`${maxEngagementScore} pts`},
                    {label:"Score Decay",val:`${decayPercent}% at ${decayMonths} mo`},
                    {label:"MQL Threshold",val:mqlCriteria||"—"},
                  ].map(({label,val})=>(
                    <div key={label} style={{background:"rgba(0,0,0,0.08)",borderRadius:"8px",padding:"10px 12px"}}>
                      <div style={{fontSize:"11px",color:"#7A5C00",marginBottom:"2px"}}>{label}</div>
                      <div style={{fontSize:"15px",fontWeight:"700",color:"#1A1A18"}}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Threshold matrix summary — moved to bottom */}

              <div style={cardStyle}>
                <p style={subLabel}>Ideal Customer Profile</p>
                {[
                  {label:"Industries",val:[...targetIndustries.filter(i=>i!=="Other"),...otherIndustries].join(", ")||"—"},
                  {label:"Company Sizes",val:targetSizes.join(", ")||"—"},
                  {label:"Job Titles",val:[...targetTitles.filter(t=>t!=="Other"),...otherTitles].join(", ")||"—"},
                  {label:"Locations",val:[...targetLocations.filter(l=>l!=="Other"),...otherLocations].join(", ")||"—"},
                  {label:"Annual Revenue",val:targetRevenues.join(", ")||"—"},
                ].map(({label,val})=>(
                  <div key={label} style={{display:"flex",gap:"12px",marginBottom:"8px",fontSize:"13px"}}>
                    <span style={{minWidth:"110px",color:"#999"}}>{label}</span>
                    <span style={{color:"#1A1A18",fontWeight:"500"}}>{val}</span>
                  </div>
                ))}
                {icpNotes.trim()&&<div style={{marginTop:"12px",padding:"10px 12px",background:"#F6F4F0",borderRadius:"8px",fontSize:"12px",color:"#666",lineHeight:1.6,whiteSpace:"pre-wrap"}}><strong style={{color:"#999"}}>Notes:</strong> {icpNotes}</div>}
              </div>

              {fitCriteria.filter(r=>r.included).length>0&&(
                <div style={cardStyle}>
                  <p style={subLabel}>Demographic / Fit <span style={{fontWeight:"400",color:"#aaa",textTransform:"none",letterSpacing:0,fontSize:"11px"}}>(normalized to 100 pts max)</span></p>
                  {fitCriteria.filter(r=>r.included).map((r,i,arr)=>{
                    const norm = r.points < 0 ? -normFit(Math.abs(r.points)) : normFit(r.points);
                    return (
                      <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<arr.length-1?"1px solid #F0EDE8":"none"}}>
                        <span style={{fontSize:"13px",color:"#333"}}>{r.label}</span>
                        <span style={{fontSize:"13px",fontWeight:"700",fontFamily:"monospace",color:norm<0?"#C0392B":"#1A1A18",flexShrink:0,marginLeft:"12px"}}>{norm<0?`-${Math.abs(norm)}`:`+${norm}`} pts</span>
                      </div>
                    );
                  })}
                  {fitNotes.trim()&&<div style={{marginTop:"12px",padding:"10px 12px",background:"#F6F4F0",borderRadius:"8px",fontSize:"12px",color:"#666",lineHeight:1.6,whiteSpace:"pre-wrap"}}><strong style={{color:"#999"}}>Notes:</strong> {fitNotes}</div>}
                </div>
              )}

              {behaviorCriteria.filter(r=>r.included).length>0&&(
                <div style={cardStyle}>
                  <p style={subLabel}>Behavioural / Engagement <span style={{fontWeight:"400",color:"#aaa",textTransform:"none",letterSpacing:0,fontSize:"11px"}}>(normalized to 100 pts max)</span></p>
                  {behaviorCriteria.filter(r=>r.included).map((r,i,arr)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<arr.length-1?"1px solid #F0EDE8":"none"}}>
                      <span style={{fontSize:"13px",color:"#333"}}>{r.label}</span>
                      <div style={{display:"flex",gap:"10px",alignItems:"center",flexShrink:0,marginLeft:"12px"}}>
                        <span style={{fontSize:"11px",color:"#aaa"}}>max {r.maxTimes}x</span>
                        <span style={{fontSize:"13px",fontWeight:"700",fontFamily:"monospace",color:"#1A1A18"}}>+{normEng(r.points)} pts</span>
                      </div>
                    </div>
                  ))}
                  {engagementNotes.trim()&&<div style={{marginTop:"12px",padding:"10px 12px",background:"#F6F4F0",borderRadius:"8px",fontSize:"12px",color:"#666",lineHeight:1.6,whiteSpace:"pre-wrap"}}><strong style={{color:"#999"}}>Notes:</strong> {engagementNotes}</div>}
                </div>
              )}

              {[...fitNegativeCriteria,...engagementNegativeCriteria].filter(r=>r.included).length>0&&(
                <div style={cardStyle}>
                  <p style={{...subLabel,color:"#C0392B"}}>Negative Signals</p>
                  {fitNegativeCriteria.filter(r=>r.included).map((r,i)=>(
                    <div key={`fn${i}`} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #F0EDE8"}}>
                      <span style={{fontSize:"13px",color:"#333"}}>{r.label}</span>
                      <span style={{fontSize:"13px",fontWeight:"700",fontFamily:"monospace",color:"#C0392B",flexShrink:0,marginLeft:"12px"}}>-{normFit(Math.abs(r.points))} pts</span>
                    </div>
                  ))}
                  {engagementNegativeCriteria.filter(r=>r.included).map((r,i,arr)=>(
                    <div key={`en${i}`} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<arr.length-1?"1px solid #F0EDE8":"none"}}>
                      <span style={{fontSize:"13px",color:"#333"}}>{r.label}</span>
                      <div style={{display:"flex",gap:"10px",alignItems:"center",flexShrink:0,marginLeft:"12px"}}>
                        <span style={{fontSize:"11px",color:"#aaa"}}>max {r.maxTimes}x</span>
                        <span style={{fontSize:"13px",fontWeight:"700",fontFamily:"monospace",color:"#C0392B"}}>-{normEng(Math.abs(r.points))} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={cardStyle}>
                <p style={subLabel}>Thresholds, Decay & Notifications</p>

                {/* Score Thresholds */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"14px"}}>
                  <div>
                    <p style={{margin:"0 0 8px",fontSize:"11px",fontWeight:"700",color:"#999",textTransform:"uppercase",letterSpacing:"1px"}}>Fit Tiers (A=High, B=Med, C=Low)</p>
                    {[["A — High",eFit.A],["B — Medium",eFit.B],["C — Low",eFit.C]].map(([l,v])=>(
                      <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:"13px",padding:"4px 0",borderBottom:"1px solid #F0EDE8"}}>
                        <span style={{color:"#333"}}>{l}</span><span style={{fontWeight:"700",fontFamily:"monospace"}}>≥ {v} pts</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p style={{margin:"0 0 8px",fontSize:"11px",fontWeight:"700",color:"#999",textTransform:"uppercase",letterSpacing:"1px"}}>Engagement Tiers (1=Highest)</p>
                    {[["Tier 1",eEng.T1],["Tier 2",eEng.T2],["Tier 3",eEng.T3]].map(([l,v])=>(
                      <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:"13px",padding:"4px 0",borderBottom:"1px solid #F0EDE8"}}>
                        <span style={{color:"#333"}}>{l}</span><span style={{fontWeight:"700",fontFamily:"monospace"}}>≥ {v} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{overflowX:"auto",marginBottom:"16px"}}>
                  <table style={{borderCollapse:"collapse",width:"100%",fontSize:"12px"}}>
                    <thead>
                      <tr>
                        <th style={{padding:"6px 8px",background:"#F6F4F0",border:"1px solid #E4E0D8",color:"#999",fontWeight:"600"}}></th>
                        {["Tier 3 (Lowest)","Tier 2","Tier 1 (Highest)"].map(t=><th key={t} style={{padding:"6px 8px",background:"#F6F4F0",border:"1px solid #E4E0D8",color:"#666",fontWeight:"600",textAlign:"center"}}>{t}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {[{fit:"A",label:"A (High)"},{fit:"B",label:"B (Med)"},{fit:"C",label:"C (Low)"}].map(({fit,label})=>(
                        <tr key={fit}>
                          <td style={{padding:"6px 8px",background:"#F6F4F0",border:"1px solid #E4E0D8",fontWeight:"700",whiteSpace:"nowrap"}}>{label}</td>
                          {[3,2,1].map(n=><td key={n} style={{padding:"8px",border:"1px solid #E4E0D8",textAlign:"center",fontWeight:"700",fontSize:"13px",background:"#fff"}}>{fit}{n}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{height:"1px",background:"#E4E0D8",margin:"4px 0 16px"}} />

                {/* Score Decay */}
                <p style={{...subLabel,marginBottom:"8px"}}>Score Decay</p>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"13px",padding:"4px 0",borderBottom:"1px solid #F0EDE8"}}>
                  <span style={{color:"#333"}}>Decay rate</span>
                  <span style={{fontWeight:"700",fontFamily:"monospace"}}>{decayPercent}% at {decayMonths} months</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"13px",padding:"4px 0",borderBottom:"1px solid #F0EDE8"}}>
                  <span style={{color:"#333"}}>Reaches zero</span>
                  <span style={{fontWeight:"700",fontFamily:"monospace"}}>{decayMonths * 2} months</span>
                </div>
                <div style={{fontSize:"12px",color:"#999",marginTop:"6px",marginBottom:"8px"}}>Applies to Engagement score only</div>
                {decayNotes?.trim()&&<div style={{marginBottom:"8px",padding:"10px 12px",background:"#F6F4F0",borderRadius:"8px",fontSize:"12px",color:"#666",lineHeight:1.6,whiteSpace:"pre-wrap"}}><strong style={{color:"#999"}}>Notes:</strong> {decayNotes}</div>}

                <div style={{height:"1px",background:"#E4E0D8",margin:"8px 0 16px"}} />

                {/* Notifications */}
                <p style={{...subLabel,marginBottom:"8px"}}>Notifications</p>
                {mqlCriteria?.trim()&&(
                  <div style={{marginBottom:"12px",padding:"10px 12px",background:"#FFFAE8",borderRadius:"8px",fontSize:"13px",color:"#1A1A18",lineHeight:1.6}}>
                    <strong style={{color:"#7A5C00"}}>MQL Threshold:</strong> {mqlCriteria}
                  </div>
                )}
                <div style={{fontSize:"13px",padding:"4px 0",borderBottom:"1px solid #F0EDE8",marginBottom:"8px"}}>
                  <span style={{color:"#999",fontSize:"11px",fontWeight:"700",textTransform:"uppercase",letterSpacing:"1px"}}>Sales Notification</span>
                  <div style={{marginTop:"4px",color:"#333"}}>{salesNotify ? (notifyTypes.map(t=>t==="owner"?"Contact Owner":t==="other"?`Other: ${notifyOtherDescriptions.join(", ")||"—"}`:notifyEmails.join(", ")||"—").join(", ")) : "None"}</div>
                </div>
                {thresholdNotes?.trim()&&<div style={{padding:"10px 12px",background:"#F6F4F0",borderRadius:"8px",fontSize:"12px",color:"#666",lineHeight:1.6,whiteSpace:"pre-wrap"}}><strong style={{color:"#999"}}>Notes:</strong> {thresholdNotes}</div>}
              </div>

              <button onClick={()=>{const d=buildData();exportToXLSX(d);}}
                style={{width:"100%",padding:"16px",borderRadius:"12px",background:"#F8CD56",border:"none",color:"#1A1A18",fontSize:"15px",fontWeight:"700",cursor:"pointer",fontFamily:"'DM Sans', sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",marginBottom:"10px"}}>
                📊 Download Spreadsheet (.xlsx)
              </button>
              <button onClick={()=>{const d=buildData();exportToHTML(d);}}
                style={{width:"100%",padding:"16px",borderRadius:"12px",background:"#1A1A18",border:"none",color:"#F8CD56",fontSize:"15px",fontWeight:"700",cursor:"pointer",fontFamily:"'DM Sans', sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px"}}>
                📄 Download Summary (.html)
              </button>
              <p style={{textAlign:"center",fontSize:"12px",color:"#999",marginTop:"10px"}}>Open the .html file in any browser to print or save as PDF</p>
            </div>
          )}

          {/* Navigation */}
          <div style={{display:"flex",gap:"12px",marginTop:"32px"}}>
            {step>0&&(
              <button onClick={()=>setStep(step-1)} style={{padding:"12px 20px",borderRadius:"10px",border:"1px solid #D8D5D0",background:"#fff",color:"#666",fontSize:"14px",cursor:"pointer",fontFamily:"'DM Sans', sans-serif"}}>← Back</button>
            )}
            {step<TOTAL_STEPS-1&&(
              <button onClick={()=>canAdvance()&&setStep(step+1)} disabled={!canAdvance()}
                style={{flex:1,padding:"12px 24px",borderRadius:"10px",border:"none",background:canAdvance()?"#F8CD56":"#C8C8C4",color:canAdvance()?"#1A1A18":"#fff",fontSize:"14px",fontWeight:"700",cursor:canAdvance()?"pointer":"not-allowed",fontFamily:"'DM Sans', sans-serif",transition:"background 0.15s"}}>Continue →</button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
