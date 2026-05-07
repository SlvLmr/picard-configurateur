import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, ExternalLink, Loader2, LogOut, Plus, Save, Trash2 } from 'lucide-react';
import { collections, getCollection } from './collections';
import { loadCollection, saveCollection } from './api';
import Field from './Field';

export default function Admin() {
  const [authState, setAuthState] = useState({ ready: false, user: null });

  useEffect(() => {
    const widget = window.netlifyIdentity;
    if (!widget) {
      setAuthState({ ready: true, user: null });
      return undefined;
    }
    const onInit = (user) => setAuthState({ ready: true, user });
    const onLogin = (user) => setAuthState({ ready: true, user });
    const onLogout = () => setAuthState({ ready: true, user: null });
    widget.on('init', onInit);
    widget.on('login', onLogin);
    widget.on('logout', onLogout);
    if (!widget.currentUser) {
      // Some browsers init the widget before our handler binds.
      widget.init?.();
    } else {
      setAuthState({ ready: true, user: widget.currentUser() });
    }
    return () => {
      widget.off('init', onInit);
      widget.off('login', onLogin);
      widget.off('logout', onLogout);
    };
  }, []);

  if (!authState.ready) {
    return <FullscreenStatus message="Chargement…" />;
  }

  if (!authState.user) {
    return <LoginScreen />;
  }

  return (
    <Routes>
      <Route element={<AdminShell user={authState.user} />}>
        <Route index element={<Navigate to={`/admin/${collections[0].key}`} replace />} />
        <Route path=":collectionKey" element={<CollectionListPage />} />
        <Route path=":collectionKey/new" element={<CollectionEditPage isNew />} />
        <Route path=":collectionKey/:itemIndex" element={<CollectionEditPage />} />
        <Route path="*" element={<Navigate to={`/admin/${collections[0].key}`} replace />} />
      </Route>
    </Routes>
  );
}

function FullscreenStatus({ message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-picard-cream text-picard-navy/70">
      <span className="inline-flex items-center gap-2 text-sm">
        <Loader2 size={16} className="animate-spin" /> {message}
      </span>
    </div>
  );
}

function LoginScreen() {
  const handleLogin = () => window.netlifyIdentity?.open('login');
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-stone-100 via-amber-50 to-stone-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-picard-navy/10 bg-white p-8 shadow-soft">
        <p className="text-[10px] uppercase tracking-[0.24em] text-picard-gold">Espace administrateur</p>
        <h1 className="mt-1 font-display text-3xl text-picard-navy">Picard Serrures</h1>
        <p className="mt-2 text-sm leading-relaxed text-picard-navy/65">
          Cet espace permet d'éditer le catalogue affiché sur le configurateur public. Connecte-toi
          avec ton compte Netlify Identity.
        </p>
        <button
          type="button"
          onClick={handleLogin}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-picard-navy px-6 py-3 text-sm font-medium uppercase tracking-[0.18em] text-picard-cream transition hover:bg-black"
        >
          Se connecter
        </button>
        <Link
          to="/"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-picard-navy/55 transition hover:text-picard-navy"
        >
          <ArrowLeft size={12} /> Retour au configurateur
        </Link>
      </div>
    </div>
  );
}

