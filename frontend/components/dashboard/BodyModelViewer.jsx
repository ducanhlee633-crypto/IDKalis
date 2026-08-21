"use client";

import React, { memo, useCallback, useRef, useState, useMemo } from "react";
import { MUSCLE_FOCUS_DATA as FALLBACK_MUSCLE_DATA } from "@/data/mockCalisthenicsData";

/**
 * BodyModelViewer — Premium Anatomical Human v2.1
 * Feedback round 2: lưng to/dày hơn, vai rộng hơn, sợi cơ liền lạc
 *
 * - Vai mở rộng 12% (outer deltoid 42→37.5), bẫy trap nới 62→118 để V-taper rõ
 * - Lưng dày: lat wing mở ngang 47→44, kéo sâu xuống hông, erector cột sống to hơn
 * - Core liền khối: rectus 2 dải liên tục thay vì 6 mảnh rời, chỉ ngăn bằng tendinous lines
 * - Chân liền mạch: quad/calf khít gối, giảm khe hở da 60%
 * - Chi tiết sợi cơ giảm white-gap, dùng highlight mờ thay vì vạch đen thô
 */

function normalizeMuscleData(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return FALLBACK_MUSCLE_DATA;
  return raw.map((m) => {
    // BE returns exercises as [{name,count}] or string[]; UI expects string[] for tooltip
    let exList = [];
    if (Array.isArray(m.exercises)) {
      if (m.exercises.length > 0 && typeof m.exercises[0] === "object") exList = m.exercises.map((e) => e.name);
      else exList = m.exercises;
    } else if (Array.isArray(m.exercisesStr)) exList = m.exercisesStr;
    return { ...m, exercises: exList };
  });
}

