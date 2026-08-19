"use client";

import React, { memo, useCallback, useRef, useState } from "react";
import { MUSCLE_FOCUS_DATA } from "@/data/mockCalisthenicsData";

/**
 * BodyModelViewer
 * High-precision 2D Anatomical Vector & Biomechanical Heatmap
 *
 * Features:
 * - Anatomically accurate muscle bellies with organic curvature (Pecs, 6-Pack, Obliques, Quads, Teardrops, Lats, Traps, Glutes, Calves)
 * - Athletic human silhouette with natural head, neck, hands, joints, and feet
 * - Multi-head muscle rendering for Shoulders (Anterior/Lateral/Posterior delts), Quads (Rectus femoris + Vastus lateralis/medialis), Back (Traps, Lats, Rhomboids/Teres, Erectors), Arms (Biceps, Triceps horseshoe, Forearm flexors/extensors)
 * - High-tech cyberpunk / dark-fitness HUD aesthetics with cyan glow, subtle depth gradients, and skeletal reference lines
 * - High performance event delegation and ref-based tooltip tracking (60fps hover without re-rendering)
 */

const ACCENT_CYAN = "#00e5ff";
const ACCENT_GLOW = "#22d3ee";

const MUSCLE_BY_ID = Object.fromEntries(MUSCLE_FOCUS_DATA.map((m) => [m.id, m]));

/* =========================================================================
   FRONT VIEW ANATOMICAL COORDINATES (180 x 400)
   Center X = 90
   ========================================================================= */
