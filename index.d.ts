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
  theme?: string;
  height?: number;
  width?: number;
  maxWidth?: number;
  maxHeight?: number;
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
}

export class Editor {
  constructor(selector: string | Element, options?: EditorOptions);
  /** The contentEditable element (public — apps may attach listeners to it). */
  editor: HTMLElement;
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
  isEmpty(): boolean;
  clear(): void;
  insertText(text: string): void;
  insertHTML(html: string): void;
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
  /**
   * Progressive-enhance a <textarea> into an editor with TWO-WAY sync (editor
   * edits update textarea.value + fire native events; writing textarea.value
   * updates the editor). The returned editor also exposes a controller:
   * getValue()/setValue()/destroy() (destroy restores the textarea).
   */
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