function AdminShell({ user }) {
  const handleLogout = () => window.netlifyIdentity?.logout();
  return (
    <div className="flex min-h-screen flex-col bg-picard-cream lg:flex-row">
      <aside className="flex flex-col gap-6 border-b border-picard-navy/10 bg-white px-6 py-5 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3">
          <Link to="/admin" className="block">
            <img
              src={`${import.meta.env.BASE_URL}LOGO-PICARD-SERRURES-MIDNIGHT.png`}
              alt="Picard Serrures"
              className="h-8 w-auto"
            />
            <span className="mt-1 block text-[10px] uppercase tracking-[0.22em] text-picard-navy/55">
              Espace admin
            </span>
          </Link>
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-picard-navy/15 p-1.5 text-picard-navy/55 transition hover:text-picard-navy"
            title="Voir le site"
          >
            <ExternalLink size={14} />
          </Link>
        </div>
        <nav className="flex flex-row flex-wrap gap-1 lg:flex-col lg:flex-nowrap">
          {collections.map((col) => (
            <NavLink
              key={col.key}
              to={`/admin/${col.key}`}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-picard-navy text-picard-cream'
                    : 'text-picard-navy/75 hover:bg-picard-navy/5 hover:text-picard-navy'
                }`
              }
            >
              <span>{col.label}</span>
              <ChevronRight size={14} className="opacity-50" />
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-picard-navy/10 pt-4">
          <span className="truncate text-xs text-picard-navy/65">{user.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.16em] text-picard-navy/55 transition hover:text-picard-red"
          >
            <LogOut size={12} /> Quitter
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">
        <Outlet />
      </main>
    </div>
  );
}

function CollectionListPage() {
  const { collectionKey } = useParams();
  const collection = getCollection(collectionKey);
  const { items, loading, error, reload } = useCollectionItems(collection?.file);
  const navigate = useNavigate();

  if (!collection) return <p>Collection inconnue.</p>;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-picard-gold">
            {items.length} entrée{items.length > 1 ? 's' : ''}
          </p>
          <h1 className="font-display text-4xl text-picard-navy">{collection.label}</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/admin/${collection.key}/new`)}
          className="inline-flex items-center gap-2 rounded-full bg-picard-red px-5 py-2.5 text-sm font-medium uppercase tracking-[0.16em] text-white transition hover:bg-[#A00D24]"
        >
          <Plus size={14} />
          Nouveau
        </button>
      </header>

      {loading && <FullscreenInline message="Chargement de la collection…" />}
      {error && <ErrorBanner message={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-picard-navy/20 bg-white px-6 py-10 text-center text-sm text-picard-navy/55">
          Cette collection est vide. Clique « Nouveau » pour ajouter le premier élément.
        </p>
      )}

      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx}>
            <Link
              to={`/admin/${collection.key}/${idx}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-picard-navy/10 bg-white px-5 py-4 transition hover:border-picard-navy/25 hover:shadow-soft"
            >
              <div className="flex min-w-0 items-center gap-4">
                {collection.swatch && (
                  <span
                    className="block h-10 w-10 shrink-0 rounded-md border border-picard-navy/15"
                    style={{ background: collection.swatch(item) }}
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium text-picard-navy">
                    {collection.summary(item)}
                  </p>
                  {collection.sublabel && collection.sublabel(item) && (
                    <p className="truncate text-[11px] uppercase tracking-[0.18em] text-picard-navy/55">
                      {collection.sublabel(item)}
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className="text-picard-navy/40" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CollectionEditPage({ isNew }) {
  const { collectionKey, itemIndex } = useParams();
  const collection = getCollection(collectionKey);
  const navigate = useNavigate();
  const { items, sha, loading, error, reload, mutate } = useCollectionItems(collection?.file);
  const allDoors = useDoorsForCompat(collection?.key);

  const idx = isNew ? -1 : Number(itemIndex);
  const initial = isNew ? buildEmptyItem(collection) : items[idx];
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (!isNew && items.length > 0 && Number.isFinite(idx)) {
      setDraft(items[idx]);
    }
  }, [items, idx, isNew]);

  if (!collection) return <p>Collection inconnue.</p>;
  if (loading) return <FullscreenInline message="Chargement…" />;
  if (error) return <ErrorBanner message={error} onRetry={reload} />;
  if (!isNew && !items[idx]) {
    return (
      <ErrorBanner
        message="Élément introuvable. La liste a peut-être changé."
        onRetry={() => navigate(`/admin/${collection.key}`)}
        retryLabel="Retour à la liste"
      />
    );
  }
  if (!draft) return null;

  const setField = (name, value) => setDraft((d) => ({ ...d, [name]: value }));

  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const next = isNew ? [...items, draft] : items.map((it, i) => (i === idx ? draft : it));
      await saveCollection(
        collection.file,
        next,
        sha,
        `chore(admin): ${isNew ? 'add' : 'update'} ${collection.label}`,
      );
      mutate(next);
      navigate(`/admin/${collection.key}`);
    } catch (err) {
      setSaveError(err.message || 'Échec de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    if (!window.confirm('Supprimer définitivement cet élément ?')) return;
    setSaving(true);
    setSaveError(null);
    try {
      const next = items.filter((_, i) => i !== idx);
      await saveCollection(
        collection.file,
        next,
        sha,
        `chore(admin): remove ${collection.label}`,
      );
      mutate(next);
      navigate(`/admin/${collection.key}`);
    } catch (err) {
      setSaveError(err.message || 'Échec de la suppression');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to={`/admin/${collection.key}`}
        className="mb-4 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.16em] text-picard-navy/55 transition hover:text-picard-navy"
      >
        <ArrowLeft size={12} /> {collection.label}
      </Link>
      <h1 className="font-display text-4xl text-picard-navy">
        {isNew ? `Nouveau · ${collection.label}` : collection.summary(draft) || 'Édition'}
      </h1>

      <div className="mt-8 space-y-5 rounded-3xl border border-picard-navy/10 bg-white p-6 shadow-soft">
        {collection.fields.map((field) => (
          <Field
            key={field.name}
            field={field}
            value={draft[field.name]}
            onChange={(v) => setField(field.name, v)}
            allDoors={allDoors}
          />
        ))}
      </div>

      {saveError && <p className="mt-4 text-sm text-picard-red">{saveError}</p>}

      <div className="mt-6 flex items-center justify-between gap-3">
        {!isNew ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full border border-picard-red/30 bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-picard-red transition hover:bg-picard-red/5 disabled:opacity-50"
          >
            <Trash2 size={12} /> Supprimer
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-picard-navy px-6 py-3 text-sm font-medium uppercase tracking-[0.16em] text-picard-cream transition hover:bg-black disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Sauvegarde…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

function FullscreenInline({ message }) {
  return (
    <p className="rounded-2xl border border-picard-navy/10 bg-white px-6 py-12 text-center text-sm text-picard-navy/65">
      <span className="inline-flex items-center gap-2">
        <Loader2 size={14} className="animate-spin" /> {message}
      </span>
    </p>
  );
}

function ErrorBanner({ message, onRetry, retryLabel = 'Réessayer' }) {
  return (
    <div className="rounded-2xl border border-picard-red/30 bg-picard-red/5 px-5 py-4">
      <p className="text-sm text-picard-red">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-picard-red transition hover:opacity-80"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}

function useCollectionItems(file) {
  const [state, setState] = useState({ items: [], sha: null, loading: true, error: null });

  const load = useCallback(async () => {
    if (!file) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { items, sha } = await loadCollection(file);
      setState({ items, sha, loading: false, error: null });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err.message || 'Erreur de chargement' }));
    }
  }, [file]);

  useEffect(() => {
    load();
  }, [load]);

  const mutate = useCallback((nextItems) => {
    setState((s) => ({ ...s, items: nextItems }));
  }, []);

  return { ...state, reload: load, mutate };
}

function useDoorsForCompat(currentKey) {
  // Lazy-load the doors collection so compatibleDoorIds chips show real names.
  // Skip the call when the user is editing the doors collection itself
  // (we'll show a helpful message in that case).
  const [doors, setDoors] = useState([]);
  useEffect(() => {
    if (currentKey === 'doors') {
      setDoors([]);
      return;
    }
    let alive = true;
    loadCollection('src/data/doors.json')
      .then(({ items }) => {
        if (alive) setDoors(items);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [currentKey]);
  return doors;
}

function buildEmptyItem(collection) {
  const item = {};
  collection.fields.forEach((f) => {
    if (f.type === 'boolean') item[f.name] = false;
    else if (f.type === 'idList') item[f.name] = [];
    else if (f.type === 'hotspots') item[f.name] = [];
    else item[f.name] = '';
  });
  return item;
}
