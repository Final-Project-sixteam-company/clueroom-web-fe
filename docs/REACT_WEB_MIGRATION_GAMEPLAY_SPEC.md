# ClueRoom — 게임플레이 화면 픽셀 명세 (Flutter 원본)

> 참고 문서. [REACT_WEB_MIGRATION_PLAN.md](REACT_WEB_MIGRATION_PLAN.md) Phase 5(화면별 픽셀 정합)의 실행 레퍼런스예요.
> 소스: `../project-fe/lib/screens/` (case_briefing/case/scene/evidence/suspects/interrogation/timeline/submit/result).
> 자동 정밀 분석(Explore 에이전트) 산출물을 그대로 보존한 거예요. 정본 픽셀 값은 해당 Dart 파일이 우선이에요.

---

# CLUEROOM FLUTTER GAMEPLAY SCREENS - PIXEL-PERFECT REACT WEB MIGRATION SPECIFICATION

## COMPLETE STRUCTURED ANALYSIS

I have comprehensively read all 20 specified Dart gameplay screen files and created the definitive pixel-perfect migration specification. This document is organized by gameplay flow and serves as the single source of truth for rebuilding screens in React.

---

## GAMEPLAY FLOW SEQUENCE
**Case Briefing → Case/Scene → Evidence → Suspects → Interrogation → Timeline → Submit → Result**

---

## 1. CASE BRIEFING SCREEN
**File:** `/Users/superstar/my-claude-project/팀프로젝트 튜터링 에이전트/2026_sparta_backend-3/project4-final/Team6/project-fe/lib/screens/case_briefing_screen.dart`

**Purpose:** Pre-gameplay narrative with sequential animations revealing case synopsis, victim info, detective objectives, and investigation start button.

**Layout Structure (top-to-bottom):**
- **AppBar (Transparent)**
  - "CASE BRIEFING" monoLabel (textMute color)
  - Left padding: AppTokens.sp4
  - Elevation: 0, scrolledUnderElevation: 0

- **SafeArea → Column (crossAxisAlignment: stretch)**
  - Horizontal padding: AppTokens.sp4
  - **Expanded SingleChildScrollView (BouncingScrollPhysics)**
    - Top gap: AppTokens.sp4
    - **Case Title Section**
      - Text (AppText.display, h: 1.15, c.text)
    - Gap: AppTokens.sp6
    - **Synopsis Section**
      - MSKicker("사건 개요")
      - Gap: AppTokens.sp3
      - Text (AppText.body, h: 1.6, c.text)
    - Gap: AppTokens.sp6
    - **Victim Info Section**
      - MSKicker("피해자 정보")
      - Gap: AppTokens.sp3
      - _VictimRow component (see sub-layout below)
    - Gap: AppTokens.sp6
    - **Detective Objectives Section**
      - MSKicker("탐정 목표")
      - Gap: AppTokens.sp3
      - Container (BoxDecoration: dangerSoft bg, danger border, r4, sp4 padding):
        - Text ("1. 진범을 찾아라\n2. 살해 방법과 동기를 밝혀라\n3. 최종 추리를 뒷받침할 증거를 확보하라")
        - Style: AppText.body, w600, danger color, h: 1.8
    - Gap: AppTokens.sp8
  - **Start Button Section**
    - Gap: AppTokens.sp6
    - MSButton (label: "수사 시작하기", variant: primary, expanded: true, loading: _starting)
    - Gap: AppTokens.sp6

**_VictimRow Sub-Component:**
- **Row:**
  - **Avatar Container** (40×40, sp3 border radius, gradient ink700→ink500)
    - Text (victimInitial "?", AppText.titleM 16px, ink50, h: 1.0)
  - Gap: AppTokens.sp3
  - **Expanded Column**
    - Text (victimName "미상", AppText.body w600, c.text)
    - Gap: 2dp
    - Text (victimRole "피해자 정보는 수사 시작 후 공개됩니다", AppText.bodySm, c.textSub)
  - **Location Badge** (right side)
    - Container (sp2 h/4v padding, dangerSoft bg, danger border, r2)
    - Text (locationLabel, AppText.monoLabel, danger color, h: 1.0)

**Key Components Used:**
- MSKicker (section headers with uppercase styling)
- MSButton (primary variant with loading state support)
- Container (BoxDecoration for cards)
- Custom gradient avatar
- FadeTransition + AnimatedBuilder with Transform.translate

**Animation Pattern:**
- 5 sections (_sectionCount), each with sequential AnimationController
- Opacity animation (CurvedAnimation with AppMotion.easeOut)
- Slide animation (Tween<Offset> from (0, 10) to (0, 0))
- Staggered delay: 80ms × index (80, 160, 240, 320, 400ms)
- Duration: AppMotion.dur3 (300ms)

**API Calls / Repository Methods:**
- None at this screen; GameSessionController.startSession() triggered on navigation to CaseScreen

**State / Controllers Consumed:**
- `_scenario` (Scenario model, fallback: 'demoday-eve' if not provided)
- `_ctrls` (List<AnimationController>, length: 5)
- `_opacities` (List<Animation<double>>)
- `_slides` (List<Animation<Offset>>)
- `_starting` (bool, prevents double-tap during transition)

**Navigation In/Out:**
- **Entry:** From scenario library / home screen
- **Exit:** MSButton tap → CaseScreen push (pushReplacement with scenarioId)
- **Timing:** Navigation happens in addPostFrameCallback after _starting flag set (ensures button loading visible for 1 frame)

**Pixel Notes - Spacing:**
- Horizontal padding: sp4 (16dp)
- Section gaps: sp6 (24dp), sp8 (32dp) before button
- Top padding: sp4
- Avatar size: 40×40
- Avatar border radius: sp3 (12dp)
- Victim role gap: 2dp (hardcoded, not AppToken)
- Location badge padding: sp2 h (8dp) / 4v (hardcoded)

**Pixel Notes - Colors:**
- Background: c.bg (transparent in AppBar)
- Title text: c.text (primary dark)
- Secondary text: c.textSub, c.textMute
- Avatar gradient: LinearGradient(AppColors.ink700 → AppColors.ink500)
- Avatar text: AppColors.ink50 (light)
- Objective box: dangerSoft (light red) bg + danger (red) border + danger text
- Border color: danger

**Pixel Notes - Typography:**
- Display title: AppText.display, h: 1.15
- Body text: AppText.body, h: 1.6
- Objective text: AppText.body, w600, h: 1.8
- Victim name: AppText.body, w600
- Victim role: AppText.bodySm
- Location label: AppText.monoLabel, h: 1.0
- MonoLabel: AppText.monoLabel (monospace, uppercase)

**Pixel Notes - Animations:**
- FadeTransition with CurvedAnimation (easeOut)
- AnimatedBuilder with Transform.translate
- Sequential playback with 80ms stagger
- Duration: 300ms (AppMotion.dur3)
- Easing: AppMotion.easeOut (cubic ease-out)

---

## 2. CASE SCREEN (Main Tab Shell)
**File:** `/Users/superstar/my-claude-project/팀프로젝트 튜터링 에이전트/2026_sparta_backend-3/project4-final/Team6/project-fe/lib/screens/case_screen.dart`

**Purpose:** Master shell container with 5-tab bottom navigation (Scene, Evidence, Suspects, Timeline, Submit), persistent top HUD displaying case code, briefing button, elapsed time, and unlocked evidence count; manages session lifecycle and handles back navigation.

**Layout Structure:**
- **PopScope (canPop: false, onPopInvokedWithResult: _handlePop)**
  - **GameSessionProvider (controller: _session)**
    - **Scaffold (backgroundColor: c.bg)**
      - **AppBar (Custom via _buildHud)**
        - Type: PreferredSize (height: AppTokens.sp10 = 40dp)
        - SafeArea (bottom: false)
        - Container (height: sp10, padding: sp4 h, bg: c.bg, bottom border: lineSoft):
          - **Row (children):**
            - Case code (monoLabel, textMute, format: "CL-XXX" or "CL-001" fallback)
            - [if dashboard != null]: Briefing button section
              - SizedBox(width: sp2)
              - GestureDetector (full-height tap area for HUD):
                - Container (height: sp10, padding: sp2 h):
                  - Row (mainAxisSize: min):
                    - Icon (Icons.assignment_outlined, 20px, primary)
                    - SizedBox(width: sp1)
                    - Text ("브리핑", AppText.monoLabel, primary, h: 1.0)
            - Spacer()
            - Timer section:
              - Icon (Icons.timer_outlined, 14px, textMute)
              - SizedBox(width: sp1)
              - Text (elapsedLabel, AppText.monoNum, 13px, c.text, h: 1.0)
            - SizedBox(width: sp4)
            - Evidence count section:
              - Icon (Icons.description_outlined, 14px, success if > 0 else textMute)
              - SizedBox(width: sp1)
              - Text ("n/m", AppText.monoNum, 13px, success if > 0 else textMute, h: 1.0)

      - **MSBottomNav (currentIndex: _navIndex, 5 items)**
        - Tabs: Scene, Evidence, Suspects, Timeline, Submit
        - onTap triggers setState(_navIndex = i) + conditional refreshEvidences() if i == 1

      - **Body (AnimatedBuilder on _session)**
        - **Conditional rendering:**
          - If _session.dashboard == null:
            - If _session.isLoading: MSSpinner (size: 28, centered)
            - Else if _session.loadError != null: _buildLoadError (MSEmpty with error message + retry/abandon buttons)
            - Else: (dashboard still loading)
          - Else if !_session.isCompleted && status != PLAYING:
            - _buildClosedSession (MSEmpty with status-specific message + result/home buttons)
          - Else:
            - IndexedStack (index: _navIndex, children: [SceneScreen, EvidenceScreen, SuspectsScreen, TimelineScreen, SubmitScreen])

**_buildLoadError Widget:**
- **MSEmpty (variable content based on conflict):**
  - Icon: Icons.lock_clock_outlined (if conflict) or Icons.cloud_off
  - Title: "진행 중인 세션이 있습니다" or "세션을 시작하지 못했습니다"
  - Subtitle: _session.loadError or contextual message
  - Action: MSButton (conflict ? "기존 세션 포기 후 새로 시작" : "다시 시도", primary if conflict else secondary)
  - Secondary action: MSButton ("나가기", ghost)

**_buildClosedSession Widget:**
- **MSEmpty:**
  - Icon: Icons.gavel_outlined
  - Title: "이미 종결된 사건입니다"
  - Subtitle: scored ? "이 수사는 이미 제출이 완료되었습니다. 결과를 확인하세요." : "이 수사는 더 이상 진행할 수 없습니다."
  - Action: (scored && sessionId) ? MSButton ("결과 보기", primary) : MSButton ("홈으로 돌아가기", primary)
  - Secondary action: (scored && sessionId) ? MSButton ("홈으로 돌아가기", ghost) : null

**_AbandonDialog Sub-Component:**
- **Dialog (backgroundColor: c.bgElev, shape: r6 border with line):**
  - Padding: sp6
  - **Column (mainAxisSize: min, crossAxisAlignment: stretch):**
    - **Row:** Icon (Icons.logout, 22px, danger) + SizedBox(sp2) + Text ("수사 중단", AppText.titleM, c.text)
    - SizedBox(height: sp3)
    - Text ("지금 나가면 진행 중인 수사가 중단됩니다.\n진행 상황은 저장되지 않으며 다음에 새로 시작해야 합니다.", AppText.body, textSub, h: 1.6)
    - SizedBox(height: sp6)
    - **Row (2 buttons):**
      - Expanded: MSButton ("계속 수사", secondary, expanded: true, onPressed: pop(false))
      - SizedBox(width: sp3)
      - Expanded: MSButton ("나가기", danger, expanded: true, onPressed: pop(true))

**Key Components Used:**
- GameSessionController (main state manager)
- GameSessionProvider (context injection wrapper)
- MSBottomNav (5-item tab navigation)
- MSSpinner, MSEmpty (loading/error states)
- IndexedStack (efficient tab switching without rebuilding)
- PreferredSize (custom AppBar)
- PopScope (back button interception)

**API Calls / Repository Methods:**
- **startSession():** Called via addPostFrameCallback on initState
  - Endpoint: POST /play/session/start (inferred from controller logic)
- **refreshEvidences():** Called when Evidence tab (index 1) is entered
  - Endpoint: GET /play/session/{sessionId}/evidences (inferred)
- **abandonSession():** Called on back pop with user confirmation
  - Endpoint: DELETE /play/session/{sessionId} (inferred)
- **abandonConflictAndRestart():** Recovery action on 409 conflict
  - Logic: abandon existing session, then startSession() again

**State / Controllers Consumed:**
- `_session` (GameSessionController, injected via GameSessionProvider)
- `_navIndex` (int, 0–4, local state)
- `_session.dashboard` (Dashboard?, populated after startSession)
- `_session.isLoading` (bool)
- `_session.loadError` (String?, error message if init failed)
- `_session.sessionConflict` (bool, true on 409 conflict)
- `_session.isCompleted` (bool, true after successful result submission)
- `_session.isFinalDeductionSubmitting` (bool, prevents pop during submit)
- `_session.backendSessionId` (int?, server session ID if exists)
- `_session.elapsedLabel` (String, formatted time "MM:SS" or "H:MM:SS")
- `_session.unlockedCount` (int, number of unlocked evidences)
- `_session.totalEvidenceCount` (int, total evidence count)
- `_session.tabRequest` (int?, cross-tab navigation intent from controller)
- `_session.interrogationLogs` (List<InterrogationLog>)

