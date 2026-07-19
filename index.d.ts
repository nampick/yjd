// Type definitions for @oix1987/yjd
// These declarations are the package entry types (referenced via "types" in package.json),
// so they are declared at top level rather than wrapped in `declare module`.

/** A person/task suggestion returned by a mention source. */
export interface MentionItem {
  id: string | number;
  name?: string;
  label?: string;
  avatar_url?: string;
  [key: string]: any;
}

/** Config for a single mention trigger character. */
export interface MentionTrigger {
  /** Trigger character, e.g. '#'. */
  char: string;
  /** Async (or sync) lookup of suggestions for the typed query. */
  source: (query: string) => MentionItem[] | Promise<MentionItem[]>;
  /** Custom HTML for a suggestion row. Defaults to avatar + name. */
  renderItem?: (item: MentionItem) => string;
}

/** @mention configuration. The token inserted carries `data-id`. */
export interface MentionOptions {
  /** Primary trigger character (default '@'). */
  trigger?: string;
  source?: (query: string) => MentionItem[] | Promise<MentionItem[]>;
  renderItem?: (item: MentionItem) => string;
  /** Additional triggers, e.g. '#' for task references. */
  triggers?: MentionTrigger[];
}

/** Image upload hook configuration. */
export interface ImageOptions {
  /**
   * Upload the chosen file and resolve to its URL. While pending, a placeholder
   * is shown; on resolve the src is swapped, on reject the image is removed.
   * Omit to fall back to inline base64 (data URLs).
   */
  upload?: (file: File) => string | Promise<string>;
  /** `accept` attribute for the file picker (default 'image/*'). */
  accept?: string;
  /** Maximum file size in bytes; larger files emit 'image:error'. */
  maxSize?: number;
  /** Display cap for inserted images (px or any CSS length, e.g. '60vh'). */
  maxHeight?: number | string;
  /** Display cap for inserted images (px or any CSS length). */
  maxWidth?: number | string;
}

/** Result of a file.upload hook — a URL, or richer metadata. */
export interface FileUploadResult {
  url: string;
  name?: string;
  size?: string;
}

/** Attachment (non-image file) upload hook. Inserts a "file chip". */
export interface FileOptions {
  /**
   * Upload the chosen file; resolve to a URL string or { url, name, size }.
   * While pending a placeholder chip is shown. Omit to inline a data: URL.
   */
  upload?: (file: File) => string | FileUploadResult | Promise<string | FileUploadResult>;
  /** `accept` attribute for the file picker (e.g. '.pdf,.zip,.docx'). */
  accept?: string;
  /** Maximum file size in bytes; larger files emit 'file:error'. */
  maxSize?: number;
}

/** Enter-to-submit behaviour (e.g. a comment box). */
export interface SubmitOptions {
  /**
   * Called when Enter is pressed and no autocomplete popup (mention/slash/emoji)
   * is open. Receives the current HTML and the editor instance.
   */
  onEnter: (html: string, editor: Editor) => void;
  /** Shift+Enter inserts a newline (default true). */
  newlineOnShiftEnter?: boolean;
}

/** Context passed to the AI `complete` hook for one request. */
export interface AiContext {
  /** Action id ('improve', 'fix', 'ask', 'autocomplete', or a custom id). */
  action: string;
  /** Instruction for the action (the action's prompt, or the user's question). */
  prompt: string;
  /** The selected text (or, for autocomplete, the preceding context). */
  text: string;
  /** The selected HTML, when available. */
  html: string;
  /** Aborts when the request is superseded or cancelled. */
  signal: AbortSignal;
}

/** A selection-toolbar action. */
export interface AiAction {
  id: string;
  label: string;
  /** Instruction handed to the `complete` hook as `prompt`. */
  prompt: string;
}

/** Inline ghost-text autocomplete tuning. */
export interface AiAutocompleteOptions {
  /** Idle delay before requesting a suggestion (ms, default 400). */
  debounce?: number;
  /** Minimum context length before suggesting (default 3). */
  minChars?: number;
  /** Max characters of preceding text sent as context (default 600). */
  maxContext?: number;
}

/**
 * AI configuration. Inert until a `complete` hook is given (BYO-model, like
 * `mention.source`). Enables a selection toolbar (improve/fix/shorten/…/Ask AI)
 * with accept-or-discard, and optional ghost-text autocomplete.
 */
export interface AiOptions {
  /**
   * Call your LLM and resolve to the generated text. Stream by invoking
   * `onToken` with each chunk; if you only stream, return undefined and the
   * chunks are joined.
   */
  complete: (ctx: AiContext, onToken: (chunk: string) => void) => string | void | Promise<string | void>;
  /** Replace/extend the selection-toolbar actions. */
  actions?: AiAction[];
  /** Inline ghost-text autocomplete (Tab to accept). */
  autocomplete?: boolean | AiAutocompleteOptions;
}

