// TableManager.js - Quản lý table functionality
export class TableManager {
  constructor(editor, toolbarManager) {
    this.editor = editor;
    this.toolbarManager = toolbarManager;
  }

  createTableUI() {
    // Tạo popup chọn bảng
    this.tablePopup = document.createElement('div');
    this.tablePopup.className = 'table-popup';
    this.tablePopup.style.display = 'none';
    this.tablePopup.style.position = 'absolute';
    this.tablePopup.style.background = '#fff';
    this.tablePopup.style.border = '1px solid #ccc';
    this.tablePopup.style.padding = '8px';
    this.tablePopup.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
    this.tablePopup.style.zIndex = 100;
    // Tạo lưới chọn bảng
    this.tableGrid = document.createElement('div');
    this.tableGrid.className = 'table-grid';
    this.tableGrid.style.display = 'grid';
    this.tableGrid.style.gridTemplateColumns = 'repeat(8, 20px)';
    this.tableGrid.style.gridGap = '2px';
    this.tableGrid.style.marginBottom = '8px';
    this.tablePopup.appendChild(this.tableGrid);
    // Tạo label kích thước
    // Đường kẻ ngang chia cắt
    const divider = document.createElement('div');
    divider.style.marginLeft = '-8px';
    divider.style.marginRight = '-8px';
    divider.style.height = '1px';
    divider.style.background = '#eee';
    this.tablePopup.appendChild(divider);

    this.tableSizeLabel = document.createElement('div');
    this.tableSizeLabel.className = 'table-size-label';
    this.tableSizeLabel.style.marginTop = '4px';
    this.tableSizeLabel.textContent = '0x0';
    this.tablePopup.appendChild(this.tableSizeLabel);
    // Thêm popup vào wrapper
    this.editor.wrapper.appendChild(this.tablePopup);
    // Tạo lưới 8x8
    const maxRows = 8, maxCols = 8;
    for (let r = 0; r < maxRows; r++) {
      for (let c = 0; c < maxCols; c++) {
        const cell = document.createElement('div');
        cell.className = 'table-cell';
        cell.style.width = '20px';
        cell.style.height = '20px';
        cell.style.border = '1px solid #eee';
        cell.style.background = '#f9f9f9';
        cell.style.cursor = 'pointer';
        cell.dataset.row = r + 1;
        cell.dataset.col = c + 1;
        this.tableGrid.appendChild(cell);
      }
    }
    // Sự kiện chọn kích thước bảng
    let hoverRows = 0, hoverCols = 0;
    this.tableGrid.addEventListener('mousemove', e => {
      if (e.target.classList.contains('table-cell')) {
        hoverRows = Number(e.target.dataset.row);
        hoverCols = Number(e.target.dataset.col);
        Array.from(this.tableGrid.children).forEach(cell => {
          const row = Number(cell.dataset.row), col = Number(cell.dataset.col);
          cell.classList.toggle('selected', row <= hoverRows && col <= hoverCols);
        });
        this.tableSizeLabel.textContent = `${hoverCols}x${hoverRows}`;
      }
    });
    this.tableGrid.addEventListener('mouseleave', () => {
      Array.from(this.tableGrid.children).forEach(cell => cell.classList.remove('selected'));
      this.tableSizeLabel.textContent = `0x0`;
    });
    this.tableGrid.addEventListener('mousedown', e => {
      if (e.target.classList.contains('table-cell')) {
        const rows = Number(e.target.dataset.row);
        const cols = Number(e.target.dataset.col);
        this.insertTable(rows, cols);
        this.tablePopup.style.display = 'none';
      }
    });

    // Ẩn popup khi click ra ngoài
    document.addEventListener('mousedown', e => {
      if (!this.tablePopup.contains(e.target) && e.target !== this.editor.toolbarBtns.table) {
        this.tablePopup.style.display = 'none';
      }
    });

    // Tạo table toolbar
    this.tableToolbar = document.createElement('div');
    this.tableToolbar.className = 'table-toolbar';
    this.tableToolbar.style.display = 'none';
    this.tableToolbar.style.position = 'absolute';
    this.tableToolbar.style.background = '#fff';
    this.tableToolbar.style.borderRadius = '6px';
    this.tableToolbar.style.padding = '8px';
    this.tableToolbar.style.fontSize = '12px';
    this.tableToolbar.style.boxShadow = '0 4px 24px rgba(0,0,0,0.13)';
    this.tableToolbar.style.zIndex = 100;
    this.tableToolbar.style.gap = '12px';
    this.tableToolbar.style.flexWrap = 'nowrap';
    
    // Thêm mũi tên (mặc định hướng xuống)
    if (!this.tableToolbar.arrow) {
      const arrow = document.createElement('div');
      arrow.className = 'table-toolbar-arrow';
      arrow.style.position = 'absolute';
      arrow.style.left = '50%';
      arrow.style.bottom = '-8px';
      arrow.style.transform = 'translateX(-50%)';
      arrow.style.borderLeft = '6px solid transparent';
      arrow.style.borderRight = '6px solid transparent';
      arrow.style.borderTop = '8px solid #fff';
      arrow.style.filter = 'drop-shadow(0px 1px 1px rgba(0,0,0,0.08))';
      this.tableToolbar.appendChild(arrow);
      this.tableToolbar.arrow = arrow;
    }
    
    // Xóa cũ nếu có
    if (this.tableToolbar.parentNode) this.tableToolbar.parentNode.removeChild(this.tableToolbar);
    document.body.appendChild(this.tableToolbar);
    
    this.createTableToolbarButtons();

    this.editor.wrapper.appendChild(this.tableToolbar);
  }

