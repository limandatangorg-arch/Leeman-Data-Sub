import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection, doc, onSnapshot, setDoc, addDoc, updateDoc, getDoc
} from "firebase/firestore";

// ============================================================
// FIRESTORE-BACKED DATA STORE
// Collections: users, orders, walletRequests, notifications
// Single doc: settings/main
// ============================================================

const DEFAULT_SETTINGS = {
  bankName: "First Bank",
  accountName: "Leeman Data Sub",
  accountNumber: "3012345678",
  whatsapp: "08012345678",
  dataPlans: {
    MTN: [
      { id: "mtn1", name: "500MB", validity: "1 Day", price: 150 },
      { id: "mtn2", name: "1GB", validity: "1 Day", price: 250 },
      { id: "mtn3", name: "2GB", validity: "2 Days", price: 450 },
      { id: "mtn4", name: "5GB", validity: "30 Days", price: 1400 },
      { id: "mtn5", name: "10GB", validity: "30 Days", price: 2500 },
      { id: "mtn6", name: "20GB", validity: "30 Days", price: 4500 },
    ],
    Glo: [
      { id: "glo1", name: "500MB", validity: "14 Days", price: 140 },
      { id: "glo2", name: "1GB", validity: "30 Days", price: 230 },
      { id: "glo3", name: "2GB", validity: "30 Days", price: 420 },
      { id: "glo4", name: "5GB", validity: "30 Days", price: 1300 },
      { id: "glo5", name: "10GB", validity: "30 Days", price: 2300 },
    ],
    Airtel: [
      { id: "air1", name: "500MB", validity: "1 Day", price: 160 },
      { id: "air2", name: "1GB", validity: "1 Day", price: 260 },
      { id: "air3", name: "2GB", validity: "3 Days", price: 460 },
      { id: "air4", name: "5GB", validity: "30 Days", price: 1500 },
      { id: "air5", name: "10GB", validity: "30 Days", price: 2700 },
    ],
    "9mobile": [
      { id: "9mb1", name: "500MB", validity: "30 Days", price: 135 },
      { id: "9mb2", name: "1GB", validity: "30 Days", price: 220 },
      { id: "9mb3", name: "2.5GB", validity: "30 Days", price: 500 },
      { id: "9mb4", name: "5GB", validity: "30 Days", price: 1200 },
    ],
  },
};

// ============================================================
// LOGO (image)
// ============================================================
const LeemanLogo = ({ size = 56 }) => (
  <img src="/logo.png" alt="Leeman Data Sub" width={size} height={size} style={{ borderRadius: "50%", objectFit: "cover", display: "block" }} />
);

// ============================================================
// COLOURS & SHARED STYLES
// ============================================================
const C = {
  blue900: "#0A1A33",   // deep navy (logo background)
  blue700: "#1565C0",
  blue500: "#2E8FE6",   // bright sky blue (logo ribbon)
  blue400: "#5BAEF2",
  blue100: "#BBDEFB",
  blue50: "#E3F2FD",
  white: "#FFFFFF",
  grey50: "#F8FAFC",
  grey100: "#F1F5F9",
  grey300: "#CBD5E1",
  grey500: "#64748B",
  grey700: "#334155",
  grey900: "#0F172A",
  green: "#16A34A",
  greenBg: "#DCFCE7",
  red: "#DC2626",
  redBg: "#FEE2E2",
  yellow: "#D97706",
  yellowBg: "#FEF3C7",
};

