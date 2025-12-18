// src/styles/uiTokens.js
export const UI = {
  page: "min-h-screen w-full bg-[#FFF7E6]",
  container: "max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8",

  // blocks
  section:
    "bg-white/80 backdrop-blur rounded-3xl border border-orange-100 shadow-sm",
  sectionPad: "px-4 py-4 md:px-6 md:py-5",

  // list container + header
  listWrap:
    "bg-white/80 backdrop-blur rounded-3xl border border-orange-100 shadow-sm overflow-hidden",
  listHeader:
    "px-4 py-3 md:px-6 md:py-4 border-b border-orange-100 flex items-center justify-between",

  // row card (inside list)
  rowCard:
    "rounded-2xl border border-slate-100 bg-white px-3 py-3",

  // small stuff
  backBtn:
    "inline-flex items-center gap-2 rounded-full bg-white/80 border border-orange-100 px-3 py-1 text-xs text-slate-700 shadow-sm active:scale-[0.99]",

  // consistent label typography
  label:
    "block text-[11px] font-semibold tracking-wide text-slate-600 uppercase mb-1",

  // input/select
  input:
    "w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-200",
  select:
    "w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-200",

  // icon buttons (actions)
  iconBtn:
    "inline-flex items-center justify-center w-11 h-11 rounded-2xl border border-slate-200 bg-white active:scale-[0.99]",
};