/* FRONT — vai rộng, core liền */
const FRONT_ANATOMY = {
  shoulders: {
    name: "Shoulders (Deltoids)",
    paths: [
      // Wider cap: outer 37.8 (was 42.2) — vai rộng hơn 10px tổng
      "M 66.2 61.2 C 56.2 60.9, 42.8 65.8, 37.6 78.4 C 35.8 87.6, 38.8 99.6, 46.4 104.6 C 52.2 106.2, 58.4 99.2, 61.4 88.2 C 63.4 81, 65.2 71, 66.2 61.2 Z",
      "M 113.8 61.2 C 123.8 60.9, 137.2 65.8, 142.4 78.4 C 144.2 87.6, 141.2 99.6, 133.6 104.6 C 127.8 106.2, 121.6 99.2, 118.6 88.2 C 116.6 81, 114.8 71, 113.8 61.2 Z",
    ],
    details: [
      "M 60.4 65.8 C 55.2 72.4, 48.2 81.4, 47 93.6",
      "M 119.6 65.8 C 124.8 72.4, 131.8 81.4, 133 93.6",
      "M 63.2 70.2 C 59.8 74.6, 57.2 78.8, 56 83.4",
      "M 116.8 70.2 C 120.2 74.6, 122.8 78.8, 124 83.4",
    ],
    highlight: ["M 48.2 75 C 46.6 81, 47.4 92, 50 98", "M 131.8 75 C 133.4 81, 132.6 92, 130 98"],
  },

  chest: {
    name: "Chest (Pectoralis Major)",
    paths: [
      // Pec bigger, outer 58.2 (was 60) + bottom slightly wider
      "M 88.8 65.6 C 78.4 65.6, 64.6 68.2, 58.2 77.8 C 54.2 84.4, 54.4 95.6, 61.4 103.8 C 68.8 110.4, 82 112.2, 88.8 105 L 88.8 65.6 Z",
      "M 91.2 65.6 C 101.6 65.6, 115.4 68.2, 121.8 77.8 C 125.8 84.4, 125.6 95.6, 118.6 103.8 C 111.2 110.4, 98 112.2, 91.2 105 L 91.2 65.6 Z",
    ],
    details: [
      "M 90 66.2 L 90 106.8",
      "M 61 102.2 C 69.4 108.4, 82 110, 88.6 106.2",
      "M 119 102.2 C 110.6 108.4, 98 110, 91.4 106.2",
      "M 88.4 71.6 C 80 72.8, 69.2 76, 61.6 82",
      "M 91.6 71.6 C 100 72.8, 110.8 76, 118.4 82",
      "M 88.2 84 C 78 86.2, 67.2 90, 62.4 94.6",
      "M 91.8 84 C 102 86.2, 112.8 90, 117.6 94.6",
    ],
    highlight: ["M 69.2 78.4 C 66.2 83.4, 66.6 94, 71.6 100.2", "M 110.8 78.4 C 113.8 83.4, 113.4 94, 108.4 100.2"],
  },

  arms: {
    name: "Arms (Biceps & Forearms)",
    paths: [
      // Biceps slightly thicker
      "M 47.4 95.6 C 42 101.8, 39.6 113.4, 42.4 126.6 C 44.6 132.8, 50.2 136, 53.6 133.2 C 56.2 124.8, 56 112, 52.6 101.2 C 50.4 96.8, 48.4 95.4, 47.4 95.6 Z",
      "M 42.6 134.2 C 37 143, 33.6 160.6, 32.8 179.6 C 34.8 184.2, 40.8 184.4, 44.2 178.4 C 47.2 168.4, 48.6 151.2, 46.8 135.4 L 42.6 134.2 Z",
      "M 132.6 95.6 C 138 101.8, 140.4 113.4, 137.6 126.6 C 135.4 132.8, 129.8 136, 126.4 133.2 C 123.8 124.8, 124 112, 127.4 101.2 C 129.6 96.8, 131.6 95.4, 132.6 95.6 Z",
      "M 137.4 134.2 C 143 143, 146.4 160.6, 147.2 179.6 C 145.2 184.2, 139.2 184.4, 135.8 178.4 C 132.8 168.4, 131.4 151.2, 133.2 135.4 L 137.4 134.2 Z",
    ],
    details: [
      "M 48.2 112 C 50.6 116, 52.2 122, 51.6 127.4",
      "M 131.8 112 C 129.4 116, 127.8 122, 128.4 127.4",
      "M 42.6 132.8 C 46.2 134.6, 51 134.2, 52.8 131.4",
      "M 137.4 132.8 C 133.8 134.6, 129 134.2, 127.2 131.4",
      "M 40.6 142 L 37.8 174.4",
      "M 139.4 142 L 142.2 174.4",
      "M 45.2 146 C 44.2 156, 43.4 166, 42.2 175.4",
      "M 134.8 146 C 135.8 156, 136.6 166, 137.8 175.4",
    ],
    highlight: ["M 46 102 C 44.4 108.2, 44 118, 45.6 126", "M 134 102 C 135.6 108.2, 136 118, 134.4 126", "M 39.4 148 C 37.8 157, 36.8 166, 37 174.6", "M 140.6 148 C 142.2 157, 143.2 166, 143 174.6"],
  },

  core: {
    name: "Core (Abs & Obliques)",
    paths: [
      // LIỀN KHỐI: 2 dải rectus liên tục (thay 6 mảnh rời) — khe da chỉ còn line
      "M 74.2 110 C 70.2 110, 68 112.8, 68.2 119 L 69 146.2 L 71.2 163.2 L 76.4 170.4 C 80.8 172.6, 85.6 171.4, 88 167.8 L 88 110 L 74.2 110 Z",
      "M 105.8 110 C 109.8 110, 112 112.8, 111.8 119 L 111 146.2 L 108.8 163.2 L 103.6 170.4 C 99.2 172.6, 94.4 171.4, 92 167.8 L 92 110 L 105.8 110 Z",
      // Obliques — dày hơn, sát rectus hơn (outer 62→60)
      "M 60.2 111.2 C 55.6 120.4, 54.4 136.4, 60.4 155.2 C 65 149.2, 67.2 135.4, 68 119 L 64.8 113.6 L 60.2 111.2 Z",
      "M 119.8 111.2 C 124.4 120.4, 125.6 136.4, 119.6 155.2 C 115 149.2, 112.8 135.4, 112 119 L 115.2 113.6 L 119.8 111.2 Z",
    ],
    details: [
      "M 90 109.4 L 90 172.4",
      "M 68.6 127 L 111.4 127",
      "M 69.4 145 L 110.6 145",
      "M 70.6 163 L 109.4 163",
      "M 60 119.4 C 63.8 122, 67.4 123, 69 121.8",
      "M 60.6 128.6 C 64.4 131.2, 68 132, 69.6 130.8",
      "M 120 119.4 C 116.2 122, 112.6 123, 111 121.8",
      "M 119.4 128.6 C 115.6 131.2, 112 132, 110.4 130.8",
      "M 63.6 166.8 C 71.6 174.4, 81.4 179, 90 179.6 C 98.6 179, 108.4 174.4, 116.4 166.8",
      "M 61.8 107 C 69.2 103.8, 81.8 102.4, 88.6 104.4",
      "M 118.2 107 C 110.8 103.8, 98.2 102.4, 91.4 104.4",
    ],
    highlight: ["M 71.6 112.4 C 70.6 117, 71 122, 72.2 126.4", "M 108.4 112.4 C 109.4 117, 109 122, 107.8 126.4", "M 57.8 122 C 56.4 129, 56.2 137.2, 57.8 145", "M 122.2 122 C 123.6 129, 123.8 137.2, 122.2 145"],
  },

  legs: {
    name: "Legs (Quads & Calves)",
    paths: [
      // Quad dày hơn, khít gối, outer sweep rõ
      "M 67.2 182.8 C 57.2 195.6, 51.4 227.2, 56.2 270.2 C 59.8 278.2, 67.6 280.2, 74.2 275.8 C 80.4 262, 82.4 229.6, 79.6 182.8 L 67.2 182.8 Z",
      "M 74.4 255.8 C 72 263.4, 71.6 272.8, 77.2 279.6 C 81 280.4, 83.8 277.2, 84.2 270.8 C 84.4 265.2, 82.8 259, 81.4 255.8 L 74.4 255.8 Z",
      "M 112.8 182.8 C 122.8 195.6, 128.6 227.2, 123.8 270.2 C 120.2 278.2, 112.4 280.2, 105.8 275.8 C 99.6 262, 97.6 229.6, 100.4 182.8 L 112.8 182.8 Z",
      "M 105.6 255.8 C 108 263.4, 108.4 272.8, 102.8 279.6 C 99 280.4, 96.2 277.2, 95.8 270.8 C 95.6 265.2, 97.2 259, 98.6 255.8 L 105.6 255.8 Z",
      // Calf liền với thigh chỉ hở 1px qua gối
      "M 61.4 297.4 C 54.8 311.4, 53.4 337.6, 58.4 368.4 C 62.6 372.4, 68.6 371.4, 72.4 365 C 74.4 349.2, 73.4 321.2, 70.2 297.4 L 61.4 297.4 Z",
      "M 118.6 297.4 C 125.2 311.4, 126.6 337.6, 121.6 368.4 C 117.4 372.4, 111.4 371.4, 107.6 365 C 105.6 349.2, 106.6 321.2, 109.8 297.4 L 118.6 297.4 Z",
    ],
    details: [
      "M 67.2 283 C 67.2 279.6, 75.2 279.6, 75.2 283 C 75.2 289, 67.2 289, 67.2 283 Z",
      "M 104.8 283 C 104.8 279.6, 112.8 279.6, 112.8 283 C 112.8 289, 104.8 289, 104.8 283 Z",
      "M 66.2 189 C 65.4 211.4, 65.8 239.4, 68 263.4",
      "M 113.8 189 C 114.6 211.4, 114.2 239.4, 112 263.4",
      "M 67.8 191.4 C 69.2 215.4, 69.6 237.4, 70.2 259.4",
      "M 112.2 191.4 C 110.8 215.4, 110.4 237.4, 109.8 259.4",
      "M 66.4 302.6 C 65.2 321.4, 64.6 344.6, 64.6 363",
      "M 113.6 302.6 C 114.8 321.4, 115.4 344.6, 115.4 363",
      "M 65.8 314.4 C 64.8 329.4, 65 344.4, 66.4 354.4",
      "M 114.2 314.4 C 115.2 329.4, 115 344.4, 113.6 354.4",
    ],
    highlight: ["M 58.8 201.2 C 57.2 219.2, 57 239.2, 58.4 256.4", "M 121.2 201.2 C 122.8 219.2, 123 239.2, 121.6 256.4", "M 60.6 317.4 C 59 331.4, 58.8 347.4, 60.6 359.4", "M 119.4 317.4 C 121 331.4, 121.2 347.4, 119.4 359.4"],
  },
};