  createTableToolbarButtons() {
    // Xóa tất cả nút cũ (trừ arrow)
    const arrow = this.tableToolbar.arrow;
    this.tableToolbar.innerHTML = '';
    if (arrow) {
      this.tableToolbar.appendChild(arrow);
    }
    const buttons1 = 
    [
      { icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="14" viewBox="0 0 18 14" fill="none">
          <g clip-path="url(#clip0_23_620)">
            <path d="M17.2744 10.9348V2.16365C17.2744 0.994844 16.3413 0.0475311 15.1901 0.0475311H2.35536C1.20413 0.0475311 0.274414 0.991437 0.274414 2.16024V10.9382C0.274414 12.1036 1.20413 13.0509 2.35536 13.0509H15.1935C16.3447 13.0509 17.2744 12.1036 17.2744 10.9382V10.9348ZM2.31844 7.60218H7.66178V10.8803H2.31844V7.60218ZM15.0827 10.8803H9.74273V7.60218H15.0827V10.8803ZM15.0827 5.48947H9.74273V2.21477H15.0827V5.48947ZM2.31844 2.21477H7.66178V5.48947H2.31844V2.21477Z" fill="#454545"/>
          </g>
          <defs>
            <clipPath id="clip0_23_620">
              <rect width="17" height="13" fill="white" transform="translate(0.274414 0.0475311)"/>
            </clipPath>
          </defs>
        </svg>`, title: 'Table profile', cmd: 'tableprofile' 
      },
      { icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="14" viewBox="0 0 18 14" fill="none">
        <path d="M15.3864 0.0123596H2.37934C1.21636 0.0123596 0.274414 0.964798 0.274414 2.1365V10.962C0.274414 12.1337 1.21636 13.0827 2.37934 13.0827H15.3864C16.5528 13.0827 17.4981 12.1337 17.4981 10.9586V2.13993C17.4981 0.964798 16.5528 0.0123596 15.3864 0.0123596ZM15.2776 5.48374H13.2542C13.4209 6.18265 13.4209 6.9124 13.2542 7.60789H15.2776V10.9037H10.1257C9.31642 11.1367 8.45609 11.1367 7.64676 10.9037H2.34534V7.60789H4.51488C4.34825 6.9124 4.34825 6.18265 4.51488 5.48374H2.34534V2.19132H7.66037C8.46289 1.96178 9.31302 1.96178 10.1155 2.19132H15.2776V5.48374Z" fill="#454545"/>
        <path d="M12.2715 5.48376C12.1083 4.9493 11.8158 4.44567 11.3942 4.02084C10.9521 3.57546 10.4284 3.27396 9.86732 3.11294C9.18041 2.9108 8.4425 2.92793 7.75899 3.15748C7.25231 3.32535 6.77624 3.61657 6.37497 4.02084C5.95331 4.44567 5.66086 4.9493 5.49764 5.48376C5.28 6.17239 5.28 6.91927 5.49424 7.6079C5.65746 8.14579 5.95331 8.65284 6.37497 9.07767C6.79664 9.5025 7.25231 9.77316 7.75899 9.94103C8.4425 10.1706 9.18041 10.1877 9.86732 9.98557C10.4284 9.82455 10.9521 9.52306 11.3942 9.07767C11.8362 8.63229 12.1117 8.14579 12.2749 7.6079C12.4891 6.91927 12.4891 6.17239 12.2715 5.48376ZM10.3774 7.59077C10.3774 7.59077 10.3876 7.60105 10.391 7.6079C10.5032 7.73467 10.4964 7.92995 10.3774 8.05329C10.2516 8.18005 10.0441 8.18005 9.91833 8.05329L9.86732 8.0019L8.88457 7.01177L7.8508 8.05329C7.8236 8.0807 7.793 8.10468 7.75899 8.11838C7.63997 8.1732 7.49375 8.15264 7.39173 8.05329C7.27271 7.92995 7.26591 7.73467 7.37813 7.6079C7.38153 7.60105 7.38493 7.59762 7.39173 7.59077L8.42549 6.54926L7.39173 5.50774C7.39173 5.50774 7.37813 5.49404 7.37133 5.48376C7.26591 5.357 7.27271 5.16514 7.39173 5.04523C7.49375 4.94587 7.63997 4.92531 7.75899 4.98013C7.793 4.99384 7.8236 5.01782 7.8508 5.04523L8.88457 6.08674L9.86732 5.09662L9.91833 5.04523C10.0441 4.91846 10.2516 4.91846 10.3774 5.04523C10.4964 5.16514 10.5032 5.357 10.3978 5.48376C10.391 5.49404 10.3842 5.50089 10.3774 5.50774L9.34364 6.54926L10.3774 7.59077Z" fill="#454545"/>
        </svg>`, title: 'Delete table', cmd: 'deleteTable' 
      }
    ];
    const buttontablerow = 
    [
      { icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="16" viewBox="0 0 18 16" fill="none">
        <path d="M15.6134 2.02472H13.216C13.3691 2.47353 13.4541 2.9566 13.4541 3.4568C13.4541 3.71033 13.4337 3.96043 13.3895 4.20368H15.6508V7.49953H10.7847C10.2678 7.71537 9.70328 7.83528 9.10819 7.83528C8.5131 7.83528 7.94861 7.71537 7.43173 7.49953H2.71859V4.20368H4.82692C4.78271 3.96043 4.76231 3.71033 4.76231 3.4568C4.76231 2.9566 4.84732 2.47353 5.00035 2.02472H2.60637C1.43999 2.02472 0.498047 2.97716 0.498047 4.15229V12.9709C0.498047 14.146 1.43999 15.0951 2.60637 15.0951H15.6134C16.7764 15.0951 17.7217 14.146 17.7217 12.9743V4.14886C17.7217 2.97716 16.7764 2.02472 15.6134 2.02472ZM8.12884 12.9161H2.71859V9.62367H8.12884V12.9161ZM15.6508 12.9161H10.2372V9.62367H15.6508V12.9161Z" fill="#454545"/>
        <path d="M12.2335 2.02479C11.6962 0.832527 10.4992 0 9.1118 0C7.72438 0 6.52739 0.832527 5.99011 2.02479C5.78948 2.4599 5.68066 2.94639 5.68066 3.45687C5.68066 3.71383 5.70787 3.96393 5.76228 4.20375C6.02752 5.4337 6.94566 6.41697 8.13245 6.77328C8.44189 6.86578 8.77174 6.91717 9.1118 6.91717C9.50626 6.91717 9.88712 6.84865 10.2408 6.72531C11.3527 6.33474 12.2063 5.38231 12.4613 4.20375C12.5157 3.96393 12.5429 3.71383 12.5429 3.45687C12.5429 2.94639 12.4341 2.4599 12.2335 2.02479ZM10.8393 3.77549H9.42465V5.1973C9.42465 5.37203 9.28522 5.5125 9.1118 5.5125C8.93837 5.5125 8.79895 5.37203 8.79895 5.1973V3.77549H7.38433C7.2109 3.77549 7.07148 3.6316 7.07148 3.45687C7.07148 3.28214 7.2109 3.14168 7.38433 3.14168H8.79895V1.71987C8.79895 1.54514 8.93837 1.40125 9.1118 1.40125C9.28522 1.40125 9.42465 1.54514 9.42465 1.71987V3.14168H10.8393C11.0127 3.14168 11.1521 3.28214 11.1521 3.45687C11.1521 3.6316 11.0127 3.77549 10.8393 3.77549Z" fill="#454545"/>
        </svg>`, title: 'Add row above', cmd: 'addRowAbove' 
      },
      { icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="16" viewBox="0 0 18 16" fill="none">
        <path d="M2.83001 13.0703H5.22738C5.07436 12.6215 4.98935 12.1385 4.98935 11.6383C4.98935 11.3847 5.00975 11.1346 5.05396 10.8914H2.79261V7.59554H7.65876C8.17564 7.3797 8.74013 7.25979 9.33522 7.25979C9.93032 7.25979 10.4948 7.3797 11.0117 7.59554H15.7248V10.8914H13.6165C13.6607 11.1346 13.6811 11.3847 13.6811 11.6383C13.6811 12.1385 13.5961 12.6215 13.4431 13.0703H15.837C17.0034 13.0703 17.9454 12.1179 17.9454 10.9428V2.12416C17.9454 0.949028 17.0034 1.52588e-05 15.837 1.52588e-05H2.83001C1.66703 1.52588e-05 0.72168 0.949028 0.72168 2.12073V10.9462C0.72168 12.1179 1.66703 13.0703 2.83001 13.0703ZM10.3146 2.17898H15.7248V5.4714H10.3146V2.17898ZM2.79261 2.17898H8.20625V5.4714H2.79261V2.17898Z" fill="#454545"/>
        <path d="M6.2135 13.0703C6.75079 14.2625 7.94777 15.095 9.33519 15.095C10.7226 15.095 11.9196 14.2625 12.4569 13.0703C12.6575 12.6351 12.7663 12.1486 12.7663 11.6382C12.7663 11.3812 12.7391 11.1311 12.6847 10.8913C12.4195 9.66135 11.5013 8.67807 10.3145 8.32177C10.0051 8.22926 9.67524 8.17787 9.33519 8.17787C8.94072 8.17787 8.55987 8.24639 8.20621 8.36973C7.09424 8.7603 6.24071 9.71274 5.98567 10.8913C5.93126 11.1311 5.90405 11.3812 5.90405 11.6382C5.90405 12.1486 6.01287 12.6351 6.2135 13.0703ZM7.60772 11.3195H9.02234V9.89774C9.02234 9.72302 9.16176 9.58255 9.33519 9.58255C9.50861 9.58255 9.64803 9.72302 9.64803 9.89774V11.3195H11.0627C11.2361 11.3195 11.3755 11.4634 11.3755 11.6382C11.3755 11.8129 11.2361 11.9534 11.0627 11.9534H9.64803V13.3752C9.64803 13.5499 9.50861 13.6938 9.33519 13.6938C9.16176 13.6938 9.02234 13.5499 9.02234 13.3752V11.9534H7.60772C7.43429 11.9534 7.29487 11.8129 7.29487 11.6382C7.29487 11.4634 7.43429 11.3195 7.60772 11.3195Z" fill="#454545"/>
        </svg>`, title: 'Add row below', cmd: 'addRowBelow' 
      },
      { icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="14" viewBox="0 0 19 14" fill="none">
        <path d="M18.169 2.13993V10.9586C18.169 12.1337 17.2271 13.0827 16.0607 13.0827H3.05365C1.89066 13.0827 0.945312 12.1337 0.945312 10.962V2.1365C0.945312 0.964798 1.89066 0.0123596 3.05365 0.0123596H7.45053C7.10367 0.204218 6.77723 0.450893 6.48478 0.745532C6.06311 1.17036 5.74346 1.66371 5.53263 2.19132H3.01624V5.48374H5.53263C5.74346 6.01135 6.05971 6.50813 6.48478 6.93638C6.74662 7.20019 7.03226 7.42288 7.33831 7.60789H3.01624V10.9037H8.42988V8.0704C9.12019 8.25541 9.8445 8.26911 10.5382 8.10466V10.9037H15.9485V7.60789H11.7794C12.0855 7.42288 12.3711 7.20019 12.6329 6.93638C13.058 6.50813 13.3743 6.01135 13.5851 5.48374H15.9485V2.19132H13.5851C13.3743 1.66371 13.0546 1.17036 12.6329 0.745532C12.3405 0.450893 12.014 0.204218 11.6672 0.0123596H16.0607C17.2271 0.0123596 18.169 0.964798 18.169 2.13993Z" fill="#454545"/>
        <path d="M12.5751 2.19137C12.4221 1.90701 12.2249 1.63635 11.9869 1.39653C10.6436 0.04324 8.4707 0.04324 7.1309 1.39653C6.89286 1.63635 6.69563 1.90701 6.5426 2.19137C5.98832 3.21575 5.98832 4.4594 6.53921 5.48379C6.69223 5.77158 6.88946 6.04223 7.1309 6.28548C8.4707 7.63534 10.6436 7.63534 11.9869 6.28548C12.2283 6.04223 12.4255 5.77158 12.5785 5.48379C13.1294 4.4594 13.1294 3.21575 12.5751 2.19137ZM10.5382 4.3806L11.0007 4.84655C11.1231 4.96988 11.1231 5.16859 11.0007 5.29536C10.8783 5.41869 10.681 5.41869 10.5586 5.29536L9.55887 4.2881L8.55912 5.29536C8.52171 5.33304 8.47751 5.36045 8.4299 5.37073C8.32108 5.40842 8.20207 5.38101 8.11705 5.29536C7.99463 5.16859 7.99463 4.96988 8.11705 4.84655L8.4299 4.53135L9.1134 3.83929L8.11705 2.83546C7.99463 2.71212 7.99463 2.50999 8.11705 2.38665C8.20207 2.301 8.32108 2.27359 8.4299 2.31128C8.47751 2.32156 8.52171 2.34896 8.55912 2.38665L9.55887 3.39391L10.5586 2.38665C10.681 2.26331 10.8783 2.26331 11.0007 2.38665C11.1231 2.50999 11.1231 2.71212 11.0007 2.83546L10.5382 3.3014L10.0009 3.83929L10.5382 4.3806Z" fill="#454545"/>
        </svg>`, title: 'Delete selected row', cmd: 'deleteSelectRow' 
      }    
    ];
    const buttontablecol = 
    [
      { icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="14" viewBox="0 0 19 14" fill="none">
        <path d="M16.4982 0.0123596H3.49115C2.32476 0.0123596 1.38281 0.964798 1.38281 2.1365V2.78402C2.03231 2.39346 2.79063 2.17076 3.60336 2.17076C3.73938 2.17076 3.872 2.17762 4.00462 2.19132H9.0136V5.48717H7.82001C7.90503 5.82977 7.94924 6.18265 7.94924 6.54924C7.94924 6.91583 7.90503 7.27213 7.82001 7.61131H9.0136V10.9037H4.04883C3.9026 10.9209 3.75298 10.9277 3.60336 10.9277C2.79063 10.9277 2.03231 10.705 1.38281 10.3145V10.9586C1.38281 12.1303 2.32476 13.0827 3.49115 13.0827H16.4982C17.6612 13.0827 18.6065 12.1337 18.6065 10.962V2.1365C18.6065 0.964798 17.6612 0.0123596 16.4982 0.0123596ZM16.5356 10.9037H11.1219V7.61131H16.5356V10.9037ZM16.5356 5.48717H11.1219V2.19132H16.5356V5.48717Z" fill="#454545"/>
        <path d="M6.87164 5.48725C6.42617 4.09627 5.13057 3.08902 3.60373 3.08902C2.75699 3.08902 1.98167 3.39736 1.38318 3.91469C0.638465 4.54509 0.169189 5.49067 0.169189 6.54932C0.169189 7.60796 0.638465 8.55012 1.38318 9.18052C1.98167 9.69785 2.75699 10.0062 3.60373 10.0062C5.13057 10.0062 6.42617 8.99894 6.87164 7.61139C6.97706 7.27906 7.03486 6.91933 7.03486 6.54932C7.03486 6.17931 6.97706 5.81957 6.87164 5.48725ZM5.3278 6.86451H3.91658V8.28632C3.91658 8.46105 3.77715 8.60494 3.60373 8.60494C3.4303 8.60494 3.28748 8.46105 3.28748 8.28632V6.86451H1.87626C1.70284 6.86451 1.56341 6.72405 1.56341 6.54932C1.56341 6.37459 1.70284 6.2307 1.87626 6.2307H3.28748V4.80889C3.28748 4.63416 3.4303 4.4937 3.60373 4.4937C3.77715 4.4937 3.91658 4.63416 3.91658 4.80889V6.2307H5.3278C5.50123 6.2307 5.64405 6.37459 5.64405 6.54932C5.64405 6.72405 5.50123 6.86451 5.3278 6.86451Z" fill="#454545"/>
        </svg>`, title: 'Add col right', cmd: 'addColRight' 
      },
      { icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="14" viewBox="0 0 20 14" fill="none">
        <path d="M2.71478 13.0827H15.7218C16.8882 13.0827 17.8301 12.1303 17.8301 10.9586V10.311C17.1806 10.7016 16.4223 10.9243 15.6096 10.9243C15.4736 10.9243 15.3409 10.9174 15.2083 10.9037H10.1993V7.60789H11.3929C11.3079 7.26528 11.2637 6.9124 11.2637 6.54581C11.2637 6.17923 11.3079 5.82292 11.3929 5.48374H10.1993V2.19132H15.1641C15.3103 2.17419 15.46 2.16734 15.6096 2.16734C16.4223 2.16734 17.1806 2.39003 17.8301 2.7806V2.1365C17.8301 0.964798 16.8882 0.0123596 15.7218 0.0123596H2.71478C1.5518 0.0123596 0.606445 0.961372 0.606445 2.13308V10.9586C0.606445 12.1303 1.5518 13.0827 2.71478 13.0827ZM2.67737 2.19132H8.09102V5.48374H2.67737V2.19132ZM2.67737 7.60789H8.09102V10.9037H2.67737V7.60789Z" fill="#454545"/>
        <path d="M12.3419 7.60796C12.7874 8.99894 14.083 10.0062 15.6098 10.0062C16.4566 10.0062 17.2319 9.69785 17.8304 9.18052C18.5751 8.55012 19.0444 7.60454 19.0444 6.54589C19.0444 5.48725 18.5751 4.54509 17.8304 3.91469C17.2319 3.39736 16.4566 3.08902 15.6098 3.08902C14.083 3.08902 12.7874 4.09627 12.3419 5.48382C12.2365 5.81615 12.1787 6.17588 12.1787 6.54589C12.1787 6.9159 12.2365 7.27564 12.3419 7.60796ZM13.8858 6.2307H15.297V4.80889C15.297 4.63416 15.4364 4.49027 15.6098 4.49027C15.7833 4.49027 15.9261 4.63416 15.9261 4.80889V6.2307H17.3373C17.5107 6.2307 17.6502 6.37116 17.6502 6.54589C17.6502 6.72062 17.5107 6.86451 17.3373 6.86451H15.9261V8.28632C15.9261 8.46105 15.7833 8.60152 15.6098 8.60152C15.4364 8.60152 15.297 8.46105 15.297 8.28632V6.86451H13.8858C13.7124 6.86451 13.5695 6.72062 13.5695 6.54589C13.5695 6.37116 13.7124 6.2307 13.8858 6.2307Z" fill="#454545"/>
        </svg>`, title: 'Add col left', cmd: 'addColLeft' 
      }, 
      { icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="14" viewBox="0 0 19 14" fill="none">
        <path d="M16.5185 0.0123596H3.51142C2.34844 0.0123596 1.40649 0.964798 1.40649 2.1365V2.69495C2.18522 2.27012 3.06596 2.10224 3.92289 2.19132H8.89106V5.48374H7.69069C7.86412 6.17923 7.86412 6.9124 7.69069 7.60789H8.89106V10.9037H3.89228C3.04215 10.986 2.17501 10.8181 1.40649 10.3967V10.962C1.40649 12.1337 2.34844 13.0827 3.51142 13.0827H16.5185C17.6848 13.0827 18.6302 12.1303 18.6302 10.9586V2.13993C18.6302 0.964798 17.6848 0.0123596 16.5185 0.0123596ZM16.4096 10.9037H10.9994V7.60789H16.4096V10.9037ZM16.4096 5.48374H10.9994V2.19132H16.4096V5.48374Z" fill="#454545"/>
        <path d="M6.74518 5.48377C6.58195 4.97671 6.30312 4.50049 5.90185 4.09965C5.23195 3.42472 4.35801 3.08554 3.47727 3.08554C2.74616 3.08554 2.01504 3.31851 1.40634 3.78788C1.28052 3.88038 1.16151 3.98659 1.04929 4.09965C-0.290519 5.44951 -0.290519 7.64217 1.04929 8.99203C1.16151 9.10509 1.28052 9.2113 1.40634 9.3038C2.01504 9.77317 2.74616 10.0061 3.47727 10.0061C4.35801 10.0061 5.23195 9.66696 5.90185 8.99203C6.30312 8.59119 6.58195 8.11496 6.74518 7.60791C6.96281 6.91928 6.96281 6.1724 6.74518 5.48377ZM4.9191 7.55309C4.9191 7.55309 4.9497 7.58736 4.9633 7.60791C5.03812 7.72782 5.02451 7.89227 4.9191 7.99848C4.79668 8.12182 4.59605 8.12182 4.47363 7.99848L4.08596 7.60791L3.47727 6.99465L2.47752 7.99848C2.3551 8.12182 2.15787 8.12182 2.03205 7.99848C1.90963 7.87514 1.90963 7.67643 2.03205 7.55309L3.0318 6.54584L2.03205 5.53858C1.90963 5.41525 1.90963 5.21654 2.03205 5.0932C2.15787 4.96986 2.3551 4.96986 2.47752 5.0932L3.47727 6.09703L4.47363 5.0932C4.59605 4.96986 4.79668 4.96986 4.9191 5.0932C5.02451 5.19941 5.03812 5.36386 4.9633 5.48377C4.9497 5.50432 4.9361 5.52145 4.9191 5.53858L3.91934 6.54584L4.9191 7.55309Z" fill="#454545"/>
        </svg>`, title: 'Delete selected col', cmd: 'deleteSelectCol' 
      }
    ];

    const typebuttons1 = document.createElement('div');
    typebuttons1.style.gap = '4px';
    typebuttons1.style.alignItems = 'center';
    typebuttons1.style.display = 'flex';
    buttons1.forEach(btn => {
      const button = this.createTableToolbarButton(btn.cmd, btn.icon, btn.title);
      typebuttons1.appendChild(button);
    });
    this.tableToolbar.appendChild(typebuttons1);

    const typebuttontablerow = document.createElement('div');
    typebuttontablerow.style.gap = '4px';
    typebuttontablerow.style.alignItems = 'center';
    typebuttontablerow.style.display = 'flex';
    buttontablerow.forEach(btn => {
      const button = this.createTableToolbarButton(btn.cmd, btn.icon, btn.title);
      typebuttontablerow.appendChild(button);
    });
    this.tableToolbar.appendChild(typebuttontablerow);
    const typebuttontablecol = document.createElement('div');
    typebuttontablecol.style.gap = '4px';
    typebuttontablecol.style.alignItems = 'center';
    typebuttontablecol.style.display = 'flex';
    buttontablecol.forEach(btn => {
      const button = this.createTableToolbarButton(btn.cmd, btn.icon, btn.title);
      typebuttontablecol.appendChild(button);
    });
    this.tableToolbar.appendChild(typebuttontablecol);
  }

