"use client";

export function PrintPermitButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#013a58] transition"
    >
      Print / Save PDF
    </button>
  );
}