const FRONT_ANATOMY = {
  shoulders: {
    name: "Shoulders (Deltoids)",
    paths: [
      // Left Anterior & Lateral Deltoid
      "M 65 64 C 54 65, 44 73, 42 86 C 40 98, 45 106, 52 104 C 56 96, 60 84, 66 72 Z",
      // Right Anterior & Lateral Deltoid
      "M 115 64 C 126 65, 136 73, 138 86 C 140 98, 135 106, 128 104 C 124 96, 120 84, 114 72 Z",
    ],
    details: [
      // Clavicular insertion curve left/right
      "M 62 67 C 55 76, 50 86, 50 96",
      "M 118 67 C 125 76, 130 86, 130 96",
    ],
  },

  chest: {
    name: "Chest (Pectoralis Major)",
    paths: [
      // Left Pectoral
      "M 88 68 C 76 68, 64 72, 60 82 C 57 95, 62 108, 74 110 C 82 111, 88 108, 88 102 Z",
      // Right Pectoral
      "M 92 68 C 104 68, 116 72, 120 82 C 123 95, 118 108, 106 110 C 98 111, 92 108, 92 102 Z",
    ],
    details: [
      // Sternal cleavage & inferior pec border
      "M 90 68 L 90 108",
      "M 63 104 C 72 110, 80 110, 88 106",
      "M 117 104 C 108 110, 100 110, 92 106",
      // Clavicular division
      "M 88 74 C 78 76, 70 80, 64 85",
      "M 92 74 C 102 76, 110 80, 116 85",
    ],
  },

  arms: {
    name: "Arms (Biceps & Forearms)",
    paths: [
      // Left Biceps Brachii
      "M 47 98 C 42 106, 40 120, 44 134 C 48 136, 54 130, 55 118 C 55 108, 52 101, 47 98 Z",
      // Left Forearm (Brachioradialis & Flexors)
      "M 44 137 C 38 148, 35 166, 34 182 C 37 186, 43 178, 47 165 C 50 154, 50 142, 47 137 Z",
      // Right Biceps Brachii
      "M 133 98 C 138 106, 140 120, 136 134 C 132 136, 126 130, 125 118 C 125 108, 128 101, 133 98 Z",
      // Right Forearm (Brachioradialis & Flexors)
      "M 136 137 C 142 148, 145 166, 146 182 C 143 186, 137 178, 133 165 C 130 154, 130 142, 133 137 Z",
    ],
    details: [
      // Biceps peak & inner elbow fold
      "M 44 136 C 48 138, 52 136, 54 132",
      "M 136 136 C 132 138, 128 136, 126 132",
      // Forearm muscular separation line
      "M 42 144 C 40 158, 38 172, 38 180",
      "M 138 144 C 140 158, 142 172, 142 180",
    ],
  },

  core: {
    name: "Core (Abs & Obliques)",
    paths: [
      // Rectus Abdominis - Upper Pack (Left / Right)
      "M 76 112 C 73 112, 72 118, 72 124 C 76 126, 84 126, 88 124 C 88 118, 86 112, 83 112 Z",
      "M 104 112 C 107 112, 108 118, 108 124 C 104 126, 96 126, 92 124 C 92 118, 94 112, 97 112 Z",
      // Rectus Abdominis - Mid Pack (Left / Right)
      "M 73 127 C 72 134, 72 140, 74 145 C 79 146, 85 146, 88 144 C 88 138, 88 130, 87 127 Z",
      "M 107 127 C 108 134, 108 140, 106 145 C 101 146, 95 146, 92 144 C 92 138, 92 130, 93 127 Z",
      // Rectus Abdominis - Lower Pack & V-Taper (Left / Right)
      "M 74 148 C 74 156, 75 164, 78 171 C 82 173, 86 170, 88 165 C 88 158, 88 150, 87 148 Z",
      "M 106 148 C 106 156, 105 164, 102 171 C 98 173, 94 170, 92 165 C 92 158, 92 150, 93 148 Z",
      // External Obliques & Serratus (Left)
      "M 63 115 C 58 126, 58 142, 64 156 C 68 148, 69 132, 69 119 C 66 116, 64 115, 63 115 Z",
      // External Obliques & Serratus (Right)
      "M 117 115 C 122 126, 122 142, 116 156 C 112 148, 111 132, 111 119 C 114 116, 116 115, 117 115 Z",
    ],
    details: [
      // Linea Alba (Centerline)
      "M 90 110 L 90 172",
      // Transverse Tendinous Intersections
      "M 72 125.5 L 108 125.5",
      "M 73 146.5 L 107 146.5",
      // Serratus anterior ribs
      "M 62 122 C 66 125, 70 125, 71 123",
      "M 63 132 C 67 135, 71 135, 72 133",
      "M 118 122 C 114 125, 110 125, 109 123",
      "M 117 132 C 113 135, 109 135, 108 133",
      // Inguinal Ligament (Adonis V-line)
      "M 65 168 C 73 175, 82 179, 90 179 C 98 179, 107 175, 115 168",
    ],
  },

  legs: {
    name: "Legs (Quads & Calves)",
    paths: [
      // Left Upper Quad (Rectus Femoris & Vastus Lateralis)
      "M 68 184 C 58 200, 54 235, 59 270 C 64 278, 71 278, 77 272 C 81 254, 82 224, 79 184 Z",
      // Left Vastus Medialis (Teardrop above knee)
      "M 76 258 C 74 266, 74 276, 79 281 C 83 281, 84 274, 84 264 C 82 260, 79 258, 76 258 Z",
      // Right Upper Quad (Rectus Femoris & Vastus Lateralis)
      "M 112 184 C 122 200, 126 235, 121 270 C 116 278, 109 278, 103 272 C 99 254, 98 224, 101 184 Z",
      // Right Vastus Medialis (Teardrop above knee)
      "M 104 258 C 106 266, 106 276, 101 281 C 97 281, 96 274, 96 264 C 98 260, 101 258, 104 258 Z",
      // Left Shin & Calf (Tibialis Anterior & Gastrocnemius)
      "M 63 300 C 56 316, 56 342, 61 370 C 66 374, 71 372, 75 363 C 74 346, 73 322, 71 300 Z",
      // Right Shin & Calf (Tibialis Anterior & Gastrocnemius)
      "M 117 300 C 124 316, 124 342, 119 370 C 114 374, 109 372, 105 363 C 106 346, 107 322, 109 300 Z",
    ],
    details: [
      // Patella / Knee Outline Left & Right
      "M 68 285 C 68 281, 76 281, 76 285 C 76 291, 68 291, 68 285 Z",
      "M 104 285 C 104 281, 112 281, 112 285 C 112 291, 104 291, 104 285 Z",
      // Quad sweep definition
      "M 68 190 C 67 220, 68 248, 70 268",
      "M 112 190 C 113 220, 112 248, 110 268",
      // Shin crest line
      "M 68 304 C 67 325, 66 348, 66 366",
      "M 112 304 C 113 325, 114 348, 114 366",
    ],
  },
};

