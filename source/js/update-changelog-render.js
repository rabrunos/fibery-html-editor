function parseUpdateChangelogVersionHeading(line = '') {
  const match = String(line || '').trim().match(/^##\s+\[(\d+\.\d+\.\d+)\]\s*-\s*(.+)$/);
  if (!match) return null;
  const semver = parseSemverSimple(match[1]);
  if (!semver) return null;
  return { version: semver.raw, date: String(match[2] || '').trim() };
}
function appendUpdateChangelogBadge(parent, text, toneClass) {
  if (!parent || !text) return;
  const badge = document.createElement('span');
  badge.className = `update-changelog-badge ${toneClass || ''}`.trim();
  badge.textContent = text;
  parent.appendChild(badge);
}
function renderUpdateVersionHeading(container, headingLine, comparison) {
  const heading = parseUpdateChangelogVersionHeading(headingLine);
  if (!heading) return false;
  const headingSemver = parseSemverSimple(heading.version);
  const isInstalled = !!comparison.localSemver && heading.version === comparison.localSemver.raw;
  const isLatest = !!comparison.remoteSemver && heading.version === comparison.remoteSemver.raw;
  const isNewerThanInstalled = !!comparison.localSemver && !!headingSemver && compareSemverSimple(headingSemver, comparison.localSemver) > 0;
  const isInstalledOutdated = isInstalled && comparison.localVsRemote !== null && comparison.localVsRemote < 0;
  const isInstalledCurrent = isInstalled && comparison.localVsRemote !== null && comparison.localVsRemote === 0;

  const wrapper = document.createElement('div');
  wrapper.className = 'update-changelog-version-heading';
  if (isInstalledOutdated) wrapper.classList.add('installed-outdated');
  else if (isInstalledCurrent) wrapper.classList.add('installed-current');
  else if (isLatest) wrapper.classList.add('latest');
  else if (isNewerThanInstalled) wrapper.classList.add('newer-than-installed');

  const labelWrap = document.createElement('div');
  const versionText = document.createElement('div');
  versionText.className = 'text-sm font-semibold text-gray-900';
  versionText.textContent = heading.version;
  labelWrap.appendChild(versionText);
  if (heading.date) {
    const dateText = document.createElement('div');
    dateText.className = 'text-[11px] text-gray-500';
    dateText.textContent = `${t('updateVersionDate')}: ${heading.date}`;
    labelWrap.appendChild(dateText);
  }
  wrapper.appendChild(labelWrap);

  const badges = document.createElement('div');
  badges.className = 'update-changelog-version-badges';
  if (isInstalled) appendUpdateChangelogBadge(badges, t('updateVersionBadgeInstalled'), 'badge-installed');
  if (isLatest) appendUpdateChangelogBadge(badges, t('updateVersionBadgeLatest'), 'badge-latest');
  if (isInstalledCurrent) appendUpdateChangelogBadge(badges, t('updateVersionBadgeCurrent'), 'badge-current');
  if (isInstalledOutdated) appendUpdateChangelogBadge(badges, t('updateVersionBadgeOutdated'), 'badge-outdated');
  if (isNewerThanInstalled && !isInstalled) appendUpdateChangelogBadge(badges, t('updateVersionBadgeNewer'), 'badge-newer');
  if (badges.childNodes.length) wrapper.appendChild(badges);

  container.appendChild(wrapper);
  return true;
}
function appendUpdateChangelogText(container, text) {
  const value = String(text || '').trim();
  if (!value) return;
  const p = document.createElement('p');
  p.className = 'update-changelog-paragraph';
  p.textContent = value;
  container.appendChild(p);
}
function renderUpdateChangelog(container, rawChangelog, comparison) {
  container.textContent = '';
  const source = String(rawChangelog || '').replace(/\r\n/g, '\n');
  if (!source.trim()) {
    appendUpdateChangelogText(container, t('updateChangelogUnavailable'));
    return;
  }
  const lines = source.split('\n');
  let paragraphBuffer = [];
  let list = null;

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return;
    appendUpdateChangelogText(container, paragraphBuffer.join(' '));
    paragraphBuffer = [];
  };
  const flushList = () => { list = null; };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (parseUpdateChangelogVersionHeading(line)) {
      flushParagraph();
      flushList();
      renderUpdateVersionHeading(container, line, comparison);
      continue;
    }

    const sectionHeading = trimmed.match(/^###\s+(.+)$/);
    if (sectionHeading) {
      flushParagraph();
      flushList();
      const heading = document.createElement('h4');
      heading.className = 'update-changelog-section-title';
      heading.textContent = sectionHeading[1].trim();
      container.appendChild(heading);
      continue;
    }

    const genericHeading = trimmed.match(/^##\s+(.+)$/);
    if (genericHeading) {
      flushParagraph();
      flushList();
      const heading = document.createElement('h3');
      heading.className = 'update-changelog-section-title';
      heading.textContent = genericHeading[1].trim();
      container.appendChild(heading);
      continue;
    }

    const listItem = trimmed.match(/^[-*]\s+(.+)$/);
    if (listItem) {
      flushParagraph();
      if (!list) {
        list = document.createElement('ul');
        list.className = 'update-changelog-list';
        container.appendChild(list);
      }
      const item = document.createElement('li');
      item.className = 'update-changelog-list-item';
      item.textContent = listItem[1].trim();
      list.appendChild(item);
      continue;
    }

    paragraphBuffer.push(trimmed);
  }
  flushParagraph();
}