  createTableToolbarButton(cmd, icon, title) {
    const button = document.createElement('button');
    button.innerHTML = icon;
    button.title = title;
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.borderRadius = '4px';
    button.style.setProperty('border', 'none', 'important');
    button.style.background = '#fff';
    button.style.cursor = 'pointer';
    button.onclick = e => {
      e.preventDefault();
      this.handleTableCommand(cmd);
    };
    return button;
  }

  createSplitTableToolbar(buttons, splitIndex) {
    // Tạo toolbar cho phần đầu
    const firstPart = buttons.slice(0, splitIndex);
    const secondPart = buttons.slice(splitIndex);
    
    // Tạo toolbar trên
    this.tableToolbar.style.flexDirection = 'column';
    this.tableToolbar.style.gap = '4px';
    
    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.gap = '4px';
    topRow.style.alignItems = 'center';
    
    const bottomRow = document.createElement('div');
    bottomRow.style.display = 'flex';
    bottomRow.style.gap = '4px';
    bottomRow.style.alignItems = 'center';
    
    // Tạo nút cho hàng trên
    firstPart.forEach(btn => {
      const button = this.createTableToolbarButton(btn.cmd, btn.icon, btn.title);
      topRow.appendChild(button);
    });
    
    // Tạo nút cho hàng dưới
    secondPart.forEach(btn => {
      const button = this.createTableToolbarButton(btn.cmd, btn.icon, btn.title);
      bottomRow.appendChild(button);
    });
    
    this.tableToolbar.appendChild(topRow);
    this.tableToolbar.appendChild(bottomRow);
  }

