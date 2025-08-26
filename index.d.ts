declare module 'yjdtest' {
  // Editor options interface
  interface EditorOptions {
    placeholder?: string;
    theme?: string;
    height?: number;
    width?: number;
    maxWidth?: number;
    maxHeight?: number;
    content?: string | null;
    onChange?: (content: string) => void;
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
    focus(): void;
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
  }

  export function createEditor(selector: string | Element, options?: EditorOptions): RichEditor;

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
}
