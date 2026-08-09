import Logo from "../Logo/Logo";
export default function Header() {
  return (
    <header className="absolute left-8 right-8 top-8 z-20 flex items-center justify-between">
      {/* Логотип */}
      <Logo width={145} height={41} />

      {/* Правая часть */}
      <div className="flex items-center gap-4">
        <button className="flex h-12 items-center gap-2 rounded-2xl border border-orange-500/25 bg-[#111215] px-5 text-[20px] text-white transition hover:border-orange-500/50">
          🌐
          <span className="text-[18px] font-medium">UA</span>
          <span className="text-sm">⌄</span>
        </button>

        <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-700 bg-[#111215] text-xl text-white transition hover:border-orange-500/50">
          ☼
        </button>
      </div>
    </header>
  );
}