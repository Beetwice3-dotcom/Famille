import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

const firebaseConfig = {
  databaseURL: "https://famille-a1185-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const PARENTS = [
  { id: "kim",  label: "Maman Kim",  emoji: "🌸", color: "#E8557A" },
  { id: "jade", label: "Maman Jade", emoji: "🌿", color: "#3BAA8C" },
];

const INITIAL_DATA = {
  taches: [
    { id: 1, text: "Rendez-vous médecin Noah", done: false, who: "Noah", by: "kim", at: Date.now() },
    { id: 2, text: "Payer école de soccer Léo", done: false, who: "Léo", by: "jade", at: Date.now() },
  ],
  epicerie: [
    { id: 1, text: "Yogourt grec", done: false, qty: "2", by: "kim", at: Date.now() },
    { id: 2, text: "Lait", done: false, qty: "2L", by: "jade", at: Date.now() },
  ],
  agenda: [
    { id: 1, jour: "Lun", date: "09", event: "Soccer Léo", heure: "17h30", color: "#FF6B35", by: "jade" },
    { id: 2, jour: "Mar", date: "10", event: "Natation Noah", heure: "16h00", color: "#4ECDC4", by: "kim" },
  ],
  notes: [
    { id: 1, text: "Noah allergique aux arachides", color: "#FFE66D", by: "kim" },
    { id: 2, text: "Léo a besoin d'une tenue de sport chaque jeudi", color: "#A8DADC", by: "jade" },
  ],
  lastUpdatedBy: null,
  lastUpdatedAt: null,
};

const tabs = [
  { id: "accueil",  label: "🏠", name: "Accueil"  },
  { id: "taches",   label: "✅", name: "Tâches"   },
  { id: "epicerie", label: "🛒", name: "Épicerie" },
  { id: "agenda",   label: "📅", name: "Agenda"   },
  { id: "notes",    label: "📝", name: "Notes"    },
];

const NOTE_COLORS = ["#FFE66D", "#A8DADC", "#FFB3C6", "#B5EAD7", "#FFDAC1"];
const EVENT_COLORS = ["#FF6B35", "#4ECDC4", "#C3A6FF", "#FFB347", "#A8DADC"];

