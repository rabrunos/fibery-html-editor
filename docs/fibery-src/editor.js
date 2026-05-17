import {createEmptyPage, loadPage, loadPages, savePage, deletePage, validatePageData, checkIsAdmin} from './page-api.js';

let editor;
let pageData = createEmptyPage();
let pageSelectValue = '';
let isViewMode = false;
let isAdmin = false;

// Modal state
let modalSkip = 0;
const MODAL_LIMIT = 20;
let modalSearch = '';
let modalSearchDebounce;

document.addEventListener('DOMContentLoaded', async () => {
    isAdmin = await checkIsAdmin();

    if (!isAdmin) {
        document.getElementById('pageSelectBtn').style.display = 'none';
        document.getElementById('saveBtn').style.display = 'none';
        document.getElementById('deleteBtn').style.display = 'none';
        document.getElementById('pageHeaderTitle').readOnly = true;
        document.getElementById('pageDescription').readOnly = true;
    }

    require.config({paths: {vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'}});
    require(['vs/editor/editor.main'], async () => {
        editor = monaco.editor.create(document.getElementById('editor'), {
            value: '',
            language: 'html',
            theme: 'vs',
            automaticLayout: true,
            minimap: {enabled: true},
            fontSize: 14,
            wordWrap: 'on',
        });
        editor.onDidChangeModelContent(() => {
            pageData.html = editor.getValue();
        });

        if (!isAdmin) {
            editor.updateOptions({readOnly: true});
        }

        const urlParams = new URLSearchParams(window.location.search);
        const pageId = urlParams.get('id');
        if (pageId) {
            pageSelectValue = pageId;
            await onPageSelectChange(pageId);
        }

        updateDeleteButtonState();
    });

    document.getElementById('pageHeaderTitle').addEventListener('input', (e) => {
        pageData.title = e.target.value;
    });

    document.getElementById('pageDescription').addEventListener('input', (e) => {
        pageData.description = e.target.value;
    });

    document.getElementById('saveBtn').addEventListener('click', async () => {

        const validation = validatePageData(pageData);
        if (!validation.valid) {
            showNotification('Validation errors:\n' + validation.errors.join('\n'), 'error');
            return;
        }

        try {
            const result = await savePage(pageData);
            pageData = result.data;
            document.getElementById('pageHeaderTitle').value = pageData.title || '';
            document.getElementById('pageDescription').value = pageData.description || '';
            pageSelectValue = pageData.id;
            updateURLParameter(pageData.id);
            updateDeleteButtonState();
            showNotification(`Page ${result.action}d successfully!`, 'success');
        } catch (error) {
            showNotification('Error saving page: ' + error.message, 'error');
        }
    });

    document.getElementById('deleteBtn').addEventListener('click', async () => {
        if (!pageData.id) {
            showNotification('Cannot delete unsaved page', 'error');
            return;
        }

        const pageName = pageData.title || 'this page';
        if (!confirm(`Are you sure you want to delete "${pageName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await deletePage(pageData.id);
            showNotification('Page deleted successfully!', 'success');
            resetToNewPage();
        } catch (error) {
            showNotification('Error deleting page: ' + error.message, 'error');
        }
    });

    document.getElementById('viewBtn').addEventListener('click', () => setViewMode(!isViewMode));

    // Modal controls
    document.getElementById('pageSelectBtn').addEventListener('click', openPageModal);
    document.getElementById('pageSelectModalClose').addEventListener('click', closePageModal);
    document.getElementById('pageSelectModalOverlay').addEventListener('click', closePageModal);
    document.getElementById('pageModalNewBtn').addEventListener('click', () => {
        closePageModal();
        resetToNewPage();
        updateURLParameter('new');
    });

    document.getElementById('pageModalSearch').addEventListener('input', (e) => {
        clearTimeout(modalSearchDebounce);
        modalSearch = e.target.value;
        modalSkip = 0;
        modalSearchDebounce = setTimeout(() => loadModalPage(), 300);
    });

});

async function openPageModal() {
    modalSkip = 0;
    modalSearch = '';
    document.getElementById('pageModalSearch').value = '';
    document.getElementById('pageSelectModal').style.display = 'flex';
    await loadModalPage();
}

function closePageModal() {
    document.getElementById('pageSelectModal').style.display = 'none';
}

async function loadModalPage() {
    const tbody = document.getElementById('pageModalTableBody');
    tbody.innerHTML = `<tr><td colspan="3" style="padding:32px 16px;text-align:center;color:#9ca3af;">Loading...</td></tr>`;

    try {
        const pages = await loadPages({skip: modalSkip, limit: MODAL_LIMIT + 1, search: modalSearch});
        const hasNext = pages.length > MODAL_LIMIT;
        renderModalTable(hasNext ? pages.slice(0, MODAL_LIMIT) : pages);
        renderModalPaging(hasNext);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="3" style="padding:32px 16px;text-align:center;color:#ef4444;">Error loading pages</td></tr>`;
    }
}

function renderModalTable(pages) {
    const tbody = document.getElementById('pageModalTableBody');
    if (pages.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="padding:32px 16px;text-align:center;color:#9ca3af;">No pages found</td></tr>`;
        return;
    }
    tbody.innerHTML = '';
    pages.forEach((page) => {
        const tr = document.createElement('tr');
        tr.style.cssText = `border-bottom:1px solid #f3f4f6;${page.id === pageSelectValue ? 'background:#eff6ff;' : ''}`;
        tr.onmouseover = () => { if (page.id !== pageSelectValue) tr.style.background = '#f9fafb'; };
        tr.onmouseout = () => { tr.style.background = page.id === pageSelectValue ? '#eff6ff' : ''; };

        const titleTd = document.createElement('td');
        titleTd.style.cssText = 'padding:10px 16px;';
        const titleLink = document.createElement('a');
        titleLink.href = '#';
        titleLink.textContent = page.title;
        titleLink.style.cssText = 'color:#2563eb;font-weight:500;text-decoration:none;';
        titleLink.onmouseover = () => { titleLink.style.textDecoration = 'underline'; };
        titleLink.onmouseout = () => { titleLink.style.textDecoration = 'none'; };
        titleLink.addEventListener('click', (e) => {
            e.preventDefault();
            selectPageFromModal(page.id);
        });
        titleTd.appendChild(titleLink);

        const descTd = document.createElement('td');
        descTd.style.cssText = 'padding:10px 16px;color:#6b7280;font-size:13px;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        descTd.textContent = page.description || '';

        const viewTd = document.createElement('td');
        viewTd.style.cssText = 'padding:10px 16px;';
        const viewLink = document.createElement('a');
        viewLink.href = `/api/ai-answer/pages/${page.id}/view`;
        viewLink.target = '_blank';
        viewLink.textContent = 'View';
        viewLink.style.cssText = 'color:#2563eb;font-size:13px;text-decoration:none;';
        viewLink.onmouseover = () => { viewLink.style.textDecoration = 'underline'; };
        viewLink.onmouseout = () => { viewLink.style.textDecoration = 'none'; };
        viewTd.appendChild(viewLink);

        tr.appendChild(titleTd);
        tr.appendChild(descTd);
        tr.appendChild(viewTd);
        tbody.appendChild(tr);
    });
}

function renderModalPaging(hasNext) {
    const hasPrev = modalSkip > 0;
    const from = modalSkip + 1;
    const to = modalSkip + MODAL_LIMIT;
    const paging = document.getElementById('pageModalPaging');

    const btnStyle = (enabled) =>
        `padding:6px 14px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;cursor:${enabled ? 'pointer' : 'default'};background:white;color:${enabled ? '#374151' : '#d1d5db'};`;

    paging.innerHTML = '';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Prev';
    prevBtn.disabled = !hasPrev;
    prevBtn.style.cssText = btnStyle(hasPrev);
    prevBtn.addEventListener('click', () => {
        modalSkip = Math.max(0, modalSkip - MODAL_LIMIT);
        loadModalPage();
    });

    const info = document.createElement('span');
    info.textContent = `${from}–${to}`;

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = !hasNext;
    nextBtn.style.cssText = btnStyle(hasNext);
    nextBtn.addEventListener('click', () => {
        modalSkip += MODAL_LIMIT;
        loadModalPage();
    });

    paging.appendChild(prevBtn);
    paging.appendChild(info);
    paging.appendChild(nextBtn);
}

async function selectPageFromModal(id) {
    pageSelectValue = id;
    closePageModal();
    setViewMode(false);
    await onPageSelectChange(id);
}

function resetToNewPage() {
    pageData = createEmptyPage();
    pageSelectValue = '';
    document.getElementById('pageSelectBtn').textContent = 'Select Page...';
    document.getElementById('pageHeaderTitle').value = '';
    document.getElementById('pageDescription').value = '';
    if (editor) editor.setValue('');
    setViewMode(false);
    updateURLParameter(null);
    updateDeleteButtonState();
}

async function onPageSelectChange(selectedValue) {
    if (!selectedValue) {
        updateDeleteButtonState();
        return;
    }

    try {
        pageData = await loadPage(selectedValue);
        document.getElementById('pageHeaderTitle').value = pageData.title || '';
        document.getElementById('pageDescription').value = pageData.description || '';
        if (editor) editor.setValue(pageData.html || '');
        updateURLParameter(selectedValue);
        updateDeleteButtonState();
        if (!isAdmin) setViewMode(true);
    } catch (error) {
        showNotification('Error loading page: ' + error.message, 'error');
    }
}

function updateURLParameter(pageId) {
    const url = new URL(window.location);
    if (pageId && pageId !== 'new') {
        url.searchParams.set('id', pageId);
    } else {
        url.searchParams.delete('id');
    }
    window.history.replaceState({}, '', url);
}

function updateDeleteButtonState() {
    const hasPage = !!pageData.id;
    document.getElementById('deleteBtn').disabled = !hasPage;
    document.getElementById('viewBtn').disabled = !hasPage;
}

function setViewMode(enabled) {
    isViewMode = enabled;
    document.getElementById('editorArea').style.display = enabled ? 'none' : 'flex';
    const frame = document.getElementById('viewFrame');
    frame.style.display = enabled ? 'flex' : 'none';
    if (enabled) {
        frame.src = `/api/ai-answer/pages/${pageData.id}/view`;
    } else {
        frame.src = '';
    }
    document.getElementById('viewBtn').textContent = enabled ? 'Back to Edit' : 'View';
    if (isAdmin) {
        document.getElementById('pageSelectBtn').style.display = enabled ? 'none' : '';
        document.getElementById('saveBtn').style.display = enabled ? 'none' : '';
        document.getElementById('deleteBtn').style.display = enabled ? 'none' : '';
    }
}


function showNotification(message, type = 'info') {
    const colors = {success: '#16a34a', error: '#dc2626', info: '#2563eb'};
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 1rem; left: 50%; transform: translateX(-50%);
        z-index: 9999; padding: 1rem 1.5rem; border-radius: 0.5rem;
        background-color: ${colors[type] || colors.info}; color: white;
        font-size: 0.875rem; font-weight: 500; max-width: 28rem;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); white-space: pre-line;
        transition: all 0.3s ease; opacity: 1;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(-150%)';
        notification.style.opacity = '0';
    }, 3000);
    setTimeout(() => notification.parentNode && document.body.removeChild(notification), 3500);
}
