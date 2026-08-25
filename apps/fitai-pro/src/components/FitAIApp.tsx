'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EXERCISE_CATALOG } from '@/lib/catalog';
import {
  buildRoutine,
  detectPersonalRecords,
  emptyState,
  exerciseName,
  id,
  nutritionTotals,
  sessionVolume,
  todayKey,
  workoutsThisWeek,
} from '@/lib/domain';
import { scanProductBarcode, startStepTracking } from '@/lib/native';
import { lookupFood } from '@/lib/openFoodFacts';
import { clearState, exportVault, hasVault, importVault, loadState, saveState } from '@/lib/storage';
import type {
  AppState,
  CoachClient,
  Goal,
  MealEntry,
  OpenFoodFactsProduct,
  Recipe,
  SetRecord,
  WorkoutTemplate,
} from '@/lib/types';

type Screen = 'home' | 'training' | 'nutrition' | 'coach' | 'progress' | 'settings';
type BootMode = 'loading' | 'setup' | 'locked' | 'ready';

type DraftSet = { loadKg: number; reps: number; rir: number };

const nav: Array<{ id: Screen; label: string; icon: string }> = [
  { id: 'home', label: 'Inicio', icon: '⌂' },
  { id: 'training', label: 'Entreno', icon: '◫' },
  { id: 'nutrition', label: 'Nutrición', icon: '◇' },
  { id: 'coach', label: 'Coach', icon: '◎' },
  { id: 'progress', label: 'Progreso', icon: '↗' },
  { id: 'settings', label: 'Ajustes', icon: '⚙' },
];

export function FitAIApp() {
  const [mode, setMode] = useState<BootMode>('loading');
  const [state, setState] = useState<AppState | null>(null);
  const [pin, setPin] = useState('');
  const pinRef = useRef('');
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const [screen, setScreen] = useState<Screen>('home');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    void hasVault().then((exists) => setMode(exists ? 'locked' : 'setup')).catch((cause) => {
      setError(cause instanceof Error ? cause.message : 'No se pudo abrir el almacenamiento local.');
      setMode('setup');
    });
  }, []);

  const commit = useCallback((mutator: (current: AppState) => AppState) => {
    setState((current) => {
      if (!current) return current;
      const next = { ...mutator(current), updatedAt: new Date().toISOString() };
      const activePin = pinRef.current;
      saveQueue.current = saveQueue.current
        .catch(() => undefined)
        .then(() => saveState(activePin, next))
        .catch((cause) => setError(cause instanceof Error ? cause.message : 'No se pudieron guardar los cambios.'));
      return next;
    });
  }, []);

  const lock = useCallback(() => {
    pinRef.current = '';
    setPin('');
    setState(null);
    setScreen('home');
    setMode('locked');
  }, []);

  useEffect(() => {
    if (mode !== 'ready' || !state) return;
    const minutes = Math.max(1, state.settings.autoLockMinutes);
    let timeout = window.setTimeout(lock, minutes * 60_000);
    const reset = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(lock, minutes * 60_000);
    };
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart'];
    for (const event of events) window.addEventListener(event, reset, { passive: true });
    return () => {
      window.clearTimeout(timeout);
      for (const event of events) window.removeEventListener(event, reset);
    };
  }, [lock, mode, state]);

  if (mode === 'loading') return <CenteredPanel title="FitAI Pro" subtitle="Preparando tu espacio local…" />;
  if (mode === 'setup') {
    return <SetupScreen onReady={(newState, newPin) => {
      pinRef.current = newPin;
      setPin(newPin);
      setState(newState);
      setMode('ready');
    }} onError={setError} error={error} />;
  }
  if (mode === 'locked') {
    return <UnlockScreen onUnlock={async (value) => {
      setError('');
      try {
        const loaded = await loadState(value);
        pinRef.current = value;
        setPin(value);
        setState(loaded);
        setMode('ready');
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'No se pudo desbloquear FitAI Pro.');
      }
    }} error={error} />;
  }
  if (!state) return null;

  return (
    <div className={`app-shell ${state.settings.reducedMotion ? 'reduced-motion' : ''}`}>
      <aside className="sidebar" aria-label="Navegación principal">
        <Brand />
        <div className="profile-mini">
          <div className="avatar">{initials(state.profile.displayName)}</div>
          <div><strong>{state.profile.displayName}</strong><span>{goalLabel(state.profile.goal)}</span></div>
        </div>
        <nav className="desktop-nav">
          {nav.map((item) => <NavButton key={item.id} item={item} active={screen === item.id} onClick={() => setScreen(item.id)} />)}
        </nav>
        <div className="sidebar-footer"><span className="status-dot" />Datos locales cifrados</div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">FITAI PRO 3.0</p>
            <h1>{nav.find((item) => item.id === screen)?.label}</h1>
          </div>
          <div className="top-actions">
            <span className="sync-pill">Local · sin nube</span>
            <button className="ghost-button" onClick={lock}>Bloquear</button>
          </div>
        </header>

        {error && <Notice kind="error" onClose={() => setError('')}>{error}</Notice>}
        {message && <Notice kind="success" onClose={() => setMessage('')}>{message}</Notice>}

        {screen === 'home' && <HomeScreen state={state} commit={commit} onNavigate={setScreen} setError={setError} setMessage={setMessage} />}
        {screen === 'training' && <TrainingScreen state={state} commit={commit} setError={setError} setMessage={setMessage} />}
        {screen === 'nutrition' && <NutritionScreen state={state} commit={commit} setError={setError} setMessage={setMessage} />}
        {screen === 'coach' && <CoachScreen state={state} commit={commit} setMessage={setMessage} />}
        {screen === 'progress' && <ProgressScreen state={state} />}
        {screen === 'settings' && <SettingsScreen state={state} pin={pin} commit={commit} lock={lock} setState={setState} setError={setError} setMessage={setMessage} />}
      </main>

      <nav className="mobile-nav" aria-label="Navegación móvil">
        {nav.slice(0, 5).map((item) => <NavButton key={item.id} item={item} active={screen === item.id} onClick={() => setScreen(item.id)} />)}
        <NavButton item={nav[5]} active={screen === 'settings'} onClick={() => setScreen('settings')} />
      </nav>
    </div>
  );
}

