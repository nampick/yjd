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
  /** @mention / #task autocomplete. Inert until a `source` is given. */
  mention?: MentionOptions;
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
  on(event: string, handler: (data: any) => void): void;
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
   * Progressive-enhance a <textarea> into an editor, keeping textarea.value
   * in sync (and dispatching native input/change events) on every edit.
   */
  static fromTextarea(
    textarea: HTMLTextAreaElement | string,
    options?: EditorOptions & { format?: 'html' | 'markdown' }
  ): RichEditor;
  /** The original textarea, when created via fromTextarea(). */
  textarea?: HTMLTextAreaElement;
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