  showTableToolbar(table) {
    if (!this.tableToolbar || !table) return;
    
    // Lấy thông tin về editor-area
    const editorArea = this.editor;
    const editorRect = editorArea.editor.getBoundingClientRect();
    const tableRect = table.getBoundingClientRect();
    
    // Reset toolbar style về mặc định
    this.tableToolbar.style.flexDirection = 'row';
    this.tableToolbar.style.gap = '4px';
    
    // Tạo lại nút toolbar bình thường
    this.createTableToolbarButtons();
    // const editorArea = this.editor;
    //   const editorRect = editorArea.getBoundingClientRect();
    
    // Tính toán kích thước toolbar
    this.tableToolbar.style.display = 'flex';
    this.tableToolbar.style.opacity = '0';
    this.tableToolbar.style.visibility = 'hidden';
    const toolbarRect = this.tableToolbar.getBoundingClientRect();
    const toolbarWidth = toolbarRect.width;
    const toolbarHeight = toolbarRect.height;
    this.tableToolbar.style.visibility = 'visible';

    
    // Tính toán vị trí mặc định (phía trên, căn giữa bảng)
    let left = (tableRect.left - editorRect.left) + (tableRect.width)/2 - toolbarWidth/2;
    let top = tableRect.top - toolbarHeight - 55;
    let arrowLeft = '50%';
    let arrowDirection = 'down'; // mũi tên hướng xuống

    //Trường hợp 1: Vượt quá lề trái
    if (toolbarRect.left < editorRect.left) {
      
      left = editorRect.left + 10; // Đặt toolbar bên trong editor-area
      arrowLeft = '10%'; // Mũi tên ở 10%
    }

    // Trường hợp 2: Vượt quá lề phải  
    if (editorRect.left + left + toolbarWidth > editorRect.right) {
      
      left = editorRect.right - toolbarWidth - editorRect.left - 20; // Đặt toolbar bên trong editor-area
      arrowLeft = '90%'; // Mũi tên ở 90%
    }

    // Trường hợp 3: Vượt quá lề trên
    if (top < editorRect.top + window.scrollY) {
      
      top = tableRect.bottom - 16; // Hiển thị phía dưới
      arrowDirection = 'up'; // Mũi tên hướng lên
    }
    
    // Trường hợp 4: Toolbar quá rộng so với editor-area
    if (toolbarWidth > editorRect.width - 20) {
      // Chia làm 2 hàng
      const buttons = [
        { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="14" viewBox="0 0 18 14" fill="none">
  <g clip-path="url(#clip0_23_620)">
    <path d="M17.2744 10.9348V2.16365C17.2744 0.994844 16.3413 0.0475311 15.1901 0.0475311H2.35536C1.20413 0.0475311 0.274414 0.991437 0.274414 2.16024V10.9382C0.274414 12.1036 1.20413 13.0509 2.35536 13.0509H15.1935C16.3447 13.0509 17.2744 12.1036 17.2744 10.9382V10.9348ZM2.31844 7.60218H7.66178V10.8803H2.31844V7.60218ZM15.0827 10.8803H9.74273V7.60218H15.0827V10.8803ZM15.0827 5.48947H9.74273V2.21477H15.0827V5.48947ZM2.31844 2.21477H7.66178V5.48947H2.31844V2.21477Z" fill="#454545"/>
  </g>
  <defs>
    <clipPath id="clip0_23_620">
      <rect width="17" height="13" fill="white" transform="translate(0.274414 0.0475311)"/>
    </clipPath>
  </defs>
</svg>`, title: 'Thêm dòng trên', cmd: 'addRowAbove' },
        { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="14" viewBox="0 0 18 14" fill="none">
  <g clip-path="url(#clip0_23_631)">
    <path d="M17.2744 10.9348V2.16365C17.2744 0.994844 16.3413 0.0475311 15.1901 0.0475311H2.35536C1.20413 0.0475311 0.274414 0.991437 0.274414 2.16024V10.9382C0.274414 12.1036 1.20413 13.0509 2.35536 13.0509H15.1935C16.3447 13.0509 17.2744 12.1036 17.2744 10.9382V10.9348ZM2.31844 7.60218H7.66178V10.8803H2.31844V7.60218ZM15.0827 10.8803H9.74273V7.60218H15.0827V10.8803ZM15.0827 5.48947H9.74273V2.21477H15.0827V5.48947ZM2.31844 2.21477H7.66178V5.48947H2.31844V2.21477Z" fill="#454545"/>
  </g>
  <defs>
    <clipPath id="clip0_23_631">
      <rect width="17" height="13" fill="white" transform="translate(0.274414 0.0475311)"/>
    </clipPath>
  </defs>
</svg>`, title: 'Thêm dòng dưới', cmd: 'addRowBelow' },
        { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="14" viewBox="0 0 18 14" fill="none">
  <g clip-path="url(#clip0_23_642)">
    <path d="M10.9348 0.274414H2.16365C0.994844 0.274414 0.0475311 1.20756 0.0475311 2.35879H13.0509C13.0509 1.20756 12.1036 0.274414 10.9382 0.274414H10.9348ZM7.60218 15.0827V9.74273H10.8803V15.0827H7.60218ZM10.8803 2.31844V7.66178H7.60218V2.31844H10.8803ZM5.48947 2.31844V7.66178H2.21477V2.31844H5.48947ZM2.21477 9.74273H5.48947V15.0827H2.21477V9.74273Z" fill="#454545"/>
  </g>
  <defs>
    <clipPath id="clip0_23_642">
      <rect width="17" height="13" fill="white" transform="translate(0.0475311 0.274414)"/>
    </clipPath>
  </defs>
</svg>`, title: 'Thêm cột trái', cmd: 'addColLeft' },
        { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="14" viewBox="0 0 18 14" fill="none">
  <g clip-path="url(#clip0_23_653)">
    <path d="M10.9348 0.274414H2.16365C0.994844 0.274414 0.0475311 1.20756 0.0475311 2.35879H13.0509C13.0509 1.20756 12.1036 0.274414 10.9382 0.274414H10.9348ZM7.60218 15.0827V9.74273H10.8803V15.0827H7.60218ZM10.8803 2.31844V7.66178H7.60218V2.31844H10.8803ZM5.48947 2.31844V7.66178H2.21477V2.31844H5.48947ZM2.21477 9.74273H5.48947V15.0827H2.21477V9.74273Z" fill="#454545"/>
  </g>
  <defs>
    <clipPath id="clip0_23_653">
      <rect width="17" height="13" fill="white" transform="translate(0.0475311 0.274414)"/>
    </clipPath>
  </defs>
</svg>`, title: 'Thêm cột phải', cmd: 'addColRight' },
        { icon: '<i class="fas fa-minus"></i>', title: 'Xóa dòng', cmd: 'deleteRow' },
        { icon: '<i class="fas fa-minus"></i>', title: 'Xóa cột', cmd: 'deleteCol' },
        { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="14" viewBox="0 0 19 14" fill="none">
  <path d="M16.5185 0.0123596H3.51142C2.34844 0.0123596 1.40649 0.964798 1.40649 2.1365V2.69495C2.18522 2.27012 3.06596 2.10224 3.92289 2.19132H8.89106V5.48374H7.69069C7.86412 6.17923 7.86412 6.9124 7.69069 7.60789H8.89106V10.9037H3.89228C3.04215 10.986 2.17501 10.8181 1.40649 10.3967V10.962C1.40649 12.1337 2.34844 13.0827 3.51142 13.0827H16.5185C17.6848 13.0827 18.6302 12.1303 18.6302 10.9586V2.13993C18.6302 0.964798 17.6848 0.0123596 16.5185 0.0123596ZM16.4096 10.9037H10.9994V7.60789H16.4096V10.9037ZM16.4096 5.48374H10.9994V2.19132H16.4096V5.48374Z" fill="#454545"/>
  <path d="M6.74518 5.48377C6.58195 4.97671 6.30312 4.50049 5.90185 4.09965C5.23195 3.42472 4.35801 3.08554 3.47727 3.08554C2.74616 3.08554 2.01504 3.31851 1.40634 3.78788C1.28052 3.88038 1.16151 3.98659 1.04929 4.09965C-0.290519 5.44951 -0.290519 7.64217 1.04929 8.99203C1.16151 9.10509 1.28052 9.2113 1.40634 9.3038C2.01504 9.77317 2.74616 10.0061 3.47727 10.0061C4.35801 10.0061 5.23195 9.66696 5.90185 8.99203C6.30312 8.59119 6.58195 8.11496 6.74518 7.60791C6.96281 6.91928 6.96281 6.1724 6.74518 5.48377ZM4.9191 7.55309C4.9191 7.55309 4.9497 7.58736 4.9633 7.60791C5.03812 7.72782 5.02451 7.89227 4.9191 7.99848C4.79668 8.12182 4.59605 8.12182 4.47363 7.99848L4.08596 7.60791L3.47727 6.99465L2.47752 7.99848C2.3551 8.12182 2.15787 8.12182 2.03205 7.99848C1.90963 7.87514 1.90963 7.67643 2.03205 7.55309L3.0318 6.54584L2.03205 5.53858C1.90963 5.41525 1.90963 5.21654 2.03205 5.0932C2.15787 4.96986 2.3551 4.96986 2.47752 5.0932L3.47727 6.09703L4.47363 5.0932C4.59605 4.96986 4.79668 4.96986 4.9191 5.0932C5.02451 5.19941 5.03812 5.36386 4.9633 5.48377C4.9497 5.50432 4.9361 5.52145 4.9191 5.53858L3.91934 6.54584L4.9191 7.55309Z" fill="#454545"/>
</svg>`, title: 'Merge cells', cmd: 'mergeCells' },
        { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="14" viewBox="0 0 19 14" fill="none">
  <path d="M16.5185 0.0123596H3.51142C2.34844 0.0123596 1.40649 0.964798 1.40649 2.1365V2.69495C2.18522 2.27012 3.06596 2.10224 3.92289 2.19132H8.89106V5.48374H7.69069C7.86412 6.17923 7.86412 6.9124 7.69069 7.60789H8.89106V10.9037H3.89228C3.04215 10.986 2.17501 10.8181 1.40649 10.3967V10.962C1.40649 12.1337 2.34844 13.0827 3.51142 13.0827H16.5185C17.6848 13.0827 18.6302 12.1303 18.6302 10.9586V2.13993C18.6302 0.964798 17.6848 0.0123596 16.5185 0.0123596ZM16.4096 10.9037H10.9994V7.60789H16.4096V10.9037ZM16.4096 5.48374H10.9994V2.19132H16.4096V5.48374Z" fill="#454545"/>
  <path d="M6.74518 5.48377C6.58195 4.97671 6.30312 4.50049 5.90185 4.09965C5.23195 3.42472 4.35801 3.08554 3.47727 3.08554C2.74616 3.08554 2.01504 3.31851 1.40634 3.78788C1.28052 3.88038 1.16151 3.98659 1.04929 4.09965C-0.290519 5.44951 -0.290519 7.64217 1.04929 8.99203C1.16151 9.10509 1.28052 9.2113 1.40634 9.3038C2.01504 9.77317 2.74616 10.0061 3.47727 10.0061C4.35801 10.0061 5.23195 9.66696 5.90185 8.99203C6.30312 8.59119 6.58195 8.11496 6.74518 7.60791C6.96281 6.91928 6.96281 6.1724 6.74518 5.48377ZM4.9191 7.55309C4.9191 7.55309 4.9497 7.58736 4.9633 7.60791C5.03812 7.72782 5.02451 7.89227 4.9191 7.99848C4.79668 8.12182 4.59605 8.12182 4.47363 7.99848L4.08596 7.60791L3.47727 6.99465L2.47752 7.99848C2.3551 8.12182 2.15787 8.12182 2.03205 7.99848C1.90963 7.87514 1.90963 7.67643 2.03205 7.55309L3.0318 6.54584L2.03205 5.53858C1.90963 5.41525 1.90963 5.21654 2.03205 5.0932C2.15787 4.96986 2.3551 4.96986 2.47752 5.0932L3.47727 6.09703L4.47363 5.0932C4.59605 4.96986 4.79668 4.96986 4.9191 5.0932C5.02451 5.19941 5.03812 5.36386 4.9633 5.48377C4.9497 5.50432 4.9361 5.52145 4.9191 5.53858L3.91934 6.54584L4.9191 7.55309Z" fill="#454545"/>
</svg>`, title: 'Split cells', cmd: 'splitCells' },
        { icon: '<i class="fas fa-times"></i>', title: 'Xóa bảng', cmd: 'deleteTable' }
      ];
      
      const splitIndex = Math.ceil(buttons.length / 2);
      
      // Xóa nội dung cũ
      const arrow = this.tableToolbar.arrow;
      this.tableToolbar.innerHTML = '';
      if (arrow) {
        this.tableToolbar.appendChild(arrow);
      }
      
      this.createSplitTableToolbar(buttons, splitIndex);
      
      // Tính lại kích thước sau khi chia
      const newToolbarRect = this.tableToolbar.getBoundingClientRect();
      const newToolbarHeight = newToolbarRect.height;
      
      // Cập nhật vị trí với chiều cao mới
      if (arrowDirection === 'down') {
        top = tableRect.top + window.scrollY - newToolbarHeight - 10;
      } else {
        top = tableRect.bottom + window.scrollY + 10;
      }
      
      // Đảm bảo toolbar nằm trong editor-area
      left = Math.max(editorRect.left + 10, Math.min(left, editorRect.right - newToolbarRect.width - 10));
    }
    window.addEventListener('scroll', () => this.positionTableHandles(this.selectedTable, this.tableHandles));

    // Cập nhật vị trí mũi tên
    if (this.tableToolbar.arrow) {
      this.tableToolbar.arrow.style.left = arrowLeft;
      
      if (arrowDirection === 'up') {
        // Mũi tên hướng lên
        this.tableToolbar.arrow.style.bottom = 'auto';
        this.tableToolbar.arrow.style.top = '-8px';
        this.tableToolbar.arrow.style.filter = 'none';
        this.tableToolbar.arrow.style.borderTop = 'none';
        this.tableToolbar.arrow.style.borderBottom = '8px solid #fff';
        this.tableToolbar.arrow.style.borderLeft = '6px solid transparent';
        this.tableToolbar.arrow.style.borderRight = '6px solid transparent';
      } else {
        // Mũi tên hướng xuống (mặc định)
        this.tableToolbar.arrow.style.top = 'auto';
        this.tableToolbar.arrow.style.bottom = '-8px';
        this.tableToolbar.arrow.style.borderBottom = 'none';
        this.tableToolbar.arrow.style.borderTop = '8px solid #fff';
        this.tableToolbar.arrow.style.borderLeft = '6px solid transparent';
        this.tableToolbar.arrow.style.borderRight = '6px solid transparent';
      }
    }
    
    // Áp dụng vị trí cuối cùng
    this.tableToolbar.style.left = left + 'px';
    this.tableToolbar.style.top = top + 'px';
    this.tableToolbar.style.opacity = '1';
  }