function SetupScreen({ onReady, onError, error }: { onReady: (state: AppState, pin: string) => void; onError: (value: string) => void; error: string }) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [goal, setGoal] = useState<Goal>('hypertrophy');
  const [busy, setBusy] = useState(false);
  return (
    <div className="auth-shell">
      <section className="auth-card wide-auth-card">
        <Brand />
        <p className="eyebrow">CONFIGURACIÓN INICIAL</p>
        <h1>Tu entrenamiento. Tus datos. Tu dispositivo.</h1>
        <p className="muted">FitAI Pro 3 guarda la información cifrada localmente. No necesitas cuenta, servidor ni base de datos.</p>
        {error && <Notice kind="error" onClose={() => onError('')}>{error}</Notice>}
        <label>Nombre<input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="¿Cómo quieres que te llamemos?" /></label>
        <label>Objetivo<select value={goal} onChange={(e) => setGoal(e.target.value as Goal)}><option value="hypertrophy">Hipertrofia</option><option value="strength">Fuerza</option><option value="fat-loss">Pérdida de grasa</option><option value="general">Condición general</option></select></label>
        <label>PIN local<input type="password" inputMode="numeric" autoComplete="new-password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Mínimo 4 caracteres" /></label>
        <button className="primary-button" disabled={busy || name.trim().length < 2 || pin.length < 4} onClick={async () => {
          setBusy(true); onError('');
          try {
            const created = emptyState(name, goal, EXERCISE_CATALOG);
            await saveState(pin, created);
            onReady(created, pin);
          } catch (cause) { onError(cause instanceof Error ? cause.message : 'No se pudo crear el espacio local.'); }
          finally { setBusy(false); }
        }}>{busy ? 'Cifrando…' : 'Crear FitAI Pro'}</button>
        <p className="microcopy">El PIN no se envía a ningún servidor. Si lo pierdes y no tienes respaldo, no podremos recuperar los datos cifrados.</p>
      </section>
    </div>
  );
}

function UnlockScreen({ onUnlock, error }: { onUnlock: (pin: string) => Promise<void>; error: string }) {
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="auth-shell"><section className="auth-card"><Brand /><h1>Desbloquear FitAI Pro</h1><p className="muted">Tus datos permanecen cifrados en este dispositivo.</p>{error && <Notice kind="error">{error}</Notice>}<label>PIN<input autoFocus type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && pin.length >= 4) void submit(); }} /></label><button className="primary-button" disabled={busy || pin.length < 4} onClick={() => void submit()}>{busy ? 'Desbloqueando…' : 'Entrar'}</button></section></div>
  );
  async function submit() { setBusy(true); try { await onUnlock(pin); } finally { setBusy(false); } }
}