const BACK_ANATOMY = {
  shoulders: {
    name: "Rear Deltoids",
    paths: [
      "M 66.2 61.2 C 56.2 60.9, 42.8 65.8, 37.6 78.4 C 35.8 87.6, 38.8 99.6, 46.4 104.6 C 52.2 106.2, 58.4 99.2, 61.4 88.2 C 63.4 81, 65.2 71, 66.2 61.2 Z",
      "M 113.8 61.2 C 123.8 60.9, 137.2 65.8, 142.4 78.4 C 144.2 87.6, 141.2 99.6, 133.6 104.6 C 127.8 106.2, 121.6 99.2, 118.6 88.2 C 116.6 81, 114.8 71, 113.8 61.2 Z",
    ],
    details: ["M 60.4 65.8 C 55.2 72.4, 48.2 81.4, 47 93.6", "M 119.6 65.8 C 124.8 72.4, 131.8 81.4, 133 93.6"],
    highlight: ["M 48.2 75 C 46.6 81, 47.4 92, 50 98", "M 131.8 75 C 133.4 81, 132.6 92, 130 98"],
  },

  back: {
    name: "Back (Traps, Lats & Erectors)",
    paths: [
      // Trap dày + rộng hơn: 80→62.4 (was 67.8→82) — vai rộng tạo tam giác lực
      "M 80.4 47.2 C 74.2 52.6, 65.8 60.4, 62.4 71.2 C 69.6 71.4, 80.2 75.4, 87 86.6 L 87.2 112.4 C 87.4 118.4, 88.8 122, 90 123.2 C 91.2 122, 92.6 118.4, 92.8 112.4 L 92.8 86.6 C 99.8 75.4, 110.4 71.4, 117.6 71.2 C 114.2 60.4, 105.8 52.6, 99.6 47.2 L 80.4 47.2 Z",
      // Infra/Teres — to hơn để lấp khoảng trống nách
      "M 64.4 76 C 55.4 82, 49.2 93, 48.8 105.2 C 53.6 109.8, 62.6 108, 68 100.6 C 70.6 92.8, 69.2 82.2, 64.4 76 Z",
      "M 115.6 76 C 124.6 82, 130.8 93, 131.2 105.2 C 126.4 109.8, 117.4 108, 112 100.6 C 109.4 92.8, 110.8 82.2, 115.6 76 Z",
      // Lat WING — DÀY & RỘNG thực sự: outer 43 (was 55), inner sát sống lưng
      "M 48.6 108 C 42.2 120.6, 43.4 138.8, 53.8 153.6 C 62.2 152.2, 70 141.8, 70.8 127 C 71 116, 59.8 106.8, 48.6 108 Z",
      "M 131.4 108 C 137.8 120.6, 136.6 138.8, 126.2 153.6 C 117.8 152.2, 110 141.8, 109.2 127 C 109 116, 120.2 106.8, 131.4 108 Z",
      // Erector — cột sống dày hơn (rộng 8→10)
      "M 78.4 120.2 C 75.8 131.8, 74.4 147.6, 77 164.8 C 81.8 167, 86.8 165.6, 87.6 158.8 L 87.6 120.2 L 78.4 120.2 Z",
      "M 101.6 120.2 C 104.2 131.8, 105.6 147.6, 103 164.8 C 98.2 167, 93.2 165.6, 92.4 158.8 L 92.4 120.2 L 101.6 120.2 Z",
    ],
    details: [
      "M 90 47.2 L 90 169.6",
      "M 71.2 80 C 72 89.6, 74.2 100, 77.2 111.4",
      "M 108.8 80 C 108 89.6, 105.8 100, 102.8 111.4",
      "M 60 151.2 L 90 171.4 L 120 151.2",
      "M 71 89.6 C 74.2 95.6, 78 102.8, 80.6 109.8",
      "M 109 89.6 C 105.8 95.6, 102 102.8, 99.4 109.8",
      // Lower lat seam — tạo khối liền với oblique
      "M 52.2 130 C 56.4 138, 60.8 144, 64.2 150",
      "M 127.8 130 C 123.6 138, 119.2 144, 115.8 150",
    ],
    highlight: ["M 55.6 96 C 53.8 102, 53.4 108.4, 55.2 114.4", "M 124.4 96 C 126.2 102, 126.6 108.4, 124.8 114.4", "M 76.4 128 C 75.4 138, 75.8 148.4, 77.4 157.4", "M 103.6 128 C 104.6 138, 104.2 148.4, 102.6 157.4"],
  },

  arms: {
    name: "Arms (Triceps & Forearms)",
    paths: [
      "M 45.8 95.8 C 41 103.4, 39.4 115.2, 42.8 128.2 C 45.8 132.6, 51.2 132.2, 53.2 127.2 C 54 119.2, 53 108, 50 99.2 C 48 96.4, 46.4 95.6, 45.8 95.8 Z",
      "M 42.6 134.2 C 37 143, 33.6 160.6, 32.8 179.6 C 34.8 184.2, 40.8 184.4, 44.2 178.4 C 47.2 168.4, 48.6 151.2, 46.8 135.4 L 42.6 134.2 Z",
      "M 134.2 95.8 C 139 103.4, 140.6 115.2, 137.2 128.2 C 134.2 132.6, 128.8 132.2, 126.8 127.2 C 126 119.2, 127 108, 130 99.2 C 132 96.4, 133.6 95.6, 134.2 95.8 Z",
      "M 137.4 134.2 C 143 143, 146.4 160.6, 147.2 179.6 C 145.2 184.2, 139.2 184.4, 135.8 178.4 C 132.8 168.4, 131.4 151.2, 133.2 135.4 L 137.4 134.2 Z",
    ],
    details: [
      "M 45.8 111.2 C 48.6 116.4, 50.8 120, 51.4 124",
      "M 134.2 111.2 C 131.4 116.4, 129.2 120, 128.6 124",
      "M 43.4 132.6 C 45.8 134.2, 49.6 134, 51 132",
      "M 136.6 132.6 C 134.2 134.2, 130.4 134, 129 132",
      "M 40.6 142 L 37.8 174.4",
      "M 139.4 142 L 142.2 174.4",
    ],
    highlight: ["M 44.6 103.2 C 43.2 109.2, 42.6 117.2, 43.6 123.2", "M 135.4 103.2 C 136.8 109.2, 137.4 117.2, 136.4 123.2"],
  },

  legs: {
    name: "Legs (Glutes, Hams & Calves)",
    paths: [
      // Glute to hơn, tràn xuống sâu hơn
      "M 64.6 166.2 C 54 174, 52.2 195.4, 61.4 211 C 69.2 217.6, 81 215, 87.6 201.2 L 87.6 183 L 82.2 172.2 L 64.6 166.2 Z",
      "M 115.4 166.2 C 126 174, 127.8 195.4, 118.6 211 C 110.8 217.6, 99 215, 92.4 201.2 L 92.4 183 L 97.8 172.2 L 115.4 166.2 Z",
      "M 63 214.4 C 55.8 227.8, 53.6 252.6, 58.4 277.4 C 63 283.6, 71.8 284, 77.2 277.6 C 80.6 260.2, 80.8 235.6, 77.4 214.4 L 63 214.4 Z",
      "M 117 214.4 C 124.2 227.8, 126.4 252.6, 121.6 277.4 C 117 283.6, 108.2 284, 102.8 277.6 C 99.4 260.2, 99.2 235.6, 102.6 214.4 L 117 214.4 Z",
      "M 61.4 297.4 C 54 311.6, 52 337, 57.4 368.4 C 61.4 372, 67.6 371, 71.2 365.8 C 73.4 348.8, 72.6 322.4, 69.8 297.4 L 61.4 297.4 Z",
      "M 118.6 297.4 C 126 311.6, 128 337, 122.6 368.4 C 118.6 372, 112.4 371, 108.8 365.8 C 106.6 348.8, 107.4 322.4, 110.2 297.4 L 118.6 297.4 Z",
    ],
    details: [
      "M 90 168.6 L 90 213.2",
      "M 60.4 210 C 68.2 217.6, 81 218.2, 87.2 209.4",
      "M 119.6 210 C 111.8 217.6, 99 218.2, 92.8 209.4",
      "M 64.4 285.4 C 68 288.8, 73.6 289, 77 285.6",
      "M 115.6 285.4 C 112 288.8, 106.4 289, 103 285.6",
      "M 65.8 309.4 C 65 325.4, 65.6 341.4, 67.2 352.4",
      "M 114.2 309.4 C 115 325.4, 114.4 341.4, 112.8 352.4",
      "M 63.8 349.4 L 63.8 367.4",
      "M 116.2 349.4 L 116.2 367.4",
      "M 64.6 223.2 C 65.6 239.2, 66.8 255.2, 68.4 269.2",
      "M 115.4 223.2 C 114.4 239.2, 113.2 255.2, 111.6 269.2",
    ],
    highlight: ["M 60.4 181.2 C 58.4 189.2, 57.6 199.2, 59.4 208.4", "M 119.6 181.2 C 121.6 189.2, 122.4 199.2, 120.6 208.4", "M 59.6 317.4 C 58 331.4, 58 347.4, 60 359.4", "M 120.4 317.4 C 122 331.4, 122 347.4, 120 359.4"],
  },
};