const s = {
  app: { fontFamily: "'Inter','Segoe UI',sans-serif", background: C.grey50, minHeight: "100vh", color: C.grey900 },
  // cards
  card: { background: C.white, borderRadius: 16, boxShadow: "0 2px 12px rgba(13,71,161,0.08)", padding: 20, marginBottom: 16 },
  cardBlue: { background: `linear-gradient(135deg, ${C.blue900} 0%, ${C.blue500} 100%)`, borderRadius: 16, padding: 20, marginBottom: 16, color: C.white },
  // inputs
  input: { width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.grey300}`, fontSize: 15, outline: "none", boxSizing: "border-box", background: C.white, color: C.grey900 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: C.grey700, marginBottom: 5 },
  // buttons
  btnPrimary: { background: `linear-gradient(135deg, ${C.blue700}, ${C.blue400})`, color: C.white, border: "none", borderRadius: 12, padding: "14px 0", width: "100%", fontSize: 16, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3 },
  btnOutline: { background: "transparent", color: C.blue700, border: `2px solid ${C.blue700}`, borderRadius: 12, padding: "12px 0", width: "100%", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  btnSmall: { background: C.blue700, color: C.white, border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnDanger: { background: C.red, color: C.white, border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnSuccess: { background: C.green, color: C.white, border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  // nav
  bottomNav: { position: "fixed", bottom: 0, left: 0, right: 0, background: C.white, borderTop: `1px solid ${C.blue100}`, display: "flex", justifyContent: "space-around", padding: "8px 0 6px", zIndex: 100, maxWidth: 480, margin: "0 auto" },
  navItem: (active) => ({ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer", color: active ? C.blue700 : C.grey500, fontWeight: active ? 700 : 400, fontSize: 11 }),
  // page wrapper
  page: { maxWidth: 480, margin: "0 auto", padding: "0 0 90px 0", minHeight: "100vh" },
  // header
  header: { background: `linear-gradient(135deg, ${C.blue900}, ${C.blue500})`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 50 },
  // status pills
  pill: (color, bg) => ({ display: "inline-block", background: bg, color, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }),
  // network badge
  networkBadge: (active) => ({ flex: 1, padding: "10px 4px", borderRadius: 10, border: active ? `2.5px solid ${C.blue500}` : `1.5px solid ${C.grey300}`, background: active ? C.blue50 : C.white, textAlign: "center", cursor: "pointer", fontWeight: active ? 700 : 500, fontSize: 13, color: active ? C.blue700 : C.grey700, transition: "all 0.15s" }),
};

// ============================================================
// TOAST
// ============================================================
const Toast = ({ msg, type }) => {
  if (!msg) return null;
  const bg = type === "success" ? C.green : type === "error" ? C.red : C.blue700;
  return (
    <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: bg, color: C.white, padding: "12px 24px", borderRadius: 12, zIndex: 9999, fontWeight: 600, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", maxWidth: 340, textAlign: "center" }}>
      {msg}
    </div>
  );
};

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [screen, setScreen] = useState("splash"); // splash | login | register | userDash | adminDash
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [walletRequests, setWalletRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // sub-screens
  const [userTab, setUserTab] = useState("home");
  const [adminTab, setAdminTab] = useState("dashboard");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  // ---- FIRESTORE REAL-TIME LISTENERS ----
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("users listener error:", err));

    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(list);
    }, (err) => console.error("orders listener error:", err));

    const unsubWallet = onSnapshot(collection(db, "walletRequests"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setWalletRequests(list);
    }, (err) => console.error("walletRequests listener error:", err));

    const unsubNotifs = onSnapshot(collection(db, "notifications"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(list);
    }, (err) => console.error("notifications listener error:", err));

    const unsubSettings = onSnapshot(doc(db, "settings", "main"), async (snap) => {
      if (snap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
      } else {
        // first run: seed default settings
        await setDoc(doc(db, "settings", "main"), DEFAULT_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
      }
      setLoading(false);
    }, (err) => { console.error("settings listener error:", err); setLoading(false); });

    return () => { unsubUsers(); unsubOrders(); unsubWallet(); unsubNotifs(); unsubSettings(); };
  }, []);

  // ---- FIRESTORE WRITE HELPERS ----
  // Users
  const addUser = async (user) => {
    const { id, ...data } = user;
    const ref = await addDoc(collection(db, "users"), data);
    return { id: ref.id, ...data };
  };
  const updateUser = async (user) => {
    const { id, ...data } = user;
    await updateDoc(doc(db, "users", id), data);
  };
  // Orders
  const addOrder = async (order) => {
    const { id, ...data } = order;
    await addDoc(collection(db, "orders"), data);
  };
  const updateOrder = async (id, fields) => {
    await updateDoc(doc(db, "orders", id), fields);
  };
  // Wallet requests
  const addWalletRequest = async (req) => {
    const { id, ...data } = req;
    await addDoc(collection(db, "walletRequests"), data);
  };
  const updateWalletRequest = async (id, fields) => {
    await updateDoc(doc(db, "walletRequests", id), fields);
  };
  // Notifications
  const addNotification = async (notif) => {
    const { id, ...data } = notif;
    await addDoc(collection(db, "notifications"), data);
  };
  // Settings
  const saveSettings = async (newSettings) => {
    await setDoc(doc(db, "settings", "main"), newSettings);
  };

  useEffect(() => {
    if (!loading) setTimeout(() => setScreen(s => s === "splash" ? "login" : s), 1200);
  }, [loading]);

  // ---- SPLASH ----
  if (screen === "splash" || loading) return <SplashScreen />;

  // ---- AUTH ----
  if (screen === "login") return (
    <LoginScreen
      onLogin={(user, admin) => { setCurrentUser(user); setIsAdmin(admin); setScreen(admin ? "adminDash" : "userDash"); setUserTab("home"); setAdminTab("dashboard"); }}
      onRegister={() => setScreen("register")}
      users={users}
      showToast={showToast}
      toast={toast}
      onResetPassword={async (userId, newPassword) => {
        await updateUser({ id: userId, password: newPassword });
      }}
    />
  );
  if (screen === "register") return (
    <RegisterScreen
      onRegister={async (user) => {
        const created = await addUser(user);
        setCurrentUser(created);
        setScreen("userDash");
        setUserTab("home");
        showToast("Account created! Welcome " + user.username);
      }}
      onBack={() => setScreen("login")}
      users={users}
      showToast={showToast}
      toast={toast}
    />
  );

  // ---- USER DASHBOARD ----
  if (screen === "userDash" && currentUser) {
    // Keep currentUser in sync with live Firestore data (e.g. wallet updates from admin)
    const liveUser = users.find(u => u.id === currentUser.id) || currentUser;
    return (
    <UserDashboard
      user={liveUser}
      setUser={(u) => { setCurrentUser(u); updateUser(u); }}
      tab={userTab}
      setTab={setUserTab}
      orders={orders.filter(o => o.userId === liveUser.id)}
      allOrders={orders}
      settings={settings}
      walletRequests={walletRequests}
      notifications={notifications.filter(n => n.target === "all" || n.target === liveUser.id)}
      onOrder={(order) => {
        addOrder(order);
        showToast("Order placed! Awaiting fulfillment.", "success");
      }}
      onFundRequest={(req) => {
        addWalletRequest(req);
        showToast("Fund request sent! Admin will confirm.", "success");
      }}
      onLogout={() => { setCurrentUser(null); setScreen("login"); }}
      showToast={showToast}
      toast={toast}
    />
  );
  }

  // ---- ADMIN DASHBOARD ----
  if (screen === "adminDash") return (
    <AdminDashboard
      tab={adminTab}
      setTab={setAdminTab}
      orders={orders}
      users={users}
      settings={settings}
      walletRequests={walletRequests}
      notifications={notifications}
      onUpdateOrder={(id, status, note) => {
        const fields = { status, updatedAt: new Date().toISOString() };
        if (note) fields.note = note;
        updateOrder(id, fields);
        showToast("Order updated!", "success");
      }}
      onUpdateSettings={saveSettings}
      onSendNotification={(notif) => {
        addNotification(notif);
        showToast("Notification sent!", "success");
      }}
      onHandleWalletReq={(id, action, userId, amount) => {
        updateWalletRequest(id, { status: action });
        if (action === "approved") {
          const targetUser = users.find(u => u.id === userId);
          if (targetUser) {
            updateUser({ id: userId, wallet: (targetUser.wallet || 0) + amount });
          }
          showToast(`Wallet funded ₦${amount.toLocaleString()}!`, "success");
        } else {
          showToast("Request declined.", "error");
        }
      }}
      onUpdateUser={(updatedUser) => {
        updateUser(updatedUser);
        showToast("User updated!", "success");
      }}
      onLogout={() => { setCurrentUser(null); setIsAdmin(false); setScreen("login"); }}
      showToast={showToast}
      toast={toast}
    />
  );

  return null;
}

// ============================================================
// SPLASH SCREEN
// ============================================================
function SplashScreen() {
  return (
    <div style={{ ...s.app, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: `linear-gradient(160deg, ${C.blue900} 0%, ${C.blue500} 100%)` }}>
      <div style={{ animation: "pulse 1.5s infinite", marginBottom: 24 }}>
        <LeemanLogo size={100} />
      </div>
      <div style={{ color: C.white, fontSize: 28, fontWeight: 800, letterSpacing: 1 }}>Leeman Data Sub</div>
      <div style={{ color: C.blue100, fontSize: 14, marginTop: 6 }}>Fast & Reliable Services</div>
      <div style={{ marginTop: 40, color: C.blue100, fontSize: 13 }}>Loading...</div>
      <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}`}</style>
    </div>
  );
}