  hideTableToolbar() {
    if (this.tableToolbar) {
      this.tableToolbar.style.display = 'none';
      this.tableToolbar.style.opacity = '0';
    }
  }

  insertTable(rows, cols) {
    let html = '<table style="border-collapse:collapse;width:100%;">';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        html += '<td style="border:1px solid #ccc;min-width:40px;height:28px;">&nbsp;</td>';
      }
      html += '</tr>';
    }
    html += '</table><br>';
    this.editor.editor.focus();
    document.execCommand('insertHTML', false, html);
  }

  handleTableCommand(cmd) {
    if (!this.selectedTable) return;

    switch(cmd) {
      case 'addRowAbove':
        this.addTableRow('above');
        break;
      case 'addRowBelow':
        this.addTableRow('below');
        break;
      case 'addColLeft':
        this.addTableColumn('left');
        break;
      case 'addColRight':
        this.addTableColumn('right');
        break;
      case 'deleteSelectRow':
        this.deleteTableRow();
        break;
      case 'deleteSelectCol':
        this.deleteTableColumn();
        break;
      case 'tableprofile':
        this.tableprofile();
        break;
      case 'deleteTable':
        this.deleteTable();
        break;
    }
  }

  addTableRow(position) {
    if (!this.selectedCell) return;
    const row = this.selectedCell.parentElement;
    const newRow = row.cloneNode(true);
    newRow.querySelectorAll('td,th').forEach(cell => cell.innerHTML = '&nbsp;');
    if (position === 'above') {
      row.parentElement.insertBefore(newRow, row);
    } else {
      row.parentElement.insertBefore(newRow, row.nextSibling);
    }
  }

  tableprofile(){
    console.log('tableprofile');
  }

  addTableColumn(position) {
    if (!this.selectedCell) return;
    const cellIndex = this.selectedCell.cellIndex;
    Array.from(this.selectedTable.rows).forEach(row => {
      const newCell = row.insertCell(position === 'left' ? cellIndex : cellIndex + 1);
      newCell.innerHTML = '&nbsp;';
    });
  }

  deleteTableRow() {
    if (!this.selectedCell) return;
    const row = this.selectedCell.parentElement;
    if (row.parentElement.rows.length > 1) {
      row.remove();
    }
  }

  deleteTableColumn() {
    if (!this.selectedCell) return;
    const cellIndex = this.selectedCell.cellIndex;
    if (this.selectedTable.rows[0].cells.length > 1) {
      Array.from(this.selectedTable.rows).forEach(row => {
        row.deleteCell(cellIndex);
      });
    }
  }

  mergeTableCells() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const startCell = range.startContainer.closest('td,th');
    const endCell = range.endContainer.closest('td,th');

    if (!startCell || !endCell || startCell === endCell) return;

    // Tính toán vị trí
    const startRow = startCell.parentElement.rowIndex;
    const endRow = endCell.parentElement.rowIndex;
    const startCol = startCell.cellIndex;
    const endCol = endCell.cellIndex;

    // Đảm bảo start luôn nhỏ hơn end
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    // Merge cells
    const rowspan = maxRow - minRow + 1;
    const colspan = maxCol - minCol + 1;

    // Lấy nội dung từ tất cả cells
    let content = '';
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const cell = this.selectedTable.rows[r].cells[c];
        if (cell) {
          content += cell.innerHTML;
        }
      }
    }

    // Xóa các cells cũ
    for (let r = maxRow; r >= minRow; r--) {
      for (let c = maxCol; c >= minCol; c--) {
        if (r === minRow && c === minCol) continue;
        const cell = this.selectedTable.rows[r].cells[c];
        if (cell) cell.remove();
      }
    }

    // Cập nhật cell đầu tiên
    const firstCell = this.selectedTable.rows[minRow].cells[minCol];
    firstCell.rowSpan = rowspan;
    firstCell.colSpan = colspan;
    firstCell.innerHTML = content;
  }

  splitTableCells() {
    if (!this.selectedCell) return;
    const rowspan = this.selectedCell.rowSpan || 1;
    const colspan = this.selectedCell.colSpan || 1;

    if (rowspan === 1 && colspan === 1) return;

    const row = this.selectedCell.parentElement;
    const cellIndex = this.selectedCell.cellIndex;
    const content = this.selectedCell.innerHTML;

    // Xóa cell cũ
    this.selectedCell.remove();

    // Tạo các cells mới
    for (let r = 0; r < rowspan; r++) {
      for (let c = 0; c < colspan; c++) {
        const newCell = document.createElement(this.selectedCell.tagName);
        newCell.innerHTML = r === 0 && c === 0 ? content : '&nbsp;';
        if (r === 0) {
          row.insertBefore(newCell, row.cells[cellIndex + c] || null);
        } else {
          const newRow = row.cloneNode(true);
          newRow.innerHTML = '';
          newRow.appendChild(newCell);
          row.parentElement.insertBefore(newRow, row.nextSibling);
        }
      }
    }
  }

  deleteTable() {
    if (this.selectedTable) {
      this.selectedTable.remove();
      this.tableToolbar.style.display = 'none';
      this.selectedTable = null;
      this.selectedCell = null;
    }
  }

  addTableResizeHandles(table) {
    this.removeTableResizeHandles();

    // Đảm bảo container của bảng có position: relative
    const container = table.parentElement;
    container.style.position = 'relative';

    const handles = ['tl', 'tr', 'bl', 'br'].map(pos => {
      const div = document.createElement('div');
      div.className = 'table-resize-handle ' + pos;
      div.style.position = 'absolute'; // <<== dùng absolute!
      container.appendChild(div);      // <<== gắn vào container, không phải body
      return div;
    });

    this.positionTableHandles(table, handles);

    // Sự kiện scroll, resize
    window.addEventListener('scroll', () => this.positionTableHandles(table, handles));
    window.addEventListener('resize', () => this.positionTableHandles(table, handles));

    // Resize logic
    let resizing = false, startX, startY, startW, startH, which;
    handles.forEach((handle, idx) => {
      handle.addEventListener('mousedown', e => {
        e.preventDefault();
        resizing = true;
        which = idx;
        startX = e.clientX;
        startY = e.clientY;
        startW = table.offsetWidth;
        startH = table.offsetHeight;
        document.body.style.userSelect = 'none';
      });
    });

    const onMove = e => {
      if (!resizing) return;
      let dx = e.clientX - startX;
      let dy = e.clientY - startY;
      let newW = startW, newH = startH;
      if (which === 3) { // br
        newW = startW + dx;
        newH = startH + dy;
      } else if (which === 2) { // bl
        newW = startW - dx;
        newH = startH + dy;
      } else if (which === 1) { // tr
        newW = startW + dx;
        newH = startH - dy;
      } else if (which === 0) { // tl
        newW = startW - dx;
        newH = startH - dy;
      }
      if (newW > 60) table.style.width = newW + 'px';
      if (newH > 40) table.style.height = newH + 'px';
      this.positionTableHandles(table, handles);
    };

    const onUp = () => {
      if (resizing) {
        resizing = false;
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);

    // Lưu lại để xóa khi cần
    table._resizeHandles = handles;
    table._resizePositionHandles = () => this.positionTableHandles(table, handles);
  }

  positionTableHandles(table, handles) {
    const tableRect = table.getBoundingClientRect();
    const containerRect = table.parentElement.getBoundingClientRect();

    const offsetTop = tableRect.top - containerRect.top;
    const offsetLeft = tableRect.left - containerRect.left;

    handles[0].style.top = (offsetTop - 7) + 'px'; // tl
    handles[0].style.left = (offsetLeft - 7) + 'px';

    handles[1].style.top = (offsetTop - 7) + 'px'; // tr
    handles[1].style.left = (offsetLeft + table.offsetWidth - 7) + 'px';

    handles[2].style.top = (offsetTop + table.offsetHeight - 7) + 'px'; // bl
    handles[2].style.left = (offsetLeft - 7) + 'px';

    handles[3].style.top = (offsetTop + table.offsetHeight - 7) + 'px'; // br
    handles[3].style.left = (offsetLeft + table.offsetWidth - 7) + 'px';
  }

  removeTableResizeHandles() {
    document.querySelectorAll('.table-resize-handle').forEach(h => h.remove());
  }
} 