**Navigation In/Out:**
- **Entry:** From CaseBriefingScreen via pushReplacement (CaseScreen(scenarioId))
- **Exit:** PopScope back button → _handlePop → confirmDialog → navigator.pop()
- **Prevent:** canPop: false unless isCompleted or no backend session
- **Internal:** MSBottomNav onTap → setState(_navIndex) → IndexedStack rebuild
- **Special:** refreshEvidences() triggered on Evidence tab entry (time-based unlocks)

**Pixel Notes - HUD Layout:**
- AppBar height: sp10 (40dp)
- AppBar background: c.bg
- HUD padding: sp4 horizontal (16dp)
- SafeArea: bottom: false (no bottom safe area)
- Top border: 1px lineSoft color

**Pixel Notes - HUD Elements:**
- Case code: monoLabel, textMute, left-aligned
- Briefing button padding: sp2 h (8dp)
- Briefing icon: 20px, primary color
- Briefing label: monoLabel, primary color, h: 1.0
- Timer icon: 14px, textMute
- Timer text: monoNum 13px fsBase, c.text, h: 1.0
- Evidence icon: 14px, success or textMute (conditional)
- Evidence count: monoNum 13px fsBase, success or textMute, h: 1.0

**Pixel Notes - Case Code Format:**
- Numeric scenario IDs: "CL-" + zero-padded to 3 digits (e.g., "CL-001")
- Default/sample IDs: "CL-001"

**Pixel Notes - Error States:**
- LoadError MSEmpty: Padding(sp6), centered, icon + title + subtitle + action/secondary buttons
- ClosedSession MSEmpty: Similar layout, status-specific messaging

---

## 3. SCENE SCREEN
**File:** `/Users/superstar/my-claude-project/팀프로젝트 튜터링 에이전트/2026_sparta_backend-3/project4-final/Team6/project-fe/lib/screens/scene_screen.dart`

**Purpose:** Crime scene visualization with interactive floor plan map, location list with evidence counts, optional location images, and hint button; server-backed or sample-backed fallback.

**Layout Structure:**
- **Scaffold (backgroundColor: c.bg)**
  - **AppBar (Custom via _buildAppBar)**
    - Elevation: 0, scrolledUnderElevation: 0
    - backgroundColor: Colors.transparent
    - titleSpacing: AppTokens.sp4
    - automaticallyImplyLeading: false
    - Title: Text ("CRIME SCENE", AppText.monoLabel, textMute)
    - Actions:
      - Padding(right: sp2):
        - IconButton (icon: Icons.lightbulb_outline, primary color, onPressed: showHintModal)
        - Tooltip: "힌트 보기"

  - **SafeArea → SingleChildScrollView (BouncingScrollPhysics, padding: sp4 h) → Column (crossAxisAlignment: stretch)**
    - SizedBox(height: sp4)
    - **_SceneMap Component**
      - AspectRatio(4:3)
      - Container (bgElev bg, line border, r4, Clip.hardEdge):
        - Stack (fit: StackFit.expand):
          - Image.network (with loadingBuilder → MSSkeleton on progress)
          - Fallback: _MapPlaceholder (centered icon + text)
          - Optional sample pin (if usesSampleCaseFallback && !hasLiveMap):
            - LayoutBuilder → Positioned pin at relative coords (0.58, 0.42)
            - _SamplePin: Column (24×24 circle + CustomPaint tail)

    - SizedBox(height: sp6)

    - [if items.isNotEmpty]:
      - **Location List Section**
      - MSKicker("주요 현장 정보")
      - SizedBox(height: sp3)
      - _LocationList component:
        - Column of _LocationCard items, sp2 gap between
        - Each card (sp3 padding, r3 border, animated selection):
          - Row: Icon (place_outlined, 18px) + SizedBox(sp3) + Expanded(name column) + SizedBox(sp2) + MSPill(evidence count)
          - Selected state: primarySoft bg + primary border, dur2 easeOut animation
      - [if selectedIndex != null && hasImage]:
        - SizedBox(height: sp4)
        - _LocationImageCard component:
          - ClipRRect (r4):
            - Stack:
              - AssetImageWidget (160px height, cover fit)
              - Positioned(bottom, full width):
                - Gradient overlay (ink950 → transparent, bottom-to-top)
                - Padding(sp3):
                  - Text (locationName, AppText.bodySm, ink50, w600)

    - [else if usesSampleCaseFallback]:
      - **Sample Location List Section** (production gate: only if sample fallback enabled)
      - MSKicker("주요 현장 정보")
      - SizedBox(height: sp3)
      - _SampleLocationList:
        - Column of _SampleLocationCard items, sp2 gap
        - Each card (sp3 padding, r3 border, animated selection):
          - Row: Icon + SizedBox(sp3) + Expanded(name) + SizedBox(sp2) + MSPill(hardcoded "단서 n")

    - [else if session.isLoading]:
      - Padding(top: sp6) + MSListSkeleton (itemCount: 4)

    - [else]:
      - MSKicker("현장 정보")
      - SizedBox(height: sp3)
      - MSEmpty (icon: map_outlined, title: "현장 정보 준비 중", subtitle: "이 시나리오의 현장 데이터는 곧 제공될 예정입니다.")

    - SizedBox(height: sp10)

**_MapPlaceholder Sub-Component:**
- **Center → Column (mainAxisSize: min):**
  - Icon (Icons.map_outlined, 48px, textMute)
  - SizedBox(height: sp3)
  - Text ("건물 평면도 영역", AppText.bodySm, textMute)

**_SamplePin Sub-Component:**
- **Column (mainAxisSize: min):**
  - Container (24×24, gradient tealBase→skyBase, r(circle), border: ink0 2px, boxShadow):
    - Icon (Icons.person, 12px, ink0)
  - CustomPaint (8×6, _PinTailPainter):
    - Draws triangle: moveTo(0,0) → lineTo(w/2, h) → lineTo(w, 0) → close

**_PinTailPainter (CustomPainter):**
- Paints triangle pointing downward
- Color: c.primary (matches circle)
- Size: 8×6

**_LocationCard Sub-Component:**
- **AnimatedContainer (duration: dur2, curve: easeOut)**
  - bg: selected ? primarySoft : c.bg
  - border: selected ? primary : line
  - borderRadius: r3
  - **Material (transparent) → InkWell (splashColor: primary 0.06, highlightColor: primary 0.03, r3)**
    - Padding(sp3):
      - **Row:**
        - Icon (place_outlined, 18px, primary)
        - SizedBox(width: sp3)
        - Expanded Column (name, optional floor):
          - Text (name, AppText.body, 13px, w500, c.text)
          - [if floor]: SizedBox(height: 2) + Text (floor, AppText.bodySm, textMute)
        - SizedBox(width: sp2)
        - MSPill ("해금 n/m", tone: mute)
        - [if hasImage]: SizedBox(width: sp2) + Icon (photo_outlined, 14px, textMute)

**_LocationImageCard Sub-Component:**
- **ClipRRect (borderRadius: r4)**
  - **Stack:**
    - AssetImageWidget (width: inf, height: 160, fit: cover, fallback: 160×160 icon container)
    - **Positioned (bottom: 0, left: 0, right: 0)**
      - Container (BoxDecoration: gradient ink950→transparent, all: sp3):
        - Text (name, AppText.bodySm, ink50, w600)

**_SampleLocationCard Sub-Component:**
- Similar to _LocationCard but with hardcoded location data
- Sample locations: 6 items with icon, name, clueCount

**Key Components Used:**
- _SceneMap (AspectRatio 4:3, Image.network)
- _LocationList / _SampleLocationList (Column of cards)
- _LocationCard / _SampleLocationCard (AnimatedContainer + InkWell)
- MSPill (evidence count display, mute tone)
- MSKicker (section header)
- AssetImageWidget (network image with fallback)
- MSEmpty (no data state)
- MSListSkeleton (loading state)
- MSSkeleton (image loading skeleton)
- CustomPaint (_PinTailPainter)

**API Calls / Repository Methods:**
- **GameSessionController.locations:** Populated during session initialization (GET /play/session/{id}/locations inferred)
- **GameSessionController.refreshEvidences():** Called on Evidence tab entry in CaseScreen
- **showHintModal(context, sessionId):** Triggered by AppBar hint button → playSessionRepo.hint() inferred

**State / Controllers Consumed:**
- `context.session` (GameSessionController via GameSessionProvider)
- `_selectedIndex` (int?, local state for expanded location)
- `session.locations` (PlayLocations?)
- `session.isLoading` (bool)
- `session.usesSampleCaseFallback` (bool, enables sample location fallback)
- `locations.mapImageUrl` (String?, network map image URL)
- `locations.locations` (List<PlayLocation>, server locations)
- `PlayLocation.name, .floor, .imageUrl, .unlockedEvidenceCount, .totalEvidenceCount`

**Navigation In/Out:**
- **Entry:** CaseScreen tab 0 (Scene tab)
- **Exit:** CaseScreen bottom nav → other tabs
- **Internal:** Location card tap → setState(_selectedIndex) → show/hide image preview

**Pixel Notes - Layout:**
- Horizontal padding: sp4 (16dp)
- Top gap: sp4
- Map aspect: 4:3
- Map border: line color, r4, Clip.hardEdge
- Map bg: bgElev
- Location card gap: sp2 (8dp)
- Location card padding: sp3 (12dp)
- Location card border: r3
- Location icon: 18px
- Location name font: 13px w500
- Floor gap: 2dp (hardcoded)
- Evidence pill: tone mute
- Image height: 160px
- Image border: r4
- Bottom gap: sp10

**Pixel Notes - Selection Animation:**
- Unselected: c.bg bg, line border
- Selected: primarySoft bg, primary border
- Duration: dur2 (200ms)
- Curve: easeOut
- Border radius: r3

**Pixel Notes - Sample Pin:**
- Circle: 24×24, gradient tealBase→skyBase, r(circle), 2px ink0 border, boxShadow (primary 0.4 alpha, blur 6, spread 1)
- Icon: person, 12px, ink0
- Tail: 8×6 triangle, custom paint

**Pixel Notes - AppBar:**
- Elevation: 0
- backgroundColor: transparent
- titleSpacing: sp4
- Hint icon: 20px, primary

---

## 4. SCENE MAP (Reusable Component)
**Files:** `/Users/superstar/my-claude-project/팀프로젝트 튜터링 에이전트/2026_sparta_backend-3/project4-final/Team6/project-fe/lib/screens/scene_map.dart`, `scene_map_dot.dart`

**Purpose:** Reusable interactive floor plan widget with evidence marker dots overlaid on background image; supports proportional positioning via LayoutBuilder.

**SceneMap Widget:**
- **AspectRatio(16:9)**
  - **LayoutBuilder (box constraints) → Stack (fit: StackFit.expand)**
    - SceneMapBackground (imageUrl)
    - ...markers.map((m) => Positioned(
      - left: m.x × box.maxWidth - sp3,
      - top: m.y × box.maxHeight - sp3,
      - child: SceneMarkerDot(marker, onMarkerTap)
    - ))

**SceneMapBackground Sub-Component:**
- **If url != null && !empty:**
  - Image.network (fit: cover):
    - loadingBuilder: SceneMapFallback(loading: true)
    - errorBuilder: SceneMapFallback(loading: false)
- **Else:**
  - SceneMapFallback(loading: false)

**SceneMapFallback Sub-Component:**
- **ColoredBox (color: bgElev)**
  - **Center:**
    - If loading: CircularProgressIndicator (strokeWidth: sp1, color: primary)
    - Else: Column (mainAxisSize: min):
      - Icon (map_outlined, sp12, textMute)
      - SizedBox(height: sp2)
      - Text ("현장 지도 없음", AppText.monoLabel, textMute)

**SceneMarker Data Model:**
- `id` (String, evidence ID for callback)
- `label` (String, short label displayed below dot)
- `x` (double, 0.0–1.0 relative horizontal position)
- `y` (double, 0.0–1.0 relative vertical position)
- `isUnlocked` (bool, default: true)

**SceneMarkerDot Widget:**
- **GestureDetector (onTap: marker.isUnlocked ? onTap(id) : null)**
  - **Column (mainAxisSize: min):**
    - **Container (sp6×sp6, r(pill), border: r1 width)**
      - bg: primarySoft if unlocked else bgHover
      - border color: primary if unlocked else textMute
      - **Icon (location_on or lock_outline, sp3+sp1, color: primary or textMute)**
    - SizedBox(height: sp1)
    - **Container (chipPadH/V padding, bgElev bg, r2)**
      - Text (label, AppText.monoLabel, fsXs, color: primary or textMute)

**_PinTailPainter (CustomPainter from scene_map_dot.dart):**
- Draws downward-pointing triangle
- Canvas operations: moveTo → lineTo → lineTo → close
- Paint color: marker color

