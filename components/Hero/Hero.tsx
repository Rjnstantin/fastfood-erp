import Feature from "../UI/Feature";

export default function Hero() {
  return (
    <div className="flex h-full flex-col pt-8">
      <h2 className="text-[40px] font-extrabold leading-[1.02] tracking-[-2px]">
        <span className="block text-white">Керуй.</span>
        <span className="block text-[#ff5a00]">Аналізуй.</span>
        <span className="block text-white">Розвивай.</span>
      </h2>

      <p className="mt-4 max-w-[365px] text-[18px] leading-[1.85] text-[#9ca9bd]">
        Єдина система для управління
        <br />
        вашою мережею фастфуду
      </p>

      <div className="mt-10 flex flex-col gap-4">
        <Feature
          type="control"
          title="Контроль всіх точок"
          description="Все під контролем в реальному часі"
        />

        <Feature
          type="stock"
          title="Склад і постачання"
          description="Управління товарами і постачальниками"
        />

        <Feature
          type="staff"
          title="Працівники та зарплата"
          description="Прозоро і без помилок"
        />

        <Feature
          type="analytics"
          title="Аналітика та звіти"
          description="Дані для зростання бізнесу"
        />
      </div>

      <div className="mt-10 flex w-full max-w-[405px] items-center rounded-[18px] border border-white/[0.08] bg-gradient-to-r from-[#0d0f14] to-[#090a0d] px-4 py-4 shadow-[0_14px_35px_rgba(0,0,0,0.35)]">
        <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-[14px] border border-purple-500/10 bg-purple-500/[0.06] text-[31px] text-fuchsia-300">
          ✦✦
        </div>

        <div className="ml-4 min-w-0">
          <p className="text-[19px] font-semibold leading-none text-white">
            AI помічник
          </p>

          <p className="mt-3 text-[15px] leading-none text-[#a6b0c0]">
            Ваш розумний асистент 24/7
          </p>
        </div>

        <span className="ml-auto h-[14px] w-[14px] shrink-0 rounded-full bg-[#ff6500] shadow-[0_0_15px_rgba(255,101,0,0.95)]" />
      </div>
    </div>
  );
}