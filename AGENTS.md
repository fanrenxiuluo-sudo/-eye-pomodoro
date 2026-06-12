# Project Instructions

## Project Overview
- This is a Windows desktop eye-protection Pomodoro app.
- Tech stack: Electron 35, React 19, TypeScript, electron-vite, sql.js, Recharts.
- Main process code is in `src/main/`.
- Preload code is in `src/preload/`.
- Renderer React code is in `src/renderer/`.
- Shared types are in `src/shared/`.
- Tests are in `tests/`.

## Commands
- Install dependencies: `npm install`
- Start development app: `npm run dev`
- Run tests: `npm test`
- Build app: `npm run build`
- Build Windows installer: `npm run build:win`
- Build Windows portable package: `npm run build:win:portable`

## Work Rules
- Read this file, `README.md`, `package.json`, and relevant source files before editing.
- Make only the smallest necessary change for the current task.
- Do not rewrite unrelated code.
- Do not change generated output folders such as `out/`, `dist/`, or `node_modules/`.
- Do not modify release notes, progress files, or task plan files unless the user explicitly asks.
- Preserve the existing Electron main/preload/renderer boundary.
- Keep IPC, window management, storage, timer logic, and notification behavior compatible with existing code.

## Verification
- After source code changes, run `npm test`.
- After TypeScript or build-related changes, run `npm run build`.
- If a command fails, identify the root cause and fix it before reporting completion.
- Report the exact command results in the final response.

## Response Style
- Reply in Chinese.
- State changed files first.
- State verification commands second.
- State remaining risks or unfinished items last.