function HomeScreen({ state, commit, onNavigate, setError, setMessage }: ScreenProps & { onNavigate: (screen: Screen) => void }) {
  const week = workoutsThisWeek(state.sessions);
  const today = state.steps.find((item) => item.date === todayKey())?.steps ?? 0;
  const [tracking, setTracking] = useState(false);
  const stopRef = useRef<(() => Promise<void>) | null>(null);
  const lastSessions = [...state.sessions].sort((a, b) => (b.finishedAt ?? b.startedAt).localeCompare(a.finishedAt ?? a.startedAt)).slice(0, 3);

  useEffect(() => () => { if (stopRef.current) void stopRef.current(); }, []);

  return <div className="page-stack">
    <section className="hero-card">
      <div><p className="eyebrow">HOY</p><h2>{greeting()}, {state.profile.displayName.split(' ')[0]}</h2><p>Tu objetivo es {goalLabel(state.profile.goal).toLowerCase()}. Registra lo importante y deja que el historial guíe la siguiente sesión.</p></div>
      <button className="primary-button compact" onClick={() => onNavigate('training')}>{state.activeSession ? 'Continuar entrenamiento' : 'Empezar entrenamiento'}</button>
    </section>
    <section className="metric-grid">
      <Metric title="Entrenos esta semana" value={`${week}/${state.settings.weeklyWorkoutTarget}`} progress={week / state.settings.weeklyWorkoutTarget} />
      <Metric title="Pasos hoy" value={today.toLocaleString()} progress={today / state.settings.dailyStepTarget} action={<button className="text-button" onClick={async () => {
        try {
          if (tracking && stopRef.current) { await stopRef.current(); stopRef.current = null; setTracking(false); setMessage('Contador de pasos detenido.'); return; }
          stopRef.current = await startStepTracking((steps) => commit((current) => ({ ...current, steps: upsertSteps(current.steps, steps) })));
          setTracking(true); setMessage('Contador de pasos activo mientras FitAI Pro está abierto.');
        } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo iniciar el contador.'); }
      }}>{tracking ? 'Detener' : 'Activar sensor'}</button>} />
      <Metric title="Récords personales" value={state.personalRecords.length.toString()} progress={Math.min(1, state.personalRecords.length / 12)} />
      <Metric title="Volumen total" value={`${Math.round(state.sessions.reduce((sum, s) => sum + sessionVolume(s), 0)).toLocaleString()} kg`} progress={Math.min(1, state.sessions.length / 20)} />
    </section>
    <section className="two-column">
      <Card title="Sesiones recientes" action={<button className="text-button" onClick={() => onNavigate('progress')}>Ver progreso</button>}>
        {lastSessions.length ? <div className="list">{lastSessions.map((session) => <div className="list-row" key={session.id}><div><strong>{session.name}</strong><span>{formatDate(session.finishedAt ?? session.startedAt)} · {session.sets.length} series</span></div><b>{Math.round(sessionVolume(session)).toLocaleString()} kg</b></div>)}</div> : <Empty text="Todavía no hay sesiones terminadas." />}
      </Card>
      <Card title="Acciones rápidas"><div className="quick-grid"><Quick label="Generar rutina" onClick={() => onNavigate('training')} /><Quick label="Escanear alimento" onClick={() => onNavigate('nutrition')} /><Quick label="Agregar cliente" onClick={() => onNavigate('coach')} /><Quick label="Exportar respaldo" onClick={() => onNavigate('settings')} /></div></Card>
    </section>
  </div>;
}

