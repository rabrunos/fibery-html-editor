function parseAppVersionFromHtmlSource(html = '') {
  const source = String(html || '');
  const match = source.match(/\b(?:const|let|var)\s+APP_VERSION\s*=\s*["']([^"']+)["']/);
  return String(match?.[1] || '').trim();
}
function validateRemoteUpdateHtml(remoteHtml = '') {
  const source = String(remoteHtml || '');
  if (!source.trim()) return { ok: false, reason: 'empty' };
  if (source.trim().length < 300) return { ok: false, reason: 'too-short' };
  if (/^404:\s*Not Found/i.test(source.trim())) return { ok: false, reason: 'not-found' };
  if (!/<html[\s>]/i.test(source) && !/<!doctype html/i.test(source)) return { ok: false, reason: 'not-html' };
  if (!/fibery-html-editor/i.test(source)) return { ok: false, reason: 'not-editor' };

  const metaVersion = extractRemoteVersionFromHtml(source);
  if (!metaVersion) return { ok: false, reason: 'missing-meta-version' };
  const metaSemver = parseSemverSimple(metaVersion);
  if (!metaSemver) return { ok: false, reason: 'invalid-meta-version', metaVersion };

  const appVersionLiteral = parseAppVersionFromHtmlSource(source);
  if (!appVersionLiteral) return { ok: false, reason: 'missing-app-version' };
  if (appVersionLiteral !== metaSemver.raw) return { ok: false, reason: 'version-mismatch', metaVersion: metaSemver.raw, appVersionLiteral };

  if (!/window\.FIBERY_HTML_EDITOR_VERSION\s*=\s*APP_VERSION/.test(source)) return { ok: false, reason: 'missing-window-version-assign', metaVersion: metaSemver.raw };
  if (!/document\.documentElement\.dataset\.appVersion\s*=\s*APP_VERSION/.test(source)) return { ok: false, reason: 'missing-dataset-version-assign', metaVersion: metaSemver.raw };

  const localSemver = parseSemverSimple(APP_VERSION);
  if (!localSemver) return { ok: false, reason: 'invalid-local-version' };
  const cmp = compareSemverSimple(localSemver, metaSemver);
  if (cmp >= 0) return { ok: false, reason: 'remote-not-newer', metaVersion: metaSemver.raw };
  return { ok: true, remoteVersion: metaSemver.raw, localVersion: localSemver.raw };
}
function updateValidationReasonText(reason = '') {
  if (reason === 'remote-not-newer') return t('updateRemoteVersionNotNewer');
  return t('updateRemoteHtmlInvalid');
}
