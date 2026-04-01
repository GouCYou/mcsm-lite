# MCSManager Lite

🇺🇸 English | [🇨🇳 简体中文](./README.zh-CN.md) | [🇹🇼 繁體中文](./README.zh-TW.md)

A mobile-first MCSManager client built with `uni-app` and `Vue 3`.

This project started from a simple idea: while MCSManager already has a capable web panel, there is still no mature mobile client built specifically around the official MCSManager API. So this repository is an attempt to build a lightweight, touch-friendly, visually polished mobile experience for daily server management.

## Why This Project Exists

`MCSManager Lite` is meant for people who want to:

- connect to an MCSManager panel quickly from a phone
- browse instances by daemon node
- inspect instance details without opening the full desktop-style web panel
- read logs, send commands, and manage files on the go
- use an interface that feels more native on mobile instead of a shrunk desktop admin page

## Current Status

This project is already usable as an early mobile client, but it is still evolving.

Implemented so far:

- login-first flow with automatic protocol detection and silent default port completion
- dashboard overview for panel, system, and daemon status
- daemon-aware instance list with search, paging, and quick actions
- instance detail view with runtime info, console, command sending, and file management
- text preview and image preview inside the file manager
- custom liquid-glass inspired UI across the app
- custom in-app dialogs, menus, and feedback instead of relying on native system sheets
- mobile-style page transition and tab switching animations

## Screens and Features

### Login

- connect with panel address and API key
- automatically complete missing protocol and default port when needed
- store connection information locally for later sessions

### Dashboard

- panel version
- selected daemon summary
- online daemon count
- running instance statistics
- basic host and system information

### Instances

- switch between daemon nodes
- search instances by name
- paginate long lists
- start, stop, restart, or kill instances quickly
- open instance detail with animated navigation

### Instance Detail

- runtime summary such as memory, CPU, and player count
- console log view
- command input
- basic instance metadata
- file manager with custom action menus
- text editor style preview
- image preview for supported image files

### Settings

- review current panel address and masked API key
- inspect daemon summary
- log out and return to the login page

## Tech Stack

- `uni-app`
- `Vue 3`
- plain JavaScript
- custom lightweight reactive stores

## Project Structure

```text
src/
  api/               API wrappers for overview, instances, and files
  components/        shared UI components such as tab frame and message host
  pages/             login, dashboard, instances, settings, instance detail
  stores/            lightweight app state
  utils/             formatting, storage, URL, navigation, message helpers
static/              icons and tab assets
```

## Development Notes

This repository is currently organized as a standard `uni-app` project and is especially convenient to run inside `HBuilderX`.

Typical local workflow:

1. Open the project in `HBuilderX`
2. Run it as `Web` or on a mobile target
3. Connect it to an available MCSManager panel with a valid API key

## Design Direction

The UI direction of this project focuses on:

- mobile-first interaction
- simplified panel workflows
- custom overlays and transitions
- a liquid-glass inspired visual style for cards, dialogs, and navigation

## Roadmap

Possible next steps include:

- broader API coverage from the MCSManager ecosystem
- more complete file operations
- better runtime charts and monitoring views
- push-friendly or polling-based status refresh improvements
- packaging and release workflow for mobile distribution

## Disclaimer

This is an independent community project and is not an official MCSManager client.

Please verify your own deployment environment, permissions, and API exposure before using it in production.
