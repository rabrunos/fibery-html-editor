# Human Tools

`docs/.human/` contains tools and materials for human use. It is not part of the Fibery HTML Editor runtime and should not be treated as app source.

## Files

* `fibery-test-report-app.html` is a local/human tool for importing JSON test forms, marking results, and generating a test report.
* `test-report-template.json`, when it exists, is the canonical template/reference for JSON test forms importable by `fibery-test-report-app.html`.

## Agent Boundaries

Codex/agents must not read or edit this folder during normal app tasks. Access is allowed only when the prompt explicitly asks, or when the task is about human tools, test forms, checklists, or test reports.

## Build and Changelog

Changes in this folder normally do not require the app build and normally do not require `CHANGELOG.md`, because these files are outside the delivered Fibery HTML Editor runtime. Follow the prompt if it explicitly says otherwise.