/* =========================================================================
   BACK VIEW ANATOMICAL COORDINATES (180 x 400)
   Center X = 90
   ========================================================================= */
const BACK_ANATOMY = {
  shoulders: {
    name: "Rear Deltoids",
    paths: [
      // Left Posterior Deltoid
      "M 65 64 C 54 65, 44 73, 42 86 C 40 98, 45 106, 52 104 C 56 96, 60 84, 66 72 Z",
      // Right Posterior Deltoid
      "M 115 64 C 126 65, 136 73, 138 86 C 140 98, 135 106, 128 104 C 124 96, 120 84, 114 72 Z",
    ],
    details: [
      "M 62 67 C 55 76, 50 86, 50 96",
      "M 118 67 C 125 76, 130 86, 130 96",
    ],
  },

  back: {
    name: "Back (Traps, Lats & Lower Back)",
    paths: [
      // Trapezius - Upper & Mid Diamond
      "M 82 50 C 76 56, 70 64, 68 74 C 74 74, 82 78, 88 88 L 88 116 C 88 122, 90 124, 90 124 C 90 124, 92 122, 92 116 L 92 88 C 98 78, 106 74, 112 74 C 110 64, 104 56, 98 50 Z",
      // Infraspinatus & Teres Major (Left)
      "M 67 78 C 58 84, 53 96, 53 108 C 58 112, 66 110, 71 102 C 73 94, 72 84, 67 78 Z",
      // Infraspinatus & Teres Major (Right)
      "M 113 78 C 122 84, 127 96, 127 108 C 122 112, 114 110, 109 102 C 107 94, 108 84, 113 78 Z",
      // Latissimus Dorsi - V-Taper Wings (Left)
      "M 55 110 C 50 122, 52 138, 60 152 C 67 150, 73 140, 74 126 C 74 114, 66 108, 55 110 Z",
      // Latissimus Dorsi - V-Taper Wings (Right)
      "M 125 110 C 130 122, 128 138, 120 152 C 113 150, 107 140, 106 126 C 106 114, 114 108, 125 110 Z",
      // Erector Spinae / Lower Back Columns
      "M 79 122 C 77 134, 76 150, 79 166 C 84 168, 88 166, 88 156 L 88 122 Z",
      "M 101 122 C 103 134, 104 150, 101 166 C 96 168, 92 166, 92 156 L 92 122 Z",
    ],
    details: [
      // Vertebral Spine Line
      "M 90 52 L 90 170",
      // Scapular Medial Border
      "M 73 82 C 74 94, 76 104, 79 114",
      "M 107 82 C 106 94, 104 104, 101 114",
      // Thoracolumbar fascia V-shape
      "M 65 152 L 90 172 L 115 152",
    ],
  },

  arms: {
    name: "Arms (Triceps & Posterior Forearms)",
    paths: [
      // Left Triceps Brachii (Lateral & Long Head)
      "M 46 98 C 42 108, 41 122, 45 135 C 49 135, 54 128, 54 116 C 53 106, 50 100, 46 98 Z",
      // Left Posterior Forearm (Extensors)
      "M 44 137 C 38 148, 35 166, 34 182 C 37 186, 43 178, 47 165 C 50 154, 50 142, 47 137 Z",
      // Right Triceps Brachii (Lateral & Long Head)
      "M 134 98 C 138 108, 139 122, 135 135 C 131 135, 126 128, 126 116 C 127 106, 130 100, 134 98 Z",
      // Right Posterior Forearm (Extensors)
      "M 136 137 C 142 148, 145 166, 146 182 C 143 186, 137 178, 133 165 C 130 154, 130 142, 133 137 Z",
    ],
    details: [
      // Triceps Horseshoe curve
      "M 46 114 C 49 120, 52 120, 53 115",
      "M 134 114 C 131 120, 128 120, 127 115",
      // Olecranon (Elbow bone)
      "M 45 136 C 47 138, 51 138, 52 136",
      "M 135 136 C 133 138, 129 138, 128 136",
    ],
  },

  legs: {
    name: "Legs (Glutes, Hamstrings & Calves)",
    paths: [
      // Left Gluteus Maximus & Medius
      "M 66 168 C 56 176, 55 198, 64 212 C 73 218, 83 214, 88 198 C 88 184, 82 172, 66 168 Z",
      // Right Gluteus Maximus & Medius
      "M 114 168 C 124 176, 125 198, 116 212 C 107 218, 97 214, 92 198 C 92 184, 98 172, 114 168 Z",
      // Left Hamstrings (Biceps Femoris & Semitendinosus)
      "M 65 216 C 58 230, 56 256, 61 280 C 67 284, 76 282, 80 274 C 82 254, 82 232, 78 216 Z",
      // Right Hamstrings (Biceps Femoris & Semitendinosus)
      "M 115 216 C 122 230, 124 256, 119 280 C 113 284, 104 282, 100 274 C 98 254, 98 232, 102 216 Z",
      // Left Calf (Gastrocnemius Bellies & Achilles)
      "M 63 300 C 55 316, 54 340, 60 370 C 66 374, 72 370, 75 358 C 76 338, 74 316, 71 300 Z",
      // Right Calf (Gastrocnemius Bellies & Achilles)
      "M 117 300 C 125 316, 126 340, 120 370 C 114 374, 108 370, 105 358 C 104 338, 106 316, 109 300 Z",
    ],
    details: [
      // Gluteal Cleft & Infragluteal Fold
      "M 90 170 L 90 216",
      "M 62 212 C 72 220, 84 218, 88 208",
      "M 118 212 C 108 220, 96 218, 92 208",
      // Popliteal Fossa (Behind Knee)
      "M 66 288 C 70 292, 76 292, 80 288",
      "M 114 288 C 110 292, 104 292, 100 288",
      // Gastrocnemius diamond split
      "M 68 304 C 67 322, 68 338, 69 350",
      "M 112 304 C 113 322, 112 338, 111 350",
      // Achilles Tendon insertion
      "M 66 352 L 66 372",
      "M 114 352 L 114 372",
    ],
  },
};