/** Streaming sink returned by editor.streamInto(). */
export interface StreamSink {
  /** Append a chunk at the caret (first append replaces the selection). */
  append(chunk: string): void;
  /** Finish the stream. */
  commit(): void;
  /** Undo the whole streamed insertion. */
  cancel(): void;
}

/** A snapshot of the current selection (the context an AI/tool acts on). */
export interface SelectionSnapshot {
  text: string;
  html: string;
  isEmpty: boolean;
  range: Range;
}

/** The AI module instance, exposed as `editor.ai` when configured. */
export interface AiController {
  /** Run a built-in/custom action or a free-form prompt on the selection. */
  run(action: AiAction | string, opts?: { text?: string; html?: string }): Promise<string>;
  /** Open the assistant bar (selection actions, or Ask-AI at the caret). */
  openFromToolbar(): void;
  /** Manually trigger a ghost-text completion at the caret. */
  autocomplete(): void;
}

/**
 * Toolbar configuration: a built-in preset, an exclusion of default items,
 * a flat item list (single group), or full custom groups via toolbar1/toolbar2.
 */
export type ToolbarOption = 'full' | 'compact' | { exclude: string[] } | string[];

/** A JSON document node produced by getJSON()/domToJson. */
export interface JsonNode {
  tag?: string;
  text?: string;
  attrs?: Record<string, string>;
  content?: JsonNode[];
}

/** Root JSON document. */
export interface JsonDoc {
  type: 'doc';
  content: JsonNode[];
}

// Editor options interface
export interface EditorOptions {
  placeholder?: string;
  /**
   * Colour theme. 'inherit' (default) follows the nearest ancestor [data-theme]
   * (falling back to the light :root tokens); 'light' / 'dark' force a theme;
   * 'auto' follows the OS via prefers-color-scheme.
   */
  theme?: 'inherit' | 'light' | 'dark' | 'auto';
  /** Editor height in px, or 'auto' to grow with content (no max cap). */
  height?: number | 'auto';
  /** Explicit min/max height in px (override the height-derived defaults). */
  minHeight?: number;
  maxHeight?: number;
  width?: number | string;
  maxWidth?: number | string;
  content?: string | null;
  onChange?: (content: string) => void;
  /** When true, paste always inserts plain text (default: false). */
  pasteAsPlainText?: boolean;
  /** Accessible label for the editable region (defaults to placeholder). */
  ariaLabel?: string;
  /** Maximum number of characters allowed. */
  maxLength?: number;
  /** Initial text direction. */
  direction?: 'ltr' | 'rtl';
  /** Enable markdown shortcuts (default: true). Set false to disable. */
  markdown?: boolean;
  /** Autosave drafts to localStorage. true, or { key, debounce(ms) }. */
  autosave?: boolean | { key?: string; debounce?: number };
  /** Image upload hook (replaces inline base64 when `upload` is provided). */
  image?: ImageOptions | boolean;
  /** Attachment (non-image file) upload hook → inserts a file chip. */
  file?: FileOptions;
  /** @mention / #task autocomplete. Inert until a `source` is given. */
  mention?: MentionOptions;
  /** Enter-to-submit behaviour for comment-style editors. */
  submit?: SubmitOptions;
  /** AI assistant (selection toolbar + ghost-text). Inert until `complete` is set. */
  ai?: AiOptions;
  /** Built-in preset / exclusion / flat list, instead of toolbar1/toolbar2. */
  toolbar?: ToolbarOption;
  /** Warn (emit 'content:overflow') when serialized HTML exceeds this many chars. */
  maxContentSize?: number;
  features?: {
    emoji?: boolean;
    image?: boolean;
    table?: boolean;
    wordCount?: boolean;
    breadcrumb?: boolean;
  };
  toolbar1?: Array<{
    group: string;
    items: string[];
  }>;
  toolbar2?: Array<{
    group: string;
    items: string[];
  }>;
  /**
   * Explicit list of module names to load, overriding the default set
   * (e.g. ['toolbar', 'history']). Names resolve against the registry.
   */
  modules?: string[];
  /**
   * Explicit list of format names to load, overriding the default set.
   * Names resolve against the registry.
   */
  formats?: string[];
}

