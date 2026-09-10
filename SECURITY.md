# Security policy

## Supported versions

Only the latest published release of `env-attr-cleaner` and `env-attr-cleaner-bun` is
supported. Fixes land on `main` and go out in the next release; older versions are not
backported.

## Reporting a vulnerability

Report privately through GitHub's [private vulnerability
reporting](https://github.com/techmefr/env-attr-cleaner/security/advisories/new) rather
than opening a public issue. Expect an acknowledgement within a week.

Useful in a report: the affected package and version, the bundler and framework, a
configuration that reproduces the problem, and what the emitted build looks like versus
what you expected.

## Scope

This plugin rewrites source at build time and strips attributes from production output.
The reports that matter most for it are:

- attributes that survive a production build although the configuration should have
  removed them — the tool silently failing at its one job;
- emitted code that the strip corrupts, in particular inside strings, template literals
  and comments;
- anything that lets a dependency or a workflow reach the npm publishing identity held
  by `publish.yml`.

Findings in `examples/*` are out of scope: those applications exist to exercise the
plugin in CI and are not published.