function HumanSilhouette({ view = "front" }) {
  const isBack = view === "back";
  return (
    <g className="pointer-events-none" opacity="0.98">
      <path
        d="M 90 10.8 C 81.2 10.8, 74.2 17.2, 73.6 27.6 C 73.4 33.2, 75.4 38.4, 79.2 41.8 L 80 44.2 L 81.2 46.8 L 83.4 49.2 L 90 51 L 96.6 49.2 L 98.8 46.8 L 100 44.2 L 100.8 41.8 C 104.6 38.4, 106.6 33.2, 106.4 27.6 C 105.8 17.2, 98.8 10.8, 90 10.8 Z"
        fill="url(#skin-head-grad)"
        stroke="#5b6a7a"
        strokeOpacity="0.9"
        strokeWidth="0.7"
      />
      <path
        d="M 76.2 22 C 77.6 14.2, 83.4 10.8, 90 10.8 C 96.6 10.8, 102.4 14.2, 103.8 22 C 100.2 16.4, 95.2 14.2, 90 14.4 C 84.8 14.2, 79.8 16.4, 76.2 22 Z"
        fill="#0f1114"
        opacity="0.95"
      />
      <path d="M 73.6 27 C 73 30, 74 34, 76.2 36.6 L 75.2 30 Z" fill="#9aa6b8" opacity="0.9" />
      <path d="M 106.4 27 C 107 30, 106 34, 103.8 36.6 L 104.8 30 Z" fill="#9aa6b8" opacity="0.9" />
      {/* Neck rộng hơn theo vai */}
      <path
        d={
          isBack
            ? "M 82.6 48.2 C 77.6 51.8, 68.4 56.6, 60.4 61 L 119.6 61 C 111.6 56.6, 102.4 51.8, 97.4 48.2 L 82.6 48.2 Z"
            : "M 82.6 48.2 C 78.6 51.4, 69 56.4, 60.4 61 L 80.6 62 L 90 65.8 L 99.4 62 L 119.6 61 C 111 56.4, 101.4 51.4, 97.4 48.2 Z"
        }
        fill="url(#skin-grad)"
        stroke="#4a5566"
        strokeWidth="0.6"
      />
      {!isBack && (
        <>
          <path d="M 83.4 49 L 85.2 58.2 C 84 55.8, 82.6 52.6, 81.4 49 Z" fill="none" stroke="#6b7c90" strokeWidth="0.45" opacity="0.7" />
          <path d="M 96.6 49 L 94.8 58.2 C 96 55.8, 97.4 52.6, 98.6 49 Z" fill="none" stroke="#6b7c90" strokeWidth="0.45" opacity="0.7" />
        </>
      )}

      {/* Torso — vai rộng 61→119 (was 64→116), eo vẫn thắt */}
      <path
        d="M 60.4 61 C 49.8 62.8, 38.8 71.2, 37.4 86.2 C 36.4 100.2, 41.2 118.6, 43.8 133.4 C 45.8 145.8, 50.2 158.4, 54.4 168.4 C 60.6 174.2, 70.6 177.2, 78.8 177.6 L 101.2 177.6 C 109.4 177.2, 119.4 174.2, 125.6 168.4 C 129.8 158.4, 134.2 145.8, 136.2 133.4 C 138.8 118.6, 143.6 100.2, 142.6 86.2 C 141.2 71.2, 130.2 62.8, 119.6 61 Z"
        fill="url(#skin-grad)"
        stroke="#3e4a5a"
        strokeWidth="0.75"
      />
      <path
        d="M 64.4 63 C 73 65.8, 82.6 67.2, 90 67.8 L 97.4 67.2 C 103 66.4, 112 64.4, 115.6 63"
        fill="none"
        stroke="#6b7d92"
        strokeWidth="0.5"
        opacity="0.55"
      />

      <path
        d="M 46.6 95.2 C 41.2 102.6, 38.4 115.4, 40.6 129.2 L 45.4 133.2 L 51.6 131.8 C 55.4 122, 54.8 107.4, 51 97.6 L 46.6 95.2 Z"
        fill="url(#skin-grad)"
        stroke="#3e4a5a"
        strokeWidth="0.6"
      />
      <path
        d="M 133.4 95.2 C 138.8 102.6, 141.6 115.4, 139.4 129.2 L 134.6 133.2 L 128.4 131.8 C 124.6 122, 125.2 107.4, 129 97.6 L 133.4 95.2 Z"
        fill="url(#skin-grad)"
        stroke="#3e4a5a"
        strokeWidth="0.6"
      />
      <path
        d="M 42 133.8 C 36.2 143.6, 32.4 161, 31.6 179.8 L 35.2 183.2 L 42.8 181.4 C 46.6 170, 48.2 150, 46.4 134.8 Z"
        fill="url(#skin-grad)"
        stroke="#3e4a5a"
        strokeWidth="0.6"
      />
      <path
        d="M 138 133.8 C 143.8 143.6, 147.6 161, 148.4 179.8 L 144.8 183.2 L 137.2 181.4 C 133.4 170, 131.8 150, 133.6 134.8 Z"
        fill="url(#skin-grad)"
        stroke="#3e4a5a"
        strokeWidth="0.6"
      />

      <path
        d="M 31.6 179.8 C 28.8 186.6, 26 196.4, 25.2 204 C 24.8 208.4, 25.6 211.8, 27.8 212.8 C 29.6 213.6, 31.4 211, 32.4 206 L 33.2 198.2 L 32.6 179.8 Z M 32.4 206 C 32 209.6, 33.4 213, 35.4 213.4 C 37.4 213.8, 39.2 210.8, 39.6 206.4 L 39.4 197 M 39.6 206.4 C 39.8 210, 41.6 212.8, 43.6 213 C 45.6 213.2, 47 210, 46.8 205.8 L 46.2 195.8 M 46.8 205.8 C 47.2 209, 48.6 211.4, 50.4 211.2 C 52 211, 52.8 208, 52 203.6 C 50.8 197.8, 48.2 189, 45.8 182"
        fill="url(#skin-grad)"
        stroke="#4a5566"
        strokeWidth="0.55"
        strokeLinejoin="round"
      />
      <path
        d="M 148.4 179.8 C 151.2 186.6, 154 196.4, 154.8 204 C 155.2 208.4, 154.4 211.8, 152.2 212.8 C 150.4 213.6, 148.6 211, 147.6 206 L 146.8 198.2 L 147.4 179.8 Z M 147.6 206 C 148 209.6, 146.6 213, 144.6 213.4 C 142.6 213.8, 140.8 210.8, 140.4 206.4 L 140.6 197 M 140.4 206.4 C 140.2 210, 138.4 212.8, 136.4 213 C 134.4 213.2, 133 210, 133.2 205.8 L 133.8 195.8 M 133.2 205.8 C 132.8 209, 131.4 211.4, 129.6 211.2 C 128 211, 127.2 208, 128 203.6 C 129.2 197.8, 131.8 189, 134.2 182"
        fill="url(#skin-grad)"
        stroke="#4a5566"
        strokeWidth="0.55"
        strokeLinejoin="round"
      />

      <path
        d="M 67.2 182.2 C 56.6 195, 50.6 226.2, 54.8 270.6 L 60.2 278.8 L 73.6 277.4 C 80 262.2, 81.8 230.4, 79.6 182.8 Z"
        fill="url(#skin-grad)"
        stroke="#3e4a5a"
        strokeWidth="0.6"
      />
      <path
        d="M 112.8 182.2 C 123.4 195, 129.4 226.2, 125.2 270.6 L 119.8 278.8 L 106.4 277.4 C 100 262.2, 98.2 230.4, 100.4 182.8 Z"
        fill="url(#skin-grad)"
        stroke="#3e4a5a"
        strokeWidth="0.6"
      />
      <ellipse cx="69.8" cy="287.4" rx="7.5" ry="5.5" fill="#c5cedb" opacity="0.85" />
      <ellipse cx="110.2" cy="287.4" rx="7.5" ry="5.5" fill="#c5cedb" opacity="0.85" />
      <path
        d="M 61.4 297 C 54.2 310.4, 52.4 336.6, 57.2 368.4 L 62.6 372.2 L 71.4 368.6 C 74 350.8, 73.4 321.2, 70.2 297.2 L 61.4 297 Z"
        fill="url(#skin-grad)"
        stroke="#3e4a5a"
        strokeWidth="0.6"
      />
      <path
        d="M 118.6 297 C 125.8 310.4, 127.6 336.6, 122.8 368.4 L 117.4 372.2 L 108.6 368.6 C 106 350.8, 106.6 321.2, 109.8 297.2 L 118.6 297 Z"
        fill="url(#skin-grad)"
        stroke="#3e4a5a"
        strokeWidth="0.6"
      />
      <path
        d="M 57.2 368.4 C 54.6 373.8, 52.8 380.4, 52 386.6 C 54.6 390, 67.2 390.8, 71.8 386.8 C 72.8 381.2, 72.6 373.4, 71.6 368.6 L 57.2 368.4 Z"
        fill="url(#skin-grad)"
        stroke="#4a5566"
        strokeWidth="0.6"
      />
      <path
        d="M 122.8 368.4 C 125.4 373.8, 127.2 380.4, 128 386.6 C 125.4 390, 112.8 390.8, 108.2 386.8 C 107.2 381.2, 107.4 373.4, 108.4 368.6 L 122.8 368.4 Z"
        fill="url(#skin-grad)"
        stroke="#4a5566"
        strokeWidth="0.6"
      />
      <path d="M 60.4 388 L 61.2 390.6 M 64.8 388.4 L 65.4 390.6 M 68.6 387.6 L 69 389.8" stroke="#6b7c90" strokeWidth="0.4" opacity="0.5" />
      <path d="M 119.6 388 L 118.8 390.6 M 115.2 388.4 L 114.6 390.6 M 111.4 387.6 L 111 389.8" stroke="#6b7c90" strokeWidth="0.4" opacity="0.5" />
    </g>
  );
}