export class Editor {
  constructor(selector: string | Element, options?: EditorOptions);
  /**
   * Progressive-enhance a <textarea> into an editor with two-way sync + a
   * controller (getValue/setValue/destroy). Available from `/core` too.
   */
  static fromTextarea(
    textarea: HTMLTextAreaElement | string,
    options?: EditorOptions & { format?: 'html' | 'markdown' }
  ): TextareaEditor;
  /** The contentEditable element (public — apps may attach listeners to it). */
  editor: HTMLElement;
  /** The AI module, present when `ai.complete` was configured. */
  ai?: AiController;
  on(event: string, handler: (data: any) => void): void;
  /** Remove a previously-added listener (symmetric with on()). */
  off(event: string, handler: (data: any) => void): void;
  emit(event: string, data: any): void;
  getContent(): string;
  setContent(content: string): void;
  /** Alias of getContent() / setContent(). */
  getHTML(): string;
  setHTML(html: string): void;
  /** Export/import the document as a JSON tree. */
  getJSON(): JsonDoc;
  setJSON(json: JsonDoc | JsonNode[]): void;
  /** Export/import the document as Markdown (mention ids preserved). */
  getMarkdown(): string;
  setMarkdown(markdown: string): void;
  getText(): string;
  /** Undo the last change (uses the history module, falls back to execCommand). */
  undo(): void;
  /** Redo the last undone change. */
  redo(): void;
  isEmpty(): boolean;
  clear(): void;
  insertText(text: string): void;
  insertHTML(html: string): void;
  /** Snapshot of the current selection (null when outside the editor). */
  getSelection(): SelectionSnapshot | null;
  /** Replace the current selection with content (sanitized, undo-aware). */
  replaceSelection(content: string, opts?: { asText?: boolean }): void;
  /** Open a streaming sink at the caret for token-by-token AI output. */
  streamInto(): StreamSink;
  clearFormatting(): void;
  insertHorizontalRule(): void;
  insertImageFile(file: File): void;
  /** Insert a non-image File as a file chip (uses options.file.upload). */
  insertFileAttachment(file: File): void;
  /** Open the native picker for a file attachment. */
  openFileAttachmentPicker(): void;
  /** True when a mention/slash/emoji popup that captures Enter is open. */
  isMenuOpen(): boolean;
  setReadOnly(readOnly: boolean): void;
  isReadOnly(): boolean;
  /** Switch the colour theme at runtime. */
  setTheme(theme: 'inherit' | 'light' | 'dark' | 'auto'): this;
  /** Current theme option. */
  getTheme(): 'inherit' | 'light' | 'dark' | 'auto';
  setDirection(dir: 'ltr' | 'rtl'): void;
  getDirection(): 'ltr' | 'rtl';
  toggleDirection(): void;
  clearAutosave(): void;
  focus(): void;
  destroy(): void;
}

export class Module {}
export class Format {}
export class InlineFormat extends Format {}
export class BlockFormat extends Format {}
export const registry: any;

export class RichEditor extends Editor {
  static register(path: string, definition: any, suppressWarning?: boolean): void;
  static get(path: string): any;
  static create(selector: string | Element, options?: EditorOptions): RichEditor;
  /** Inherited from Editor (returns a fully-featured RichEditor). */
  static fromTextarea(
    textarea: HTMLTextAreaElement | string,
    options?: EditorOptions & { format?: 'html' | 'markdown' }
  ): TextareaEditor;
  /** The original textarea, when created via fromTextarea(). */
  textarea?: HTMLTextAreaElement;
}

/** Editor returned by fromTextarea(), with a value controller. */
export interface TextareaEditor extends RichEditor {
  textarea: HTMLTextAreaElement;
  /** Current content (HTML or Markdown per the `format` option). */
  getValue(): string;
  /** Replace the editor content (HTML or Markdown per `format`). */
  setValue(value: string): void;
  /** Remove the editor and restore the textarea with its last value. */
  destroy(): void;
}

/** Brand-aligned alias of {@link RichEditor}. */
export { RichEditor as yjd };

export function createEditor(selector: string | Element, options?: EditorOptions): RichEditor;

/**
 * Render stored HTML into a read-only view that matches the editor's styling.
 * Sanitizes the HTML and tags the host element with `.yjd-content`.
 */
export function renderStatic(html: string, target?: Element): Element;

// Serialization helpers (also available on the editor as get/set methods)
export function htmlToMarkdown(html: string): string;
export function markdownToHtml(markdown: string): string;
export function domToJson(html: string): JsonDoc;
export function jsonToHtml(json: JsonDoc | JsonNode[]): string;

// Formats
export const Bold: any;
export const Italic: any;
export const Underline: any;
export const Strike: any;
export const Subscript: any;
export const Superscript: any;
export const Color: any;
export const Background: any;
export const Link: any;
export const Table: any;
export const Heading: any;
export const FontFamily: any;
export const LineHeight: any;
export const Capitalization: any;
export const TextAlign: any;
export const List: any;
export const Indent: any;
export const IndentIncrease: any;
export const IndentDecrease: any;
export const Emoji: any;
export const Image: any;
export const Video: any;
export const Tag: any;
export const TextSize: any;
export const Import: any;

// Modules
export const Toolbar: any;
export const History: any;
export const BlockToolbar: any;
export const TableToolbar: any;
export const CodeView: any;
export const FindReplace: any;
export const SlashMenu: any;
export const Mention: any;
export const Ai: any;
export const ResizeHandles: any;

// UI components
export const ColorPicker: any;
export const IconUtils: any;
export const LinkPopup: any;
export const TablePopup: any;
export const TextAlignPicker: any;
export const ListPicker: any;
export const EmojiPicker: any;
export const ImagePopup: any;
export const VideoPopup: any;
export const TagPopup: any;

export const createCustomButton: any;

export default RichEditor;