function TrainingScreen({ state, commit, setError, setMessage }: ScreenProps) {
  const [drafts, setDrafts] = useState<Record<string, DraftSet>>({});
  const activeTemplate = state.activeSession?.templateId ? state.templates.find((t) => t.id === state.activeSession?.templateId) : undefined;
  const templatePlans = activeTemplate?.exercises ?? [];

  const generate = () => commit((current) => ({ ...current, templates: buildRoutine(current.profile.goal, current.settings.weeklyWorkoutTarget, current.exercises) }));
  const start = (template: WorkoutTemplate) => commit((current) => ({ ...current, activeSession: { id: id('session'), templateId: template.id, name: template.name, startedAt: new Date().toISOString(), sets: [] } }));

  if (state.activeSession) {
    return <div className="page-stack"><section className="hero-card active-workout"><div><p className="eyebrow">ENTRENAMIENTO ACTIVO</p><h2>{state.activeSession.name}</h2><p>{state.activeSession.sets.length} series registradas · {Math.round(sessionVolume(state.activeSession)).toLocaleString()} kg de volumen</p></div><button className="danger-button" onClick={() => commit((current) => ({ ...current, activeSession: undefined }))}>Descartar</button></section>
      <div className="workout-list">{templatePlans.length ? templatePlans.map((plan) => {
        const draft = drafts[plan.exerciseId] ?? { loadKg: 20, reps: plan.minReps, rir: plan.targetRir };
        const done = state.activeSession?.sets.filter((set) => set.exerciseId === plan.exerciseId) ?? [];
        return <Card key={plan.exerciseId} title={exerciseName(state.exercises, plan.exerciseId)} subtitle={`${plan.targetSets}×${plan.minReps}-${plan.maxReps} · RIR ${plan.targetRir} · descanso ${plan.restSeconds}s`}>
          {done.length > 0 && <div className="set-chips">{done.map((set, index) => <span key={set.id}>#{index + 1} {set.loadKg}kg × {set.reps} · RIR {set.rir}</span>)}</div>}
          <div className="inline-fields"><label>Carga kg<input type="number" min="0" step="0.5" value={draft.loadKg} onChange={(e) => setDrafts((all) => ({ ...all, [plan.exerciseId]: { ...draft, loadKg: num(e.target.value) } }))} /></label><label>Reps<input type="number" min="1" max="100" value={draft.reps} onChange={(e) => setDrafts((all) => ({ ...all, [plan.exerciseId]: { ...draft, reps: num(e.target.value) } }))} /></label><label>RIR<input type="number" min="0" max="10" value={draft.rir} onChange={(e) => setDrafts((all) => ({ ...all, [plan.exerciseId]: { ...draft, rir: num(e.target.value) } }))} /></label><button className="secondary-button" onClick={() => {
            if (draft.reps < 1 || draft.rir < 0 || draft.rir > 10 || draft.loadKg < 0) { setError('Revisa carga, repeticiones y RIR.'); return; }
            const record: SetRecord = { id: id('set'), exerciseId: plan.exerciseId, kind: done.length ? 'working' : 'warmup', reps: Math.round(draft.reps), loadKg: draft.loadKg, rir: draft.rir, completedAt: new Date().toISOString() };
            commit((current) => current.activeSession ? ({ ...current, activeSession: { ...current.activeSession, sets: [...current.activeSession.sets, record] } }) : current);
          }}>Registrar serie</button></div>
        </Card>;
      }) : <Card title="Entrenamiento libre"><p className="muted">Este entrenamiento no tiene plantilla asociada.</p></Card>}</div>
      <button className="primary-button finish-button" disabled={!state.activeSession.sets.length} onClick={() => {
        const finished = { ...state.activeSession!, finishedAt: new Date().toISOString() };
        const newRecords = detectPersonalRecords(finished, state.personalRecords);
        commit((current) => ({ ...current, sessions: [...current.sessions, finished], personalRecords: [...current.personalRecords, ...newRecords], activeSession: undefined }));
        setMessage(newRecords.length ? `Entrenamiento guardado. ${newRecords.length} nuevo(s) récord(s).` : 'Entrenamiento guardado.');
      }}>Finalizar y guardar entrenamiento</button>
    </div>;
  }

  return <div className="page-stack"><section className="section-heading"><div><p className="eyebrow">PROGRAMACIÓN LOCAL</p><h2>Rutinas y sesiones</h2><p className="muted">El generador usa tu objetivo y frecuencia. Luego puedes registrar cada serie con carga, repeticiones y RIR.</p></div><button className="primary-button compact" onClick={generate}>{state.templates.length ? 'Regenerar rutina' : 'Generar rutina'}</button></section>
    {state.templates.length ? <div className="template-grid">{state.templates.map((template) => <Card key={template.id} title={template.name} subtitle={`${template.exercises.length} ejercicios`}><ol className="exercise-summary">{template.exercises.map((plan) => <li key={plan.exerciseId}><span>{exerciseName(state.exercises, plan.exerciseId)}</span><b>{plan.targetSets}×{plan.minReps}-{plan.maxReps}</b></li>)}</ol><button className="secondary-button full" onClick={() => start(template)}>Iniciar {template.name}</button></Card>)}</div> : <Card title="Aún no tienes una rutina"><Empty text="Genera una rutina inicial. Puedes regenerarla cuando cambie tu objetivo o frecuencia." /></Card>}
  </div>;
}

function NutritionScreen({ state, commit, setError, setMessage }: ScreenProps) {
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState<OpenFoodFactsProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState({ name: '', calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  const [recipe, setRecipe] = useState({ name: '', servings: 1, calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  const todayMeals = state.meals.filter((meal) => meal.eatenAt.startsWith(todayKey()));
  const totals = nutritionTotals(todayMeals);

  async function search(code: string) {
    setLoading(true); setError(''); setProduct(null);
    try { const found = await lookupFood(code); setProduct(found); setBarcode(found.barcode); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo consultar el alimento.'); }
    finally { setLoading(false); }
  }

  return <div className="page-stack"><section className="metric-grid nutrition-metrics"><Metric title="Calorías hoy" value={`${Math.round(totals.calories)} kcal`} progress={Math.min(1, totals.calories / 2200)} /><Metric title="Proteína" value={`${Math.round(totals.proteinG)} g`} progress={Math.min(1, totals.proteinG / 160)} /><Metric title="Carbohidratos" value={`${Math.round(totals.carbsG)} g`} progress={Math.min(1, totals.carbsG / 250)} /><Metric title="Grasas" value={`${Math.round(totals.fatG)} g`} progress={Math.min(1, totals.fatG / 80)} /></section>
    <section className="two-column"><Card title="Escáner nutricional" subtitle="Open Food Facts · valores por 100 g"><div className="barcode-row"><input inputMode="numeric" value={barcode} onChange={(e) => setBarcode(e.target.value.replace(/\D/g, '').slice(0, 14))} placeholder="EAN / UPC" /><button className="secondary-button" disabled={loading} onClick={() => void search(barcode)}>{loading ? 'Buscando…' : 'Buscar'}</button><button className="secondary-button" onClick={async () => { try { const code = await scanProductBarcode(); setBarcode(code); await search(code); } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo escanear.'); } }}>Escanear</button></div>
      {product && <div className="product-card"><strong>{product.name}</strong><span>{product.brand ?? 'Marca no indicada'} · {product.servingSize ?? 'por 100 g'}</span><div className="macro-row"><b>{product.nutrition.calories} kcal</b><span>P {product.nutrition.proteinG}g</span><span>C {product.nutrition.carbsG}g</span><span>G {product.nutrition.fatG}g</span></div><button className="primary-button compact" onClick={() => {
        const meal: MealEntry = { id: id('meal'), name: product.name, eatenAt: new Date().toISOString(), ...product.nutrition, barcode: product.barcode, source: 'open-food-facts' };
        commit((current) => ({ ...current, meals: [...current.meals, meal] })); setMessage('Alimento agregado al registro de hoy.');
      }}>Agregar 100 g</button></div>}
    </Card>
    <Card title="Comida manual"><div className="form-grid"><label>Nombre<input value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} /></label><label>kcal<input type="number" min="0" value={manual.calories} onChange={(e) => setManual({ ...manual, calories: num(e.target.value) })} /></label><label>Proteína g<input type="number" min="0" value={manual.proteinG} onChange={(e) => setManual({ ...manual, proteinG: num(e.target.value) })} /></label><label>Carbos g<input type="number" min="0" value={manual.carbsG} onChange={(e) => setManual({ ...manual, carbsG: num(e.target.value) })} /></label><label>Grasas g<input type="number" min="0" value={manual.fatG} onChange={(e) => setManual({ ...manual, fatG: num(e.target.value) })} /></label></div><button className="secondary-button full" disabled={!manual.name.trim()} onClick={() => { const meal: MealEntry = { id: id('meal'), name: manual.name.trim(), eatenAt: new Date().toISOString(), calories: manual.calories, proteinG: manual.proteinG, carbsG: manual.carbsG, fatG: manual.fatG, source: 'manual' }; commit((current) => ({ ...current, meals: [...current.meals, meal] })); setManual({ name: '', calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }); setMessage('Comida registrada.'); }}>Guardar comida</button></Card></section>
    <section className="two-column"><Card title="Recetas locales" subtitle={`${state.recipes.length} guardadas`}><div className="form-grid"><label>Nombre<input value={recipe.name} onChange={(e) => setRecipe({ ...recipe, name: e.target.value })} /></label><label>Porciones<input type="number" min="1" value={recipe.servings} onChange={(e) => setRecipe({ ...recipe, servings: Math.max(1, num(e.target.value)) })} /></label><label>kcal totales<input type="number" min="0" value={recipe.calories} onChange={(e) => setRecipe({ ...recipe, calories: num(e.target.value) })} /></label><label>Proteína g<input type="number" min="0" value={recipe.proteinG} onChange={(e) => setRecipe({ ...recipe, proteinG: num(e.target.value) })} /></label><label>Carbos g<input type="number" min="0" value={recipe.carbsG} onChange={(e) => setRecipe({ ...recipe, carbsG: num(e.target.value) })} /></label><label>Grasas g<input type="number" min="0" value={recipe.fatG} onChange={(e) => setRecipe({ ...recipe, fatG: num(e.target.value) })} /></label></div><button className="secondary-button full" disabled={!recipe.name.trim()} onClick={() => { const created: Recipe = { id: id('recipe'), name: recipe.name.trim(), servings: Math.max(1, recipe.servings), createdAt: new Date().toISOString(), ingredients: [{ id: id('ingredient'), name: 'Total de receta', quantity: 1, unit: 'receta', calories: recipe.calories, proteinG: recipe.proteinG, carbsG: recipe.carbsG, fatG: recipe.fatG }] }; commit((current) => ({ ...current, recipes: [...current.recipes, created] })); setRecipe({ name: '', servings: 1, calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }); setMessage('Receta guardada.'); }}>Guardar receta</button></Card>
      <Card title="Registro de hoy">{todayMeals.length ? <div className="list">{[...todayMeals].reverse().map((meal) => <div className="list-row" key={meal.id}><div><strong>{meal.name}</strong><span>{meal.source ?? 'manual'} · {meal.proteinG}g proteína</span></div><b>{Math.round(meal.calories)} kcal</b></div>)}</div> : <Empty text="No has registrado comidas hoy." />}</Card></section>
  </div>;
}

function CoachScreen({ state, commit, setMessage }: Omit<ScreenProps, 'setError'>) {
  const [clientName, setClientName] = useState('');
  const [goal, setGoal] = useState<Goal>('hypertrophy');
  const [selectedId, setSelectedId] = useState<string>(state.clients[0]?.id ?? '');
  const [measurement, setMeasurement] = useState({ weightKg: 0, waistCm: 0, bodyFatPercent: 0, note: '' });
  const selected = state.clients.find((client) => client.id === selectedId);
  return <div className="page-stack"><section className="section-heading"><div><p className="eyebrow">COACH CENTER LOCAL</p><h2>Clientes y seguimiento</h2><p className="muted">Los clientes son perfiles de seguimiento dentro de tu bóveda local; no hay mensajería ni sincronización remota en esta versión local-only.</p></div></section>
    <section className="two-column coach-layout"><Card title="Clientes"><div className="inline-fields"><label>Nombre<input value={clientName} onChange={(e) => setClientName(e.target.value)} /></label><label>Objetivo<select value={goal} onChange={(e) => setGoal(e.target.value as Goal)}><option value="hypertrophy">Hipertrofia</option><option value="strength">Fuerza</option><option value="fat-loss">Pérdida de grasa</option><option value="general">General</option></select></label><button className="secondary-button" disabled={!clientName.trim()} onClick={() => { const client: CoachClient = { id: id('client'), name: clientName.trim(), goal, active: true, measurements: [], notes: [], createdAt: new Date().toISOString() }; commit((current) => ({ ...current, clients: [...current.clients, client] })); setClientName(''); setSelectedId(client.id); setMessage('Cliente agregado.'); }}>Agregar</button></div>
      <div className="client-list">{state.clients.map((client) => <button key={client.id} className={`client-row ${selectedId === client.id ? 'selected' : ''}`} onClick={() => setSelectedId(client.id)}><span className="avatar small">{initials(client.name)}</span><span><strong>{client.name}</strong><small>{goalLabel(client.goal)} · {client.measurements.length} mediciones</small></span></button>)}</div></Card>
      <Card title={selected ? selected.name : 'Seguimiento'}>{selected ? <><div className="form-grid"><label>Peso kg<input type="number" min="0" step="0.1" value={measurement.weightKg || ''} onChange={(e) => setMeasurement({ ...measurement, weightKg: num(e.target.value) })} /></label><label>Cintura cm<input type="number" min="0" step="0.1" value={measurement.waistCm || ''} onChange={(e) => setMeasurement({ ...measurement, waistCm: num(e.target.value) })} /></label><label>% grasa<input type="number" min="0" max="80" step="0.1" value={measurement.bodyFatPercent || ''} onChange={(e) => setMeasurement({ ...measurement, bodyFatPercent: num(e.target.value) })} /></label><label className="span-2">Nota<input value={measurement.note} maxLength={300} onChange={(e) => setMeasurement({ ...measurement, note: e.target.value })} /></label></div><button className="primary-button compact" disabled={!measurement.weightKg && !measurement.waistCm && !measurement.bodyFatPercent && !measurement.note.trim()} onClick={() => { const captured = { id: id('measurement'), capturedAt: new Date().toISOString(), weightKg: measurement.weightKg || undefined, waistCm: measurement.waistCm || undefined, bodyFatPercent: measurement.bodyFatPercent || undefined, note: measurement.note.trim() || undefined }; commit((current) => ({ ...current, clients: current.clients.map((client) => client.id === selected.id ? { ...client, measurements: [...client.measurements, captured] } : client) })); setMeasurement({ weightKg: 0, waistCm: 0, bodyFatPercent: 0, note: '' }); setMessage('Medición guardada.'); }}>Guardar medición</button><div className="list measurement-list">{[...selected.measurements].reverse().slice(0, 8).map((item) => <div className="list-row" key={item.id}><div><strong>{formatDate(item.capturedAt)}</strong><span>{item.note ?? 'Sin nota'}</span></div><b>{item.weightKg ? `${item.weightKg} kg` : item.waistCm ? `${item.waistCm} cm` : item.bodyFatPercent ? `${item.bodyFatPercent}%` : '—'}</b></div>)}</div></> : <Empty text="Agrega o selecciona un cliente para registrar medidas." />}</Card></section>
  </div>;
}

function ProgressScreen({ state }: { state: AppState }) {
  const exercisePrs = useMemo(() => [...state.personalRecords].sort((a, b) => b.achievedAt.localeCompare(a.achievedAt)).slice(0, 12), [state.personalRecords]);
  const recent = useMemo(() => [...state.sessions].filter((s) => s.finishedAt).sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? '')).slice(0, 12), [state.sessions]);
  const maxVolume = Math.max(1, ...recent.map(sessionVolume));
  return <div className="page-stack"><section className="metric-grid"><Metric title="Sesiones" value={state.sessions.length.toString()} progress={Math.min(1, state.sessions.length / 30)} /><Metric title="PRs" value={state.personalRecords.length.toString()} progress={Math.min(1, state.personalRecords.length / 20)} /><Metric title="Rutinas" value={state.templates.length.toString()} progress={Math.min(1, state.templates.length / 6)} /><Metric title="Clientes" value={state.clients.filter((c) => c.active).length.toString()} progress={Math.min(1, state.clients.length / 10)} /></section>
    <section className="two-column"><Card title="Volumen por sesión">{recent.length ? <div className="bar-chart">{[...recent].reverse().map((session) => <div className="bar-item" key={session.id}><div className="bar" style={{ height: `${Math.max(8, (sessionVolume(session) / maxVolume) * 100)}%` }} title={`${Math.round(sessionVolume(session))} kg`} /><span>{new Date(session.startedAt).toLocaleDateString('es', { day: '2-digit', month: '2-digit' })}</span></div>)}</div> : <Empty text="Completa entrenamientos para ver la tendencia." />}</Card>
      <Card title="Récords recientes">{exercisePrs.length ? <div className="list">{exercisePrs.map((pr) => <div className="list-row" key={pr.id}><div><strong>{exerciseName(state.exercises, pr.exerciseId)}</strong><span>{prType(pr.type)} · {formatDate(pr.achievedAt)}</span></div><b>{pr.type === 'reps' ? `${pr.value} reps` : `${pr.value} kg`}</b></div>)}</div> : <Empty text="Los récords se detectan automáticamente al finalizar sesiones." />}</Card></section>
  </div>;
}

function SettingsScreen({ state, pin, commit, lock, setState, setError, setMessage }: { state: AppState; pin: string; commit: ScreenProps['commit']; lock: () => void; setState: (state: AppState) => void; setError: (v: string) => void; setMessage: (v: string) => void }) {
  const importRef = useRef<HTMLInputElement>(null);
  return <div className="page-stack"><section className="two-column"><Card title="Preferencias"><div className="settings-list"><Setting label="Reducir movimiento" hint="Desactiva transiciones no esenciales"><input type="checkbox" checked={state.settings.reducedMotion} onChange={(e) => commit((current) => ({ ...current, settings: { ...current.settings, reducedMotion: e.target.checked } }))} /></Setting><Setting label="Meta de entrenos/semana" hint="Se usa también para generar la rutina"><input type="number" min="2" max="6" value={state.settings.weeklyWorkoutTarget} onChange={(e) => commit((current) => ({ ...current, settings: { ...current.settings, weeklyWorkoutTarget: Math.min(6, Math.max(2, Math.round(num(e.target.value)))) } }))} /></Setting><Setting label="Meta diaria de pasos" hint="Objetivo visual del panel"><input type="number" min="1000" max="50000" step="500" value={state.settings.dailyStepTarget} onChange={(e) => commit((current) => ({ ...current, settings: { ...current.settings, dailyStepTarget: Math.min(50000, Math.max(1000, Math.round(num(e.target.value)))) } }))} /></Setting><Setting label="Bloqueo automático" hint="Minutos de inactividad"><input type="number" min="1" max="120" value={state.settings.autoLockMinutes} onChange={(e) => commit((current) => ({ ...current, settings: { ...current.settings, autoLockMinutes: Math.min(120, Math.max(1, Math.round(num(e.target.value)))) } }))} /></Setting></div></Card>
    <Card title="Privacidad y respaldo" subtitle="Bóveda AES-GCM derivada de tu PIN"><div className="button-stack"><button className="secondary-button full" onClick={async () => { try { const raw = await exportVault(); const blob = new Blob([raw], { type: 'application/json' }); const href = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = href; anchor.download = `FitAI-Pro-backup-${todayKey()}.fitai.json`; anchor.click(); URL.revokeObjectURL(href); setMessage('Respaldo cifrado exportado.'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo exportar.'); } }}>Exportar respaldo cifrado</button><button className="secondary-button full" onClick={() => importRef.current?.click()}>Importar respaldo</button><input ref={importRef} className="hidden" type="file" accept="application/json,.json" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { const raw = await file.text(); const imported = await importVault(raw, pin); setState(imported); setMessage('Respaldo validado e importado.'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo importar.'); } finally { event.target.value = ''; } }} /><button className="ghost-button full" onClick={lock}>Bloquear ahora</button></div><p className="microcopy">FitAI Pro no guarda tu PIN. Un respaldo exportado sigue cifrado y necesita el mismo PIN para abrirse.</p></Card></section>
    <Card title="Zona de riesgo"><p className="muted">Eliminar los datos borra la bóveda de este dispositivo. Exporta un respaldo antes si quieres conservarlos.</p><button className="danger-button" onClick={async () => { if (!window.confirm('¿Eliminar definitivamente todos los datos locales de FitAI Pro?')) return; await clearState(); window.location.reload(); }}>Eliminar todos los datos locales</button></Card>
  </div>;
}

function Brand() { return <div className="brand"><span className="brand-mark">F</span><span><strong>FitAI</strong><b>PRO</b></span></div>; }
function NavButton({ item, active, onClick }: { item: { label: string; icon: string }; active: boolean; onClick: () => void }) { return <button className={`nav-button ${active ? 'active' : ''}`} onClick={onClick}><span>{item.icon}</span><small>{item.label}</small></button>; }
function Card({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) { return <section className="card"><header className="card-header"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action}</header>{children}</section>; }
function Metric({ title, value, progress, action }: { title: string; value: string; progress: number; action?: React.ReactNode }) { const pct = Math.min(100, Math.max(0, progress * 100)); return <section className="metric-card"><div className="metric-top"><span>{title}</span>{action}</div><strong>{value}</strong><div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div></section>; }
function Quick({ label, onClick }: { label: string; onClick: () => void }) { return <button className="quick-action" onClick={onClick}><span>＋</span>{label}</button>; }
function Empty({ text }: { text: string }) { return <div className="empty-state"><span>○</span><p>{text}</p></div>; }
function CenteredPanel({ title, subtitle }: { title: string; subtitle: string }) { return <div className="auth-shell"><section className="auth-card"><Brand /><h1>{title}</h1><p className="muted">{subtitle}</p></section></div>; }
function Notice({ kind, children, onClose }: { kind: 'error' | 'success'; children: React.ReactNode; onClose?: () => void }) { return <div className={`notice ${kind}`} role={kind === 'error' ? 'alert' : 'status'}><span>{children}</span>{onClose && <button onClick={onClose} aria-label="Cerrar">×</button>}</div>; }
function Setting({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) { return <label className="setting-row"><span><strong>{label}</strong><small>{hint}</small></span>{children}</label>; }

type ScreenProps = { state: AppState; commit: (mutator: (current: AppState) => AppState) => void; setError: (value: string) => void; setMessage: (value: string) => void };

function upsertSteps(items: AppState['steps'], steps: number): AppState['steps'] {
  const date = todayKey();
  const next = { date, steps, updatedAt: new Date().toISOString() };
  const existing = items.findIndex((item) => item.date === date);
  if (existing < 0) return [...items, next];
  return items.map((item, index) => index === existing ? next : item);
}
function num(value: string): number { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function initials(value: string): string { return value.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'FA'; }
function goalLabel(goal: Goal): string { return ({ strength: 'Fuerza', hypertrophy: 'Hipertrofia', 'fat-loss': 'Pérdida de grasa', general: 'Condición general' })[goal]; }
function formatDate(value: string): string { return new Date(value).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' }); }
function greeting(): string { const hour = new Date().getHours(); return hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'; }
function prType(type: string): string { return ({ 'estimated-1rm': '1RM estimado', load: 'Carga', reps: 'Repeticiones', volume: 'Volumen de serie' } as Record<string, string>)[type] ?? type; }
