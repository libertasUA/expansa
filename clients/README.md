# Clients

One client ships at launch and which one is not decided — mobile (React Native) or web.
A Steam build would be the web client in a desktop shell rather than a third codebase.
This directory presumes no platform; each client is a workspace package under it.

Two rules apply to whatever lands here first, both from CLAUDE.md:

- **Only rendering and platform APIs live in a client package.** Transport, session, local
  store, cached state and view models are not rendering. Keep them under `src/core/`,
  separate from `src/ui/`, so extracting a shared client package once a second client
  exists is a file move rather than a rewrite.
- **No shared client package is created in advance.** It gets extracted from the first
  client when the second one appears; a family of zero cannot be designed for.
