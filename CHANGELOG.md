# Changelog

## [2.20.0] - 2026-05-29

## New Features:
* **Mobile post page redesign**: Rewrote the mobile post page as composable components — PostHeader, PostBody, PostActions, CommentComposer, CommentList, and CommentItem — replacing the previous monolithic layout
* **Flat comment system**: Removed reply threading to match desktop behavior; comments render as a clean, flat, chronologically sorted list
* **Utility hooks**: Added `useSig` for SIG badge lookup, `useUser` for author info resolution, and a `relativeTime` formatter for zh-TW timestamps
* **Toast notification system**: Integrated a ToastProvider with an imperative API into the mobile shell, replacing Sweetalert2 dialogs for login warnings and errors
* **Native-feeling overlays**: Added BottomSheet and DraggableSheet primitives powering the SIG list panel with drag-to-dismiss support
* **Pull-to-refresh**: Added pull-to-refresh gesture on the mobile feed with a scroll-to-top listener wired to the active tab
* **Page transitions & animations**: Spring-animated tab indicator, tap-scale feedback on buttons, and per-route PageTransition component for smooth navigation
* **Safe area support**: Tab bar, header, and feed padding now respect iOS safe-area insets for notched devices

## Bug Fixes:
* **Mobile post UI polish**: Fixed back chevron alignment in PostHeader, made the MdPreview background transparent to preserve glassmorphism, prevented horizontal scrolling on the post page, and corrected send button visibility and icon in CommentComposer
* **Avatar fallbacks**: Standardized the avatar fallback image to the local `/images/default-avatar.png` across PostHeader, CommentComposer, and CommentItem — eliminating broken-image icons
* **Comment section spacing**: Added proper margins to the comment list for improved visual separation
* **Mobile tab indicator**: Fixed tab indicator centering to avoid layout shift caused by CSS transform
* **Accessibility**: Blocked keyboard activation of disabled tabs and re-enabled pinch-to-zoom with themed status bar color
