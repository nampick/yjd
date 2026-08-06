/**
 * Emoji Picker — UI 2.0 popup: search field, "Frequently used" recents and
 * category tabs (the design's picker chrome), replacing the old flat grid +
 * OS-shortcut footer. Recents persist in localStorage (best-effort).
 */
import { appendPopup, calculatePopupPosition, setPopupPosition } from '../utils/popup-helper.js';

const RECENT_KEY = 'yjd-emoji-recent';
const RECENT_SEED = ['👍', '🎉', '🔥', '✅', '🚀', '👀', '🐛', '💡'];

// name → emoji per category. Names power the search box; keep them short.
const CATEGORIES = [
  { id: 'smileys', icon: '😀', label: 'Smileys & people', emojis: {
    grinning: '😀', beaming: '😁', joy: '😂', rofl: '🤣', smile: '😄', sweat: '😅',
    wink: '😉', blush: '😊', yum: '😋', cool: '😎', 'heart eyes': '😍', kiss: '😘',
    thinking: '🤔', neutral: '😐', eyeroll: '🙄', sleeping: '😴', crying: '😢',
    sob: '😭', angry: '😡', mindblown: '🤯', party: '🥳', worried: '😟',
    scream: '😱', hug: '🤗', shush: '🤫', liar: '🤥', mask: '😷', devil: '😈',
    clown: '🤡', ghost: '👻', skull: '💀', poop: '💩', wave: '👋', 'thumbs up': '👍',
    'thumbs down': '👎', clap: '👏', pray: '🙏', muscle: '💪', eyes: '👀', heart: '❤️'
  } },
  { id: 'nature', icon: '🐻', label: 'Animals & nature', emojis: {
    dog: '🐶', cat: '🐱', mouse: '🐭', rabbit: '🐰', fox: '🦊', bear: '🐻',
    panda: '🐼', koala: '🐨', tiger: '🐯', lion: '🦁', cow: '🐮', pig: '🐷',
    frog: '🐸', monkey: '🐵', chicken: '🐔', penguin: '🐧', bird: '🐦', duck: '🦆',
    butterfly: '🦋', bug: '🐛', bee: '🐝', snail: '🐌', octopus: '🐙', whale: '🐳',
    dolphin: '🐬', tree: '🌳', cactus: '🌵', flower: '🌸', rose: '🌹', sun: '☀️',
    moon: '🌙', star: '⭐', cloud: '☁️', rain: '🌧️', snow: '❄️', rainbow: '🌈'
  } },
  { id: 'food', icon: '🍔', label: 'Food & drink', emojis: {
    apple: '🍎', banana: '🍌', grapes: '🍇', strawberry: '🍓', watermelon: '🍉',
    lemon: '🍋', peach: '🍑', avocado: '🥑', tomato: '🍅', corn: '🌽', bread: '🍞',
    cheese: '🧀', egg: '🥚', bacon: '🥓', pancakes: '🥞', fries: '🍟', burger: '🍔',
    pizza: '🍕', hotdog: '🌭', taco: '🌮', sushi: '🍣', ramen: '🍜', curry: '🍛',
    salad: '🥗', popcorn: '🍿', donut: '🍩', cookie: '🍪', cake: '🎂', icecream: '🍦',
    chocolate: '🍫', coffee: '☕', tea: '🍵', beer: '🍺', wine: '🍷', cocktail: '🍸'
  } },
  { id: 'activity', icon: '⚽', label: 'Activities', emojis: {
    soccer: '⚽', basketball: '🏀', football: '🏈', baseball: '⚾', tennis: '🎾',
    volleyball: '🏐', pool: '🎱', pingpong: '🏓', badminton: '🏸', goal: '🥅',
    golf: '⛳', bow: '🏹', fishing: '🎣', boxing: '🥊', ski: '🎿', skate: '🛹',
    bike: '🚴', swim: '🏊', run: '🏃', trophy: '🏆', medal: '🥇', dart: '🎯',
    bowling: '🎳', videogame: '🎮', dice: '🎲', chess: '♟️', guitar: '🎸',
    piano: '🎹', microphone: '🎤', headphones: '🎧', art: '🎨', theater: '🎭'
  } },
  { id: 'travel', icon: '✈️', label: 'Travel & places', emojis: {
    car: '🚗', taxi: '🚕', bus: '🚌', firetruck: '🚒', ambulance: '🚑', police: '🚓',
    truck: '🚚', tractor: '🚜', motorcycle: '🏍️', bicycle: '🚲', train: '🚆',
    metro: '🚇', airplane: '✈️', rocket: '🚀', helicopter: '🚁', ship: '🚢',
    sailboat: '⛵', anchor: '⚓', fuel: '⛽', construction: '🚧', map: '🗺️',
    mountain: '⛰️', volcano: '🌋', camping: '🏕️', beach: '🏖️', desert: '🏜️',
    stadium: '🏟️', house: '🏠', office: '🏢', hospital: '🏥', bank: '🏦',
    hotel: '🏨', school: '🏫', castle: '🏰', bridge: '🌉', city: '🌆'
  } },
  { id: 'objects', icon: '💡', label: 'Objects', emojis: {
    laptop: '💻', keyboard: '⌨️', mouse2: '🖱️', phone: '📱', printer: '🖨️',
    camera: '📷', video: '📹', tv: '📺', radio: '📻', battery: '🔋', plug: '🔌',
    bulb: '💡', flashlight: '🔦', candle: '🕯️', book: '📖', newspaper: '📰',
    money: '💰', card: '💳', gem: '💎', wrench: '🔧', hammer: '🔨', gear: '⚙️',
    scissors: '✂️', pen: '🖊️', pencil: '✏️', paperclip: '📎', folder: '📁',
    calendar: '📅', chart: '📊', pin: '📌', lock: '🔒', key: '🔑', magnet: '🧲',
    package: '📦', mailbox: '📫', bell: '🔔'
  } },
  { id: 'symbols', icon: '🔣', label: 'Symbols', emojis: {
    'check mark': '✅', cross: '❌', warning: '⚠️', question: '❓', exclamation: '❗',
    'plus sign': '➕', 'minus sign': '➖', divide: '➗', infinity: '♾️', recycle: '♻️',
    sparkles: '✨', boom: '💥', 'fire flame': '🔥', 'hundred points': '💯',
    'red heart': '❤️', 'broken heart': '💔', arrow: '➡️', 'arrow up': '⬆️',
    'arrow down': '⬇️', new: '🆕', free: '🆓', ok: '🆗', sos: '🆘', wifi: '📶',
    peace: '☮️', 'yin yang': '☯️', music: '🎵', notes: '🎶', copyright: '©️',
    registered: '®️', tm: '™️', hash: '#️⃣', 'star symbol': '⭐', zap: '⚡'
  } }
];

