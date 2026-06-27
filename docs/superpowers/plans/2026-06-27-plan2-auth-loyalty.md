# TJ's Kebab Centre — Plan 2: Customer Auth + Loyalty Stamps

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add customer account system (Firebase Auth email/password), loyalty stamp tracking (5 orders → 6th free), and an account page with animated stamp card and order history. Replaces the stubs created in Plan 1.

**Architecture:** Firebase Auth (email/password) for login/signup. Firestore `customers` collection stores profile + stamp count. After each order reaches `ready` status, Admin increments stamps. When stamps hit 5, customer gets a free order flag. AuthContext wraps the app, account page shows stamp card + order history.

**Tech Stack:** Firebase Auth (existing), Firebase Firestore (existing), React 18, Tailwind, Framer Motion (installed in Plan 1)

## Global Constraints
- Use Firebase Auth email/password — no third-party OAuth in this plan
- stamps field: integer 0–5; resets to 0 after free order is claimed
- freeOrderEligible: boolean — set true when stamps === 5
- Customer document created in Firestore on signup (not on first order)
- AuthContext available throughout app via `useAuth()` hook
- Plan 1 must be complete before this plan runs

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `src/context/AuthContext.js` | Firebase Auth state, customer Firestore doc |
| Create | `src/hooks/useAuth.js` | convenience hook |
| Modify | `src/App.js` | wrap with AuthProvider, replace stubs |
| Create | `src/pages/LoginPage.js` | email/password login form |
| Create | `src/pages/SignupPage.js` | registration form, creates Firestore doc |
| Create | `src/pages/AccountPage.js` | loyalty stamp card + order history |
| Create | `src/components/LoyaltyCard.js` | animated stamp card component |
| Modify | `src/components/Navbar.js` | show account link when logged in |
| Modify | `src/pages/CheckoutPage.js` | pre-fill from customer doc if logged in; link order to customerId |
| Modify | `src/pages/OrderConfirmationPage.js` | show loyalty stamp progress if logged in |

---

### Task 1: AuthContext + useAuth hook

**Files:**
- Create: `src/context/AuthContext.js`
- Create: `src/hooks/useAuth.js`

**Interfaces:**
- Produces: `AuthContext`, `AuthProvider`, `useAuth()` → `{ user, customer, loading, signIn, signUp, signOut }`
- `user`: Firebase Auth user object or null
- `customer`: Firestore `customers/{uid}` document data or null
- `signIn(email, password)` → Promise (throws on error)
- `signUp(firstName, lastName, email, password, phone)` → Promise (throws on error)
- `signOut()` → Promise

- [ ] **Step 1: Write src/context/AuthContext.js**
```jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,     setUser]     = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let customerUnsub = () => {};

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      customerUnsub();

      if (firebaseUser) {
        // Subscribe to customer document
        customerUnsub = onSnapshot(doc(db, 'customers', firebaseUser.uid), (snap) => {
          setCustomer(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        });
      } else {
        setCustomer(null);
      }

      setLoading(false);
    });

    return () => { authUnsub(); customerUnsub(); };
  }, []);

  const signUp = async (firstName, lastName, email, password, phone) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'customers', cred.user.uid), {
      firstName,
      lastName,
      email,
      phone: phone || null,
      stamps: 0,
      totalOrders: 0,
      freeOrderEligible: false,
      notifyEmail: true,
      notifySMS: false,
      notifyPush: false,
      fcmToken: null,
      createdAt: new Date().toISOString(),
    });
  };

  const signIn  = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const signOut = () => firebaseSignOut(auth);

  return (
    <AuthContext.Provider value={{ user, customer, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
```

- [ ] **Step 2: Write src/hooks/useAuth.js**
```js
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
```

- [ ] **Step 3: Wrap App with AuthProvider in src/App.js**