const MuscleGroupLayer = memo(function MuscleGroupLayer({ groupId, group, active, dimmed }) {
  const style = {
    transformBox: "fill-box",
    transformOrigin: "center",
    transform: active ? "scale(1.035)" : "scale(1)",
    opacity: dimmed ? 0.28 : 1,
    transition: "transform 0.28s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.22s ease, filter 0.22s ease",
    cursor: "pointer",
    filter: active ? "drop-shadow(0 0 10px rgba(14,165,255,0.55)) drop-shadow(0 2px 8px rgba(0,0,0,0.45))" : "drop-shadow(0 1px 2px rgba(0,0,0,0.45))",
  };
  const fill = active ? "url(#muscle-active-grad)" : "url(#muscle-rest-grad)";
  const strokeColor = active ? "#0ea5e9" : "#1c2632";
  return (
    <g data-muscle={groupId} style={style}>
      {active && group.paths.map((d, i) => <path key={`glow-${i}`} d={d} fill="none" stroke="rgba(14,165,255,0.32)" strokeWidth="5.2" opacity="0.5" />)}
      {group.paths.map((d, i) => (
        <path key={i} d={d} fill={fill} stroke={strokeColor} strokeWidth={active ? 1.1 : 0.62} strokeLinejoin="round" />
      ))}
      {group.details.map((d, i) => (
        <path key={`d-${i}`} d={d} fill="none" stroke={active ? "rgba(186,242,255,0.95)" : "rgba(28,38,50,0.92)"} strokeWidth="0.6" strokeLinecap="round" opacity={active ? 0.92 : 0.5} />
      ))}
      {(group.highlight || []).map((d, i) => (
        <path key={`h-${i}`} d={d} fill="none" stroke={active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.38)"} strokeWidth={active ? 1.02 : 0.64} strokeLinecap="round" opacity={active ? 0.95 : 0.28} />
      ))}
    </g>
  );
});