/* =========================================================================
   AESTHETIC HUMAN SILHOUETTE & SKELETAL REFERENCE (Base layer)
   ========================================================================= */
function HumanSilhouette({ view = "front" }) {
  return (
    <g className="pointer-events-none" opacity="0.95">
      {/* Head with jawline and cranium */}
      <path
        d="M 90 16 C 80 16, 75 24, 75 34 C 75 44, 81 50, 85 52 L 87 53 L 93 53 L 95 52 C 99 50, 105 44, 105 34 C 105 24, 100 16, 90 16 Z"
        fill="#14171f"
        stroke="#475569"
        strokeWidth="0.8"
      />

      {/* Neck & Trapezius contour */}
      <path
        d="M 83 50 C 78 54, 70 58, 64 64 L 116 64 C 110 58, 102 54, 97 50 Z"
        fill="#14171f"
        stroke="#475569"
        strokeWidth="0.7"
      />

      {/* Torso Athletic V-Taper Contour (Organic curves) */}
      <path
        d="M 64 64 C 54 66, 44 76, 43 90 C 42 104, 46 120, 48 135 C 50 148, 54 158, 58 170 C 64 176, 72 178, 80 178 L 100 178 C 108 178, 116 176, 122 170 C 126 158, 130 148, 132 135 C 134 120, 138 104, 137 90 C 136 76, 126 66, 116 64 Z"
        fill="#11141a"
        stroke="#334155"
        strokeWidth="0.7"
      />

      {/* Hands (Stylized anatomical aesthetic hands) */}
      {/* Left Hand */}
      <path
        d="M 34 182 C 32 188, 29 196, 28 205 C 27 212, 28 216, 32 216 C 34 216, 36 211, 37 206 C 38 214, 40 216, 42 215 C 44 214, 45 208, 45 204 C 47 210, 49 211, 50 209 C 51 207, 50 200, 49 194 C 48 188, 47 184, 47 182 Z"
        fill="#14171f"
        stroke="#475569"
        strokeWidth="0.7"
      />
      {/* Right Hand */}
      <path
        d="M 146 182 C 148 188, 151 196, 152 205 C 153 212, 152 216, 148 216 C 146 216, 144 211, 143 206 C 142 214, 140 216, 138 215 C 136 214, 135 208, 135 204 C 133 210, 131 211, 130 209 C 129 207, 130 200, 131 194 C 132 188, 133 184, 133 182 Z"
        fill="#14171f"
        stroke="#475569"
        strokeWidth="0.7"
      />

      {/* Feet & Ankles */}
      {/* Left Foot */}
      <path
        d="M 61 370 C 58 376, 56 384, 55 390 C 58 393, 70 393, 74 388 C 75 382, 75 374, 75 363 Z"
        fill="#14171f"
        stroke="#475569"
        strokeWidth="0.7"
      />
      {/* Right Foot */}
      <path
        d="M 119 370 C 122 376, 124 384, 125 390 C 122 393, 110 393, 106 388 C 105 382, 105 374, 105 363 Z"
        fill="#14171f"
        stroke="#475569"
        strokeWidth="0.7"
      />
    </g>
  );
}