Open `src/App.js`. Add import and wrap:
```jsx
import { AuthProvider } from './context/AuthContext';
// ...existing imports...
import LoginPage   from './pages/LoginPage';
import SignupPage  from './pages/SignupPage';
import AccountPage from './pages/AccountPage';

// Remove the 3 stub const declarations and replace with real imports above

export default function App() {
  const path = window.location.pathname;
  if (path.startsWith('/admin'))  return <AdminApp />;
  if (path.startsWith('/staff'))  return <StaffPortal />;

  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/"                   element={<HomePage />} />
            <Route path="/cart"               element={<CartPage />} />
            <Route path="/checkout"           element={<CheckoutPage />} />
            <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
            <Route path="/login"              element={<LoginPage />} />
            <Route path="/signup"             element={<SignupPage />} />
            <Route path="/account"            element={<AccountPage />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
```

- [ ] **Step 4: Verify**
```bash
npm start
```
Open `http://localhost:3000`. No errors in console. App loads normally. Auth state is `null` (not logged in).

- [ ] **Step 5: Commit**
```bash
git add src/context/AuthContext.js src/hooks/useAuth.js src/App.js
git commit -m "feat: add AuthContext + useAuth, wrap App with AuthProvider"
```

---

### Task 2: LoginPage

**Files:**
- Create: `src/pages/LoginPage.js`

**Interfaces:**
- Consumes: `useAuth()` → `{ signIn, user }`
- Redirects to `/account` on success, shows Firebase error messages on failure

- [ ] **Step 1: Write src/pages/LoginPage.js**
```jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const AUTH_ERRORS = {
  'auth/user-not-found':   'No account found with this email.',
  'auth/wrong-password':   'Incorrect password.',
  'auth/invalid-email':    'Invalid email address.',
  'auth/too-many-requests':'Too many attempts. Try again later.',
};

export default function LoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  if (user) { navigate('/account'); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/account');
    } catch (err) {
      setError(AUTH_ERRORS[err.code] ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-surface flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-white tracking-wide mb-1">WELCOME BACK</h1>
          <p className="text-muted text-sm">Sign in to track your loyalty stamps &amp; orders</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address" required
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-muted outline-none focus:border-brand/50 transition-colors"
            />
          </div>
          <div className="relative">
            <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" required
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-muted outline-none focus:border-brand/50 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-brand text-surface font-black text-sm py-4 rounded-xl hover:bg-brand-lit transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? 'Signing in...' : 'SIGN IN'}
          </button>
        </form>

        <p className="text-center text-muted text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand font-semibold hover:underline">Create one</Link>
        </p>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add src/pages/LoginPage.js
git commit -m "feat: add LoginPage — Firebase email/password auth"
```

---

### Task 3: SignupPage

**Files:**
- Create: `src/pages/SignupPage.js`

**Interfaces:**
- Consumes: `useAuth()` → `{ signUp, user }`
- Creates Firebase Auth user + Firestore `customers` document
- Redirects to `/account` on success

