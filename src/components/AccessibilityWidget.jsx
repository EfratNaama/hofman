import { useEffect, useState } from 'react';

const STORAGE_KEY = 'beit-hoffman-accessibility-settings';
const MODE_CLASSES = [
  'accessibility-color-blind',
  'accessibility-contrast-black',
  'accessibility-contrast-white',
  'accessibility-no-flashes',
];

const defaultSettings = {
  fontScale: 1,
  mode: '',
  noFlashes: false,
};

const panelActions = [
  { key: 'shortcuts', icon: '⌨', label: 'מקלדת קיצורי דרך' },
  { key: 'colorBlind', icon: '◐', label: 'התאמה לעיוורי צבעים' },
  { key: 'blackContrast', icon: '●', label: 'התאמה לכבדי ראייה שחור' },
  { key: 'whiteContrast', icon: '○', label: 'התאמה לכבדי ראייה לבן' },
  { key: 'noFlashes', icon: '✦', label: 'חסום הבהובים' },
  { key: 'increaseText', icon: 'A+', label: 'הגדלת טקסט' },
  { key: 'decreaseText', icon: 'A-', label: 'הקטנת טקסט' },
  { key: 'statement', icon: 'ⓘ', label: 'הצהרת נגישות' },
  { key: 'reset', icon: '↺', label: 'בטל נגישות' },
];

function normalizeSettings(settings) {
  return {
    ...defaultSettings,
    ...settings,
    fontScale: Number(settings?.fontScale) || 1,
  };
}

function readSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? normalizeSettings(JSON.parse(saved)) : defaultSettings;
  } catch (error) {
    return defaultSettings;
  }
}

function applySettings(settings) {
  document.body.classList.remove(...MODE_CLASSES);
  document.body.style.removeProperty('--accessibility-font-scale');
  document.documentElement.style.setProperty('--accessibility-font-scale', String(settings.fontScale));

  if (settings.mode) {
    document.body.classList.add(settings.mode);
  }

  if (settings.noFlashes) {
    document.body.classList.add('accessibility-no-flashes');
  }
}

function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const savedSettings = readSettings();
    setSettings(savedSettings);
    applySettings(savedSettings);
  }, []);

  useEffect(() => {
    applySettings(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    function handleKeyboardShortcut(event) {
      if (event.altKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        setIsOpen((open) => !open);
        return;
      }

      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => document.removeEventListener('keydown', handleKeyboardShortcut);
  }, []);

  function updateSettings(nextSettings) {
    setSettings((current) => ({ ...current, ...nextSettings }));
  }

  function handleAction(actionKey) {
    setMessage('');

    if (actionKey === 'shortcuts') {
      setShowShortcuts((current) => !current);
      return;
    }

    if (actionKey === 'colorBlind') {
      updateSettings({ mode: settings.mode === 'accessibility-color-blind' ? '' : 'accessibility-color-blind' });
      return;
    }

    if (actionKey === 'blackContrast') {
      updateSettings({ mode: settings.mode === 'accessibility-contrast-black' ? '' : 'accessibility-contrast-black' });
      return;
    }

    if (actionKey === 'whiteContrast') {
      updateSettings({ mode: settings.mode === 'accessibility-contrast-white' ? '' : 'accessibility-contrast-white' });
      return;
    }

    if (actionKey === 'noFlashes') {
      updateSettings({ noFlashes: !settings.noFlashes });
      return;
    }

    if (actionKey === 'increaseText') {
      updateSettings({ fontScale: Math.min(Number((settings.fontScale + 0.1).toFixed(1)), 1.3) });
      return;
    }

    if (actionKey === 'decreaseText') {
      updateSettings({ fontScale: Math.max(Number((settings.fontScale - 0.1).toFixed(1)), 0.9) });
      return;
    }

    if (actionKey === 'statement') {
      setMessage('האתר כולל כלי נגישות פנימי לשיפור קריאות, ניגודיות ושימוש במקלדת.');
      return;
    }

    if (actionKey === 'reset') {
      setSettings(defaultSettings);
      setShowShortcuts(false);
      setMessage('הגדרות הנגישות אופסו.');
    }
  }

  function isPressed(actionKey) {
    if (actionKey === 'shortcuts') return showShortcuts;
    if (actionKey === 'colorBlind') return settings.mode === 'accessibility-color-blind';
    if (actionKey === 'blackContrast') return settings.mode === 'accessibility-contrast-black';
    if (actionKey === 'whiteContrast') return settings.mode === 'accessibility-contrast-white';
    if (actionKey === 'noFlashes') return settings.noFlashes;
    return undefined;
  }

  return (
    <div className="accessibility-widget" dir="rtl">
      {isOpen && (
        <section className="accessibility-panel" aria-label="תפריט נגישות">
          <div className="accessibility-panel-header">
            <span aria-hidden="true">♿</span>
            <h2 className="accessibility-panel-title">אפשרויות נגישות</h2>
          </div>

          <div className="accessibility-actions">
            {panelActions.map((action) => (
              <button
                key={action.key}
                type="button"
                className="accessibility-action"
                aria-label={action.label}
                aria-pressed={isPressed(action.key)}
                aria-controls={action.key === 'shortcuts' ? 'accessibility-shortcuts' : undefined}
                aria-expanded={action.key === 'shortcuts' ? showShortcuts : undefined}
                onClick={() => handleAction(action.key)}
              >
                <span className="accessibility-action-icon" aria-hidden="true">{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {showShortcuts && (
            <section
              id="accessibility-shortcuts"
              className="accessibility-shortcuts"
              aria-label="קיצורי דרך במקלדת"
            >
              <h3 className="accessibility-shortcuts-title">קיצורי דרך</h3>
              <ul>
                <li><strong>Alt + A:</strong> פתיחת/סגירת תפריט נגישות</li>
                <li><strong>Esc:</strong> סגירת התפריט</li>
                <li><strong>Tab:</strong> מעבר בין כפתורים</li>
                <li><strong>Enter/Space:</strong> הפעלת כפתור</li>
              </ul>
            </section>
          )}

          {message && (
            <p className="accessibility-message" role="status">
              {message}
            </p>
          )}
        </section>
      )}

      <button
        type="button"
        className="accessibility-toggle"
        aria-label={isOpen ? 'סגירת פאנל נגישות' : 'פתיחת פאנל נגישות'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span aria-hidden="true">♿</span>
      </button>
    </div>
  );
}

export default AccessibilityWidget;
