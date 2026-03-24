---
name: archive
description: Archive a completed change — merge knowledge, changelog, commit
max_concurrent: 1
---

## judo-archiver
task: >
  Archive this change.
  Merge change research into global judospec/research/ files.
  Append entry to judospec/CHANGELOG.md.

## judo-git-manager
blockedBy: judo-archiver
task: >
  Commit archive changes.
  Archiver result: {result.judo-archiver.summary}