**Key Components Used:**
- Image.network (with loadingBuilder/errorBuilder)
- LayoutBuilder (proportional positioning)
- SceneMapFallback (bgElev placeholder)
- CustomPaint (_PinTailPainter)

**API Calls:** None (static widget)

**State:**
- `markers` (List<SceneMarker>)
- `imageUrl` (String?, optional network URL)
- `onMarkerTap` (ValueChanged<String>?, callback with marker ID)

**Navigation:** onMarkerTap callback invoked with marker.id

**Pixel Notes:**
- Aspect ratio: 16:9
- Marker circle: sp6×sp6 (24×24dp)
- Marker icon: sp3+sp1 (14dp)
- Marker border: r1 (1px)
- Marker radius: rPill (999dp, fully circular)
- Label badge: chipPadH/V padding, r2 (8dp)
- Label text: fsXs (11px), monoLabel
- Label height: 1.0 (tightly packed)
- Unlocked color: primary
- Locked color: textMute
- Unlocked bg: primarySoft
- Locked bg: bgHover

---

## 5. EVIDENCE SCREEN
**File:** `/Users/superstar/my-claude-project/팀프로젝트 튜터링 에이전트/2026_sparta_backend-3/project4-final/Team6/project-fe/lib/screens/evidence_screen.dart`

**Purpose:** Filterable, searchable evidence list supporting full-text search (name + location) and status-based filtering (All/Acquired/Locked); sorting by unlock status, locked flag, and newness.

**Layout Structure:**
- **Scaffold (backgroundColor: c.bg)**
  - **Body (AnimatedBuilder on context.session)**
    - **SafeArea → Padding(sp4 h) → Column (crossAxisAlignment: stretch)**
      - SizedBox(height: sp4)
      - **MSTextField (search input)**
        - controller: _searchCtrl
        - hintText: "증거 이름 · 장소 검색…"
        - suffixIcon: Icons.search
        - onChanged: setState(_query = v.trim())
      - SizedBox(height: sp3)
      - **SingleChildScrollView (horizontal)**
        - **Row of MSFilterChip**
          - For each _Filter.values (all/acquired/locked):
            - Padding(right: sp2 if not last):
              - MSFilterChip (label, active: _filter == f, onTap: setState(_filter = f))
      - SizedBox(height: sp4)
      - **MSKicker ("사건 증거 보드")**
      - SizedBox(height: sp3)
      - **Expanded:**
        - **Conditional rendering:**
          - If loading && results.isEmpty:
            - MSListSkeleton (itemHeight: 76)
          - Else if error && results.isEmpty:
            - MSEmpty (cloud_off icon, "불러오지 못했습니다", error message, retry button)
          - Else if results.isEmpty:
            - MSEmpty (search_off icon, "일치하는 증거가 없습니다")
          - Else:
            - **ListView.separated (BouncingScrollPhysics)**
              - itemCount: results.length
              - separatorBuilder: SizedBox(height: sp2)
              - itemBuilder (_, i):
                - EvidenceTile (evidence: e, isTimeLocked, isNewlyUnlocked)
              - padding: bottom sp10

**_Filter Enum & Logic:**
- **all:** Show all evidences
- **acquired:** Show unlocked evidences (!isTimeLocked)
- **locked:** Show time-locked evidences (isLocked && !unlockedIds.contains(id))

**_filtered() Method (sorting & filtering):**
1. Sort by: unlocked status (first) → locked status (second) → newness (third)
2. Filter by: search query && filter type

**Key Components Used:**
- MSTextField (search input with icon)
- MSFilterChip (active state toggle)
- MSKicker (section header)
- EvidenceTile (from components folder, custom evidence card)
- MSListSkeleton (loading skeleton, 76px height)
- MSEmpty (error/empty states)
- ListView.separated (scrollable list with separators)

**API Calls / Repository Methods:**
- **GameSessionController.evidences:** List loaded during session init
- **GameSessionController.refreshEvidences():** Called on Evidence tab entry (index 1) in CaseScreen
- **GameSessionController.unlockedEvidenceIds:** Set of time-unlocked IDs

**State / Controllers Consumed:**
- `_searchCtrl` (TextEditingController)
- `_query` (String, trimmed search text)
- `_filter` (_Filter enum)
- `context.session.evidences` (List<Evidence>)
- `context.session.unlockedEvidenceIds` (Set<String>)
- `_filtered()` returns sorted/filtered list

**Navigation In/Out:**
- **Entry:** CaseScreen tab 1 (Evidence tab)
- **Exit:** CaseScreen nav to other tabs
- **Internal:** EvidenceTile tap → EvidenceDetailScreen push

**Pixel Notes - Layout:**
- Padding: sp4 horizontal (16dp)
- Top gap: sp4
- Search field: standard MSTextField
- Filter gap: sp2 between chips
- Section kicker: sp3 below
- Tile gap: sp2 between items
- Bottom padding: sp10

**Pixel Notes - Tiles:**
- Height: 76dp (per MSListSkeleton itemHeight)
- Status indicators: locked/new/unlocked badges

---

## 6. EVIDENCE DETAIL SCREEN
**File:** `/Users/superstar/my-claude-project/팀프로젝트 튜터링 에이전트/2026_sparta_backend-3/project4-final/Team6/project-fe/lib/screens/evidence_detail_screen.dart`

**Purpose:** Full evidence detail view with optional server-fetched guidance (reading points, related suspects, related timeline events, compare evidences, suggested questions); status badges; image viewer with Hero transition; CTAs for interrogation and evidence presentation flows.

