# Implementation Plan - Glassmorphic & Sci-Fi Isometric UI Overhaul

## Context
The user requested a complete UI transformation of QAForge into a **Glassmorphic and Sci-Fi Isometric** theme across the entire application. 
This includes:
- Deep sci-fi dark command center aesthetic (`#070B14`, `#0B101D`, `#131C30`)
- Translucent frosted glass panels with subtle cyan/blue glowing borders (`border-[#3A5280]/40`, `bg-[#131C30]/80`, `backdrop-blur-md`)
- Isometric and floating 3D perspective cards with layered glowing shadows (`shadow-[0_20px_50px_rgba(0,120,255,0.15)]`, glow highlights)
- Glowing neon cyan/blue accent badges, progress indicators, and 3D pill tags (`text-[#00F0FF]`, `bg-[#00F0FF]/10`, `border-[#00F0FF]/30`)
- Sci-fi grid patterns and hexagonal/tech motifs on headers, sidebars, cards, and modal dialogs.

## Critical Files to Modify
1. `client/src/index.css`: Update Tailwind utility classes (`.card-surface`, `.glass-surface`, `.kanban-card`, buttons, inputs, scrollbars, and add sci-fi isometric utility classes like `.sci-card`, `.sci-button`, `.sci-glow`, `.grid-bg`).
2. `client/tailwind.config.js`: Add sci-fi color palettes (`sci: { bg: '#070B14', surface: '#101726', border: '#23324F', cyan: '#00F0FF', blue: '#3B82F6', glow: 'rgba(0, 240, 255, 0.25)' }`) and sci-fi animations/box-shadows.
3. `client/src/components/layout/MainLayout.jsx` & `Header.jsx` & `Sidebar.jsx`: Apply glassmorphism (`backdrop-blur-md bg-[#0F1626]/80`), glowing borders, and isometric top/side accents.
4. `client/src/pages/HomePage.jsx` & `KanbanCard.jsx` & `KanbanColumn.jsx`: Transform dashboards, stat cards, and kanban columns into floating sci-fi isometric cards with glowing borders and holographic styling.
5. `client/src/pages/LoginPage.jsx`: Elevate the login screen with sci-fi grid decorations, glowing glass panels, and isometric preview elements.
6. `client/src/components/common/CreateModal.jsx` and other pages (Backlog, Bugs, TestCases, etc.): Ensure consistent glassmorphism and sci-fi styling.

## Verification Plan
1. Run `npm --prefix client run build` to verify clean compilation with no syntax or CSS issues.
2. Review visual consistency across key pages (Home, Kanban board, Login, Sidebar, Header, Modals) to ensure the Sci-Fi Isometric & Glassmorphic theme is stunning and fully cohesive.