/* =========================================================================
   MEMOIZED MUSCLE GROUP LAYER
   ========================================================================= */
const MuscleGroupLayer = memo(function MuscleGroupLayer({
  groupId,
  group,
  active,
  dimmed,
}) {
  const style = {
    transformBox: "fill-box",
    transformOrigin: "center",
    transform: active ? "scale(1.05)" : "scale(1)",
    opacity: dimmed ? 0.3 : 1,
    transition: "all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
    cursor: "pointer",
    filter: active
      ? "drop-shadow(0 0 12px rgba(0, 229, 255, 0.75))"
      : "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
  };

  const fill = active ? "url(#muscle-active-grad)" : "url(#muscle-rest-grad)";

  return (
    <g data-muscle={groupId} style={style}>
      {/* Muscle Bellies */}
      {group.paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill={fill}
          stroke={active ? ACCENT_CYAN : "#222d3d"}
          strokeWidth={active ? 1.2 : 0.8}
          strokeLinejoin="round"
        />
      ))}

      {/* Internal Muscle striations / tendon lines */}
      {group.details.map((d, i) => (
        <path
          key={`d-${i}`}
          d={d}
          fill="none"
          stroke={active ? "rgba(0, 229, 255, 0.7)" : "#1a2330"}
          strokeWidth="0.75"
          strokeLinecap="round"
        />
      ))}
    </g>
  );
});

/* =========================================================================
   MAIN COMPONENT: BodyModelViewer
   ========================================================================= */