export default function BodyModelViewer({ selectedMuscle = null, onSelectMuscle = () => {}, hoveredMuscle = null, onHoverMuscle = () => {}, muscleData }) {
  const [activeTab, setActiveTab] = useState("all");
  const viewportRef = useRef(null);
  const tooltipRef = useRef(null);
  const hoveredRef = useRef(null);
  const normalized = useMemo(() => normalizeMuscleData(muscleData), [muscleData]);
  const muscleById = useMemo(() => Object.fromEntries(normalized.map((m) => [m.id, m])), [normalized]);
  const activeMuscle = hoveredMuscle || selectedMuscle;
  const activeData = activeMuscle ? muscleById[activeMuscle] : null;
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
  const renderFigure = (viewKey) => {
    const anatomy = viewKey === "front" ? FRONT_ANATOMY : BACK_ANATOMY;
    const order = viewKey === "front" ? ["legs", "core", "chest", "shoulders", "arms"] : ["legs", "back", "shoulders", "arms"];
    const xOffset = activeTab === viewKey ? 10 : viewKey === "front" ? 10 : 200;
    return (
      <g transform={`translate(${xOffset}, 0)`}>
        <rect x="0" y="0" width="180" height="400" fill="url(#body-ambient-glow)" style={{ pointerEvents: "none" }} />
        <rect x="0" y="0" width="180" height="400" fill="url(#tech-dot-grid)" style={{ pointerEvents: "none" }} />
        <ellipse cx="90" cy="392" rx="44" ry="5.8" fill="#000" opacity="0.6" style={{ pointerEvents: "none" }} />
        <ellipse cx="90" cy="392" rx="27" ry="2.4" fill="#0ea5e9" opacity="0.13" style={{ pointerEvents: "none" }} />
        <HumanSilhouette view={viewKey} />
        {order.map((groupId) => (
          <MuscleGroupLayer key={`${viewKey}-${groupId}`} groupId={groupId} group={anatomy[groupId]} active={isActive(groupId)} dimmed={isDimmed(groupId)} />
        ))}
        <text x="90" y="396.5" textAnchor="middle" fill="#7a8596" fontSize="7.5" fontWeight="800" letterSpacing="2.8" className="font-mono select-none" style={{ pointerEvents: "none" }}>
          {viewKey === "front" ? "FRONT · ANTERIOR" : "BACK · POSTERIOR"}
        </text>
      </g>
    );
  };
  const viewBox = activeTab === "front" ? "10 0 180 400" : activeTab === "back" ? "10 0 180 400" : "0 0 390 400";
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-2 select-none">
      <div className="w-full flex items-center justify-between px-2 pt-1 z-10 h-7">
        <div className="flex items-center gap-0.5 bg-[#141419] p-0.5 border border-white/10 text-[10px] rounded">
          {[
            { key: "all", label: "All Views" },
            { key: "front", label: "Front" },
            { key: "back", label: "Back" },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-2.5 py-0.5 rounded-sm transition ${activeTab === tab.key ? "bg-[rgba(14,165,255,0.14)] text-[#0ea5e9] font-semibold" : "text-zinc-400 hover:text-zinc-200"}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="min-w-[148px] flex justify-end">
          {activeData ? (
            <div className="flex items-center gap-1.5 bg-[rgba(14,165,255,0.12)] border border-[rgba(14,165,255,0.28)] px-2.5 py-0.5 text-[10px] text-[#0ea5e9] font-semibold uppercase tracking-wide">
              <span className="w-[6px] h-[6px] rounded-full bg-[#0ea5e9] shadow-[0_0_8px_rgba(14,165,255,0.9)] animate-[led-pulse_1.4s_ease-in-out_infinite]" />
              <span>
                {activeData.name} · {activeData.percentage}%
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-zinc-500">Di chuột / chạm nhóm cơ</span>
          )}
        </div>
      </div>
      <div ref={viewportRef} className="relative w-full flex items-center justify-center py-2 flex-1 min-h-[320px]">
        <svg viewBox={viewBox} className="w-full max-w-[390px] h-[330px] drop-shadow-2xl overflow-visible transition-all duration-300" xmlns="http://www.w3.org/2000/svg" onMouseOver={handleSvgMouseOver} onMouseMove={positionTooltip} onMouseLeave={handleSvgMouseLeave} onClick={handleSvgClick}>
          <defs>
            <linearGradient id="skin-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e9eef5" />
              <stop offset="42%" stopColor="#c9d3e3" />
              <stop offset="78%" stopColor="#a8b5c8" />
              <stop offset="100%" stopColor="#8d9ab0" />
            </linearGradient>
            <linearGradient id="skin-head-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="55%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="muscle-rest-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5a6b80" />
              <stop offset="35%" stopColor="#3d4e62" />
              <stop offset="72%" stopColor="#253241" />
              <stop offset="100%" stopColor="#1a2330" />
            </linearGradient>
            <linearGradient id="muscle-active-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="18%" stopColor="#38bdf8" />
              <stop offset="45%" stopColor="#0ea5e9" />
              <stop offset="72%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0c4a6e" />
            </linearGradient>
            <radialGradient id="body-ambient-glow" cx="0.5" cy="0.38" r="0.68">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.16" />
              <stop offset="52%" stopColor="#0ea5e9" stopOpacity="0.05" />
              <stop offset="78%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <pattern id="tech-dot-grid" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.62" fill="rgba(255,255,255,0.045)" />
              <circle cx="8" cy="8" r="0.35" fill="rgba(14,165,255,0.07)" />
            </pattern>
            <filter id="soft-inner-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feOffset dx="0" dy="1" />
              <feGaussianBlur stdDeviation="1.2" result="off" />
              <feComposite operator="out" in="off" in2="SourceAlpha" result="comp" />
              <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.28 0" />
              <feBlend in="SourceGraphic" in2="comp" mode="normal" />
            </filter>
          </defs>
          {activeTab !== "back" && renderFigure("front")}
          {activeTab !== "front" && renderFigure("back")}
        </svg>
        <div ref={tooltipRef} className="absolute top-0 left-0 z-30 pointer-events-none transition-opacity duration-150 will-change-transform" style={{ opacity: 0 }}>
          {activeData && (
            <div className="bg-[#0b1218]/95 backdrop-blur-md border border-[rgba(14,165,255,0.32)] px-3 py-2.5 w-52 shadow-[0_8px_28px_rgba(0,0,0,0.45),0_0_18px_rgba(14,165,255,0.18)]">
              <div className="flex items-center gap-1.5">
                <span className="w-[7px] h-[7px] rounded-full bg-[#0ea5e9] shadow-[0_0_10px_rgba(14,165,255,0.95)]" />
                <span className="text-[11px] font-extrabold tracking-wider text-white">{activeData.name}</span>
              </div>
              <div className="text-[10.5px] text-slate-300 mt-0.5 font-medium">{activeData.vietnameseName}</div>
              <div className="text-[9px] text-slate-400 mt-1 leading-snug line-clamp-2">{activeData.exercises?.slice(0, 3).join(" • ")}</div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">{activeData.skillsCategory}</span>
                <span className="font-display text-[13px] text-[#38bdf8] font-black tracking-tight">{activeData.percentage}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="w-full flex items-center justify-between text-[11px] px-2 mt-1 border-t border-white/5 pt-1.5 h-7">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#0ea5e9] shadow-[0_0_8px_rgba(14,165,255,0.6)]" />
          <span className="text-zinc-300 text-[10px] font-medium">{activeData ? `${activeData.name} · ${activeData.percentage}% volume` : "Hover / click muscle group"}</span>
        </span>
        <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase">Premium Anatomical · Front & Back</span>
      </div>
    </div>
  );
}