class EmojiPicker {
  constructor(options = {}) {
    this.options = {
      // Legacy override: a flat `emojis: []` array replaces the category sets.
      emojis: null,
      onEmojiSelect: null,
      ...options
    };

    this.popup = null;
    this.isVisible = false;
    this.clickOutsideHandler = null;
    this.activeCat = 'recent';
    this.query = '';

    this.categories = Array.isArray(this.options.emojis) && this.options.emojis.length
      ? [{ id: 'custom', icon: '😀', label: 'Emoji',
           emojis: Object.fromEntries(this.options.emojis.map((e, i) => ['emoji ' + i, e])) }]
      : CATEGORIES;

    this.createEmojiPicker();
  }

  _recents() {
    try {
      const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || 'null');
      if (Array.isArray(raw) && raw.length) return raw.slice(0, 16);
    } catch (e) { /* private mode / blocked storage */ }
    return RECENT_SEED;
  }

  _pushRecent(emoji) {
    try {
      const list = [emoji, ...this._recents().filter((e) => e !== emoji)].slice(0, 16);
      localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    } catch (e) { /* best-effort */ }
  }

  /**
   * Create emoji picker popup: search, section head, grid, category tabs.
   */
  createEmojiPicker() {
    this.popup = document.createElement('div');
    this.popup.className = 'emoji-picker-popup';

    // Search row
    const search = document.createElement('div');
    search.className = 'emoji-search';
    search.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>';
    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Search emoji';
    this.searchInput.setAttribute('aria-label', 'Search emoji');
    this.searchInput.addEventListener('input', () => {
      this.query = this.searchInput.value.trim().toLowerCase();
      this.renderGrid();
    });
    // Don't let the editor's focus guards swallow typing in the field.
    this.searchInput.addEventListener('pointerdown', (e) => e.stopPropagation());
    search.appendChild(this.searchInput);
    this.popup.appendChild(search);

    // Section head + grid
    this.headEl = document.createElement('div');
    this.headEl.className = 'emoji-head';
    this.popup.appendChild(this.headEl);
    this.gridEl = document.createElement('div');
    this.gridEl.className = 'emoji-grid';
    this.popup.appendChild(this.gridEl);

    // Category tabs (recent first)
    if (this.categories.length > 1) {
      const tabs = document.createElement('div');
      tabs.className = 'emoji-cats';
      const allCats = [{ id: 'recent', icon: '🕘', label: 'Frequently used' }, ...this.categories];
      allCats.forEach((c) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'emoji-cat' + (c.id === this.activeCat ? ' active' : '');
        b.textContent = c.icon;
        b.title = c.label;
        b.setAttribute('aria-label', c.label);
        b.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.activeCat = c.id;
          this.query = '';
          this.searchInput.value = '';
          tabs.querySelectorAll('.emoji-cat').forEach((x) => x.classList.toggle('active', x === b));
          this.renderGrid();
        });
        tabs.appendChild(b);
      });
      this.popup.appendChild(tabs);
    }

    this.renderGrid();
    appendPopup(this.popup);
  }

  renderGrid() {
    let title;
    let list; // [{ name, emoji }]
    if (this.query) {
      title = 'Search results';
      list = [];
      this.categories.forEach((c) => {
        Object.entries(c.emojis).forEach(([name, emoji]) => {
          if (name.includes(this.query)) list.push({ name, emoji });
        });
      });
    } else if (this.activeCat === 'recent' && this.categories.length > 1) {
      title = 'Frequently used';
      list = this._recents().map((emoji) => ({ name: '', emoji }));
    } else {
      const cat = this.categories.find((c) => c.id === this.activeCat) || this.categories[0];
      title = cat.label;
      list = Object.entries(cat.emojis).map(([name, emoji]) => ({ name, emoji }));
    }

    this.headEl.textContent = title;
    this.gridEl.innerHTML = '';
    if (!list.length) {
      const empty = document.createElement('div');
      empty.className = 'emoji-empty';
      empty.textContent = 'No emoji found';
      this.gridEl.appendChild(empty);
      return;
    }
    list.forEach(({ name, emoji }) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'emoji-button';
      b.textContent = emoji;
      b.title = name || emoji;
      b.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.selectEmoji(emoji);
      });
      this.gridEl.appendChild(b);
    });
  }

  /**
   * Setup click outside handler
   */
  setupClickOutside() {
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
    }

    this.clickOutsideHandler = (e) => {
      if (!this.popup.contains(e.target)) {
        this.hide();
      }
    };

    // Add slight delay to avoid immediate close
    setTimeout(() => {
      document.addEventListener('click', this.clickOutsideHandler);
    }, 100);
  }

  /**
   * Remove click outside handler
   */
  removeClickOutside() {
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
      this.clickOutsideHandler = null;
    }
  }

  /**
   * Show emoji picker popup
   * @param {HTMLElement} anchor - Element to position popup relative to
   */
  show(anchor) {
    if (!anchor) return;

    // Ensure popup is in DOM
    if (!document.body.contains(this.popup)) {
      appendPopup(this.popup);
    }

    // Fresh recents each open
    if (this.activeCat === 'recent' && !this.query) this.renderGrid();

    // Calculate and set popup position
    const position = calculatePopupPosition(anchor, this.popup, {
      offsetY: 5,
      offsetX: 0
    });
    setPopupPosition(this.popup, position);

    // Show popup by adding visible class
    this.popup.classList.add('visible');
    this.isVisible = true;

    // Setup click outside handler
    this.setupClickOutside();
  }

  /**
   * Hide emoji picker popup
   */
  hide() {
    this.popup.classList.remove('visible');
    this.isVisible = false;
    this.removeClickOutside();
  }

  /**
   * Select emoji and trigger callback
   * @param {string} emoji - Selected emoji
   */
  selectEmoji(emoji) {
    this._pushRecent(emoji);
    if (this.options.onEmojiSelect) {
      this.options.onEmojiSelect(emoji);
    }

    this.hide();
  }

  /**
   * Destroy the emoji picker
   */
  destroy() {
    this.removeClickOutside();

    if (this.popup && this.popup.parentNode) {
      this.popup.parentNode.removeChild(this.popup);
    }

    this.popup = null;
    this.isVisible = false;
  }
}

export default EmojiPicker;