function parentInfo(id) { return PARENTS.find(p => p.id === id) || PARENTS[0]; }
function timeAgo(ts) {
  if (!ts) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s/60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s/3600)}h`;
  return `il y a ${Math.floor(s/86400)}j`;
}

export default function FamilleApp() {
  const [parent, setParent] = useState(null);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("accueil");
  const [toast, setToast] = useState(null);
  const [newTache, setNewTache] = useState("");
  const [newWho, setNewWho] = useState("Les deux");
  const [newEpicerie, setNewEpicerie] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newEvent, setNewEvent] = useState("");
  const [newHeure, setNewHeure] = useState("");
  const [newJour, setNewJour] = useState("");

  useEffect(() => {
    const dbRef = ref(db, "famille");
    const unsub = onValue(dbRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setData(prev => {
          if (prev && val.lastUpdatedBy && val.lastUpdatedBy !== parent?.id && val.lastUpdatedAt !== prev?.lastUpdatedAt) {
            const who = parentInfo(val.lastUpdatedBy);
            showToast(`${who.emoji} ${who.label} a mis à jour l'app !`);
          }
          return val;
        });
      } else {
        set(ref(db, "famille"), INITIAL_DATA);
        setData(INITIAL_DATA);
      }
    });
    return () => unsub();
  }, [parent]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function saveData(newData) {
    set(ref(db, "famille"), newData);
  }

  function updateData(updater) {
    setData(prev => {
      const next = { ...updater(prev), lastUpdatedBy: parent?.id, lastUpdatedAt: Date.now() };
      saveData(next);
      return next;
    });
  }

  if (!parent) {
    return (
      <div style={pgStyle}>
        <style>{css}</style>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding:32 }}>
          <div style={{ fontSize:56 }}>🏡</div>
          <h1 style={{ fontSize:28, fontWeight:900, color:"#2D2D2D", margin:"8px 0 4px", textAlign:"center" }}>Famille Beaumont</h1>
          <p style={{ color:"#9A9A9A", fontWeight:600, marginBottom:40, textAlign:"center" }}>Qui se connecte ?</p>
          <div style={{ display:"flex", gap:16, width:"100%" }}>
            {PARENTS.map(p => (
              <button key={p.id} onClick={() => setParent(p)} className="parent-btn"
                style={{ flex:1, background:"#fff", border:`3px solid ${p.color}`, borderRadius:24, padding:"28px 16px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:10, boxShadow:`0 4px 20px ${p.color}33` }}>
                <div style={{ fontSize:52 }}>{p.emoji}</div>
                <div style={{ fontSize:18, fontWeight:900, color:p.color }}>{p.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ ...pgStyle, display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
        <style>{css}</style>
        <div style={{ textAlign:"center", color:"#9A9A9A", fontWeight:700 }}>Chargement… ⏳</div>
      </div>
    );
  }

  const addTache = () => {
    if (!newTache.trim()) return;
    updateData(d => ({ ...d, taches: [...(d.taches||[]), { id: Date.now(), text: newTache.trim(), done: false, who: newWho, by: parent.id, at: Date.now() }] }));
    setNewTache("");
  };
  const toggleTache = (id) => updateData(d => ({ ...d, taches: d.taches.map(t => t.id === id ? { ...t, done: !t.done, by: parent.id, at: Date.now() } : t) }));
  const deleteTache = (id) => updateData(d => ({ ...d, taches: d.taches.filter(t => t.id !== id) }));

  const addEpicerie = () => {
    if (!newEpicerie.trim()) return;
    updateData(d => ({ ...d, epicerie: [...(d.epicerie||[]), { id: Date.now(), text: newEpicerie.trim(), done: false, qty: newQty||"1", by: parent.id, at: Date.now() }] }));
    setNewEpicerie(""); setNewQty("");
  };
  const toggleEpicerie = (id) => updateData(d => ({ ...d, epicerie: d.epicerie.map(e => e.id === id ? { ...e, done: !e.done, by: parent.id, at: Date.now() } : e) }));
  const deleteEpicerie = (id) => updateData(d => ({ ...d, epicerie: d.epicerie.filter(e => e.id !== id) }));

  const addEvent = () => {
    if (!newEvent.trim()) return;
    const idx = (data.agenda||[]).length;
    updateData(d => ({ ...d, agenda: [...(d.agenda||[]), { id: Date.now(), jour: newJour||"?", date:"—", event: newEvent.trim(), heure: newHeure||"—", color: EVENT_COLORS[idx % EVENT_COLORS.length], by: parent.id }] }));
    setNewEvent(""); setNewHeure(""); setNewJour("");
  };
  const deleteEvent = (id) => updateData(d => ({ ...d, agenda: d.agenda.filter(e => e.id !== id) }));

  const addNote = () => {
    if (!newNote.trim()) return;
    const idx = (data.notes||[]).length;
    updateData(d => ({ ...d, notes: [...(d.notes||[]), { id: Date.now(), text: newNote.trim(), color: NOTE_COLORS[idx % NOTE_COLORS.length], by: parent.id }] }));
    setNewNote("");
  };
  const deleteNote = (id) => updateData(d => ({ ...d, notes: d.notes.filter(n => n.id !== id) }));

  const tachesLeft = (data.taches||[]).filter(t => !t.done).length;
  const epicerieLeft = (data.epicerie||[]).filter(e => !e.done).length;
  const otherParent = PARENTS.find(p => p.id !== parent.id);

  return (
    <div style={pgStyle}>
      <style>{css}</style>

      {toast && (
        <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", background:"#2D2D2D", color:"#fff", borderRadius:16, padding:"12px 20px", fontSize:14, fontWeight:700, zIndex:999, boxShadow:"0 4px 20px rgba(0,0,0,0.25)", whiteSpace:"nowrap", animation:"slideDown 0.3s ease" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ background:parent.color, padding:"24px 20px 18px", borderRadius:"0 0 28px 28px", boxShadow:`0 4px 20px ${parent.color}55` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)", fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>{parent.emoji} {parent.label}</div>
            <h1 style={{ margin:"2px 0 0", color:"#fff", fontSize:22, fontWeight:900 }}>Famille Beaumont 🏡</h1>
          </div>
          <button onClick={() => setParent(null)} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:12, padding:"8px 14px", color:"#fff", fontSize:12, fontWeight:800, cursor:"pointer" }}>Changer</button>
        </div>
        {data.lastUpdatedBy && data.lastUpdatedBy !== parent.id && (
          <div style={{ marginTop:10, background:"rgba(255,255,255,0.18)", borderRadius:12, padding:"8px 12px", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:16 }}>{otherParent?.emoji}</span>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.95)", fontWeight:700 }}>{otherParent?.label} a modifié {timeAgo(data.lastUpdatedAt)}</span>
          </div>
        )}
        <div style={{ display:"flex", gap:8, marginTop:14 }}>
          {[{ label:"tâches", val:tachesLeft, icon:"✅" }, { label:"épicerie", val:epicerieLeft, icon:"🛒" }, { label:"événements", val:(data.agenda||[]).length, icon:"📅" }].map((s,i) => (
            <div key={i} style={{ flex:1, background:"rgba(255,255,255,0.2)", borderRadius:12, padding:"8px 6px", textAlign:"center" }}>
              <div style={{ fontSize:16 }}>{s.icon}</div>
              <div style={{ fontSize:20, fontWeight:900, color:"#fff" }}>{s.val}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.8)", fontWeight:700 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:"18px 16px 0" }}>

        {activeTab === "accueil" && (
          <div className="fade-in">
            <ST>📅 Cette semaine</ST>
            <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:8 }}>
              {(data.agenda||[]).map(ev => (
                <div key={ev.id} style={{ minWidth:115, background:ev.color, borderRadius:18, padding:12, flexShrink:0, position:"relative" }}>
                  <div style={{ fontSize:10, fontWeight:800, color:"rgba(0,0,0,0.45)", textTransform:"uppercase" }}>{ev.jour} {ev.date}</div>
                  <div style={{ fontSize:14, fontWeight:800, color:"#2D2D2D", marginTop:4, lineHeight:1.2 }}>{ev.event}</div>
                  <div style={{ fontSize:11, color:"rgba(0,0,0,0.5)", marginTop:4, fontWeight:700 }}>{ev.heure}</div>
                  <div style={{ position:"absolute", top:8, right:8 }}>{parentInfo(ev.by).emoji}</div>
                </div>
              ))}
            </div>
            <ST style={{ marginTop:20 }}>🔥 À faire</ST>
            {(data.taches||[]).filter(t => !t.done).slice(0,4).map(t => (
              <div key={t.id} onClick={() => toggleTache(t.id)} style={{ background:"#fff", borderRadius:16, padding:"13px 16px", marginBottom:10, display:"flex", alignItems:"center", gap:12, boxShadow:"0 2px 10px rgba(0,0,0,0.06)", cursor:"pointer" }}>
                <div style={circle(false, parent.color)} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#2D2D2D" }}>{t.text}</div>
                  <div style={{ fontSize:11, color:"#9A9A9A", marginTop:2, fontWeight:600 }}>👤 {t.who} · {parentInfo(t.by).emoji}</div>
                </div>
              </div>
            ))}
            {tachesLeft === 0 && <div style={{ textAlign:"center", padding:"20px 0" }}><div style={{ fontSize:32 }}>🎉</div><div style={{ fontSize:14, fontWeight:700, color:"#9A9A9A", marginTop:6 }}>Tout est fait !</div></div>}
            <ST style={{ marginTop:20 }}>📝 Notes</ST>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {(data.notes||[]).map(n => (
                <div key={n.id} style={{ background:n.color, borderRadius:16, padding:14, flex:"1 1 44%", minWidth:140 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#2D2D2D", lineHeight:1.4 }}>{n.text}</div>
                  <div style={{ fontSize:11, marginTop:8, color:"rgba(0,0,0,0.4)", fontWeight:700 }}>{parentInfo(n.by).emoji}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "taches" && (
          <div className="fade-in">
            <ST>À faire ({tachesLeft})</ST>
            {(data.taches||[]).filter(t => !t.done).map(t => (
              <TacheItem key={t.id} t={t} onToggle={toggleTache} onDelete={deleteTache} color={parent.color} />
            ))}
            {(data.taches||[]).some(t => t.done) && <><ST style={{ marginTop:20, opacity:0.5 }}>Complétées ✓</ST>{(data.taches||[]).filter(t => t.done).map(t => <TacheItem key={t.id} t={t} onToggle={toggleTache} onDelete={deleteTache} color={parent.color} done />)}</>}
            <Card>
              <input value={newTache} onChange={e => setNewTache(e.target.value)} onKeyDown={e => e.key==="Enter" && addTache()} placeholder="Nouvelle tâche…" style={inp} />
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <select value={newWho} onChange={e => setNewWho(e.target.value)} style={{ ...inp, flex:1 }}><option>Noah</option><option>Léo</option><option>Les deux</option></select>
                <Btn onClick={addTache} color={parent.color} />
              </div>
            </Card>
          </div>
        )}

        {activeTab === "epicerie" && (
          <div className="fade-in">
            <ST>À acheter ({epicerieLeft})</ST>
            {(data.epicerie||[]).filter(e => !e.done).map(e => <EpicItem key={e.id} e={e} onToggle={toggleEpicerie} onDelete={deleteEpicerie} color={parent.color} />)}
            {(data.epicerie||[]).some(e => e.done) && <><ST style={{ marginTop:20, opacity:0.5 }}>Dans le panier ✓</ST>{(data.epicerie||[]).filter(e => e.done).map(e => <EpicItem key={e.id} e={e} onToggle={toggleEpicerie} onDelete={deleteEpicerie} color={parent.color} done />)}</>}
            <Card>
              <input value={newEpicerie} onChange={e => setNewEpicerie(e.target.value)} onKeyDown={e => e.key==="Enter" && addEpicerie()} placeholder="Ajouter un article…" style={inp} />
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <input value={newQty} onChange={e => setNewQty(e.target.value)} placeholder="Quantité" style={{ ...inp, flex:0.6 }} />
                <Btn onClick={addEpicerie} color={parent.color} />
              </div>
            </Card>
          </div>
        )}

        {activeTab === "agenda" && (
          <div className="fade-in">
            <ST>Événements</ST>
            {(data.agenda||[]).map(ev => (
              <div key={ev.id} style={{ background:"#fff", borderRadius:16, padding:"13px 16px", marginBottom:10, display:"flex", gap:14, alignItems:"center", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
                <div style={{ background:ev.color, borderRadius:14, padding:"10px 12px", textAlign:"center", minWidth:54, flexShrink:0 }}>
                  <div style={{ fontSize:10, fontWeight:800, color:"rgba(0,0,0,0.45)", textTransform:"uppercase" }}>{ev.jour}</div>
                  <div style={{ fontSize:22, fontWeight:900, color:"#2D2D2D" }}>{ev.date}</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:"#2D2D2D" }}>{ev.event}</div>
                  <div style={{ fontSize:11, color:"#9A9A9A", marginTop:3, fontWeight:600 }}>🕐 {ev.heure} · {parentInfo(ev.by).emoji}</div>
                </div>
                <button onClick={() => deleteEvent(ev.id)} style={del}>✕</button>
              </div>
            ))}
            <Card>
              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                <input value={newJour} onChange={e => setNewJour(e.target.value)} placeholder="Jour" style={{ ...inp, flex:0.5 }} />
                <input value={newHeure} onChange={e => setNewHeure(e.target.value)} placeholder="Heure" style={{ ...inp, flex:0.6 }} />
              </div>
              <input value={newEvent} onChange={e => setNewEvent(e.target.value)} onKeyDown={e => e.key==="Enter" && addEvent()} placeholder="Nom de l'événement…" style={inp} />
              <button onClick={addEvent} style={{ ...btnSt(parent.color), width:"100%", marginTop:10 }}>+ Ajouter</button>
            </Card>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="fade-in">
            <ST>Notes & rappels</ST>
            <div style={{ display:"flex", flexWrap:"wrap", gap:12 }}>
              {(data.notes||[]).map(n => (
                <div key={n.id} style={{ background:n.color, borderRadius:18, padding:14, flex:"1 1 44%", minWidth:150, position:"relative", boxShadow:"0 3px 10px rgba(0,0,0,0.08)" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#2D2D2D", lineHeight:1.5 }}>{n.text}</div>
                  <div style={{ fontSize:11, marginTop:8, color:"rgba(0,0,0,0.45)", fontWeight:700 }}>{parentInfo(n.by).emoji} {parentInfo(n.by).label}</div>
                  <button onClick={() => deleteNote(n.id)} style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.1)", border:"none", borderRadius:"50%", width:22, height:22, cursor:"pointer", fontSize:12, color:"#555" }}>✕</button>
                </div>
              ))}
              <div style={{ flex:"1 1 100%", background:"#fff", borderRadius:18, padding:16, boxShadow:"0 2px 10px rgba(0,0,0,0.06)", marginTop:4 }}>
                <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Écrire une note…" rows={3} style={{ ...inp, width:"100%", resize:"none", lineHeight:1.5 }} />
                <button onClick={addNote} style={{ ...btnSt(parent.color), width:"100%", marginTop:8 }}>📌 Épingler</button>
              </div>
            </div>
          </div>
        )}

      </div>

      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#fff", borderTop:"1px solid #F0EBE3", display:"flex", padding:"8px 0 14px", zIndex:100, boxShadow:"0 -4px 20px rgba(0,0,0,0.07)" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="tab-btn"
            style={{ flex:1, background:"none", border:"none", cursor:"pointer", padding:"5px 4px", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
            <div style={{ fontSize:20 }}>{tab.label}</div>
            <div style={{ fontSize:10, fontWeight:800, color:activeTab===tab.id ? parent.color : "#BBBBBB" }}>{tab.name}</div>
            {activeTab===tab.id && <div style={{ width:18, height:3, background:parent.color, borderRadius:10, marginTop:1 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

function TacheItem({ t, onToggle, onDelete, done, color }) {
  return (
    <div style={{ background:"#fff", borderRadius:16, padding:"12px 14px", marginBottom:10, display:"flex", alignItems:"center", gap:12, boxShadow:"0 2px 10px rgba(0,0,0,0.06)", opacity:done?0.5:1 }}>
      <div onClick={() => onToggle(t.id)} style={circle(done, color)}>{done && "✓"}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#2D2D2D", textDecoration:done?"line-through":"none" }}>{t.text}</div>
        <div style={{ fontSize:11, color:"#9A9A9A", marginTop:2, fontWeight:600 }}>👤 {t.who} · {parentInfo(t.by).emoji} · {timeAgo(t.at)}</div>
      </div>
      <button onClick={() => onDelete(t.id)} style={del}>✕</button>
    </div>
  );
}

function EpicItem({ e, onToggle, onDelete, done, color }) {
  return (
    <div style={{ background:"#fff", borderRadius:16, padding:"12px 14px", marginBottom:10, display:"flex", alignItems:"center", gap:12, boxShadow:"0 2px 10px rgba(0,0,0,0.06)", opacity:done?0.5:1 }}>
      <div onClick={() => onToggle(e.id)} style={{ ...circle(done, color), borderRadius:8 }}>{done && "✓"}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#2D2D2D", textDecoration:done?"line-through":"none" }}>{e.text}</div>
        <div style={{ fontSize:11, color:"#9A9A9A", marginTop:2, fontWeight:600 }}>Qté : {e.qty} · {parentInfo(e.by).emoji}</div>
      </div>
      <button onClick={() => onDelete(e.id)} style={del}>✕</button>
    </div>
  );
}

function ST({ children, style }) {
  return <h2 style={{ fontSize:12, fontWeight:900, textTransform:"uppercase", letterSpacing:1, color:"#BBBBBB", margin:"0 0 12px", ...style }}>{children}</h2>;
}
function Card({ children }) {
  return <div style={{ background:"#fff", borderRadius:18, padding:16, marginTop:16, boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>{children}</div>;
}
function Btn({ onClick, color }) {
  return <button onClick={onClick} style={btnSt(color)}>+ Ajouter</button>;
}

const pgStyle = { fontFamily:"'Nunito', system-ui, sans-serif", background:"#FFF8F0", minHeight:"100vh", maxWidth:480, margin:"0 auto", position:"relative", paddingBottom:90 };
const circle = (done, color) => ({ width:26, height:26, borderRadius:"50%", border:`2.5px solid ${done?"#4ECDC4":color}`, background:done?"#4ECDC4":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, cursor:"pointer", transition:"all 0.2s", fontSize:14, color:"#fff", fontWeight:900 });
const btnSt = (color) => ({ background:color, color:"#fff", border:"none", borderRadius:12, padding:"10px 18px", fontSize:14, fontWeight:800, cursor:"pointer" });
const inp = { width:"100%", border:"2px solid #F0E8E0", borderRadius:12, padding:"10px 14px", fontSize:14, fontWeight:600, color:"#2D2D2D", outline:"none", background:"#FAFAFA" };
const del = { background:"none", border:"none", cursor:"pointer", fontSize:16, color:"#DDD", flexShrink:0 };
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  input, button, select, textarea { font-family: inherit; }
  .tab-btn, .parent-btn { transition: all 0.18s; }
  .tab-btn:active { transform: scale(0.92); }
  .parent-btn:active { transform: scale(0.97); }
  .fade-in { animation: fadeIn 0.25s ease; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideDown { from { opacity:0; transform:translateX(-50%) translateY(-10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
  ::-webkit-scrollbar { display: none; }
`;
