var API = {
  async checkIsAdmin(options: FiberyCheckAdminOptions = {}): Promise<boolean> {
    return withApiUsage({ kind: 'fibery-api', operation: 'checkIsAdmin', source: options.source || 'init', automatic: !!options.automatic }, async () => {
      const r = await fetch('/api/ai-answer/pages/is-admin');
      if (!r.ok) return false;
      const data = await r.json() as { isAdmin?: unknown };
      return !!data.isAdmin;
    });
  },

  async loadPages({
    skip = 0,
    limit = 21,
    search = '',
    source = 'unknown',
    automatic = false
  }: FiberyLoadPagesOptions = {}): Promise<FiberyLoadPagesResult> {
    return withApiUsage({ kind: 'fibery-api', operation: 'loadPages', source, automatic }, async () => {
      const params = new URLSearchParams();
      params.set('skip', String(skip));
      params.set('limit', String(limit));
      if (search) params.set('search', search);
      const r = await fetch('/api/ai-answer/pages/?' + params.toString());
      if (!r.ok) throw new Error('Failed to load pages');
      return r.json() as Promise<FiberyLoadPagesResult>;
    });
  },

  async loadPage(id: string, options: FiberyLoadPageOptions = {}): Promise<FiberyPage | null> {
    return withApiUsage({ kind: 'fibery-api', operation: 'loadPage', source: options.source || 'unknown', pageId: id, automatic: !!options.automatic }, async () => {
      const r = await fetch('/api/ai-answer/pages/' + encodeURIComponent(id));
      if (!r.ok) throw new Error('Failed to load page');
      return r.json() as Promise<FiberyPage>;
    });
  },

  async savePage(page: SavePagePayload, options: FiberySavePageOptions = {}): Promise<FiberySaveResult> {
    return withApiUsage({ kind: 'fibery-api', operation: 'savePage', source: options.source || 'save-page', pageId: page?.id || '', automatic: !!options.automatic }, async () => {
      const isUpdate = !!page.id;
      const r = await fetch(
        isUpdate ? '/api/ai-answer/pages/' + encodeURIComponent(page.id) : '/api/ai-answer/pages/',
        {
          method: isUpdate ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(page)
        }
      );
      if (!r.ok) {
        let msg = 'Failed to save page';
        try {
          msg += ': ' + JSON.stringify(await r.json());
        } catch (_) {}
        throw new Error(msg);
      }
      return r.json() as Promise<FiberySaveResult>;
    });
  },

  async deletePage(id: string, options: FiberyDeletePageOptions = {}): Promise<{ success: boolean }> {
    return withApiUsage({ kind: 'fibery-api', operation: 'deletePage', source: options.source || 'delete-page', pageId: id, automatic: !!options.automatic }, async () => {
      const r = await fetch('/api/ai-answer/pages/' + encodeURIComponent(id), { method: 'DELETE' });
      if (!r.ok) throw new Error('Failed to delete page');
      return { success: true };
    });
  }
};
