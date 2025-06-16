# Hướng dẫn tái cấu trúc Editor.js

## Cấu trúc mới

File `Editor.js` gốc đã được chia thành các module riêng theo tính năng:

### 1. EditorCore.js

**Chức năng:** Core functionality của editor
**Các hàm cần di chuyển:**

- `constructor()` - Hàm khởi tạo chính
- `init()` - **BẮT BUỘC** - Hàm khởi tạo editor
- `setupContentObserver()` - Theo dõi thay đổi nội dung
- `addGlobalClickHandler()` - Xử lý click toàn cục
- `updateEditorAreaHeight()` - Cập nhật chiều cao
- `bindEvents()` - Gắn kết các sự kiện
- `updateStatusbar()` - Cập nhật thanh trạng thái
- `saveSelection()` - Lưu vị trí con trỏ
- `restoreSelection()` - Khôi phục vị trí con trỏ
- `toggleSourceView()` - Chuyển đổi chế độ HTML
- `adjustEditorZoom()` - Điều chỉnh zoom
- `resetEditorZoom()` - Reset zoom
- `updateZoomStatus()` - Cập nhật trạng thái zoom
- `destroy()` - Hủy editor

### 2. ToolbarManager.js

**Chức năng:** Quản lý toolbar và các nút bấm
**Các hàm cần di chuyển:**

- `createCheckmarkSVG()`
- `updateDropdownCheckmarks()`
- `createToolbar()`
- `toggleToolbar2()`
- `updateMoreOptionsButtonState()`
- `addToolbar2RowSeparators()`
- `createBtn()`
- `createColorBtn()`
- `createSeparator()`
- `updateFormatButtonStates()`
- `checkFormatByStyle()`
- `updateColorButtonStates()`
- `showColorPicker()`
- `createDropdownButton()`
- `closeAllDropdowns()`

### 3. TableManager.js

**Chức năng:** Quản lý bảng
**Các hàm cần di chuyển:**

- `createTableUI()`
- `createTableToolbarButtons()`
- `createTableToolbarButton()`
- `createSplitTableToolbar()`
- `showTableToolbar()`
- `hideTableToolbar()`
- `insertTable()`
- `handleTableCommand()`
- `addTableRow()`
- `addTableColumn()`
- `deleteTableRow()`
- `deleteTableColumn()`
- `mergeTableCells()`
- `splitTableCells()`
- `deleteTable()`
- `addTableResizeHandles()`
- `positionTableHandles()`
- `removeTableResizeHandles()`

### 4. FormatManager.js

**Chức năng:** Quản lý định dạng văn bản
**Các hàm cần di chuyển:**

- `getCurrentTextColor()`
- `getCurrentBackgroundColor()`
- `normalizeColor()`
- `applyBackgroundColor()`
- `applyTextColor()`
- `toggleFormat()`
- `handleFormatCommand()`
- `adjustFontSize()`
- `setFontSize()`
- `applyFontSizeToBlock()`
- `applyFontSizeToSelection()`
- `updateFontSizeDisplay()`
- `removeLineHeight()`
- `applyLineHeight()`
- `applyLineHeightToBlock()`
- `applyLineHeightToSelection()`
- `removeLineHeightFromBlock()`
- `removeLineHeightFromSelection()`
- `updateLineHeightDisplay()`
- `applyCapitalization()`
- `applyCapitalizationToBlock()`
- `applyCapitalizationToSelection()`
- `transformText()`
- `toTitleCase()`
- `capitalizeFirst()`
- `replaceTextInElement()`

### 5. BlockManager.js

**Chức năng:** Quản lý block và indentation
**Các hàm cần di chuyển:**

- `createBlockToolbar()`
- `createBlockToolbarButtons()`
- `createSplitToolbar()`
- `createToolbarButton()`
- `showBlockToolbar()`
- `hideBlockToolbar()`
- `handleBlockToolbarAction()`
- `applyIndentToSelection()`
- `getBlockElementAtCaret()`
- `getBlocksInSelection()`
- `isAfterNode()`
- `isBeforeNode()`
- `getParentBlock()`
- `toggleIndentForBlock()`
- `updateIndentButtonState()`
- `blockHasTextIndent()`
- `applyPaddingIndentToSelection()`
- `applyPaddingIndentToBlock()`
- `updateIndentDecreaseButtonVisibility()`
- `updateIndentIncreaseButtonVisibility()`
- `blockHasPositivePaddingLeft()`
- `blockHasMaxPaddingLeft()`
- `applyHeadingToSelection()`
- `changeBlockTag()`
- `updateHeadingSelector()`

### 6. MediaManager.js

**Chức năng:** Quản lý hình ảnh và video
**Các hàm cần di chuyển:**

- `showTooltip()`
- `insertImageWithStyle()`
- `insertVideo()`
- `showImgResizeHandles()`
- `positionImgHandles()`
- `removeImgResizeHandles()`
- `startResizeImgHandle()`
- `resizingImgHandle()`
- `insertImage()`
- `insertLink()`
- `insertEmoji()`
- `showImageDropdown()`
- `showLinkDropdown()`
- `showEmojiDropdown()`
- `showVideoDropdown()`

### 7. ImportExportManager.js

**Chức năng:** Quản lý import/export
**Các hàm cần di chuyển:**

- `importContent()`
- `importExcelFile()`
- `parseExcelToTable()`
- `processExcelFile()`
- `importPdfFile()`
- `loadPdfJs()`
- `renderPdfAsHtml()`
- `showPdfErrorMessage()`
- `importDocFile()`
- `loadMammoth()`
- `convertDocToHtml()`
- `showDocErrorMessage()`
- `createNewDocument()`
- `importDocument()`
- `exportAsHTML()`
- `showImportDropdown()`

### 8. ThemeManager.js

**Chức năng:** Quản lý theme
**Các hàm cần di chuyển:**

- `toggleTheme()`
- `applyTheme()`
- `updateThemeToggleButton()`
- `updateToolbarButtonsTheme()`
- `updateSelectorsTheme()`
- `updateDynamicElements()`
- `updateEditorContentTheme()`
- `updateTableThemes()`
- `applyThemeToElement()`

### 9. TagTemplateManager.js

**Chức năng:** Quản lý tags và templates
**Các hàm cần di chuyển:**

- `getTagCategories()`
- `showTagsPopup()`
- `showTagsForCategory()`
- `insertTag()`
- `closeTagsPopup()`
- `getTemplateCategories()`
- `showTemplatesPopup()`
- `showTemplatesForCategory()`
- `insertTemplate()`
- `closeTemplatesPopup()`

### 10. SelectorManager.js

**Chức năng:** Quản lý các selector
**Các hàm cần di chuyển:**

- `showFontSelector()`
- `showFontSizeSelector()`
- `showLineHeightSelector()`

## Cách di chuyển code

1. **Tìm hàm trong Editor.js gốc** theo danh sách trên
2. **Copy code của hàm** (bao gồm cả phần logic bên trong)
3. **Paste vào hàm tương ứng** trong file manager
4. **Thay đổi tham chiếu `this.`** thành `this.editor.` nếu cần thiết
5. **Test từng module** sau khi di chuyển

## Lưu ý quan trọng

- **EditorCore.js** phải chứa hàm `init()` (yêu cầu bắt buộc)
- Các manager được khởi tạo trong constructor của Editor class chính
- Cần thay đổi cách gọi hàm từ `this.functionName()` thành `this.manager.functionName()`
- Kiểm tra dependencies giữa các hàm khi di chuyển
