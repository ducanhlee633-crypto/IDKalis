"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { EXERCISE_LIBRARY, MUSCLE_GROUPS } from "@/data/mockCalisthenicsData";
import { Plus, X, Search, Library, Save, Check, ChevronDown } from "lucide-react";

export default function ExerciseLibraryPage() {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [exercises, setExercises] = useState(EXERCISE_LIBRARY);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openPicker, setOpenPicker] = useState(null); // "primary" | "secondary" | null
  const [pickerAnchor, setPickerAnchor] = useState(null); // { left, top, width }
  const [muscleSearch, setMuscleSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    primaryMuscles: [],
    secondaryMuscles: [],
    movementType: "PUSH",
    inputType: "note",
  });

  const categories = ["ALL", "PUSH", "PULL", "LEGS", "CORE"];

  const filteredExercises = exercises.filter((ex) => {
    const matchesFilter = filter === "ALL" || ex.movementType === filter;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      ex.name.toLowerCase().includes(query) ||
      ex.primaryMuscles.join(", ").toLowerCase().includes(query) ||
      ex.secondaryMuscles.join(", ").toLowerCase().includes(query) ||
      ex.description.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleMuscle = (field, muscleName) => {
    setForm((prev) => {
      const current = prev[field];
      const inOtherField = prev[field === "primaryMuscles" ? "secondaryMuscles" : "primaryMuscles"];
      if (current.includes(muscleName)) {
        return { ...prev, [field]: current.filter((m) => m !== muscleName) };
      }
      if (inOtherField.includes(muscleName)) return prev;
      return { ...prev, [field]: [...current, muscleName] };
    });
  };

  const openMusclePicker = (field, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPickerAnchor({ left: rect.left, top: rect.bottom, width: rect.width });
    setOpenPicker(field);
    setMuscleSearch("");
  };

  const handleAddExercise = (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.primaryMuscles.length === 0) return;

    const newExercise = {
      id: `lib-${Date.now()}`,
      name: form.name.trim(),
      description: form.description.trim(),
      primaryMuscles: form.primaryMuscles,
      secondaryMuscles: form.secondaryMuscles,
      movementType: form.movementType,
      inputType: form.inputType,
    };

    setExercises((prev) => [newExercise, ...prev]);
    setForm({
      name: "",
      description: "",
      primaryMuscles: [],
      secondaryMuscles: [],
      movementType: "PUSH",
      inputType: "note",
    });
    setIsModalOpen(false);
  };

  const inputTypeLabel = {
    time: "Time Hold",
    weight: "Weighted",
    note: "Bodyweight",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2.5">
            <Library className="w-6 h-6 text-cyan-400" />
            Exercise Library
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            All exercises with descriptions, primary & secondary muscles, and movement classification.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-4 py-2 transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Exercise to the Library</span>
        </button>
      </div>

      {/* Search + Category Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 bg-[#141418] border border-white/5 px-3 py-2 w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises or muscles..."
            className="bg-transparent outline-none text-xs text-zinc-200 w-full placeholder:text-zinc-500"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3.5 py-1.5 text-xs font-medium transition ${
                filter === cat
                  ? "bg-cyan-400/15 border border-cyan-400/30 text-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.2)]"
                  : "bg-[#141418] border border-white/5 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="text-[11px] text-zinc-500 ml-1 whitespace-nowrap">
            {filteredExercises.length} exercises
          </span>
        </div>
      </div>

      {/* Exercise Cards Grid */}
      {filteredExercises.length === 0 ? (
        <div className="bg-[#121215] border border-[#222228] p-10 text-center square-frame">
          <p className="text-sm text-zinc-400">No exercises match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExercises.map((ex) => (
            <div
              key={ex.id}
              className="bg-[#121215] border border-[#222228] p-5 square-frame hover:border-zinc-700 transition flex flex-col"
            >
              <div className="flex items-start justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 border ${
                      ex.movementType === "PUSH"
                        ? "text-blue-400 border-blue-400/30 bg-blue-400/10"
                        : ex.movementType === "PULL"
                        ? "text-cyan-400 border-cyan-400/30 bg-cyan-400/10"
                        : ex.movementType === "LEGS"
                        ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                        : "text-amber-400 border-amber-400/30 bg-amber-400/10"
                    }`}
                  >
                    {ex.movementType}
                  </span>
                  <span className="text-[10px] font-medium text-zinc-500 border border-white/5 bg-[#1c1c24] px-2 py-0.5">
                    {inputTypeLabel[ex.inputType] || ex.inputType}
                  </span>
                </div>
              </div>
              <h3 className="text-base font-bold text-zinc-100">{ex.name}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-1.5 flex-1">
                {ex.description}
              </p>

              <div className="mt-4 space-y-2 border-t border-white/[0.04] pt-3">
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider w-16 shrink-0 mt-0.5">
                    Primary
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {ex.primaryMuscles.map((m) => (
                      <span key={m} className="px-1.5 py-0.5 bg-blue-400/10 border border-blue-400/25 text-blue-400 text-[10px] font-medium">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider w-16 shrink-0 mt-0.5">
                    Secondary
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {ex.secondaryMuscles.map((m) => (
                      <span key={m} className="px-1.5 py-0.5 bg-zinc-700/30 border border-white/5 text-zinc-400 text-[10px] font-medium">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Exercise Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#121215] border border-[#26262e] w-full max-w-lg square-frame max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 pb-3">
              <h2 className="text-base font-bold text-zinc-100">Add Exercise</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 hover:bg-white/5 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExercise} className="p-5 pt-2 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Exercise Name *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Archer Push-Up"
                  className="w-full bg-[#0d0d10] border border-white/10 px-3 py-2 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-cyan-400/40 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="How to perform the movement..."
                  className="w-full bg-[#0d0d10] border border-white/10 px-3 py-2 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-cyan-400/40 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Primary Muscles *
                  </label>
                  <button
                    type="button"
                    onClick={(e) => openMusclePicker("primary", e)}
                    className={`w-full min-h-[36px] flex flex-wrap items-center gap-1.5 bg-[#0d0d10] border px-2.5 py-1.5 text-xs transition ${
                      openPicker === "primary"
                        ? "border-cyan-400/40"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    {form.primaryMuscles.length === 0 ? (
                      <span className="text-zinc-600 px-1">Select muscles...</span>
                    ) : (
                      form.primaryMuscles.map((m) => (
                        <span key={m} className="flex items-center gap-1 bg-blue-400/10 border border-blue-400/25 text-blue-400 px-1.5 py-0.5 text-[10px] font-medium">
                          {m}
                          <span
                            role="button"
                            tabIndex={-1}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMuscle("primaryMuscles", m);
                            }}
                            className="hover:text-white cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </span>
                        </span>
                      ))
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500 ml-auto shrink-0" />
                  </button>
                </div>
                <div className="relative">
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Secondary Muscles
                  </label>
                  <button
                    type="button"
                    onClick={(e) => openMusclePicker("secondary", e)}
                    className={`w-full min-h-[36px] flex flex-wrap items-center gap-1.5 bg-[#0d0d10] border px-2.5 py-1.5 text-xs transition ${
                      openPicker === "secondary"
                        ? "border-cyan-400/40"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    {form.secondaryMuscles.length === 0 ? (
                      <span className="text-zinc-600 px-1">Select muscles...</span>
                    ) : (
                      form.secondaryMuscles.map((m) => (
                        <span key={m} className="flex items-center gap-1 bg-zinc-700/30 border border-white/10 text-zinc-300 px-1.5 py-0.5 text-[10px] font-medium">
                          {m}
                          <span
                            role="button"
                            tabIndex={-1}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMuscle("secondaryMuscles", m);
                            }}
                            className="hover:text-white cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </span>
                        </span>
                      ))
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500 ml-auto shrink-0" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Movement Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["PUSH", "PULL", "LEGS", "CORE"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, movementType: type }))}
                        className={`px-3 py-2 text-xs font-semibold border transition ${
                          form.movementType === type
                            ? type === "PUSH"
                              ? "bg-blue-400/15 border-blue-400/40 text-blue-400"
                              : type === "PULL"
                              ? "bg-cyan-400/15 border-cyan-400/40 text-cyan-400"
                              : type === "LEGS"
                              ? "bg-emerald-400/15 border-emerald-400/40 text-emerald-400"
                              : "bg-amber-400/15 border-amber-400/40 text-amber-400"
                            : "bg-[#0d0d10] border-white/10 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Input Type
                  </label>
                  <select
                    name="inputType"
                    value={form.inputType}
                    onChange={handleInputChange}
                    className="w-full bg-[#0d0d10] border border-white/10 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-cyan-400/40 transition"
                  >
                    <option value="note">Bodyweight</option>
                    <option value="time">Time Hold</option>
                    <option value="weight">Weighted</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 transition active:scale-[0.98] mt-2"
              >
                <Save className="w-4 h-4" />
                <span>Save to Library</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Muscle Picker - rendered via portal anchored to the clicked field */}
      {openPicker &&
        pickerAnchor &&
        createPortal(
          <MusclePicker
            selected={
              openPicker === "primary" ? form.primaryMuscles : form.secondaryMuscles
            }
            used={
              openPicker === "primary" ? form.secondaryMuscles : form.primaryMuscles
            }
            search={muscleSearch}
            onSearch={setMuscleSearch}
            onToggle={(name) =>
              toggleMuscle(
                openPicker === "primary" ? "primaryMuscles" : "secondaryMuscles",
                name
              )
            }
            onClose={() => {
              setOpenPicker(null);
              setPickerAnchor(null);
            }}
            anchor={pickerAnchor}
          />,
          document.body
        )}
    </div>
  );
}

function MusclePicker({ selected, used, search, onSearch, onToggle, onClose, anchor }) {
  const filtered = MUSCLE_GROUPS.filter((m) =>
    m.name.toLowerCase().includes(search.trim().toLowerCase())
  );
  const regions = [...new Set(MUSCLE_GROUPS.map((m) => m.region))];

  const width = Math.min(Math.max(anchor.width, 300), window.innerWidth - 24);
  const left = Math.max(8, Math.min(anchor.left, window.innerWidth - width - 8));

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div
        className="fixed z-[70] bg-[#16161b] border border-[#2a2a33] square-frame shadow-2xl"
        style={{
          left,
          top: anchor.top + 6,
          width,
          maxWidth: "calc(100vw - 24px)",
        }}
      >
        <div className="p-2.5 border-b border-white/5 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search muscles..."
            className="bg-transparent outline-none text-xs text-zinc-200 w-full placeholder:text-zinc-500"
          />
        </div>
        <div className="max-h-56 overflow-y-auto p-2.5 space-y-3">
          {regions.map((region) => {
            const regionMuscles = filtered.filter((m) => m.region === region);
            if (regionMuscles.length === 0) return null;
            return (
              <div key={region}>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  {region}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {regionMuscles.map((m) => {
                    const isSelected = selected.includes(m.name);
                    const isUsed = used.includes(m.name);
                    return (
                      <button
                        key={m.name}
                        type="button"
                        onClick={() => onToggle(m.name)}
                        disabled={isUsed}
                        className={`flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-medium border transition text-left ${
                          isSelected
                            ? "bg-cyan-400/10 border-cyan-400/40 text-cyan-400"
                            : isUsed
                            ? "bg-[#0d0d10] border-white/5 text-zinc-600 cursor-not-allowed"
                            : "bg-[#0d0d10] border-white/10 text-zinc-300 hover:border-zinc-500 hover:text-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 shrink-0" />}
                        <span className="truncate">{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-zinc-500 text-center py-3">No muscles found.</p>
          )}
        </div>
      </div>
    </>
  );
}