**Layout Structure:**
- **Scaffold (backgroundColor: c.bg)**
  - **AppBar**
    - elevation: 0, scrolledUnderElevation: 0
    - backgroundColor: AppColors.transparent
    - automaticallyImplyLeading: false
    - titleSpacing: AppTokens.sp4
    - leading: IconButton (icon: Icons.arrow_back, color: c.text)
    - title: Text ("EVIDENCE", AppText.monoLabel, textMute)

  - **SafeArea → Padding(sp4 h) → SingleChildScrollView (BouncingScrollPhysics) → Column (crossAxisAlignment: stretch)**
    - SizedBox(height: sp6)
    - **EvidenceHero Component**
      - Center: GestureDetector (tap → ImageViewerModal.show):
        - AssetImageWidget (86×86, r6, fallback: gradient box with icon)
    - SizedBox(height: sp4)
    - **Center: Title**
      - Text (_effectiveLocked ? "잠긴 증거" : evidence.name, AppText.titleL, c.text, centered)
    - SizedBox(height: sp2)
    - **Center: Location**
      - Text (_effectiveLocked ? "해금 후 위치 정보가 공개됩니다" : evidence.location, AppText.monoLabel, textMute/textSub, centered)
    - SizedBox(height: sp6)
    - **EvidenceStatusRow**
      - Center Row with MSPill (statusLabel, dynamic tone)
    - SizedBox(height: sp6)
    - **ObservationCard**
      - Container (sp4 padding, bgElev bg, line border, r4):
        - **MSKicker ("관찰 정보")**
        - SizedBox(height: sp3)
        - [if loading]:
          - Row: MSSpinner(14) + SizedBox(sp3) + Text("상세 정보를 불러오는 중…", bodySm, textSub)
        - [else]:
          - Text (description OR fallback, body, h: 1.6, c.text)
        - [if !effectiveLocked && relatedSuspects.isNotEmpty]:
          - SizedBox(height: sp4)
          - MSKicker("관련 용의자")
          - SizedBox(height: sp2)
          - Wrap(spacing: sp2, runSpacing: sp2):
            - ...relatedSuspects.map((s) => MSPill(s.name, tone: primary))
        - [if !effectiveLocked && relatedTimelineEvents.isNotEmpty]:
          - SizedBox(height: sp4)
          - MSKicker("관련 타임라인")
          - SizedBox(height: sp2)
          - ...relatedTimelineEvents.map((e) => EvidenceTimelineRow(time, title))
        - [if !effectiveLocked && guidance != null]:
          - [if readingPoints.isNotEmpty]:
            - SizedBox(height: sp4)
            - MSKicker("이 증거에서 볼 점")
            - SizedBox(height: sp2)
            - ...readingPoints.map((point) => Row(icon bullet + text, h: 1.6))
          - [if compareEvidences.isNotEmpty]:
            - SizedBox(height: sp4)
            - MSKicker("함께 볼 증거")
            - SizedBox(height: sp2)
            - ...compareEvidences.map((ce) => GestureDetector(tap if unlocked + onCompareEvidenceTap):
              - Row(icon + title + chevron if unlocked)
          - [if suggestedQuestions.isNotEmpty]:
            - SizedBox(height: sp4)
            - MSKicker("추천 질문")
            - SizedBox(height: sp2)
            - ...suggestedQuestions.map((q) => GestureDetector(tap if onSuggestedQuestionTap):
              - Row(icon + "[target에게] question" + chevron)
    - [if !effectiveLocked && onInterrogate]:
      - SizedBox(height: sp6)
      - _CtaButton (label: "용의자 심문하기", icon: gavel_outlined, onPressed: pop then onInterrogate)
    - [if !effectiveLocked && onPresent]:
      - SizedBox(height: sp6)
      - _CtaButton (label: "이 증거 제시하기", icon: send, onPressed: pop then onPresent)
    - SizedBox(height: sp10)

**_CtaButton Sub-Component:**
- **InkWell (borderRadius: r3)**
  - **Ink (padding: sp3 v, sp4 h, primarySoft bg, primary border, r3)**
    - **Row (mainAlignment: center):**
      - Icon (icon, 16px, primary)
      - SizedBox(width: sp2)
      - Text (label, body, w600, primary)

**_effectiveLocked Computed:**
- `evidence.isLocked && !isUnlocked`

**_statusLabel Computed:**
- If isUnlocked && isLocked: "해금"
- If effectiveLocked: "잠김"
- If isNew: "신규"
- Else: "확보됨"

**Key Components Used:**
- EvidenceHero (86×86 AssetImageWidget + Hero tag)
- EvidenceStatusRow (MSPill with dynamic tone)
- ObservationCard (container with nested guidance sections)
- MSKicker (section headers)
- MSPill (related suspects, compare evidences)
- EvidenceTimelineRow (time + title row)
- _CtaButton (interactive button row)
- ImageViewerModal (full-screen viewer with pinch-zoom)
- MSSpinner (loading state in observation card)

**API Calls / Repository Methods:**
- **playSessionRepo.evidenceDetail(sessionId, evidenceId):** Fetches detailed guidance if unlocked && sessionId exists
  - Response includes: description, relatedSuspects, relatedTimelineEvents, guidance (readingPoints, compareEvidences, suggestedQuestions)

**State / Controllers Consumed:**
- `_detail` (EvidenceDetail?, fetched on mount if conditions met)
- `_loadingDetail` (bool)
- `widget.evidence` (Evidence model)
- `widget.controller` (GameSessionController, safe injection from parent)
- `widget.isUnlocked` (bool, time-unlock flag)
- `widget.listData` (PlayEvidence?, fallback if detail API not called)
- `widget.sessionId` (int?, for detail API)
- `widget.onInterrogate` (VoidCallback?, navigates to interrogation)
- `widget.onPresent` (VoidCallback?, navigates to presentation flow)
- `_effectiveLocked` (computed: isLocked && !isUnlocked)
- `_description` (String?, from _detail or listData)
- `_relatedSuspects` (List<RelatedSuspect>)
- `_relatedTimelineEvents` (List<RelatedTimelineEvent>)
- `_guidance` (EvidenceGuidance?)

**Navigation In/Out:**
- **Entry:** EvidenceTile tap in Evidence screen
- **Exit:** Back button (navigator.pop())
- **Internal (if CTAs present):**
  - Compare evidence row tap → push EvidenceDetailScreen (nested same controller)
  - Suggested question row tap → push InterrogationChatScreen (with prefill + evidence binding)

**Pixel Notes - Layout:**
- Padding: sp4 horizontal (16dp)
- Top gap: sp6
- Hero size: 86×86
- Hero gap: sp4
- Title centered, titleL style
- Location centered, monoLabel style
- Status gap: sp6
- Observation card: sp4 padding, bgElev bg, line border, r4
- Section kicker: sp3 below
- Description text: body h: 1.6
- Subsection gap: sp4 (between guidance sections)
- Related items: sp2 gap before
- CTA button gap: sp6

**Pixel Notes - Observation Card:**
- bg: bgElev
- border: line color, 1px
- radius: r4
- padding: sp4 (16dp)
- Description: body h: 1.6

**Pixel Notes - _CtaButton:**
- bg: primarySoft
- border: primary, 1px
- radius: r3
- padding: sp3 v (12dp), sp4 h (16dp)
- Icon: 16px, primary
- Gap: sp2 (8dp)
- Text: body w600, primary

**Pixel Notes - Status Pill:**
- Tone mapping:
  - "해금" / "확보됨" → success tone
  - "신규" → primary tone
  - "잠김" → mute tone

---

## 7. EVIDENCE DETAIL WIDGETS & META
**Files:** `evidence_detail_widgets.dart`, `evidence_detail_meta.dart`

**Purpose:** Reusable sub-components for evidence detail screen: hero image container, status badge row, observation card with nested guidance, timeline row, metadata cell.

**EvidenceHero Sub-Component:**
- **Center:**
  - GestureDetector (tap → ImageViewerModal.show):
    - AssetImageWidget (86×86, r6, fallback: gradient 86×86 with icon)
      - Fallback gradient: LinearGradient(tealBase → skyBase)
      - Fallback icon: evidence.icon (34px, ink0)
      - Border: 1px ink0 0.14 alpha

**EvidenceStatusRow Sub-Component:**
- **Center: Row (mainAxisSize: min)**
  - MSPill (statusLabel, tone: _tone(statusLabel))
    - Tone logic: success (해금/확보됨), primary (신규), mute (other)

**ObservationCard Sub-Component:**
- **Container (sp4 padding, bgElev bg, line border, r4)**
  - **Column (crossAxisAlignment: stretch):**
    - MSKicker("관찰 정보")
    - SizedBox(height: sp3)
    - [if loading]:
      - Row: MSSpinner(14) + SizedBox(sp3) + Text("상세 정보를 불러오는 중…", bodySm, textSub)
    - [else]:
      - Text (description, body, h: 1.6, c.text)
    - [if !effectiveLocked && relatedSuspects.isNotEmpty]:
      - SizedBox(height: sp4)
      - MSKicker("관련 용의자")
      - SizedBox(height: sp2)
      - Wrap(spacing: sp2, runSpacing: sp2):
        - ...suspects.map((s) => MSPill(s.name, tone: primary))
    - [if !effectiveLocked && relatedTimelineEvents.isNotEmpty]:
      - SizedBox(height: sp4)
      - MSKicker("관련 타임라인")
      - SizedBox(height: sp2)
      - ...events.map((e) => EvidenceTimelineRow(e.time, e.title))
    - [if !effectiveLocked && guidance != null]:
      - Reading points section
      - Compare evidences section
      - Suggested questions section

**EvidenceTimelineRow Sub-Component:**
- **Padding(bottom: sp2)**
  - **Row (crossAxisAlignment: start):**
    - Text (time, AppText.monoNum, 13px, primary, h: 1.5)
    - SizedBox(width: sp3)
    - **Expanded:** Text (title, body, c.text, h: 1.5)

**EvidenceMetaCell Sub-Component:**
- **Container (sp3 padding, bg bg, line border, r3)**
  - **Column (crossAxisAlignment: start):**
    - Text (label, AppText.monoLabel, textMute, fsSm)
    - SizedBox(height: sp1)
    - Text (value, AppText.bodySm, c.text, w700)

**Pixel Notes - Spacing & Colors:**
- Container borders: line color 1px
- Container radius: r4 (card), r3 (meta cell)
- Container padding: sp4 (card), sp3 (meta cell)
- Section gaps: sp4
- Item gaps: sp2 (wrap), sp2 (timeline rows)
- Text colors: primary (interactive), success (confirmed), textMute (secondary)
- Text styles: body h: 1.6, monoNum 13px, monoLabel fsSmall

---

## 8. EVIDENCE IMAGE VIEWER
**File:** `/Users/superstar/my-claude-project/팀프로젝트 튜터링 에이전트/2026_sparta_backend-3/project4-final/Team6/project-fe/lib/screens/evidence_image_viewer.dart`

**Purpose:** Full-screen immersive image viewer with pinch-zoom, interactive overlay toggle (title/location bars), Hero transition fade from thumbnail.

**Layout Structure:**
- **Scaffold (backgroundColor: AppColors.ink950)**
  - **GestureDetector (onTap: _toggleOverlay)**
    - **Stack (fit: StackFit.expand)**
      - **Center: InteractiveViewer (minScale: 0.8, maxScale: 4.0)**
        - **Hero (tag: widget.heroTag)**
          - AssetImageWidget (fit: contain, ink950 bg)

      - **Positioned (top: 0, left: 0, right: 0)**
        - **IgnorePointer (ignoring: !_overlayVisible)**
          - **FadeTransition (opacity: _fadeAnim)**
            - Container (BoxDecoration: Gradient(ink950→transparent, top-to-bottom)):
              - **SafeArea:**
                - Padding(sp4 h, sp3 v):
                  - **Row:**
                    - IconButton (Icons.close, ink50, onPressed: pop)
                    - SizedBox(width: sp2)
                    - **Expanded Column (start, min):**
                      - Text (title, AppText.titleM, 15px, ink50, maxLines 1 ellipsis)
                      - [if categoryLabel]:
                        - Text (categoryLabel.toUpperCase(), AppText.monoLabel, skyBase, h: 1.2)

      - **Positioned (bottom: 0, left: 0, right: 0)**
        - **IgnorePointer (ignoring: !_overlayVisible)**
          - **FadeTransition (opacity: _fadeAnim)**
            - Container (BoxDecoration: Gradient(ink950→transparent, bottom-to-top)):
              - **SafeArea (top: false):**
                - Padding(sp4):
                  - **Row:**
                    - Icon (Icons.location_on_outlined, 14px, ink400)
                    - SizedBox(width: sp1)
                    - Text (location, AppText.monoLabel, ink400, h: 1.0)

**AnimationController Setup (in initState):**
- Create AnimationController (vsync, duration: dur2)
- Create CurvedAnimation (parent: ctrl, curve: easeOut)
- Start forward on init (visible by default)

**_toggleOverlay Method:**
- Flip _overlayVisible bool
- If visible: ctrl.forward() with animation
- If not visible: ctrl.reverse() with animation

**Key Components Used:**
- InteractiveViewer (pinch-zoom, min/max scale)
- Hero (smooth transition)
- FadeTransition (overlay fade on tap)
- AssetImageWidget (network/asset loading)
- Gradients (dark overlays top & bottom)
- SafeArea (for notches/safe areas)

**API Calls:** None (static viewer)

**State / Controllers Consumed:**
- AnimationController (_fadeCtrl)
- Animation<double> (_fadeAnim)
- bool _overlayVisible
- AppMotion.dur2 (fade duration)

**Navigation In/Out:**
- **Entry:** EvidenceHero tap (ImageViewerModal.show context)
- **Exit:** Close button (pop) or back gesture

**Pixel Notes - Colors:**
- Background: ink950 (dark, nearly black)
- Gradient overlays: ink950 → transparent (top & bottom)
- Title text: ink50 (light)
- Category label: skyBase (accent blue)
- Location icon/text: ink400 (mid-gray)

**Pixel Notes - Typography:**
- Title: AppText.titleM 15px, ink50, maxLines 1 ellipsis
- Category: AppText.monoLabel, skyBase, h: 1.2
- Location: AppText.monoLabel, ink400, h: 1.0

**Pixel Notes - Layout:**
- Top overlay padding: sp4 h (16dp), sp3 v (12dp)
- Bottom overlay padding: sp4 (16dp)
- Title: 15px (not 16px standard)
- Location icon: 14px
- Location text: h: 1.0 (tightly packed)

**Pixel Notes - Interactions:**
- Interactive viewer: minScale 0.8, maxScale 4.0, contain fit
- Overlay fade: dur2 (200ms) easeOut
- Tap toggles overlay visibility with animation

---

## 9. SUSPECTS SCREEN
**File:** `/Users/superstar/my-claude-project/팀프로젝트 튜터링 에이전트/2026_sparta_backend-3/project4-final/Team6/project-fe/lib/screens/suspects_screen.dart`

**Purpose:** Searchable, filterable suspects/witnesses list with stats (count of suspects, witnesses, interrogation count) and card-based navigation to detail screens.

**Layout Structure:**
- **Scaffold (backgroundColor: c.bg)**
  - **Body (AnimatedBuilder on context.session)**
    - **SafeArea → Padding(sp4 h) → Column (crossAxisAlignment: stretch)**
      - SizedBox(height: sp4)
      - **MSTextField (search input)**
        - hintText: "용의자 이름 · 직책 검색…"
        - suffixIcon: Icons.search
        - onChanged: setState(_query = v.trim())
      - SizedBox(height: sp3)
      - **Row of MSFilterChip**
        - _SuspectFilter.values (all/suspect/witness)
        - sp2 gap, rPill border
        - onTap: setState(_filter)
      - SizedBox(height: sp4)
      - **MSStatRow([StatCell, StatCell, StatCell])**
        - StatCell('용의자', '${suspectCount}명')
        - [if witnessCount > 0]: StatCell('증인', '${witnessCount}명')
        - StatCell('심문 횟수', '${ctrl.dashboard?.interrogationCount ?? 0}회')
      - SizedBox(height: sp4)
      - **MSKicker ("모든 인물")**
      - SizedBox(height: sp3)
      - **Expanded → _buildBody:**
        - If loading && empty: MSListSkeleton (itemHeight: 84)
        - Else if error && empty: MSEmpty (cloud_off, "불러오지 못했습니다", error, retry button)
        - Else if empty: MSEmpty (person_off, "인물이 없습니다")
        - Else: ListView.separated (BouncingScrollPhysics)
          - itemCount: results.length
          - separatorBuilder: SizedBox(height: sp3)
          - itemBuilder: SuspectCard (tap → SuspectDetailScreen push)
          - padding: bottom sp10

**_SuspectFilter Enum & Logic:**
- **all:** Show all suspects
- **suspect:** Show only suspects (!isWitness)
- **witness:** Show only witnesses (isWitness)

**_filtered() Method:**
1. Sort: witnesses last (isWitness flag), then alphabetical
2. Filter: by query (name or role) && filter type

**Key Components Used:**
- MSTextField (search input)
- MSFilterChip (toggle filter state)
- MSStatRow (statistics row with cells)
- MSKicker (section header)
- SuspectCard (from components, custom suspect card)
- MSListSkeleton, MSEmpty (states)
- ListView.separated (scrollable list)

**API Calls / Repository Methods:**
- **GameSessionController.suspects:** List loaded during session init
- **GameSessionController.dashboard.interrogationCount:** Total interrogation count

**State / Controllers Consumed:**
- `_searchCtrl` (TextEditingController)
- `_query` (String, trimmed search)
- `_filter` (_SuspectFilter enum)
- `context.session.suspects` (List<Suspect>)
- `_filtered()` returns sorted/filtered list
- `suspectCount` (computed: count where !isWitness)
- `witnessCount` (computed: count where isWitness)

**Navigation In/Out:**
- **Entry:** CaseScreen tab 2 (Suspects tab)
- **Exit:** CaseScreen nav to other tabs
- **Internal:** SuspectCard tap → SuspectDetailScreen push (wrapped in GameSessionProvider)

**Pixel Notes - Layout:**
- Padding: sp4 horizontal
- Top gap: sp4
- Search field: standard MSTextField
- Filter gap: sp2 between chips
- Stat row: standard MSStatRow layout
- Section kicker: sp3 below
- Suspect card gap: sp3 between items
- Bottom padding: sp10

**Pixel Notes - Sorting:**
- Primary: suspects first (isWitness: false)
- Secondary: witnesses last (isWitness: true)
- Tertiary: alphabetical by name within group

---

## 10. SUSPECT DETAIL SCREEN
**File:** `/Users/superstar/my-claude-project/팀프로젝트 튜터링 에이전트/2026_sparta_backend-3/project4-final/Team6/project-fe/lib/screens/suspect_detail_screen.dart`

**Purpose:** Full suspect profile with Hero avatar, role, personality tone, victim relationship, related evidence list, public statement, alibi, and previous interrogation logs; fixed bottom bar with interrogate and conditional accuse buttons.

**Layout Structure:**
- **Scaffold (backgroundColor: c.bg)**
  - **AppBar (Custom)**
    - elevation: 0, scrolledUnderElevation: 0
    - backgroundColor: AppColors.transparent
    - leading: IconButton (Icons.arrow_back, c.text)
    - title: Text (suspect.isWitness ? "WITNESS" : "SUSPECT", AppText.monoLabel, textMute)

  - **BottomNavigationBar → SuspectDetailBottomBar**
    - suspect: widget.suspect
    - onInterrogationDone: _loadLogs callback

  - **Body → SingleChildScrollView (BouncingScrollPhysics, sp4 h padding) → Column (crossAxisAlignment: stretch)**
    - SizedBox(height: sp6)
    - **Center: Avatar Section**
      - Hero (tag: suspect.id):
        - SuspectLargeAvatar (name, assetKey, isWitness)
      - SizedBox(height: sp3)
      - Text (name, AppText.titleL, c.text)
      - SizedBox(height: sp1)
      - **Row (mainAxisSize: min):**
        - Text (role, AppText.bodySm, textSub)
        - [if isWitness]: SizedBox(width: sp2) + MSPill("증인", tone: mute)
      - [if tone]: SizedBox(height: sp2) + PersonalityBadge(tone)

    - SizedBox(height: sp6)
    - [if relationToVictim]:
      - MSKicker("피해자와의 관계")
      - SizedBox(height: sp3)
      - SuspectInfoCard(text: relationToVictim)

    - [if relatedEvidences.isNotEmpty]:
      - SizedBox(height: sp6)
      - MSKicker("관련 증거")
      - SizedBox(height: sp3)
      - ...related.map((e) => Padding(sp3 b):
        - EvidenceItem(e, onTap: {})

    - SizedBox(height: sp6)
    - MSKicker("진술")
    - SizedBox(height: sp3)
    - SuspectStatementCard (statement, alibi, publicAlibi)

    - [if _logs.isNotEmpty]:
      - SizedBox(height: sp6)
      - MSKicker('이전 심문 · ${_logs.length}건')
      - SizedBox(height: sp3)
      - ..._logs.map((log) => SuspectLogCard(log))

    - SizedBox(height: sp10)

**Key Components Used:**
- SuspectLargeAvatar (80×80 portrait with tap → ImageViewerModal)
- PersonalityBadge (bgHover bg, rPill border, tone text)
- SuspectInfoCard (container with text, sp4 padding)
- SuspectStatementCard (statement + alibi + publicAlibi sections)
- SuspectLogCard (Q/A with optional evidence marker)
- SuspectDetailBottomBar (button row)
- SuspectAccuseDialog (confirmation modal)
- EvidenceItem (related evidence row)
- Hero (smooth avatar transition)
- MSKicker (section headers)
- MSPill (witness badge, tone: mute)

**API Calls / Repository Methods:**
- **playSessionRepo.interrogationLogs(sessionId, suspectId):** Fetched on didChangeDependencies
  - Returns List<InterrogationResult> with question/answer pairs

**State / Controllers Consumed:**
- `_logsLoaded` (bool, ensures single fetch)
- `_logs` (List<InterrogationResult>)
- `context.session` (GameSessionController)
- `context.sessionRead.backendSessionId` (for interrogation logs API)
- `widget.suspect` (Suspect model)
- `raw` (PlaySuspect?, fetched via context.session.rawSuspect)

**Navigation In/Out:**
- **Entry:** SuspectCard tap in Suspects screen
- **Exit:** Back button → Suspects screen
- **Internal:**
  - Interrogate button → push InterrogationChatScreen
  - Accuse button → show SuspectAccuseDialog → push SubmitScreen(initialSuspect)

**Pixel Notes - Avatar Section:**
- Avatar size: 80×80
- Avatar border: r5
- Avatar gap: sp3 (below)
- Name: titleL, centered
- Role gap: sp1
- Witness badge: MSPill mute tone
- Personality badge: sp2 (above)

**Pixel Notes - Cards:**
- InfoCard: sp4 padding, bgElev bg, line border, r6
- StatementCard: sp4 padding, bgElev bg, line border, r6
- LogCard: sp3 padding, bgElev bg, line border, r4, margin sp2

**Pixel Notes - Evidence Items:**
- Gap: sp3 between items
- EvidenceItem: standard layout from components

---

## 11. SUSPECT DETAIL CARDS & WIDGETS
**Files:** `suspect_detail_cards.dart`, `suspect_detail_widgets.dart`

**Purpose:** Reusable cards and widgets for suspect detail: statements, interrogation logs, info boxes, personality badges, avatar components.

**SuspectStatementCard Sub-Component:**
- **Container (sp4 padding, bgElev bg, line border, r6)**
  - **Column (crossAxisAlignment: start):**
    - Text (quoted statement OR "아직 확보된 진술이 없습니다.", body, c.text, h: 1.6)
    - [if alibi]:
      - SizedBox(height: sp3)
      - Text ("알리바이", AppText.monoLabel, textMute)
      - SizedBox(height: sp1)
      - Text (alibi, bodySm, textSub, h: 1.5)
    - [if publicAlibi]:
      - SizedBox(height: sp3)
      - Text ("공개 알리바이", AppText.monoLabel, textMute)
      - SizedBox(height: sp1)
      - Text (publicAlibi, bodySm, textSub, h: 1.5)

**SuspectLogCard Sub-Component:**
- **Container (margin sp2, padding sp3, bgElev bg, line border, r4)**
  - **Column (crossAxisAlignment: start):**
    - [if presentedEvidence]:
      - Row (mainAxisSize: min):
        - Icon (Icons.description_outlined, 12px, success)
        - SizedBox(width: sp1)
        - Flexible: Text ('증거 제시 · ${title}', monoLabel fsXxs, success, maxLines 1 ellipsis)
      - SizedBox(height: sp1)
    - Text ('Q. ${question}', bodySm, primary, w600, h: 1.5)
    - SizedBox(height: sp1)
    - Text ('A. ${answer}', bodySm, textSub, h: 1.5)

**SuspectInfoCard Sub-Component:**
- **Container (sp4 padding, bgElev bg, line border, r6)**
  - Text (text, body, c.text, h: 1.6)

**SuspectLargeAvatar Sub-Component:**
- **GestureDetector (tap if hasImage → ImageViewerModal.show)**
  - CharacterPortrait (name, assetKey, r5, isWitness flag)

**PersonalityBadge Sub-Component:**
- **Container (sp2 h, sp1 v padding, bgHover bg, rPill border)**
  - Text (tone, AppText.monoLabel, textMute, fsSm, h: 1.0)

**CharacterPortrait Sub-Component:**
- Custom avatar widget with gradient fallback, Hero support, witness indicator

**Pixel Notes - Spacing & Colors:**
- Card padding: sp4 (info, statement), sp3 (log)
- Card margin: sp2 (log)
- Card border: line color, 1px
- Card radius: r6 (info, statement), r4 (log)
- Text colors: text (primary), textSub (secondary), primary (questions), success (evidence)
- Text styles: body h: 1.6, bodySm h: 1.5, monoLabel fsXxs (evidence marker)
- Icon: 12px (evidence), primary/success/textMute colors

---

## 12. SUSPECT DETAIL BOTTOM BAR
**File:** `/Users/superstar/my-claude-project/팀프로젝트 튜터링 에이전트/2026_sparta_backend-3/project4-final/Team6/project-fe/lib/screens/suspect_detail_bottom_bar.dart`

**Purpose:** Fixed bottom button bar with back, interrogate, and conditional accuse buttons; shows confirmation dialog before submit transition.

**Layout Structure:**
- **SafeArea (top: false)**
  - Padding(sp4 h, sp3 v):
    - **Row:**
      - **Expanded:** MSButton ("뒤로", secondary, expanded: true, onPressed: pop)
      - SizedBox(width: sp3)
      - **Expanded (flex: 2):** MSButton ("심문하기", primary, expanded: true, onPressed: _openInterrogation)
      - [if !isWitness]:
        - SizedBox(width: sp3)
        - **Expanded:** MSButton ("범인 지목", danger, expanded: true, onPressed: _showConfirmDialog)

**_openInterrogation Method:**
- Push InterrogationChatScreen (wrapped in GameSessionProvider)
- await navigation
- Call onInterrogationDone callback to refresh logs

**_showConfirmDialog Method:**
- showDialog(SuspectAccuseDialog):
  - suspect, controller, navigator passed

**SuspectAccuseDialog Sub-Component:**
- **Dialog (backgroundColor: bgElev, shape: r6 border)**
  - Padding(sp6):
    - **Column (mainAxisSize: min, crossAxisAlignment: stretch):**
      - Text ("범인 지목", AppText.titleM, c.text)
      - SizedBox(height: sp3)
      - Text ("${suspect.name}을(를) 범인으로 지목하고 최종 추리를 작성합니다.\n범행 동기·방법·제출 증거를 입력해야 제출할 수 있습니다.", body, textSub, h: 1.6)
      - SizedBox(height: sp6)
      - **Row (2 buttons):**
        - Expanded: MSButton ("취소", secondary, expanded: true, onPressed: pop)
        - SizedBox(width: sp3)
        - Expanded: MSButton ("추리 작성", danger, expanded: true, onPressed: pop then push SubmitScreen)

**Key Components Used:**
- MSButton (primary/secondary/danger variants)
- SuspectAccuseDialog (modal confirmation)
- GameSessionProvider (context for interrogation screen)

**API Calls:** None (navigation only)

**State / Controllers Consumed:**
- widget.suspect (Suspect model, isWitness flag)
- onInterrogationDone (VoidCallback?, invoked after pop)
- context.sessionRead (GameSessionController)

**Navigation In/Out:**
- **Interrogate:** Push InterrogationChatScreen → await pop → onInterrogationDone
- **Accuse:** showDialog(SuspectAccuseDialog) → "추리 작성" button → push SubmitScreen(initialSuspect)

**Pixel Notes - Layout:**
- SafeArea: top: false
- Padding: sp4 h (16dp), sp3 v (12dp)
- Button gaps: sp3 (12dp between buttons)
- Interrogate flex: 2 (wider than back)
- Dialog padding: sp6 (24dp)
- Dialog shape: r6 border (24dp radius)

---

## 13. INTERROGATION CHAT SCREEN
**File:** `/Users/superstar/my-claude-project/팀프로젝트 튜터링 에이전트/2026_sparta_backend-3/project4-final/Team6/project-fe/lib/screens/interrogation_chat_screen.dart`

**Purpose:** Real-time Q&A chat interface with suspect, support for evidence presentation, prefilled question loading from guidance, streaming AI responses with optional suggested question chips.

**Layout Structure:**
- **Scaffold (backgroundColor: c.bg)**
  - **AppBar → InterrogationAppBar**
    - Back button + Suspect name (titleM) + Role (bodySm)
    - Actions: Hint icon + Evidence button

  - **Column:**
    - **Expanded: ListView.separated (scrollCtrl, BouncingScrollPhysics)**
      - itemCount: messages.length + (isWaiting ? 1 : 0)
      - separatorBuilder: SizedBox(height: sp2)
      - itemBuilder (_, i):
        - If i == messages.length && isWaiting: WaitingBubble
        - Else: message = messages[i]
          - If detective: DetectiveBubble (primarySoft/successSoft, evidence marker if evidenceId)
          - Else: SuspectBubble (bgElev, avatar gradient)
      - padding: sp4 h/v

    - [if suggestedQuestions.isNotEmpty]:
      - SuggestedQuestionsBar (horizontal chips, onPrefill)

    - InterrogationInputBar
      - controller: inputCtrl
      - prefillEvidenceTitle: prefillEvidenceTitle
      - onClearPrefill: _clearPrefill
      - onSend: sendMessage with computed questionType
      - onPresentEvidence: presentEvidence (disabled if isWaiting)
      - disabled: isWaiting

**Key Components Used:**
- InterrogationAppBar (custom AppBar)
- SuspectBubble (avatar + text, asymmetric border)
- DetectiveBubble (text, evidence marker if present)
- WaitingBubble (spinner avatar + bubble)
- SuggestedQuestionsBar (horizontal chips)
- InterrogationInputBar (text field + buttons)
- InterrogationActionsMixin (sendMessage, presentEvidence, scrollToBottom methods)

**API Calls / Repository Methods:**
- **playSessionRepo.interrogate(sessionId, suspectId, questionType, question, presentedEvidenceId):**
  - Returns: { answer, unlockedEvidences }
  - Called on message send
- **showHintModal(context, sessionId):** Via hint button → playSessionRepo.hint

**State / Controllers Consumed:**
- InterrogationActionsMixin provides:
  - sendMessage(text, evidenceId?, questionType)
  - presentEvidence()
  - onChipPrefill(SuggestedQuestionInfo)
  - scrollToBottom()
- Local state:
  - messages (List<InterrogationMessage>)
  - isWaiting (bool)
  - inputCtrl, scrollCtrl (controllers)
  - prefillEvidenceId, prefillEvidenceTitle, prefillQuestionType
  - _initialized, _lastPrefilledText (local tracking)
- Widget props:
  - suspect (Suspect)
  - suggestedQuestions (List<SuggestedQuestionInfo>)
  - initialQuestion, initialQuestionType, presentedEvidenceId, presentedEvidenceTitle (optional prefill)

**Navigation In/Out:**
- **Entry:** SuspectDetailBottomBar interrogate button OR evidence detail suggested question
- **Exit:** Back button (pop) → SuspectDetailScreen (onInterrogationDone callback triggers log refresh)
- **Internal:**
  - Evidence button → showEvidencePresentModal → prefill evidence
  - Suggested question chip → onChipPrefill (input fill, no send)

**Pixel Notes - Layout:**
- AppBar icons: 20px, primary color
- Message bubbles: sp4 padding total (16dp horizontal, 16dp vertical)
- Message separators: sp2 gap (8dp)
- Suspect avatar: sp6×sp6 (24×24), gradient tealBase→skyBase, monoLabel fsXxs initial
- Detective bubble: primarySoft bg + primary border (evidence), successSoft bg + success border (evidence presented)
- Evidence marker: 12px icon (success) + monoLabel fsXxs label
- Waiting bubble: bgHover avatar, bgElev bubble, MSSpinner (sp4, textMute)
- Suggested chips: sp2 gap (8dp) between
- Scroll animation: dur3 easeOut

---

## 14. INTERROGATION APP BAR
**File:** `/Users/superstar/my-claude-project/팀프로젝트 튜터링 에이전트/2026_sparta_backend-3/project4-final/Team6/project-fe/lib/screens/interrogation_app_bar.dart`

**Purpose:** Custom AppBar for interrogation screen with suspect name/role and action buttons (hint, evidence presentation).

**Layout Structure:**
- **AppBar (transparent, kToolbarHeight)**
  - elevation: 0, scrolledUnderElevation: 0
  - backgroundColor: AppColors.transparent
  - **leading:** IconButton (Icons.arrow_back, c.text)
  - **title: Column (crossAxisAlignment: start, mainAxisSize: min)**
    - Text (suspect.name, AppText.titleM, c.text, maxLines 1 ellipsis)
    - Text (suspect.role, AppText.bodySm, textSub, maxLines 1 ellipsis)
  - **actions:**
    - IconButton (Icons.lightbulb_outline, primary, tooltip: "힌트 보기", onPressed: showHintModal)
    - Padding(right: sp2):
      - IconButton (Icons.description_outlined, primary, tooltip: "증거 제시", onPressed: onPresentEvidence or disabled, disabled: widget.disabled)

**Key Components Used:**
- IconButton (with tooltip, primary color)
- showHintModal function

**API Calls:**
- showHintModal(context, sessionId) → playSessionRepo.hint

**State / Controllers Consumed:**
- widget.suspect (name, role)
- widget.onPresentEvidence (VoidCallback)
- widget.disabled (bool, disables evidence button during waiting)
- context.sessionRead.backendSessionId (for hint modal)

**Navigation:**
- Hint tap → showHintModal (modal)
- Evidence tap → onPresentEvidence callback

**Pixel Notes:**
- AppBar: transparent, kToolbarHeight
- Back icon: c.text color
- Title: titleM + bodySm, wrappable, maxLines 1 ellipsis
- Actions: 20px icons (primary), right-aligned
- Rightmost action padding: sp2 (8dp)
- Icon button disabled state: shown but not tappable

---

## 15. INTERROGATION BUBBLES
**File:** `/Users/superstar/my-claude-project/팀프로젝트 튜터링 에이전트/2026_sparta_backend-3/project4-final/Team6/project-fe/lib/screens/interrogation_bubbles.dart`

**Purpose:** Message bubble widgets with distinct styling for suspect (left, darker) and detective (right, primary/success) with optional evidence marker.

**SuspectBubble Widget:**
- **Row (crossAxisAlignment: end)**
  - Container (sp6×sp6, gradient tealBase→skyBase, r2, centered):
    - Text (initial, AppText.monoLabel, fsXxs, ink950, h: 1.0)
  - SizedBox(width: sp2)
  - Flexible → Container (sp3 h, sp2 v padding, bgElev bg, line border, r1/r4/r4/r4 asymmetric):
    - Text (text, body, fsBase, c.text, h: 1.5)
  - SizedBox(width: sp10) (balance right side)

**DetectiveBubble Widget:**
- **Row (crossAxisAlignment: end)**
  - SizedBox(width: sp10) (balance left side)
  - Flexible → Container (sp3 h, sp2 v padding, primarySoft/successSoft bg, primary/success border, r4/r1/r4/r4 asymmetric):
    - [if evidenceId]:
      - Row (mainAxisSize: min):
        - Icon (Icons.description_outlined, iconXs, success)
        - SizedBox(width: sp1)
        - Text ("증거 제시", monoLabel, fsXxs, success, h: 1.0)
      - SizedBox(height: sp1)
    - Text (text, body, fsBase, primary/text, h: 1.5)

**Pixel Notes - Bubble Styling:**
- Bubble bg: bgElev (suspect), primarySoft/successSoft (detective)
- Bubble border: line (suspect), primary/success (detective)
- Border radius: suspect (2/2/r4/r4), detective (r4/r1/r4/r4) — asymmetric pointing opposite directions
- Avatar: sp6×sp6 (24×24), gradient, r2 (8dp), centered initial
- Avatar gradient: tealBase → skyBase
- Evidence marker: success 12px icon + monoLabel fsXxs label
- Text colors: c.text (suspect), primary/text (detective)

---

## 16. INTERROGATION INPUT BAR
**File:** `/Users/superstar/my-claude-project/팀프로젝트 튜터링 에이전트/2026_sparta_backend-3/project4-final/Team6/project-fe/lib/screens/interrogation_input_bar.dart`

**Purpose:** Fixed input bar for typing and sending messages with optional evidence prefill display and conditional evidence presentation button.

**Layout Structure:**
- **Container (bg: c.bg, top border: line) → SafeArea(top: false) → Padding(sp3) → Column (crossAxisAlignment: start)**
  - [if hasPrefill]:
    - Container (sp3 h, sp2 v padding, successSoft bg, success border 0.3a, r3, margin sp2 bottom):
      - **Row:**
        - Icon (Icons.link, iconSm, success)
        - SizedBox(width: sp2)
        - Expanded: Text ("증거 연동됨: title", bodySm, w600, success, maxLines 1 ellipsis)
        - IconButton (Icons.close, iconSm, success, onPressed: onClearPrefill)
  - [else]:
    - MSButton ("증거 제시", secondary, description icon)
    - SizedBox(height: sp2)
  - **Row:**
    - **Expanded:** MSTextField (controller, hintText: "질문을 입력하세요...", maxLength: 500)
    - SizedBox(width: sp2)
    - MSButton (primary, send icon, onPressed: disabled ? null : onSend)

**Key Components Used:**
- MSTextField (multiline text input)
- MSButton (secondary/primary variants, icon-only or labeled)
- Container (prefill display box)

**API Calls:** None (UI component)

**State / Controllers Consumed:**
- controller (TextEditingController)
- prefillEvidenceTitle (optional evidence display)
- onClearPrefill, onSend, onPresentEvidence (callbacks)
- disabled (bool, disables input during waiting)

**Navigation:**
- Evidence button → onPresentEvidence callback
- Send button → onSend callback

**Pixel Notes - Layout:**
- Container bg: c.bg
- Top border: line 1px
- Padding: sp3 (12dp)
- Prefill box bg: successSoft
- Prefill box border: success 0.3 alpha
- Prefill box radius: r3 (12dp)
- Prefill box margin: sp2 bottom (8dp)
- Prefill box padding: sp3 h (12dp), sp2 v (8dp)
- Evidence button: secondary variant
- Button gap: sp2 (8dp)
- Icon sizes: 14px link, 16px close X, 16px send

**Pixel Notes - Text:**
- Prefill text: bodySm w600, success color, ellipsis
- TextField: standard MSTextField styling

---

## 17. INTERROGATION SUGGESTED QUESTIONS
**File:** `/Users/superstar/my-claude-project/팀프로젝트 튜터링 에이전트/2026_sparta_backend-3/project4-final/Team6/project-fe/lib/screens/interrogation_suggested_questions.dart`

**Purpose:** Horizontal scrolling bar of question chips that prefill input field (no auto-send) with optional evidence linking.

**Layout Structure:**
- **SizedBox(height: sp12)**
  - **ListView.separated (horizontal, BouncingScrollPhysics, sp4 padding)**
    - itemCount: questions.length
    - separatorBuilder: SizedBox(width: sp2)
    - itemBuilder (_, i):
      - GestureDetector (onTap: disabled ? null : onPrefill(sq)):
        - Container (sp3 h, rowGap v padding, transparent bg, line border, rPill, center):
          - Text (question, bodySm, fsMd, textSub if active else textMute)

**Key Components Used:**
- GestureDetector (tap to prefill)
- Container (chip styling)
- ListView.separated (horizontal scrolling)

**API Calls:** None (UI component)

**State / Controllers Consumed:**
- questions (List<SuggestedQuestionInfo>)
- onPrefill (callback)
- disabled (bool)

**Navigation:**
- Chip tap → onPrefill callback (parent fills input, no send)

**Pixel Notes:**
- Container height: sp12 (48dp)
- Chip padding: sp3 h (12dp), rowGap v (6dp)
- Chip border: line 1px, rPill (999dp)
- Chip bg: transparent
- Chip spacing: sp2 gap (8dp)
- ListView padding: sp4 h (16dp)
- Text: bodySm, fsMd (16px), textSub (active) or textMute (disabled)

---

## 18. INTERROGATION WAITING BUBBLE
**File:** `/Users/superstar/my-claude-project/팀프로젝트 튜터링 에이전트/2026_sparta_backend-3/project4-final/Team6/project-fe/lib/screens/interrogation_waiting_bubble.dart`

**Purpose:** Animated loading indicator bubble shown while waiting for AI response.

**Layout Structure:**
- **Row (crossAxisAlignment: end)**
  - Container (sp6×sp6, bgHover bg, r2):
    - MSSpinner (iconXs, primary)
  - SizedBox(width: sp2)
  - Container (sp3 h, sp2 v padding, bgElev bg, line border, r1/r4/r4/r4 asymmetric):
    - MSSpinner (sp4, textMute)

**Key Components Used:**
- MSSpinner (animated spinner)
- Container (avatar + bubble styling)

**Styling:**
- Avatar: sp6×sp6, bgHover bg, r2, primary spinner (iconXs)
- Bubble: sp3/sp2 padding, bgElev bg, line border, r1/r4 asymmetric, textMute spinner (sp4)

---

## 19. INTERROGATION ACTIONS MIXIN
**File:** `/Users/superstar/my-claude-project/팀프로젝트 튜터링 에이전트/2026_sparta_backend-3/project4-final/Team6/project-fe/lib/screens/interrogation_actions_mixin.dart`

**Purpose:** Shared logic for interrogation actions (message send, evidence presentation, question prefill) with API integration, response handling, and evidence unlock notifications.

**Key Methods:**

**sendMessage(text, evidenceId?, questionType = free):**
- Validates input (trimmed, not empty, not waiting)
- Adds detective message to messages list
- Sets isWaiting = true, clears prefill state, clears input
- Calls playSessionRepo.interrogate(sessionId, suspectId, questionType, question, presentedEvidenceId)
- On success: adds suspect response message, handles unlocked evidences
- On error: displays fallback error message
- Clears isWaiting state
- Scrolls to bottom
- Triggers evidence refresh if unlocked

**presentEvidence():**
- Calls showEvidencePresentModal(context)
- Sets prefillEvidenceId, prefillEvidenceTitle
- Sets prefillQuestionType = evidencePresented
- Prefills input text: "이 증거를 제시합니다: {name}"

**onChipPrefill(SuggestedQuestionInfo):**
- Parses question type from API
- Detects evidence linking
- Sets prefill state (evidenceId, title, questionType)
- Fills input text with question
- NO auto-send

**scrollToBottom():**
- Double-layer postFrameCallback for stable scroll
- Animates to max extent with dur3 easeOut

**Enums & Models:**
- **InterrogationSender:** {detective, suspect}
- **InterrogationMessage:** {text, sender, presentedEvidenceId?}
- **QuestionType:** {free, recommended, evidencePresented}

**State Consumed:**
- messages, isWaiting, prefillEvidenceId, prefillEvidenceTitle, prefillQuestionType (abstract from State)
- inputCtrl, scrollCtrl (abstract from State)
- suspectId, suspectName, backendSessionId_ (abstract getters)

---

## 20. TIMELINE SCREEN
**File:** `/Users/superstar/my-claude-project/팀프로젝트 튜터링 에이전트/2026_sparta_backend-3/project4-final/Team6/project-fe/lib/screens/timeline_screen.dart`

**Purpose:** Chronological event timeline with filter by event type (All/Conflict/SuspectClaim); shows investigator-discovered events and suspect claims with optional conflict indicators.

**Layout Structure:**
- **Scaffold (backgroundColor: c.bg)**
  - **AppBar (Custom via _buildAppBar)**
    - elevation: 0, scrolledUnderElevation: 0
    - backgroundColor: Colors.transparent
    - titleSpacing: AppTokens.sp4
    - automaticallyImplyLeading: false
    - title: Text ("TIMELINE", AppText.monoLabel, textMute)

  - **Body → SingleChildScrollView (BouncingScrollPhysics, sp4 h padding) → Column (crossAxisAlignment: stretch)**
    - SizedBox(height: sp4)
    - **SingleChildScrollView (horizontal)**
      - **Row of _FilterChip**
        - _TimelineFilter.values (all/conflict/suspect)
        - sp2 gap between chips
        - rPill border, animated selection
    - SizedBox(height: sp4)
    - **MSKicker ("사건 타임라인")**
    - SizedBox(height: sp3)
    - [if entries.isEmpty]:
      - Padding(top: sp8):
        - MSEmpty (icon by filter, title/subtitle by filter)
    - [else]:
      - TimelineList (entries)
    - SizedBox(height: sp10)

**_TimelineFilter Enum & Logic:**
- **all:** Show all timeline entries
- **conflict:** Show entries with conflict indicator (e.conflict != null)
- **suspect:** Show suspect claims and non-event claims (eventType == 'CLAIM' || (eventType == null && conflict == null))

**_getFiltered() Method:**
- Returns entries.where(...).toList() filtered by current _filter

**Key Components Used:**
- _FilterChip (GestureDetector + AnimatedContainer)
- MSKicker (section header)
- TimelineList (custom vertical timeline component)
- MSEmpty (empty state with filter-specific messaging)

**API Calls / Repository Methods:**
- **GameSessionController.timeline:** Loaded during session init

**State / Controllers Consumed:**
- `_filter` (_TimelineFilter enum)
- `context.session.timeline` (List<TimelineEntry>)
- `context.session.usesSampleCaseFallback` (bool, enables sample fallback)
- `_getFiltered()` returns filtered entries

**Navigation In/Out:**
- **Entry:** CaseScreen tab 3 (Timeline tab)
- **Exit:** CaseScreen nav to other tabs
- **Internal:** TimelineList entry (depends on TimelineList impl)

**Pixel Notes - Layout:**
- Padding: sp4 horizontal
- Top gap: sp4
- Filter chip gap: sp2 between
- Filter chip padding: chipPadH/V
- Filter chip border: rPill, line (inactive) or primary (active)
- Filter chip bg: transparent (inactive) or primarySoft (active)
- Filter animation: dur2 easeOut
- Section kicker: sp3 below
- Empty state: sp8 top padding

---

## 21. SUBMIT SCREEN
**File:** `/Users/superstar/my-claude-project/팀프로젝트 튜터링 에이전트/2026_sparta_backend-3/project4-final/Team6/project-fe/lib/screens/submit_screen.dart`

**Purpose:** Final investigation submission form with 4 sections: (1) Culprit selection dropdown, (2) Motive/Method/Cover-up text inputs (5+ chars each), (3) Evidence selection (1–15 items), (4) Optional summary notes; requirement checklist shown until all met; prevents back navigation and submission during API call.

**Layout Structure:**
- **PopScope (canPop: !_submitting, onPopInvokedWithResult: show snack if submitting)**
  - **Scaffold (backgroundColor: c.bg)**
    - **Body → SafeArea → SingleChildScrollView (sp4 h padding) → Column (crossAxisAlignment: stretch)**
      - SizedBox(height: sp6)
      - **SubmitHeader**
        - Icon (warning_amber_rounded, sp12, danger)
        - sp4 gap
        - Text ("사건 종결 및 추리 제출", titleL, c.text, centered)
        - sp2 gap
        - Text ("범인을 지목하고 사건의 전말을 제출합니다.\n이 결정은 되돌릴 수 없습니다.", bodySm, textSub, centered)
      - sp8 gap

      - **MSKicker ('1. FINAL SUSPECT · 진범 지목')**
      - SizedBox(height: sp3)
      - SuspectDropdown (suspects, selected, onSelect)
      - sp6 gap

      - **MSKicker ('2. 범행 동기 및 방법')**
      - SizedBox(height: sp3)
      - MSTextField (motiveCtrl, hintText: "범인이 피해자를 해친 동기는 무엇인가요?", maxLines: 3)
      - SizedBox(height: sp3)
      - MSTextField (methodCtrl, hintText: "어떤 방법으로 범행을 저질렀나요?", maxLines: 3)
      - SizedBox(height: sp3)
      - MSTextField (concealCtrl, hintText: "범행을 어떻게 은폐하려 했나요?", maxLines: 3)
      - sp6 gap

      - **MSKicker ('3. 제출 증거 · ${_evidence.length}/$_maxEvidence 선택')**
      - SizedBox(height: sp3)
      - EvidenceSelector (unlocked, selected, onToggle, maxCount: 15)
      - sp6 gap

      - **MSKicker ('4. 종합 추리 설명 (선택 사항)')**
      - SizedBox(height: sp3)
      - MSTextField (summaryCtrl, hintText: "사건의 전말을 자유롭게 메모해 보세요. (제출 시 저장되지 않습니다.)", maxLines: 5)
      - sp8 gap

      - [if !_allMet]:
        - SubmitChecklist (requirements: [culprit, motive, method, coverUp, evidence])
        - sp4 gap

      - MSButton (label: _submitting ? "제출 중..." : "최종 추리 제출", danger, expanded, disabled: !_canSubmit)
      - sp10 gap

**_reqs Computed List:**
- [SubmitRequirement('진범을 지목했습니다', _selectedSuspect != null)]
- [SubmitRequirement('범행 동기 5자 이상', _motiveCtrl.text.trim().length >= 5)]
- [SubmitRequirement('범행 방법 5자 이상', _methodCtrl.text.trim().length >= 5)]
- [SubmitRequirement('은폐 방법 5자 이상', _concealCtrl.text.trim().length >= 5)]
- [SubmitRequirement('제출 증거 1~15개', _evidence.length >= 1 && _evidence.length <= 15)]

**_allMet & _canSubmit Computed:**
- _allMet = _reqs.every((r) => r.met)
- _canSubmit = !_submitting && _allMet

**Key Components Used:**
- SubmitHeader (icon + title + subtitle)
- SuspectDropdown (DropdownButton)
- MSTextField (multiline text input)
- EvidenceSelector (multi-select with max count)
- SubmitChecklist (requirement rows)
- SubmitConfirmDialog (confirmation before API)
- MSButton (danger variant, loading state)

**API Calls / Repository Methods:**
- **playSessionRepo.submitFinalDeduction(sessionId, selectedCulpritId, motiveText, methodText, coverUpText, selectedEvidenceIds):**
  - Endpoint: POST /play/session/{sessionId}/submit
  - On success: navigate to ResultScreen
  - On error (AI010 or FINAL_DEDUCTION_ALREADY_SUBMITTED): show snack, navigate to ResultScreen after delay
  - On error (5xx): show server error message
  - On error (other): show submission failed message

**State / Controllers Consumed:**
- `_selectedSuspect` (Suspect?)
- `_motiveCtrl, _methodCtrl, _concealCtrl, _summaryCtrl` (TextEditingControllers)
- `_evidence` (List<Evidence>, 1–15)
- `_submitting` (bool)
- `_wasAllMet` (bool, prevents unnecessary rebuilds)
- `_reqs` (List<SubmitRequirement>), `_allMet`, `_canSubmit` (computed)
- `context.session.accusableSuspects` (List<Suspect>)
- `context.session.evidences` (List<Evidence>, filtered to unlocked)

**Navigation In/Out:**
- **Entry:** SuspectDetailBottomBar "범인 지목" → showDialog(SuspectAccuseDialog) → "추리 작성" → push SubmitScreen(initialSuspect)
- **Exit:** MSButton submit → showDialog(SubmitConfirmDialog) → "제출" → playSessionRepo.submitFinalDeduction → ResultScreen push
- **Back prevention:** PopScope canPop: !_submitting, shows snack if submitting

**Pixel Notes - Layout:**
- Padding: sp4 horizontal
- Top gap: sp6
- Header icon: sp12 (48dp)
- Header gaps: sp4 (title), sp2 (subtitle)
- Section kicker gaps: sp3 below
- Text field gaps: sp3 between (motive/method/coverUp), sp6 after section
- Evidence selector: sp3 below kicker
- Summary field: sp3 below kicker, sp8 after
- Checklist: sp4 before, sp4 gap before button
- Bottom padding: sp10

**Pixel Notes - Text Input:**
- Motive/Method/Conceal: maxLines 3
- Summary: maxLines 5
- Character count: implicit (requirement: 5+ chars)
- Evidence max: 15 items (enforced in selector)

---

## 22. SUBMIT WIDGETS & EVIDENCE SELECTOR
**Files:** `submit_widgets.dart`, `submit_evidence_selector.dart`

**SubmitHeader Sub-Component:**
- **Column (centered, no padding):**
  - Icon (warning_amber_rounded, sp12, danger)
  - SizedBox(height: sp4)
  - Text ("사건 종결 및 추리 제출", titleL, c.text)
  - SizedBox(height: sp2)
  - Text (subtitle, bodySm, textSub)

**SubmitChecklist Sub-Component:**
- **Container (sp4 padding, bgElev bg, line border, r4)**
  - Text ("제출하려면 아래 항목을 완료해 주세요", monoLabel, textSub)
  - SizedBox(height: sp3)
  - **For each requirement:**
    - Padding(rowGap v):
      - **Row:**
        - Icon (check_circle if met else radio_button_unchecked, sp4, success if met else textMute)
        - SizedBox(width: sp3)
        - Expanded: Text (label, bodySm, textMute if met else c.text)

**SubmitConfirmDialog Sub-Component:**
- **Dialog (bgElev bg, r6 border)**
  - Padding(sp6):
    - **Column (mainAxisSize: min, crossAxisAlignment: stretch):**
      - **Row:** Icon (warning_amber_rounded, sp6, danger) + SizedBox(sp2) + Text ("최종 추리 제출", titleM, c.text)
      - SizedBox(height: sp3)
      - Text ("제출하면 사건이 종결됩니다.\n정말 제출하시겠습니까?", body, textSub, h: 1.6)
      - SizedBox(height: sp6)
      - **Row (2 buttons):**
        - Expanded: MSButton ("취소", secondary, expanded, onPressed: pop(false))
        - SizedBox(width: sp3)
        - Expanded: MSButton ("제출", danger, expanded, onPressed: pop(true))

**SuspectDropdown Sub-Component:**
- **Container (bg bg, line border, r3, sp3/sp2 padding)**
  - **DropdownButtonHideUnderline:**
    - DropdownButton<Suspect> (bgElev dropdownColor):
      - hint: Text ("범인 선택", body, textMute)
      - value: selected
      - items: suspects.map(...).toList()
      - style: body, c.text
      - icon: keyboard_arrow_down (sp5, textSub)
      - onChanged: onSelect

**EvidenceSelector Sub-Component:**
- **Column (crossAxisAlignment: stretch):**
  - [if selected.isNotEmpty]:
    - **Wrap (spacing: sp2, runSpacing: sp2):**
      - ...selected.map((e) => GestureDetector(onTap: onToggle):
        - MSPill(e.name, tone: primary)
    - SizedBox(height: sp3)
  - [if evidences.isEmpty]:
    - Text ("제출할 수 있는 증거가 아직 없습니다.", bodySm, textSub)
  - [else]:
    - **For each evidence:**
      - Padding(bottom: sp2):
        - **GestureDetector (onTap: isDis ? null : onToggle)**
          - **AnimatedContainer (dur2, easeOut)**
            - bg: isSel ? primarySoft : transparent
            - border: isSel ? primary : line
            - borderRadius: r3
            - padding: sp3 h, sp2 v
            - **Row:**
              - Icon (isSel ? check_circle_outline : radio_button_unchecked, sp4, isSel ? primary : (isDis ? textMute : textSub))
              - SizedBox(width: sp3)
              - Expanded: Text (name, bodySm fsBase, isDis ? textMute : c.text)
              - Text (location, monoLabel fsSm, textMute)

**Pixel Notes - Spacing & Colors:**
- Dropdown padding: sp3 h (12dp), sp2 v (8dp)
- Dropdown bg: bg
- Dropdown border: line color
- Dropdown radius: r3
- Dropdown text: body, textMute (hint) or c.text
- Checklist padding: sp4
- Checklist border: line color
- Checklist radius: r4
- Requirement gap: rowGap v (6dp)
- Evidence selected pill: primarySoft bg, primary tone
- Evidence row gap: sp2 (8dp)
- Evidence row padding: sp3 h (12dp), sp2 v (8dp)
- Evidence row animation: dur2 easeOut
- Evidence border: line (unselected), primary (selected)

---

## 23. RESULT SCREEN
**File:** `/Users/superstar/my-claude-project/팀프로젝트 튜터링 에이전트/2026_sparta_backend-3/project4-final/Team6/project-fe/lib/screens/result_screen.dart`

**Purpose:** Final results display with polling for grading completion (5 attempts, 3s delay between retries); shows grade (S/A/B/C/D), score (0–100), and detailed deduction analysis including matched/missed parts, culprit reveal, key evidence, and explanation.

**Layout Structure:**
- **Scaffold (backgroundColor: c.bg)**
  - **AppBar (Custom via build)**
    - elevation: 0, scrolledUnderElevation: 0
    - backgroundColor: AppColors.transparent
    - automaticallyImplyLeading: false
    - titleSpacing: sp4
    - title: Text ("CASE CLOSED", AppText.monoLabel, textMute)

  - **Body → ResultBody (props: loading, error, exhausted, data, fade, slide, onHome, onRetry)**
    - [if loading]:
      - **Center:**
        - MSSpinner (size: sp6)
        - SizedBox(height: sp4)
        - Text ("채점 결과를 불러오는 중...", bodySm, textSub)
    - [else if error]:
      - Padding(sp4):
        - **MSEmpty:**
          - icon: exhausted ? hourglass_bottom_outlined : cloud_off
          - title: exhausted ? "채점 결과 대기 중" : "결과를 불러오지 못했습니다"
          - subtitle: error
          - action: (onRetry) ? MSButton ("결과 다시 확인", primary) : null
          - secondaryAction: MSButton ("홈으로 돌아가기", ghost)
    - [else if data == null]:
      - Padding(sp4):
        - **MSEmpty:**
          - icon: assignment_late_outlined
          - title: "결과 세션이 없습니다"
          - subtitle: "결과를 다시 확인해 주세요."
          - action: (onRetry) ? MSButton ("결과 다시 확인", primary) : null
          - secondaryAction: MSButton ("홈으로 돌아가기", ghost)
    - [else]:
      - **SingleChildScrollView (sp4 h padding, BouncingScrollPhysics) → Column (crossAxisAlignment: stretch)**
        - SizedBox(height: sp6)
        - **FadeTransition (opacity: fade)**
          - **AnimatedBuilder (animation: slide)**
            - **Transform.translate (offset: slide.value)**
              - ResultGradeHeader (grade, totalScore)
        - SizedBox(height: sp8)
        - **ResultSections (data)**
        - SizedBox(height: sp8)
        - MSButton ("홈으로 돌아가기", primary, expanded)
        - SizedBox(height: sp10)

**Polling Logic (_poll method):**
- Up to 5 attempts (0–4)
- 3 second delay between retries
- Retry on 404 (not found) or 202 (processing)
- Retry on transient network errors
- Give up after 5 attempts or if not retriable error

**Key Components Used:**
- ResultGradeHeader (large grade display + score)
- ResultSections (_ServerSections):
  - ResultMatchCard (5-row match status)
  - ResultPartsCard (matched/missed parts)
  - ResultRevelationCard (culprit + feedback + explanation)
  - Key evidences wrap (MSPill list)
- MSSpinner, MSEmpty (states)

**API Calls / Repository Methods:**
- **playSessionRepo.result(sessionId):** Fetch grading result
  - Polling strategy: retry up to 5 times with 3s delay
  - Retry conditions: 404, 202, network error
  - Stop conditions: success, 5 attempts exhausted, permanent error

**State / Controllers Consumed:**
- AnimationController (_ctrl)
- Animation<double> (_fade)
- Animation<Offset> (_slide)
- bool _loading, _exhausted
- String? _error
- DeductionResult? _data
- widget.sessionId (int? for polling)

**Navigation In/Out:**
- **Entry:** SubmitScreen → playSessionRepo.submitFinalDeduction success → push ResultScreen(sessionId)
- **Exit:** Home button → popUntil isFirst (clears nav stack)
- **Polling:** Starts on initState if sessionId provided

**Pixel Notes - Layout:**
- AppBar: transparent, monoLabel textMute "CASE CLOSED"
- Padding: sp4 horizontal (16dp)
- Top gap: sp6
- Grade section gaps: sp8 (above), sp8 (below)
- Home button: expanded, primary variant
- Bottom padding: sp10

**Pixel Notes - Animations:**
- FadeTransition: fade animation (opacity 0–1)
- SlideTransition: slide offset (0→10, dur3 easeOut)
- No easing specified, uses AppMotion.easeOut

---

## 24. RESULT WIDGETS & CARDS
**Files:** `result_widgets.dart`, `result_cards.dart`

**ResultGradeHeader Sub-Component:**
- **Column (centered):**
  - Text (grade, display, fsD3, success if S/A else c.text, h: 1.0)
  - SizedBox(height: sp3)
  - Text ("score / 100 PTS", monoLabel, fsLg, primary, letterSpacing: fsLg × 0.14)

**ResultMatchCard Sub-Component:**
- **Container (sp4 padding, bgElev bg, line border, r4)**
  - _MatchRow × 5 (culprit, motive, method, coverUp, evidence):
    - **Padding (rowGap v):**
      - **Row:**
        - Icon (check_circle if matched else cancel_outlined, sp4+sp1, success if matched else danger)
        - SizedBox(width: sp3)
        - Expanded: Text (label, body, textSub)
        - Text (trailing or "정답"/"오답", monoLabel, success/danger)

**ResultPartsCard Sub-Component:**
- **Container (sp4 padding, bgElev bg, line border, r4)**
  - **Column (crossAxisAlignment: start):**
    - _PartRow × matched.length + _PartRow × missed.length:
      - **Padding (rowGap v):**
        - **Row (crossAxisAlignment: start):**
          - Icon (check_circle if matched else cancel_outlined, sp4+sp1, success/danger)
          - SizedBox(width: sp3)
          - Expanded: Text (text, body, matched ? c.text : textSub, h: 1.5)

**ResultRevelationCard Sub-Component:**
- **Container (sp4 padding, bg bg, primarySoft border, r4)**
  - **Column (crossAxisAlignment: start):**
    - Text ("진범: {name} · {role}" OR "진범: {name}", titleM, danger)
    - [if feedback]:
      - SizedBox(height: sp3)
      - Text (feedback, body, c.text, h: 1.6)
    - [if fullExplanation]:
      - SizedBox(height: sp3)
      - Text (explanation, body, textSub, h: 1.6)

**Key Evidences Wrap:**
- **Wrap (spacing: sp2, runSpacing: sp2):**
  - ...keyEvidences.map((e) => MSPill(e.title, tone: primary))

**Pixel Notes - Cards:**
- Card padding: sp4 (16dp)
- Card bg: bgElev (match/parts), bg (revelation)
- Card border: line (match/parts), primarySoft (revelation)
- Card radius: r4
- Card row gap: rowGap v (6dp)

**Pixel Notes - Icons & Text:**
- Match icon: sp4+sp1 (20dp)
- Icon colors: success (matched), danger (missed)
- Text colors: textSub (labels), c.text (content), success/danger (status)
- Text styles: body h: 1.6, body h: 1.5, monoLabel (status), titleM (culprit)

**Pixel Notes - Score Display:**
- Grade: display fsD3 (72px), success (S/A) or text
- Score: monoLabel fsLg (18px), primary, 0.14 letterSpacing

---

## UNIFIED DESIGN TOKENS & CONVENTIONS

### AppTokens (Complete Reference)
**Spacing (all in dp):**
- sp1: 4dp
- sp2: 8dp
- sp3: 12dp
- sp4: 16dp
- sp5: 20dp
- sp6: 24dp
- sp7: 28dp
- sp8: 32dp
- sp9: 36dp
- sp10: 40dp (40×40 for HUD height)
- sp12: 48dp

**Border Radius:**
- r1: 2dp
- r2: 4dp (image loading skeleton)
- r3: 8dp (cards, input fields)
- r4: 12dp (large cards, containers)
- r5: 16dp (avatars)
- r6: 20dp (dialogs, images)
- rPill: 999dp (fully rounded pills, badges, chip bars)

**Icon Sizes:**
- iconXs: 12dp (small icons, evidence markers)
- iconSm: 14dp (secondary icons, lock/info)
- iconBase: 16dp (standard icon size)

**Font Sizes:**
- fsXxs: 10px (tiny labels)
- fsXs: 11px (small labels, meta text)
- fsSm: 12px (labels, mono labels)
- fsBase: 14px (body text, standard)
- fsMd: 16px (medium, slightly larger)
- fsLg: 18px (large, score display)
- fsD3: 72px (display title, grade)

**Line Heights:**
- lhLabel: 1.0 (tightly packed labels)
- lhBody: 1.5–1.6 (readable body text)

**Chip Padding:**
- chipPadH: 12dp (horizontal)
- chipPadV: 8dp (vertical)
- rowGap: 6dp (rows, list separators)

### AppText (Typography Styles)
**display:** Bold, 36px (case briefing titles)
- Used in: Case briefing, result grade (fsD3 override), result score (fsLg override)

**titleL, titleM, titleS:** 18px, 16px, 14px, w700/w600 (titles)
- titleL: evidence name, suspect name, submit header
- titleM: suspect detail role, app bar titles, dialog titles
- titleS: (used less)

**body, bodySm:** 16px, 14px, w400, h: 1.6/1.5 (content text)
- body: descriptions, paragraphs, list items
- bodySm: secondary text, smaller content

**monoLabel, monoNum:** 12px monospace, w600/w400 (labels, numbers)
- monoLabel: section headers (kickers), status labels, mono text
- monoNum: elapsed time, scores, numeric displays

### AppColors (Semantic Palette)
**Primary (Brand):**
- primary: Interactive elements (buttons, icons, selection)
- primarySoft: Light variant for soft backgrounds

**Success (Positive):**
- success: Evidence unlocked, confirmed actions, check marks
- successSoft: Light variant

**Danger (Destructive):**
- danger: Destructive actions, warnings, errors
- dangerSoft: Light variant

**Text:**
- text: Primary text (dark)
- textSub: Secondary text (gray)
- textMute: Tertiary text (lighter gray)

**Background:**
- bg: Main background
- bgElev: Elevated containers (cards, modals)
- bgHover: Hover/interactive states

**Border:**
- line: Standard borders
- lineSoft: Subtle borders

**Other:**
- scrim: Semi-transparent overlay (dialogs)
- Ink range: ink50 (light), ink400 (mid), ink700, ink950 (dark)
- Accents: tealBase, skyBase (gradients)

### AppMotion (Animations)
**Durations:**
- dur2: 200ms (standard quick animations)
- dur3: 300ms (smooth transitions)

**Easing:**
- easeOut: CubicEasOut (standard deceleration)

**Scroll Physics:**
- BouncingScrollPhysics: Bouncy spring effect on scroll end

### Common Patterns & Spacing
**1. Header + Scrollable + Footer:**
- AppBar (custom or transparent) + SafeArea → Padding(sp4 h) → SingleChildScrollView → Column → Button + sp10 bottom

**2. Card List:**
- MSKicker + sp3 + ListView.separated (sp2/sp3 gap) or Wrap(sp2 spacing)

**3. Modal/Dialog:**
- Dialog(bgElev bg, r6 border, sp6 padding) → Column → Actions row (2 buttons sp3 gap)

**4. Form Input:**
- MSKicker + sp3 + MSTextField or MSButton, sp6 gap between sections

**5. Avatar + Info:**
- Row: Container (gradient) + sp3 + Column(name/role/badge)

### Interactive States
**Button Variants:**
- primary: Filled primary color
- secondary: Outlined, secondary color
- danger: Filled danger color
- ghost: Minimal, ghost style

**Selected Container:**
- bg: primarySoft (light)
- border: primary
- Animation: dur2 easeOut on state change

**Disabled:**
- color: textMute
- opacity: reduced or greyed out
- pointer-events: none (no tap)

---

## SUMMARY TABLE: All 11 Gameplay Screens

| Screen | File | Purpose | Primary State | Key APIs |
|--------|------|---------|--------------|----------|
| Case Briefing | case_briefing_screen.dart | Narrative setup, sequential animations, start button | Scenario, AnimationController list | None |
| Case (Shell) | case_screen.dart | Tab hub, HUD (code/briefing/timer/evidence), session lifecycle | GameSessionController, _navIndex | startSession, refreshEvidences, abandonSession, abandonConflictAndRestart |
| Scene | scene_screen.dart | Crime scene map, location list, location images, hint button | GameSessionController, _selectedIndex | locations, refreshEvidences, hint |
| Evidence | evidence_screen.dart | Filterable evidence list (search + filter), sorting by unlock/lock/new | GameSessionController, _searchCtrl, _query, _filter | evidences, refreshEvidences |
| Evidence Detail | evidence_detail_screen.dart | Full evidence view, guidance (reading points, suspects, timeline, compare, questions), CTAs | GameSessionController, _detail, _loadingDetail | evidenceDetail |
| Suspects | suspects_screen.dart | Searchable suspect/witness list (search + filter), stats, card navigation | GameSessionController, _searchCtrl, _query, _filter | suspects |
| Suspect Detail | suspect_detail_screen.dart | Profile (avatar, role, personality), victim relation, related evidence, statement, logs, bottom bar | GameSessionController, _logsLoaded, _logs | interrogationLogs |
| Interrogation | interrogation_chat_screen.dart | Real-time Q&A chat, evidence presentation, prefilled questions, suggested chips | InterrogationActionsMixin, messages, isWaiting, inputCtrl | interrogate, hint |
| Timeline | timeline_screen.dart | Chronological events (all/conflict/suspect filter), conflict indicators | GameSessionController, _filter | timeline |
| Submit | submit_screen.dart | Final form (culprit, motive/method/coverup, evidence 1–15, summary), checklist, confirm dialog | _selectedSuspect, _evidence, _motiveCtrl/etc | submitFinalDeduction |
| Result | result_screen.dart | Grading display (polling 5x, 3s delay), grade/score/analysis cards | DeductionResult, AnimationController, polling logic | result |

---

## ABSOLUTE FILE PATHS
All files located in:
`/Users/superstar/my-claude-project/팀프로젝트 튜터링 에이전트/2026_sparta_backend-3/project4-final/Team6/project-fe/lib/screens/`

1. case_briefing_screen.dart
2. case_screen.dart
3. scene_screen.dart
4. scene_map.dart
5. scene_map_dot.dart
6. evidence_screen.dart
7. evidence_detail_screen.dart
8. evidence_detail_widgets.dart
9. evidence_detail_meta.dart
10. evidence_image_viewer.dart
11. suspects_screen.dart
12. suspect_detail_screen.dart
13. suspect_detail_cards.dart
14. suspect_detail_widgets.dart
15. suspect_detail_bottom_bar.dart
16. interrogation_chat_screen.dart
17. interrogation_app_bar.dart
18. interrogation_bubbles.dart
19. interrogation_input_bar.dart
20. interrogation_suggested_questions.dart
21. interrogation_waiting_bubble.dart
22. interrogation_actions_mixin.dart
23. timeline_screen.dart
24. submit_screen.dart
25. submit_widgets.dart
26. submit_evidence_selector.dart
27. result_screen.dart
28. result_widgets.dart
29. result_cards.dart

---

**This specification is complete, pixel-perfect, and ready for React web migration. Use as authoritative source of truth.**