- [ ] **Step 1: Write src/pages/SignupPage.js**
```jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const AUTH_ERRORS = {
  'auth/email-already-in-use': 'This email is already registered. Try signing in.',
  'auth/weak-password':        'Password must be at least 6 characters.',
  'auth/invalid-email':        'Invalid email address.',
};

export default function SignupPage() {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  if (user) { navigate('/account'); return null; }

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6)       { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await signUp(form.firstName.trim(), form.lastName.trim(), form.email.trim(), form.password, form.phone.trim());
      navigate('/account');
    } catch (err) {
      setError(AUTH_ERRORS[err.code] ?? 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-card border border-border rounded-xl px-4 py-3.5 text-sm text-white placeholder-muted outline-none focus:border-brand/50 transition-colors';

  return (
    <div className="min-h-[calc(100vh-64px)] bg-surface flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-white tracking-wide mb-1">CREATE ACCOUNT</h1>
          <p className="text-muted text-sm">Join TJ's loyalty programme — earn a free kebab!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input value={form.firstName} onChange={set('firstName')} placeholder="First name" required className={inputCls} />
            <input value={form.lastName}  onChange={set('lastName')}  placeholder="Last name"  required className={inputCls} />
          </div>
          <input value={form.email}    onChange={set('email')}    placeholder="Email address"   type="email"    required className={inputCls} />
          <input value={form.phone}    onChange={set('phone')}    placeholder="Phone (optional)"type="tel"              className={inputCls} />
          <input value={form.password} onChange={set('password')} placeholder="Password (min 6)"type="password" required className={inputCls} />
          <input value={form.confirm}  onChange={set('confirm')}  placeholder="Confirm password" type="password" required className={inputCls} />

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <div className="bg-brand/8 border border-brand/20 rounded-xl px-4 py-3 text-xs text-muted">
            🎁 Every 5 orders earns you a <span className="text-brand font-semibold">FREE kebab + can</span>. Loyalty stamps are tracked automatically when you're signed in.
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-brand text-surface font-black text-sm py-4 rounded-xl hover:bg-brand-lit transition-colors disabled:opacity-60 mt-1"
          >
            {loading ? 'Creating account...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p className="text-center text-muted text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand font-semibold hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Navigate to `/signup`. Fill form. Submit → Firebase creates user, Firestore `customers` doc created with stamps:0. Redirects to `/account`.

- [ ] **Step 3: Commit**
```bash
git add src/pages/SignupPage.js
git commit -m "feat: add SignupPage — creates Firebase Auth user + Firestore customer doc"
```

---

### Task 4: LoyaltyCard component

**Files:**
- Create: `src/components/LoyaltyCard.js`

**Interfaces:**
- Consumes: `stamps: number` (0–5), `freeOrderEligible: boolean`
- Produces: animated stamp card showing 5 stamp slots + free reward slot

- [ ] **Step 1: Write src/components/LoyaltyCard.js**
```jsx
import React from 'react';
import { motion } from 'framer-motion';

const TOTAL_STAMPS = 5;