// ============================================================
// LOGIN
// ============================================================
function LoginScreen({ onLogin, onRegister, users, showToast, toast, onResetPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [fpEmail, setFpEmail] = useState("");
  const [fpPhone, setFpPhone] = useState("");
  const [fpNew, setFpNew] = useState("");

  const ADMIN = { email: "limandata.ng.org@gmail.com", password: "1990Liman@" };

  const handleLogin = () => {
    if (!email || !password) return showToast("Fill in all fields", "error");
    if (email.trim().toLowerCase() === ADMIN.email && password === ADMIN.password) {
      onLogin(null, true); return;
    }
    const user = users.find(u => (u.email.toLowerCase() === email.trim().toLowerCase() || u.username.toLowerCase() === email.trim().toLowerCase()) && u.password === password);
    if (!user) return showToast("Invalid credentials", "error");
    if (user.blocked) return showToast("Account blocked. Contact support.", "error");
    onLogin(user, false);
  };

  const handleReset = () => {
    if (!fpEmail || !fpPhone || !fpNew) return showToast("Fill all fields", "error");
    if (fpNew.length < 6) return showToast("Password must be 6+ characters", "error");
    const user = users.find(u => u.email.toLowerCase() === fpEmail.trim().toLowerCase() && u.phone === fpPhone.trim());
    if (!user) return showToast("No account matches that email & phone", "error");
    onResetPassword(user.id, fpNew);
    showToast("Password reset successful! You can now login.", "success");
    setShowForgot(false);
    setFpEmail(""); setFpPhone(""); setFpNew("");
  };

  return (
    <div style={{ ...s.app, ...s.page }}>
      <Toast {...toast} />
      <div style={{ background: `linear-gradient(160deg, ${C.blue900}, ${C.blue500})`, padding: "48px 24px 36px", textAlign: "center" }}>
        <LeemanLogo size={80} />
        <div style={{ color: C.white, fontSize: 24, fontWeight: 800, marginTop: 12 }}>Leeman Data Sub</div>
        <div style={{ color: C.blue100, fontSize: 13, marginTop: 4 }}>Sign in to continue</div>
      </div>
      <div style={{ padding: "28px 20px" }}>
        <div style={s.card}>
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Email or Username</label>
            <input style={s.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email or username" />
          </div>
          <div style={{ marginBottom: 10, position: "relative" }}>
            <label style={s.label}>Password</label>
            <input style={s.input} type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" />
            <span onClick={() => setShow(!show)} style={{ position: "absolute", right: 14, top: 34, cursor: "pointer", color: C.grey500, fontSize: 13 }}>{show ? "Hide" : "Show"}</span>
          </div>
          <div style={{ textAlign: "right", marginBottom: 16 }}>
            <span onClick={() => setShowForgot(true)} style={{ color: C.blue700, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Forgot password?</span>
          </div>
          <button style={s.btnPrimary} onClick={handleLogin}>Login</button>
        </div>
        <div style={{ textAlign: "center", marginTop: 8, color: C.grey700, fontSize: 14 }}>
          Don't have an account?{" "}
          <span onClick={onRegister} style={{ color: C.blue700, fontWeight: 700, cursor: "pointer" }}>Register</span>
        </div>
      </div>

      {showForgot && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 200 }}>
          <div style={{ background: C.white, borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 480, margin: "0 auto" }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>Reset Password</div>
            <div style={{ fontSize: 13, color: C.grey500, marginBottom: 16 }}>Enter your registered email and phone number to set a new password.</div>
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Email</label>
              <input style={s.input} type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)} placeholder="Your registered email" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Phone Number</label>
              <input style={s.input} type="tel" value={fpPhone} onChange={e => setFpPhone(e.target.value)} placeholder="Your registered phone number" />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>New Password</label>
              <input style={s.input} type="password" value={fpNew} onChange={e => setFpNew(e.target.value)} placeholder="Min 6 characters" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...s.btnOutline, flex: 1 }} onClick={() => setShowForgot(false)}>Cancel</button>
              <button style={{ ...s.btnPrimary, flex: 1 }} onClick={handleReset}>Reset Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// REGISTER
// ============================================================
function RegisterScreen({ onRegister, onBack, users, showToast, toast }) {
  const [form, setForm] = useState({ username: "", fullname: "", email: "", phone: "", password: "", confirm: "" });
  const [show, setShow] = useState(false);

  const handle = () => {
    if (!form.username || !form.fullname || !form.email || !form.phone || !form.password) return showToast("Fill all fields", "error");
    if (form.password !== form.confirm) return showToast("Passwords don't match", "error");
    if (form.password.length < 6) return showToast("Password must be 6+ characters", "error");
    if (users.find(u => u.email.toLowerCase() === form.email.toLowerCase())) return showToast("Email already exists", "error");
    if (users.find(u => u.username.toLowerCase() === form.username.toLowerCase())) return showToast("Username taken", "error");
    onRegister({ id: Date.now().toString(), ...form, wallet: 0, createdAt: new Date().toISOString(), blocked: false });
  };

  const f = (k) => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div style={{ ...s.app, ...s.page }}>
      <Toast {...toast} />
      <div style={{ background: `linear-gradient(160deg, ${C.blue900}, ${C.blue500})`, padding: "32px 20px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <span onClick={onBack} style={{ color: C.white, cursor: "pointer", fontSize: 22 }}>←</span>
        <div>
          <div style={{ color: C.white, fontSize: 20, fontWeight: 800 }}>Create Account</div>
          <div style={{ color: C.blue100, fontSize: 12 }}>Join Leeman Data Sub</div>
        </div>
      </div>
      <div style={{ padding: "20px 20px" }}>
        <div style={s.card}>
          {[["username", "Username", "text"], ["fullname", "Full Name", "text"], ["email", "Email", "email"], ["phone", "Phone Number", "tel"]].map(([k, lbl, t]) => (
            <div key={k} style={{ marginBottom: 14 }}>
              <label style={s.label}>{lbl}</label>
              <input style={s.input} type={t} {...f(k)} placeholder={`Enter ${lbl.toLowerCase()}`} />
            </div>
          ))}
          <div style={{ marginBottom: 14, position: "relative" }}>
            <label style={s.label}>Password</label>
            <input style={s.input} type={show ? "text" : "password"} {...f("password")} placeholder="Min 6 characters" />
            <span onClick={() => setShow(!show)} style={{ position: "absolute", right: 14, top: 34, cursor: "pointer", color: C.grey500, fontSize: 13 }}>{show ? "Hide" : "Show"}</span>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={s.label}>Confirm Password</label>
            <input style={s.input} type="password" {...f("confirm")} placeholder="Re-enter password" />
          </div>
          <button style={s.btnPrimary} onClick={handle}>Create Account</button>
        </div>
        <div style={{ textAlign: "center", marginTop: 8, color: C.grey700, fontSize: 14 }}>
          Have an account?{" "}
          <span onClick={onBack} style={{ color: C.blue700, fontWeight: 700, cursor: "pointer" }}>Login</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// USER DASHBOARD
// ============================================================
function UserDashboard({ user, setUser, tab, setTab, orders, allOrders, settings, walletRequests, notifications, onOrder, onFundRequest, onLogout, showToast, toast }) {
  const tabs = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "buy", icon: "🛒", label: "Buy" },
    { id: "wallet", icon: "💰", label: "Wallet" },
    { id: "history", icon: "📋", label: "History" },
    { id: "notifs", icon: "🔔", label: "Alerts" },
  ];

  return (
    <div style={{ ...s.app, ...s.page }}>
      <Toast {...toast} />
      {tab === "home" && <UserHome user={user} settings={settings} orders={orders} notifications={notifications} setTab={setTab} onLogout={onLogout} />}
      {tab === "buy" && <BuyService user={user} setUser={setUser} settings={settings} onOrder={onOrder} showToast={showToast} />}
      {tab === "wallet" && <WalletPage user={user} settings={settings} walletRequests={walletRequests.filter(w => w.userId === user.id)} onFundRequest={onFundRequest} showToast={showToast} />}
      {tab === "history" && <UserHistory orders={orders} />}
      {tab === "notifs" && <UserNotifications notifications={notifications} />}
      <div style={s.bottomNav}>
        {tabs.map(t => (
          <div key={t.id} style={s.navItem(tab === t.id)} onClick={() => setTab(t.id)}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserHome({ user, settings, orders, notifications, setTab, onLogout }) {
  const completed = orders.filter(o => o.status === "completed").length;
  const unread = notifications.filter(n => !n.read).length;

  const copyAccNum = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(settings.accountNumber);
  };

  return (
    <div>
      <div style={{ background: `linear-gradient(135deg, ${C.blue900}, ${C.blue500})`, padding: "20px 20px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LeemanLogo size={38} />
            <div>
              <div style={{ color: C.white, fontWeight: 800, fontSize: 15 }}>Leeman Data Sub</div>
              <div style={{ color: C.blue100, fontSize: 12 }}>Hi, {user.username} 👋</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {unread > 0 && <div style={{ background: C.red, color: C.white, borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, cursor: "pointer" }} onClick={() => setTab("notifs")}>{unread}</div>}
            <span onClick={onLogout} style={{ color: C.blue100, cursor: "pointer", fontSize: 13 }}>Logout</span>
          </div>
        </div>
        {/* Wallet Balance */}
        <div style={{ background: "rgba(255,255,255,0.13)", borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ color: C.blue100, fontSize: 12, marginBottom: 4 }}>Wallet Balance</div>
          <div style={{ color: C.white, fontSize: 30, fontWeight: 800 }}>₦{(user.wallet || 0).toLocaleString()}</div>
          <button onClick={() => setTab("wallet")} style={{ marginTop: 10, background: "rgba(255,255,255,0.2)", color: C.white, border: "1px solid rgba(255,255,255,0.4)", borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Fund Wallet</button>
        </div>
      </div>

      <div style={{ padding: "16px 16px" }}>
        {/* Account Number Banner */}
        <div style={{ background: C.blue50, border: `1.5px solid ${C.blue100}`, borderRadius: 14, padding: "14px 18px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: C.grey500, fontWeight: 600 }}>Payment Account</div>
            <div style={{ fontSize: 13, color: C.grey700, marginTop: 2 }}>{settings.bankName} • {settings.accountName}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.blue900, letterSpacing: 2 }}>{settings.accountNumber}</div>
          </div>
          <button onClick={copyAccNum} style={{ background: C.blue700, color: C.white, border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Copy</button>
        </div>

        {/* Quick Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ ...s.card, margin: 0, textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.blue700 }}>{orders.length}</div>
            <div style={{ fontSize: 12, color: C.grey500 }}>Total Orders</div>
          </div>
          <div style={{ ...s.card, margin: 0, textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.green }}>{completed}</div>
            <div style={{ fontSize: 12, color: C.grey500 }}>Completed</div>
          </div>
        </div>

        {/* Services */}
        <div style={{ fontWeight: 700, fontSize: 15, color: C.grey900, marginBottom: 12 }}>Our Services</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[
            { icon: "📶", label: "Buy Data", sub: "All Networks", tab: "buy" },
            { icon: "📱", label: "Buy Airtime", sub: "Instant Top-up", tab: "buy" },
            { icon: "💡", label: "Electricity", sub: "NEPA/BEDC", tab: "buy" },
            { icon: "📺", label: "TV Subscription", sub: "DSTV/GOTV", tab: "buy" },
          ].map(item => (
            <div key={item.label} onClick={() => setTab(item.tab)} style={{ ...s.card, margin: 0, cursor: "pointer", textAlign: "center", padding: 16 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.grey900 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: C.grey500 }}>{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        {orders.length > 0 && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.grey900, marginBottom: 10 }}>Recent Orders</div>
            {orders.slice(0, 3).map(o => <OrderCard key={o.id} order={o} />)}
            <div onClick={() => setTab("history")} style={{ textAlign: "center", color: C.blue700, fontWeight: 600, fontSize: 13, cursor: "pointer", padding: 8 }}>View all orders →</div>
          </div>
        )}
      </div>
    </div>
  );
}

// BUY SERVICE PAGE
function BuyService({ user, setUser, settings, onOrder, showToast }) {
  const [service, setService] = useState("data"); // data | airtime | tv | electricity
  const [network, setNetwork] = useState("MTN");
  const [plan, setPlan] = useState(null);
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [decoder, setDecoder] = useState("");
  const [meter, setMeter] = useState("");
  const [tvProvider, setTvProvider] = useState("DSTV");
  const [tvPlan, setTvPlan] = useState("");
  const [discoProvider, setDiscoProvider] = useState("EKEDC");
  const [meterType, setMeterType] = useState("Prepaid");
  const [payMode, setPayMode] = useState("wallet");

  const networks = ["MTN", "Glo", "Airtel", "9mobile"];
  const tvProviders = ["DSTV", "GOTV", "Startimes"];
  const tvPlans = {
    DSTV: [{ name: "Padi", price: 2950 }, { name: "Yanga", price: 3950 }, { name: "Confam", price: 6200 }, { name: "Compact", price: 10500 }, { name: "Compact+", price: 16600 }, { name: "Premium", price: 24500 }],
    GOTV: [{ name: "Lite", price: 410 }, { name: "Jinja", price: 1640 }, { name: "Jolli", price: 2460 }, { name: "Max", price: 4150 }, { name: "Supa", price: 6400 }],
    Startimes: [{ name: "Nova", price: 900 }, { name: "Basic", price: 1700 }, { name: "Smart", price: 2200 }, { name: "Classic", price: 2500 }, { name: "Super", price: 4200 }],
  };
  const discoCos = ["EKEDC", "IKEDC", "AEDC", "KEDCO", "PHED", "EEDC", "JEDC", "BEDC", "YEDC"];

  const selectedPlanObj = plan ? settings.dataPlans[network]?.find(p => p.id === plan) : null;
  const selectedTvPlanObj = tvPlan ? tvPlans[tvProvider]?.find(p => p.name === tvPlan) : null;
  const orderAmount = service === "data" ? (selectedPlanObj?.price || 0)
    : service === "airtime" ? (parseInt(amount) || 0)
    : service === "tv" ? (selectedTvPlanObj?.price || 0)
    : (parseInt(amount) || 0);

  const canAfford = (user.wallet || 0) >= orderAmount;

  const placeOrder = () => {
    if (payMode === "wallet" && !canAfford) return showToast("Insufficient wallet balance", "error");
    const order = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      phone: user.phone,
      service,
      network: service === "data" || service === "airtime" ? network : undefined,
      plan: service === "data" ? selectedPlanObj?.name : service === "tv" ? tvPlan : undefined,
      amount: orderAmount,
      recipientPhone: service === "data" || service === "airtime" ? phone : undefined,
      decoderNumber: service === "tv" ? decoder : undefined,
      meterNumber: service === "electricity" ? meter : undefined,
      tvProvider: service === "tv" ? tvProvider : undefined,
      discoProvider: service === "electricity" ? discoProvider : undefined,
      meterType: service === "electricity" ? meterType : undefined,
      payMode,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    if (payMode === "wallet") {
      setUser({ ...user, wallet: (user.wallet || 0) - orderAmount });
    }
    onOrder(order);
    setConfirm(false);
    setPhone(""); setAmount(""); setPlan(null); setDecoder(""); setMeter(""); setTvPlan("");
    showToast("Order placed successfully!", "success");
  };

  const serviceIcons = { data: "📶", airtime: "📱", tv: "📺", electricity: "💡" };

  return (
    <div>
      <div style={s.header}>
        <LeemanLogo size={32} />
        <div style={{ color: C.white, fontWeight: 800, fontSize: 17 }}>Buy Services</div>
      </div>
      <div style={{ padding: "16px 16px" }}>
        {/* Service Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18, overflowX: "auto" }}>
          {[["data", "📶", "Data"], ["airtime", "📱", "Airtime"], ["tv", "📺", "TV Sub"], ["electricity", "💡", "NEPA"]].map(([id, icon, label]) => (
            <button key={id} onClick={() => setService(id)} style={{ flexShrink: 0, padding: "10px 18px", borderRadius: 20, border: service === id ? "none" : `1.5px solid ${C.grey300}`, background: service === id ? C.blue700 : C.white, color: service === id ? C.white : C.grey700, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {icon} {label}
            </button>
          ))}
        </div>

        <div style={s.card}>
          {/* DATA */}
          {service === "data" && (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: C.grey900 }}>📶 Buy Data Bundle</div>
              <div style={{ marginBottom: 14 }}>
                <label style={s.label}>Select Network</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {networks.map(n => <div key={n} style={s.networkBadge(network === n)} onClick={() => { setNetwork(n); setPlan(null); }}>{n}</div>)}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={s.label}>Select Plan</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {(settings.dataPlans[network] || []).map(p => (
                    <div key={p.id} onClick={() => setPlan(p.id)} style={{ padding: "10px 12px", borderRadius: 10, border: plan === p.id ? `2px solid ${C.blue500}` : `1.5px solid ${C.grey300}`, background: plan === p.id ? C.blue50 : C.white, cursor: "pointer" }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: plan === p.id ? C.blue700 : C.grey900 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: C.grey500 }}>{p.validity}</div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: C.blue700, marginTop: 2 }}>₦{p.price}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={s.label}>Phone Number</label>
                <input style={s.input} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08XXXXXXXXX" />
              </div>
            </>
          )}

          {/* AIRTIME */}
          {service === "airtime" && (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: C.grey900 }}>📱 Buy Airtime</div>
              <div style={{ marginBottom: 14 }}>
                <label style={s.label}>Select Network</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {networks.map(n => <div key={n} style={s.networkBadge(network === n)} onClick={() => setNetwork(n)}>{n}</div>)}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={s.label}>Phone Number</label>
                <input style={s.input} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08XXXXXXXXX" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={s.label}>Amount (₦)</label>
                <input style={s.input} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g 500" />
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  {[100, 200, 500, 1000, 2000].map(a => <span key={a} onClick={() => setAmount(String(a))} style={{ background: C.blue50, color: C.blue700, borderRadius: 8, padding: "5px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>₦{a}</span>)}
                </div>
              </div>
            </>
          )}

          {/* TV */}
          {service === "tv" && (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: C.grey900 }}>📺 TV Subscription</div>
              <div style={{ marginBottom: 14 }}>
                <label style={s.label}>Select Provider</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {tvProviders.map(p => <div key={p} style={s.networkBadge(tvProvider === p)} onClick={() => { setTvProvider(p); setTvPlan(""); }}>{p}</div>)}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={s.label}>Select Plan</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {(tvPlans[tvProvider] || []).map(p => (
                    <div key={p.name} onClick={() => setTvPlan(p.name)} style={{ padding: "10px 12px", borderRadius: 10, border: tvPlan === p.name ? `2px solid ${C.blue500}` : `1.5px solid ${C.grey300}`, background: tvPlan === p.name ? C.blue50 : C.white, cursor: "pointer" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: tvPlan === p.name ? C.blue700 : C.grey900 }}>{p.name}</div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: C.blue700 }}>₦{p.price.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={s.label}>Decoder / Smart Card Number</label>
                <input style={s.input} type="text" value={decoder} onChange={e => setDecoder(e.target.value)} placeholder="Enter decoder number" />
              </div>
            </>
          )}

          {/* ELECTRICITY */}
          {service === "electricity" && (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: C.grey900 }}>💡 Electricity Payment</div>
              <div style={{ marginBottom: 14 }}>
                <label style={s.label}>Select DisCo</label>
                <select style={s.input} value={discoProvider} onChange={e => setDiscoProvider(e.target.value)}>
                  {discoCos.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={s.label}>Meter Type</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["Prepaid", "Postpaid"].map(m => <div key={m} style={s.networkBadge(meterType === m)} onClick={() => setMeterType(m)}>{m}</div>)}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={s.label}>Meter Number</label>
                <input style={s.input} type="text" value={meter} onChange={e => setMeter(e.target.value)} placeholder="Enter meter number" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={s.label}>Amount (₦)</label>
                <input style={s.input} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Minimum ₦1000" />
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  {[1000, 2000, 5000, 10000].map(a => <span key={a} onClick={() => setAmount(String(a))} style={{ background: C.blue50, color: C.blue700, borderRadius: 8, padding: "5px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>₦{a}</span>)}
                </div>
              </div>
            </>
          )}

          {/* Payment Mode */}
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Payment Method</label>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={s.networkBadge(payMode === "wallet")} onClick={() => setPayMode("wallet")}>💰 Wallet (₦{(user.wallet || 0).toLocaleString()})</div>
              <div style={s.networkBadge(payMode === "transfer")} onClick={() => setPayMode("transfer")}>🏦 Transfer</div>
            </div>
          </div>

          {orderAmount > 0 && (
            <div style={{ background: C.blue50, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: C.grey600, fontSize: 14 }}>Total Amount:</span>
                <span style={{ color: C.blue900, fontWeight: 800, fontSize: 16 }}>₦{orderAmount.toLocaleString()}</span>
              </div>
              {payMode === "wallet" && !canAfford && (
                <div style={{ color: C.red, fontSize: 12, marginTop: 4, fontWeight: 600 }}>⚠️ Insufficient balance. Please fund your wallet.</div>
              )}
            </div>
          )}

          <button style={{ ...s.btnPrimary, opacity: (orderAmount === 0 || (payMode === "wallet" && !canAfford)) ? 0.5 : 1 }}
            onClick={() => {
              if (orderAmount === 0) return showToast("Please complete the form", "error");
              if (payMode === "wallet" && !canAfford) return showToast("Insufficient wallet balance", "error");
              setConfirm(true);
            }}>
            Proceed to Order
          </button>
        </div>
      </div>

      {/* Confirm Modal */}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 200 }}>
          <div style={{ background: C.white, borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 480, margin: "0 auto" }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 16 }}>Confirm Order</div>
            <div style={{ background: C.grey100, borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 14, lineHeight: 1.8 }}>
              <div><b>Service:</b> {service.toUpperCase()}</div>
              {(service === "data" || service === "airtime") && <div><b>Network:</b> {network}</div>}
              {service === "data" && selectedPlanObj && <div><b>Plan:</b> {selectedPlanObj.name} ({selectedPlanObj.validity})</div>}
              {(service === "data" || service === "airtime") && <div><b>Phone:</b> {phone}</div>}
              {service === "tv" && <><div><b>Provider:</b> {tvProvider}</div><div><b>Plan:</b> {tvPlan}</div><div><b>Decoder:</b> {decoder}</div></>}
              {service === "electricity" && <><div><b>DisCo:</b> {discoProvider}</div><div><b>Meter:</b> {meter}</div><div><b>Type:</b> {meterType}</div></>}
              <div><b>Amount:</b> ₦{orderAmount.toLocaleString()}</div>
              <div><b>Payment:</b> {payMode === "wallet" ? "Wallet" : "Bank Transfer"}</div>
            </div>
            {payMode === "transfer" && (
              <div style={{ background: C.blue50, borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 13 }}>
                <b>Pay to:</b> {settings.bankName}<br />
                <b>Account:</b> {settings.accountNumber}<br />
                <b>Name:</b> {settings.accountName}<br />
                <span style={{ color: C.grey500 }}>After transfer, your order will be processed manually.</span>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...s.btnOutline, flex: 1 }} onClick={() => setConfirm(false)}>Cancel</button>
              <button style={{ ...s.btnPrimary, flex: 1 }} onClick={placeOrder}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// WALLET PAGE
function WalletPage({ user, settings, walletRequests, onFundRequest, showToast }) {
  const [amount, setAmount] = useState("");
  const [proof, setProof] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleRequest = () => {
    if (!amount || parseInt(amount) < 100) return showToast("Minimum ₦100", "error");
    const req = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      amount: parseInt(amount),
      proof,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    onFundRequest(req);
    setAmount(""); setProof(""); setShowModal(false);
  };

  const copyAccNum = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(settings.accountNumber);
    showToast("Account number copied!", "success");
  };

  return (
    <div>
      <div style={s.header}>
        <LeemanLogo size={32} />
        <div style={{ color: C.white, fontWeight: 800, fontSize: 17 }}>My Wallet</div>
      </div>
      <div style={{ padding: "16px 16px" }}>
        <div style={s.cardBlue}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>Available Balance</div>
          <div style={{ fontSize: 36, fontWeight: 800 }}>₦{(user.wallet || 0).toLocaleString()}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>@{user.username}</div>
        </div>

        {/* Account details for payment */}
        <div style={{ ...s.card, background: C.blue50, border: `1.5px solid ${C.blue100}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.blue900, marginBottom: 10 }}>💳 Fund Your Wallet</div>
          <div style={{ fontSize: 13, color: C.grey700, marginBottom: 12 }}>Transfer to this account, then tap "I've Paid" below:</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, color: C.grey500 }}>{settings.bankName}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.blue900, letterSpacing: 2 }}>{settings.accountNumber}</div>
              <div style={{ fontSize: 13, color: C.grey700 }}>{settings.accountName}</div>
            </div>
            <button onClick={copyAccNum} style={s.btnSmall}>Copy</button>
          </div>
        </div>

        <button style={s.btnPrimary} onClick={() => setShowModal(true)}>I've Made Payment</button>

        <div style={{ fontWeight: 700, fontSize: 14, color: C.grey900, margin: "20px 0 10px" }}>Fund Request History</div>
        {walletRequests.length === 0 ? (
          <div style={{ textAlign: "center", color: C.grey500, padding: 20, fontSize: 14 }}>No fund requests yet</div>
        ) : walletRequests.map(r => (
          <div key={r.id} style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>₦{r.amount.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: C.grey500 }}>{new Date(r.createdAt).toLocaleDateString()}</div>
            </div>
            <span style={s.pill(r.status === "approved" ? C.green : r.status === "declined" ? C.red : C.yellow, r.status === "approved" ? C.greenBg : r.status === "declined" ? C.redBg : C.yellowBg)}>
              {r.status === "approved" ? "✅ Approved" : r.status === "declined" ? "❌ Declined" : "⏳ Pending"}
            </span>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 200 }}>
          <div style={{ background: C.white, borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 480, margin: "0 auto" }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 16 }}>Payment Request</div>
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Amount Paid (₦)</label>
              <input style={s.input} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g 5000" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Transfer Reference / Note (optional)</label>
              <input style={s.input} value={proof} onChange={e => setProof(e.target.value)} placeholder="e.g TXN123456" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...s.btnOutline, flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={{ ...s.btnPrimary, flex: 1 }} onClick={handleRequest}>Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// USER HISTORY
function UserHistory({ orders }) {
  return (
    <div>
      <div style={s.header}>
        <LeemanLogo size={32} />
        <div style={{ color: C.white, fontWeight: 800, fontSize: 17 }}>Transaction History</div>
      </div>
      <div style={{ padding: "16px 16px" }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: "center", color: C.grey500, padding: 40, fontSize: 14 }}>No transactions yet</div>
        ) : orders.map(o => <OrderCard key={o.id} order={o} />)}
      </div>
    </div>
  );
}

function OrderCard({ order }) {
  const icons = { data: "📶", airtime: "📱", tv: "📺", electricity: "💡" };
  return (
    <div style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ fontSize: 28 }}>{icons[order.service]}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            {order.service === "data" ? `${order.network} ${order.plan}` :
             order.service === "airtime" ? `${order.network} Airtime` :
             order.service === "tv" ? `${order.tvProvider} ${order.plan || ""}` :
             `${order.discoProvider} ${order.meterType}`}
          </div>
          <div style={{ fontSize: 12, color: C.grey500 }}>{order.recipientPhone || order.decoderNumber || order.meterNumber}</div>
          <div style={{ fontSize: 11, color: C.grey400 }}>{new Date(order.createdAt).toLocaleString()}</div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontWeight: 800, color: C.blue900 }}>₦{order.amount?.toLocaleString()}</div>
        <span style={s.pill(order.status === "completed" ? C.green : order.status === "failed" ? C.red : C.yellow, order.status === "completed" ? C.greenBg : order.status === "failed" ? C.redBg : C.yellowBg)}>
          {order.status === "completed" ? "✅ Done" : order.status === "failed" ? "❌ Failed" : "⏳ Processing"}
        </span>
      </div>
    </div>
  );
}

// USER NOTIFICATIONS
function UserNotifications({ notifications }) {
  return (
    <div>
      <div style={s.header}>
        <LeemanLogo size={32} />
        <div style={{ color: C.white, fontWeight: 800, fontSize: 17 }}>Notifications</div>
      </div>
      <div style={{ padding: "16px 16px" }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: "center", color: C.grey500, padding: 40, fontSize: 14 }}>No notifications</div>
        ) : notifications.map(n => (
          <div key={n.id} style={{ ...s.card, borderLeft: `4px solid ${C.blue500}` }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{n.title}</div>
            <div style={{ fontSize: 13, color: C.grey700, marginTop: 4 }}>{n.body}</div>
            <div style={{ fontSize: 11, color: C.grey400, marginTop: 6 }}>{new Date(n.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================
function AdminDashboard({ tab, setTab, orders, users, settings, walletRequests, notifications, onUpdateOrder, onUpdateSettings, onSendNotification, onHandleWalletReq, onUpdateUser, onLogout, showToast, toast }) {
  const tabs = [
    { id: "dashboard", icon: "📊", label: "Overview" },
    { id: "orders", icon: "📋", label: "Orders" },
    { id: "wallet", icon: "💰", label: "Wallet" },
    { id: "users", icon: "👥", label: "Users" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <div style={{ ...s.app, ...s.page }}>
      <Toast {...toast} />
      {tab === "dashboard" && <AdminOverview orders={orders} users={users} walletRequests={walletRequests} setTab={setTab} onLogout={onLogout} />}
      {tab === "orders" && <AdminOrders orders={orders} onUpdateOrder={onUpdateOrder} showToast={showToast} />}
      {tab === "wallet" && <AdminWallet walletRequests={walletRequests} onHandleWalletReq={onHandleWalletReq} showToast={showToast} />}
      {tab === "users" && <AdminUsers users={users} orders={orders} onUpdateUser={onUpdateUser} showToast={showToast} />}
      {tab === "settings" && <AdminSettings settings={settings} onUpdateSettings={onUpdateSettings} onSendNotification={onSendNotification} users={users} showToast={showToast} />}
      <div style={s.bottomNav}>
        {tabs.map(t => (
          <div key={t.id} style={s.navItem(tab === t.id)} onClick={() => setTab(t.id)}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminOverview({ orders, users, walletRequests, setTab, onLogout }) {
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const totalRevenue = orders.filter(o => o.status === "completed").reduce((s, o) => s + (o.amount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === "pending");
  const pendingWallet = walletRequests.filter(w => w.status === "pending");

  return (
    <div>
      <div style={{ background: `linear-gradient(135deg, ${C.blue900}, ${C.blue500})`, padding: "20px 20px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LeemanLogo size={38} />
            <div>
              <div style={{ color: C.white, fontWeight: 800, fontSize: 15 }}>Admin Panel</div>
              <div style={{ color: C.blue100, fontSize: 12 }}>Leeman Data Sub</div>
            </div>
          </div>
          <span onClick={onLogout} style={{ color: C.blue100, cursor: "pointer", fontSize: 13 }}>Logout</span>
        </div>
      </div>
      <div style={{ padding: "16px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[
            { label: "Total Revenue", val: `₦${totalRevenue.toLocaleString()}`, color: C.green, bg: C.greenBg },
            { label: "Total Orders", val: orders.length, color: C.blue700, bg: C.blue50 },
            { label: "Today's Orders", val: todayOrders.length, color: C.yellow, bg: C.yellowBg },
            { label: "Total Users", val: users.length, color: C.blue900, bg: C.blue100 },
          ].map(item => (
            <div key={item.label} style={{ ...s.card, margin: 0, background: item.bg }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.val}</div>
              <div style={{ fontSize: 12, color: C.grey700 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {pendingOrders.length > 0 && (
          <div style={{ ...s.card, background: C.yellowBg, border: `1.5px solid ${C.yellow}`, cursor: "pointer" }} onClick={() => setTab("orders")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, color: C.yellow }}>⚠️ Pending Orders</div>
                <div style={{ fontSize: 13, color: C.grey700 }}>{pendingOrders.length} order(s) need attention</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.yellow }}>{pendingOrders.length}</div>
            </div>
          </div>
        )}

        {pendingWallet.length > 0 && (
          <div style={{ ...s.card, background: C.blue50, border: `1.5px solid ${C.blue400}`, cursor: "pointer" }} onClick={() => setTab("wallet")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, color: C.blue700 }}>💰 Wallet Requests</div>
                <div style={{ fontSize: 13, color: C.grey700 }}>{pendingWallet.length} request(s) awaiting</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.blue700 }}>{pendingWallet.length}</div>
            </div>
          </div>
        )}

        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Recent Orders</div>
        {orders.slice(0, 5).map(o => (
          <div key={o.id} style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>@{o.username} — {o.service?.toUpperCase()}</div>
              <div style={{ fontSize: 12, color: C.grey500 }}>{o.network || o.tvProvider || o.discoProvider} {o.plan || ""}</div>
              <div style={{ fontSize: 11, color: C.grey400 }}>{new Date(o.createdAt).toLocaleString()}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 800 }}>₦{o.amount?.toLocaleString()}</div>
              <span style={s.pill(o.status === "completed" ? C.green : o.status === "failed" ? C.red : C.yellow, o.status === "completed" ? C.greenBg : o.status === "failed" ? C.redBg : C.yellowBg)}>
                {o.status === "completed" ? "✅ Done" : o.status === "failed" ? "❌ Failed" : "⏳ Processing"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminOrders({ orders, onUpdateOrder, showToast }) {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  return (
    <div>
      <div style={s.header}>
        <LeemanLogo size={32} />
        <div style={{ color: C.white, fontWeight: 800, fontSize: 17 }}>Manage Orders</div>
      </div>
      <div style={{ padding: "16px 16px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
          {[["all", "All"], ["pending", "⏳ Pending"], ["completed", "✅ Completed"], ["failed", "❌ Failed"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 20, border: filter === v ? "none" : `1.5px solid ${C.grey300}`, background: filter === v ? C.blue700 : C.white, color: filter === v ? C.white : C.grey700, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{l} {v !== "all" ? `(${orders.filter(o => o.status === v).length})` : `(${orders.length})`}</button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: C.grey500, padding: 40 }}>No orders found</div>
        ) : filtered.map(o => (
          <div key={o.id} style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>@{o.username}</div>
                <div style={{ fontSize: 13, color: C.grey700 }}>
                  {o.service?.toUpperCase()} — {o.network || o.tvProvider || o.discoProvider} {o.plan || ""}
                </div>
                <div style={{ fontSize: 12, color: C.grey500 }}>
                  {o.recipientPhone || o.decoderNumber || o.meterNumber}
                </div>
                <div style={{ fontSize: 11, color: C.grey400 }}>{new Date(o.createdAt).toLocaleString()}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>₦{o.amount?.toLocaleString()}</div>
                <span style={s.pill(o.status === "completed" ? C.green : o.status === "failed" ? C.red : C.yellow, o.status === "completed" ? C.greenBg : o.status === "failed" ? C.redBg : C.yellowBg)}>
                  {o.status === "completed" ? "✅ Done" : o.status === "failed" ? "❌ Failed" : "⏳ Processing"}
                </span>
              </div>
            </div>
            {o.note && <div style={{ fontSize: 12, color: C.grey500, marginBottom: 8 }}>Note: {o.note}</div>}
            {o.status === "pending" && (
              <div style={{ display: "flex", gap: 8 }}>
                <button style={s.btnSuccess} onClick={() => { onUpdateOrder(o.id, "completed", note); showToast("Order completed!"); }}>✅ Complete</button>
                <button style={s.btnDanger} onClick={() => { onUpdateOrder(o.id, "failed", note); showToast("Order marked failed", "error"); }}>❌ Fail</button>
                <button style={{ ...s.btnSmall, background: C.grey300, color: C.grey700 }} onClick={() => setSelected(selected === o.id ? null : o.id)}>📝 Note</button>
              </div>
            )}
            {selected === o.id && (
              <div style={{ marginTop: 10 }}>
                <input style={s.input} value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminWallet({ walletRequests, onHandleWalletReq, showToast }) {
  const [filter, setFilter] = useState("pending");
  const filtered = filter === "all" ? walletRequests : walletRequests.filter(w => w.status === filter);

  return (
    <div>
      <div style={s.header}>
        <LeemanLogo size={32} />
        <div style={{ color: C.white, fontWeight: 800, fontSize: 17 }}>Wallet Requests</div>
      </div>
      <div style={{ padding: "16px 16px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[["pending", "⏳ Pending"], ["approved", "✅ Approved"], ["declined", "❌ Declined"], ["all", "All"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 20, border: filter === v ? "none" : `1.5px solid ${C.grey300}`, background: filter === v ? C.blue700 : C.white, color: filter === v ? C.white : C.grey700, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{l}</button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: C.grey500, padding: 40 }}>No requests</div>
        ) : filtered.map(w => (
          <div key={w.id} style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700 }}>@{w.username}</div>
                <div style={{ fontSize: 13, color: C.grey500 }}>Ref: {w.proof || "N/A"}</div>
                <div style={{ fontSize: 11, color: C.grey400 }}>{new Date(w.createdAt).toLocaleString()}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: 17, color: C.blue900 }}>₦{w.amount?.toLocaleString()}</div>
                <span style={s.pill(w.status === "approved" ? C.green : w.status === "declined" ? C.red : C.yellow, w.status === "approved" ? C.greenBg : w.status === "declined" ? C.redBg : C.yellowBg)}>
                  {w.status}
                </span>
              </div>
            </div>
            {w.status === "pending" && (
              <div style={{ display: "flex", gap: 8 }}>
                <button style={s.btnSuccess} onClick={() => onHandleWalletReq(w.id, "approved", w.userId, w.amount)}>✅ Approve & Fund</button>
                <button style={s.btnDanger} onClick={() => onHandleWalletReq(w.id, "declined", w.userId, 0)}>❌ Decline</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminUsers({ users, orders, onUpdateUser, showToast }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [walletAdd, setWalletAdd] = useState("");

  const filtered = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  const sel = users.find(u => u.id === selected);

  const addWallet = () => {
    if (!walletAdd || parseInt(walletAdd) <= 0) return showToast("Enter valid amount", "error");
    onUpdateUser({ ...sel, wallet: (sel.wallet || 0) + parseInt(walletAdd) });
    setWalletAdd("");
    showToast(`₦${parseInt(walletAdd).toLocaleString()} added!`, "success");
  };

  return (
    <div>
      <div style={s.header}>
        <LeemanLogo size={32} />
        <div style={{ color: C.white, fontWeight: 800, fontSize: 17 }}>Manage Users</div>
      </div>
      <div style={{ padding: "16px 16px" }}>
        <input style={{ ...s.input, marginBottom: 16 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by username or email..." />
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: C.grey500, padding: 40 }}>No users found</div>
        ) : filtered.map(u => (
          <div key={u.id} style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700 }}>@{u.username}</div>
                <div style={{ fontSize: 13, color: C.grey500 }}>{u.fullname} • {u.phone}</div>
                <div style={{ fontSize: 12, color: C.grey400 }}>{u.email}</div>
                <div style={{ fontSize: 13, color: C.blue700, fontWeight: 700 }}>Balance: ₦{(u.wallet || 0).toLocaleString()}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                <span style={s.pill(u.blocked ? C.red : C.green, u.blocked ? C.redBg : C.greenBg)}>{u.blocked ? "Blocked" : "Active"}</span>
                <button style={s.btnSmall} onClick={() => setSelected(selected === u.id ? null : u.id)}>Manage</button>
              </div>
            </div>
            {selected === u.id && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.grey300}` }}>
                <div style={{ marginBottom: 10 }}>
                  <label style={s.label}>Add Wallet Balance (₦)</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input style={{ ...s.input, flex: 1 }} type="number" value={walletAdd} onChange={e => setWalletAdd(e.target.value)} placeholder="Amount" />
                    <button style={s.btnSuccess} onClick={addWallet}>Add</button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={u.blocked ? s.btnSuccess : s.btnDanger} onClick={() => { onUpdateUser({ ...u, blocked: !u.blocked }); showToast(`User ${u.blocked ? "unblocked" : "blocked"}!`); }}>
                    {u.blocked ? "✅ Unblock" : "🚫 Block"}
                  </button>
                </div>
                <div style={{ marginTop: 10, fontSize: 13, color: C.grey500 }}>
                  Orders: {orders.filter(o => o.userId === u.id).length} total
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminSettings({ settings, onUpdateSettings, onSendNotification, users, showToast }) {
  const [form, setForm] = useState({ ...settings });
  const [tab, setTab] = useState("account");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifTarget, setNotifTarget] = useState("all");
  const [editingPlan, setEditingPlan] = useState(null);
  const [newPlan, setNewPlan] = useState({ network: "MTN", name: "", validity: "", price: "" });

  const saveAccount = () => {
    onUpdateSettings({ ...settings, bankName: form.bankName, accountName: form.accountName, accountNumber: form.accountNumber, whatsapp: form.whatsapp });
    showToast("Account details saved!", "success");
  };

  const sendNotif = () => {
    if (!notifTitle || !notifBody) return showToast("Fill title and message", "error");
    onSendNotification({ id: Date.now().toString(), title: notifTitle, body: notifBody, target: notifTarget, createdAt: new Date().toISOString() });
    setNotifTitle(""); setNotifBody("");
  };

  const updatePlanPrice = (network, planId, newPrice) => {
    const updated = { ...settings.dataPlans, [network]: settings.dataPlans[network].map(p => p.id === planId ? { ...p, price: parseInt(newPrice) } : p) };
    onUpdateSettings({ ...settings, dataPlans: updated });
    showToast("Price updated!", "success");
  };

  const addPlan = () => {
    if (!newPlan.name || !newPlan.validity || !newPlan.price) return showToast("Fill all plan fields", "error");
    const id = newPlan.network.toLowerCase() + Date.now();
    const updated = { ...settings.dataPlans, [newPlan.network]: [...(settings.dataPlans[newPlan.network] || []), { id, name: newPlan.name, validity: newPlan.validity, price: parseInt(newPlan.price) }] };
    onUpdateSettings({ ...settings, dataPlans: updated });
    setNewPlan({ network: "MTN", name: "", validity: "", price: "" });
    showToast("Plan added!", "success");
  };

  const deletePlan = (network, planId) => {
    const updated = { ...settings.dataPlans, [network]: settings.dataPlans[network].filter(p => p.id !== planId) };
    onUpdateSettings({ ...settings, dataPlans: updated });
    showToast("Plan deleted!", "success");
  };

  return (
    <div>
      <div style={s.header}>
        <LeemanLogo size={32} />
        <div style={{ color: C.white, fontWeight: 800, fontSize: 17 }}>Settings</div>
      </div>
      <div style={{ padding: "16px 16px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
          {[["account", "🏦 Account"], ["plans", "📶 Data Plans"], ["notif", "📢 Notify"]].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 20, border: tab === v ? "none" : `1.5px solid ${C.grey300}`, background: tab === v ? C.blue700 : C.white, color: tab === v ? C.white : C.grey700, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{l}</button>
          ))}
        </div>

        {tab === "account" && (
          <div style={s.card}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>🏦 Bank Account Details</div>
            {[["bankName", "Bank Name"], ["accountName", "Account Name"], ["accountNumber", "Account Number"], ["whatsapp", "WhatsApp Number"]].map(([k, lbl]) => (
              <div key={k} style={{ marginBottom: 14 }}>
                <label style={s.label}>{lbl}</label>
                <input style={s.input} value={form[k] || ""} onChange={e => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
            <button style={s.btnPrimary} onClick={saveAccount}>Save Account Details</button>
          </div>
        )}

        {tab === "plans" && (
          <div>
            {["MTN", "Glo", "Airtel", "9mobile"].map(network => (
              <div key={network} style={s.card}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.blue900, marginBottom: 10 }}>{network} Plans</div>
                {(settings.dataPlans[network] || []).map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1, fontSize: 13 }}><b>{p.name}</b> ({p.validity})</div>
                    {editingPlan === p.id ? (
                      <>
                        <input style={{ ...s.input, width: 80, padding: "6px 8px", fontSize: 13 }} type="number" defaultValue={p.price}
                          onBlur={e => { updatePlanPrice(network, p.id, e.target.value); setEditingPlan(null); }} autoFocus />
                      </>
                    ) : (
                      <span style={{ fontWeight: 700, color: C.blue700, fontSize: 14 }}>₦{p.price}</span>
                    )}
                    <button style={{ ...s.btnSmall, padding: "5px 10px", fontSize: 12 }} onClick={() => setEditingPlan(editingPlan === p.id ? null : p.id)}>✏️</button>
                    <button style={{ ...s.btnDanger, padding: "5px 10px", fontSize: 12 }} onClick={() => deletePlan(network, p.id)}>🗑️</button>
                  </div>
                ))}
              </div>
            ))}
            <div style={s.card}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>➕ Add New Plan</div>
              <div style={{ marginBottom: 10 }}>
                <label style={s.label}>Network</label>
                <select style={s.input} value={newPlan.network} onChange={e => setNewPlan({ ...newPlan, network: e.target.value })}>
                  {["MTN", "Glo", "Airtel", "9mobile"].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              {[["name", "Plan Name (e.g. 3GB)"], ["validity", "Validity (e.g. 30 Days)"], ["price", "Price (₦)"]].map(([k, ph]) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <label style={s.label}>{ph.split(" (")[0]}</label>
                  <input style={s.input} value={newPlan[k]} onChange={e => setNewPlan({ ...newPlan, [k]: e.target.value })} placeholder={ph} type={k === "price" ? "number" : "text"} />
                </div>
              ))}
              <button style={s.btnPrimary} onClick={addPlan}>Add Plan</button>
            </div>
          </div>
        )}

        {tab === "notif" && (
          <div style={s.card}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>📢 Send Notification</div>
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Send to</label>
              <select style={s.input} value={notifTarget} onChange={e => setNotifTarget(e.target.value)}>
                <option value="all">All Users</option>
                {users.map(u => <option key={u.id} value={u.id}>@{u.username}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Title</label>
              <input style={s.input} value={notifTitle} onChange={e => setNotifTitle(e.target.value)} placeholder="e.g. New offer available!" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Message</label>
              <textarea style={{ ...s.input, minHeight: 80, resize: "vertical" }} value={notifBody} onChange={e => setNotifBody(e.target.value)} placeholder="Type your message here..." />
            </div>
            <button style={s.btnPrimary} onClick={sendNotif}>Send Notification</button>
          </div>
        )}
      </div>
    </div>
  );
}