export default function BodyModelViewer({
  selectedMuscle = null,
  onSelectMuscle = () => {},
  hoveredMuscle = null,
  onHoverMuscle = () => {},
}) {
  const [activeTab, setActiveTab] = useState("all"); // "all" | "front" | "back"
  const viewportRef = useRef(null);
  const tooltipRef = useRef(null);
  const hoveredRef = useRef(null);

  const activeMuscle = hoveredMuscle || selectedMuscle;
  const activeData = activeMuscle ? MUSCLE_BY_ID[activeMuscle] : null;

  /* Event delegation tooltip positioner */
  const positionTooltip = useCallback((e) => {
    const el = tooltipRef.current;
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!el || !rect) return;
    const localY = e.clientY - rect.top;
    const flipY = localY > rect.height - 96;
    const x = Math.max(8, Math.min(e.clientX - rect.left + 16, rect.width - 210));
    el.style.transform = `translate(${x}px, ${flipY ? localY - 110 : localY + 16}px)`;
  }, []);

  const handleSvgMouseOver = useCallback(
    (e) => {
      const el = e.target.closest?.("[data-muscle]");
      if (!el) return;
      const id = el.dataset.muscle;
      if (hoveredRef.current !== id) {
        hoveredRef.current = id;
        onHoverMuscle(id);
      }
      if (tooltipRef.current) tooltipRef.current.style.opacity = "1";
      positionTooltip(e);
    },
    [onHoverMuscle, positionTooltip],
  );

  const handleSvgMouseLeave = useCallback(() => {
    hoveredRef.current = null;
    onHoverMuscle(null);
    if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
  }, [onHoverMuscle]);

  const handleSvgClick = useCallback(
    (e) => {
      const el = e.target.closest?.("[data-muscle]");
      if (el) onSelectMuscle(el.dataset.muscle);
    },
    [onSelectMuscle],
  );

  const isActive = (id) => activeMuscle === id;
  const isDimmed = (id) => Boolean(selectedMuscle) && !isActive(id);

  /* Render Single Anatomical Figure */
  const renderFigure = (viewKey) => {
    const anatomy = viewKey === "front" ? FRONT_ANATOMY : BACK_ANATOMY;
    const order =
      viewKey === "front"
        ? ["legs", "core", "chest", "shoulders", "arms"]
        : ["legs", "back", "shoulders", "arms"];

    const xOffset =
      activeTab === viewKey
        ? 10
        : viewKey === "front"
        ? 10
        : 200;

    return (
      <g transform={`translate(${xOffset}, 0)`}>
        {/* Ambient Back Glow & Cyber Dot Grid */}
        <rect
          x="0"
          y="0"
          width="180"
          height="400"
          fill="url(#body-ambient-glow)"
          style={{ pointerEvents: "none" }}
        />
        <rect
          x="0"
          y="0"
          width="180"
          height="400"
          fill="url(#tech-dot-grid)"
          style={{ pointerEvents: "none" }}
        />

        {/* Floor Shadow */}
        <ellipse
          cx="90"
          cy="392"
          rx="40"
          ry="4"
          fill="#000"
          opacity="0.6"
          style={{ pointerEvents: "none" }}
        />

        {/* Base Anatomical Silhouette */}
        <HumanSilhouette view={viewKey} />

        {/* Muscle Groups */}
        {order.map((groupId) => (
          <MuscleGroupLayer
            key={`${viewKey}-${groupId}`}
            groupId={groupId}
            group={anatomy[groupId]}
            active={isActive(groupId)}
            dimmed={isDimmed(groupId)}
          />
        ))}

        {/* View Label */}
        <text
          x="90"
          y="395"
          textAnchor="middle"
          fill="#64748b"
          fontSize="9"
          fontWeight="700"
          letterSpacing="3"
          className="font-mono select-none"
          style={{ pointerEvents: "none" }}
        >
          {viewKey === "front" ? "FRONT" : "BACK"}
        </text>
      </g>
    );
  };

  const viewBox =
    activeTab === "front"
      ? "10 0 180 400"
      : activeTab === "back"
      ? "10 0 180 400"
      : "0 0 390 400";

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-2 select-none">
      {/* Top Controls: View Switcher */}
      <div className="w-full flex items-center justify-between px-2 pt-1 z-10 h-7">
        <div className="flex items-center gap-0.5 bg-[#141419] p-0.5 border border-white/10 text-[10px] rounded">
          {[
            { key: "all", label: "All Views" },
            { key: "front", label: "Front" },
            { key: "back", label: "Back" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-2.5 py-0.5 rounded-sm transition ${
                activeTab === tab.key
                  ? "bg-cyan-400/20 text-cyan-300 font-semibold shadow-[inset_0_0_0_1px_rgba(0,229,255,0.4)]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Badge */}
        <div className="min-w-[140px] flex justify-end">
          {activeData ? (
            <div className="flex items-center gap-1.5 bg-cyan-400/10 border border-cyan-400/40 px-2.5 py-0.5 rounded text-[10px] text-cyan-300 font-semibold uppercase shadow-[0_0_10px_rgba(0,229,255,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] shadow-[0_0_6px_#00e5ff] animate-ping" />
              <span>
                {activeData.name} · {activeData.percentage}%
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-zinc-500">Select muscle</span>
          )}
        </div>
      </div>

      {/* SVG Anatomy Canvas */}
      <div
        ref={viewportRef}
        className="relative w-full flex items-center justify-center py-2 flex-1 min-h-[300px]"
      >
        <svg
          viewBox={viewBox}
          className="w-full max-w-[390px] h-[310px] drop-shadow-2xl overflow-visible transition-all duration-300"
          xmlns="http://www.w3.org/2000/svg"
          onMouseOver={handleSvgMouseOver}
          onMouseMove={positionTooltip}
          onMouseLeave={handleSvgMouseLeave}
          onClick={handleSvgClick}
        >
          <defs>
            {/* Rest Muscle Gradient (Slate-charcoal 3D shading) */}
            <linearGradient id="muscle-rest-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b485d" />
              <stop offset="50%" stopColor="#2c3747" />
              <stop offset="100%" stopColor="#1e2733" />
            </linearGradient>

            {/* Active Muscle Gradient (Glowing Cyan/Teal) */}
            <linearGradient id="muscle-active-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00e5ff" />
              <stop offset="60%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#0e7490" />
            </linearGradient>

            {/* Ambient Body Core Glow */}
            <radialGradient id="body-ambient-glow" cx="0.5" cy="0.4" r="0.6">
              <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.12" />
              <stop offset="60%" stopColor="#00e5ff" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>

            {/* Futuristic Tech Dot Grid */}
            <pattern
              id="tech-dot-grid"
              width="12"
              height="12"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="0.65" fill="rgba(255,255,255,0.04)" />
            </pattern>
          </defs>

          {activeTab !== "back" && renderFigure("front")}
          {activeTab !== "front" && renderFigure("back")}
        </svg>

        {/* Dynamic Tooltip */}
        <div
          ref={tooltipRef}
          className="absolute top-0 left-0 z-30 pointer-events-none transition-opacity duration-150 will-change-transform"
          style={{ opacity: 0 }}
        >
          {activeData && (
            <div className="bg-[#14141a]/95 backdrop-blur-md border border-cyan-400/30 px-3 py-2.5 rounded-lg shadow-2xl shadow-black/80 w-48 animate-fade-in">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] shadow-[0_0_6px_#00e5ff]" />
                <span className="text-[11px] font-bold tracking-wider text-white">
                  {activeData.name}
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5 font-medium">
                {activeData.vietnameseName}
              </div>
              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/10">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold">
                  {activeData.skillsCategory}
                </span>
                <span className="text-xs font-mono text-cyan-300 font-bold">
                  {activeData.percentage}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Caption */}
      <div className="w-full flex items-center justify-between text-[11px] text-zinc-400 px-2 mt-1 border-t border-white/5 pt-1.5 h-6">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]" />
          <span className="text-zinc-400 text-[10px]">
            {activeData
              ? `${activeData.name} · ${activeData.percentage}% volume`
              : "Hover / click muscle group"}
          </span>
        </span>
        <span className="text-[10px] text-zinc-500 font-mono">
          2D Anatomical Vector · Front &amp; Back
        </span>
      </div>
    </div>
  );
}
