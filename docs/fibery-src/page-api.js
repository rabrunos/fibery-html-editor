export const createEmptyPage = () => ({
    id: '',
    title: '',
    description: '',
    html: '',
});

export const checkIsAdmin = async () => {
    const response = await fetch('/api/ai-answer/pages/is-admin');
    if (!response.ok) return false;
    const {isAdmin} = await response.json();
    return isAdmin;
};

export const loadPages = async ({skip, limit, search} = {}) => {
    const params = new URLSearchParams();
    if (skip !== undefined) params.set('skip', skip);
    if (limit !== undefined) params.set('limit', limit);
    if (search) params.set('search', search);
    const query = params.toString();
    const response = await fetch(`/api/ai-answer/pages/${query ? `?${query}` : ''}`);
    if (!response.ok) {
        throw new Error('Failed to load pages');
    }
    return await response.json();
};

export const loadPage = async (pageId) => {
    const response = await fetch(`/api/ai-answer/pages/${pageId}`);
    if (!response.ok) {
        throw new Error('Failed to load page');
    }
    return await response.json();
};

export const savePage = async (pageData) => {
    const isUpdate = !!pageData.id;
    const url = isUpdate ? `/api/ai-answer/pages/${pageData.id}` : '/api/ai-answer/pages/';
    const method = isUpdate ? 'PUT' : 'POST';

    const response = await fetch(url, {
        method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(pageData),
    });

    if (!response.ok) {
        throw new Error('Failed to save page');
    }

    return {success: true, action: isUpdate ? 'update' : 'create', data: await response.json()};
};

export const deletePage = async (pageId) => {
    const response = await fetch(`/api/ai-answer/pages/${pageId}`, {method: 'DELETE'});
    if (!response.ok) {
        throw new Error('Failed to delete page');
    }
    return {success: true};
};

export const validatePageData = (pageData) => {
    const errors = [];
    if (!pageData.title || !pageData.title.trim()) {
        errors.push('Page title is required');
    }
    return {valid: errors.length === 0, errors};
};