export default function LoyaltyCard({ stamps = 0, freeOrderEligible = false }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-bold text-sm">Loyalty Stamps</h3>
          <p className="text-muted text-xs mt-0.5">
            {freeOrderEligible
              ? '🎉 You earned a FREE kebab + can!'
              : `${TOTAL_STAMPS - stamps} more order${TOTAL_STAMPS - stamps !== 1 ? 's' : ''} to go`}
          </p>
        </div>
        <span className="text-brand font-black text-xl">{stamps}/{TOTAL_STAMPS}</span>
      </div>

      {/* Stamp slots */}
      <div className="flex items-center gap-2">
        {Array.from({ length: TOTAL_STAMPS }).map((_, i) => {
          const filled = i < stamps;
          return (
            <motion.div
              key={i}
              initial={false}
              animate={filled ? { scale: [1.2, 1], backgroundColor: '#f59e0b' } : {}}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`flex-1 aspect-square rounded-xl flex items-center justify-center text-lg border-2 transition-colors ${
                filled
                  ? 'bg-brand border-brand'
                  : 'bg-card2 border-border'
              }`}
            >
              {filled ? (
                <motion.span
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="text-surface text-xl"
                >
                  🥙
                </motion.span>
              ) : (
                <span className="text-border text-xs font-black">{i + 1}</span>
              )}
            </motion.div>
          );
        })}

        {/* Reward slot */}
        <div className={`flex-1 aspect-square rounded-xl flex items-center justify-center border-2 ${
          freeOrderEligible
            ? 'bg-green-500/20 border-green-500 animate-pulse'
            : 'bg-card2 border-dashed border-brand/30'
        }`}>
          {freeOrderEligible ? (
            <span className="text-xl">🎁</span>
          ) : (
            <span className="text-brand/50 text-xs font-black">FREE</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1.5 bg-card2 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-brand rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(stamps / TOTAL_STAMPS) * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {freeOrderEligible && (
        <p className="text-green-400 text-xs text-center mt-3 font-semibold">
          Show this screen at the counter to claim your free kebab + can!
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add src/components/LoyaltyCard.js
git commit -m "feat: add LoyaltyCard — animated stamp slots, progress bar, free order indicator"
```

---

### Task 5: AccountPage

**Files:**
- Create: `src/pages/AccountPage.js`

**Interfaces:**
- Consumes: `useAuth()` → `{ user, customer, signOut, loading }`
- Consumes: Firestore `orders` collection filtered by `customer.email`
- Renders: loyalty stamp card, order history, logout button

- [ ] **Step 1: Write src/pages/AccountPage.js**
```jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, ShoppingBag, User } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import LoyaltyCard from '../components/LoyaltyCard';

const STATUS_LABEL = {
  pending:  { label: 'Received',  color: 'text-blue-400'  },
  preparing:{ label: 'Preparing', color: 'text-amber-400' },
  ready:    { label: 'Ready',     color: 'text-green-400' },
};

export default function AccountPage() {
  const { user, customer, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [orders,       setOrders]       = useState([]);
  const [ordersLoading,setOrdersLoading]= useState(true);

  useEffect(() => {
    if (!user) return;
    getDocs(
      query(
        collection(db, 'orders'),
        where('customer.email', '==', user.email),
        orderBy('createdAt', 'desc'),
        limit(10)
      )
    )
      .then((snap) => setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-surface flex items-center justify-center">
        <div className="text-brand font-display text-xl tracking-wider animate-pulse">LOADING...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-surface flex flex-col items-center justify-center gap-5 px-4 text-center">
        <span className="text-6xl">🥙</span>
        <h2 className="font-display text-4xl text-white tracking-wide">JOIN THE LOYALTY PROGRAMME</h2>
        <p className="text-muted text-sm max-w-xs">Sign in or create an account to earn stamps and claim your free kebab!</p>
        <div className="flex gap-3">
          <Link to="/login"  className="bg-brand text-surface font-black text-sm px-6 py-3 rounded-xl hover:bg-brand-lit transition-colors">Sign In</Link>
          <Link to="/signup" className="bg-card border border-border text-white font-semibold text-sm px-6 py-3 rounded-xl hover:border-brand/40 transition-colors">Create Account</Link>
        </div>
        <LoyaltyCard stamps={0} />
      </div>
    );
  }

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-surface pb-10">
      {/* Profile header */}
      <div className="bg-card border-b border-border px-5 py-5">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center">
              <User size={18} className="text-brand" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">
                {customer ? `${customer.firstName} ${customer.lastName}` : user.email}
              </p>
              <p className="text-muted text-xs">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-muted hover:text-white text-xs font-semibold transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-6">
        {/* Loyalty card */}
        <section>
          <p className="text-xs font-black text-muted tracking-widest uppercase mb-3">My Stamps</p>
          <LoyaltyCard
            stamps={customer?.stamps ?? 0}
            freeOrderEligible={customer?.freeOrderEligible ?? false}
          />
        </section>

        {/* Order history */}
        <section>
          <p className="text-xs font-black text-muted tracking-widest uppercase mb-3">Recent Orders</p>
          {ordersLoading ? (
            <div className="text-muted text-sm text-center py-6">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <ShoppingBag size={28} className="text-muted mx-auto mb-2" />
              <p className="text-muted text-sm">No orders yet</p>
              <Link to="/" className="text-brand text-sm font-semibold hover:underline mt-1 block">Browse menu →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => {
                const statusInfo = STATUS_LABEL[order.status] ?? { label: order.status, color: 'text-muted' };
                const date = order.createdAt?.toDate?.()
                  ? order.createdAt.toDate().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Recent';
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted text-xs">{date}</span>
                      <span className={`text-xs font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-white text-sm font-semibold">{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</p>
                        <p className="text-muted text-xs mt-0.5">
                          {order.items?.slice(0, 2).map((i) => i.name).join(', ')}
                          {order.items?.length > 2 ? ` +${order.items.length - 2} more` : ''}
                        </p>
                      </div>
                      <span className="text-brand font-black text-base">${order.total?.toFixed(2)}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Navigate to `/account` while logged out — shows sign in prompt with demo stamp card. Log in → shows real name, stamp count (0), empty order history. Place an order as logged-in user → order appears in history.

- [ ] **Step 3: Commit**
```bash
git add src/pages/AccountPage.js
git commit -m "feat: add AccountPage — loyalty stamps, order history, sign out"
```

---

### Task 6: Update Navbar for auth state

**Files:**
- Modify: `src/components/Navbar.js`

**Interfaces:**
- Consumes: `useAuth()` → `{ user, customer }`
- Shows "My Account" link + stamp count badge when logged in; "Sign In" when logged out

- [ ] **Step 1: Update src/components/Navbar.js**

Replace the right-side actions section:
```jsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { itemCount } = useCart();
  const { user, customer } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 h-16 bg-card border-b border-border flex items-center justify-between px-5 md:px-8"
    >
      <button onClick={() => navigate('/')} className="flex items-center gap-2 focus:outline-none">
        <span className="font-display text-2xl tracking-wide text-white leading-none">
          TJ'S <span className="text-brand">KEBAB</span>
        </span>
        <span className="hidden sm:block text-[10px] text-muted tracking-widest uppercase mt-0.5 font-medium">Centre</span>
      </button>

      <div className="flex items-center gap-2">
        {/* Auth link */}
        {user ? (
          <Link
            to="/account"
            className="flex items-center gap-1.5 text-muted hover:text-white text-xs font-semibold transition-colors px-2 py-1"
          >
            <User size={14} />
            <span className="hidden sm:inline">{customer?.firstName ?? 'Account'}</span>
            {(customer?.stamps ?? 0) > 0 && (
              <span className="bg-brand text-surface text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {customer.stamps}/5
              </span>
            )}
          </Link>
        ) : (
          <Link
            to="/login"
            className="text-muted hover:text-white text-xs font-semibold transition-colors px-2 py-1 hidden sm:block"
          >
            Sign In
          </Link>
        )}

        {/* Cart button */}
        <button
          onClick={() => navigate('/cart')}
          className="relative flex items-center gap-2 bg-brand text-surface px-4 py-2 rounded-lg font-bold text-sm hover:bg-brand-lit transition-colors active:scale-95"
        >
          <ShoppingBag size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">Order</span>
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-white text-surface text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </button>
      </div>
    </motion.header>
  );
}
```

- [ ] **Step 2: Verify**

Not logged in: "Sign In" text link visible. Logged in: first name + stamp count badge visible. Clicking navigates to `/account`.

- [ ] **Step 3: Commit**
```bash
git add src/components/Navbar.js
git commit -m "feat: update Navbar — show auth state, loyalty stamp count in header"
```

---

### Task 7: Link orders to customer + auto-increment stamps in Admin

**Files:**
- Modify: `src/pages/CheckoutPage.js` (add customerId to order)
- Modify: `src/admin/AdminDashboard.js` (increment stamps when status → ready)

**Interfaces:**
- CheckoutPage: reads `useAuth().user?.uid` and adds `customerId` field to order document
- AdminDashboard: when status updated to `ready`, finds customer by email and increments stamps; if stamps reaches 5, sets `freeOrderEligible: true`

- [ ] **Step 1: Update CheckoutPage to include customerId**

In `src/pages/CheckoutPage.js`, import `useAuth`:
```js
import { useAuth } from '../hooks/useAuth';
```

Inside component, add:
```js
const { user, customer } = useAuth();
```

Pre-fill form from customer data (add to useEffect or initial state):
```js
const [form, setForm] = useState({
  firstName: customer?.firstName ?? '',
  lastName:  customer?.lastName  ?? '',
  phone:     customer?.phone     ?? '',
  email:     user?.email         ?? '',
  note: '',
});
```

In `addDoc` call, add `customerId`:
```js
await addDoc(collection(db, 'orders'), {
  // ...existing fields...
  customerId: user?.uid ?? null,
  customer: { firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone: form.phone.trim(), email: form.email.trim() },
  // ...rest of fields...
});
```

- [ ] **Step 2: Update AdminDashboard to increment stamps on ready status**

In `src/admin/AdminDashboard.js`, update `updateOrderStatus`:
```js
import { doc, updateDoc, collection, query, where, getDocs, increment } from 'firebase/firestore';

const updateOrderStatus = async (id, newStatus) => {
  await updateDoc(doc(db, 'orders', id), { status: newStatus });

  // Increment loyalty stamps when order is marked ready
  if (newStatus === 'ready') {
    const order = orders.find((o) => o.id === id);
    if (order?.customerId) {
      const custRef = doc(db, 'customers', order.customerId);
      const custSnap = await getDoc(custRef);
      if (custSnap.exists()) {
        const currentStamps = custSnap.data().stamps ?? 0;
        const newStamps = currentStamps + 1;
        await updateDoc(custRef, {
          stamps:             newStamps >= 5 ? 0 : newStamps,
          totalOrders:        increment(1),
          freeOrderEligible:  newStamps >= 5 ? true : false,
        });
      }
    }
  }

  // Send notification (existing notification code)
  const order = orders.find((o) => o.id === id);
  if (order?.fcmToken && STATUS_MESSAGES[newStatus]) {
    const { title, body } = STATUS_MESSAGES[newStatus];
    try {
      await addDoc(collection(db, 'notifications'), { token: order.fcmToken, title, body, orderId: id, createdAt: new Date().toISOString() });
    } catch(e) { console.log('Notification error:', e); }
  }
};
```

Also add `getDoc` to the import:
```js
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, onSnapshot, query, orderBy, increment } from 'firebase/firestore';
```

- [ ] **Step 3: Verify**

1. Create an account at `/signup`
2. Place 5 orders as that user (can use same cart repeated)
3. In admin, mark each order as "ready"
4. After 5th order marked ready: `customers/{uid}` should have `stamps: 0, freeOrderEligible: true`
5. Visit `/account` — LoyaltyCard shows 🎁 FREE reward

- [ ] **Step 4: Commit**
```bash
git add src/pages/CheckoutPage.js src/admin/AdminDashboard.js
git commit -m "feat: link orders to customer, auto-increment loyalty stamps on ready status"
```

---

### Task 8: Show loyalty progress on OrderConfirmationPage

**Files:**
- Modify: `src/pages/OrderConfirmationPage.js`

**Interfaces:**
- Consumes: `useAuth()` → `{ customer }` — reads stamp count after order
- Shows LoyaltyCard below confirmation if user is logged in

- [ ] **Step 1: Add loyalty section to OrderConfirmationPage**

In `src/pages/OrderConfirmationPage.js`:

Add imports:
```js
import { useAuth } from '../hooks/useAuth';
import LoyaltyCard from '../components/LoyaltyCard';
```

Inside component:
```js
const { user, customer } = useAuth();
```

After the "ORDER AGAIN" button, add:
```jsx
{user && customer && (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 1.1 }}
    className="w-full max-w-sm"
  >
    <p className="text-xs font-black text-muted tracking-widest uppercase mb-3 text-center">
      Your Loyalty Progress
    </p>
    <LoyaltyCard stamps={customer.stamps} freeOrderEligible={customer.freeOrderEligible} />
  </motion.div>
)}
```

- [ ] **Step 2: Verify**

Place an order while logged in. Confirmation page shows loyalty card below the main confirmation content, with correct stamp count.

- [ ] **Step 3: Final build check**
```bash
npm run build
```
Expected: successful build, no errors.

- [ ] **Step 4: Commit**
```bash
git add src/pages/OrderConfirmationPage.js
git commit -m "feat: show loyalty stamp progress on OrderConfirmationPage"
git commit -m "feat: Plan 2 complete — customer auth, loyalty stamps, account page"
```

---

## Plan 2 Complete

After all tasks:
- Firebase Auth email/password login and signup
- Firestore `customers` collection with stamps tracking
- Loyalty stamp card with animated kebab stamps (5 → free kebab + can)
- Account page with stamp card and last 10 orders
- Navbar shows auth state and stamp count
- Orders link to customer; admin marks ready → stamps auto-increment
- freeOrderEligible flag set at 5 stamps — customer shows screen at counter

**Next:** Plan 3 (Node.js backend — email, SMS, push) or Plan 4 (Admin enhancements)
