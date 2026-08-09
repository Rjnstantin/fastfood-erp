import Header from "../components/Header/Header";
import Hero from "../components/Hero/Hero";
import BurgerScene from "../components/BurgerScene/BurgerScene";
import LoginCard from "../components/Login/LoginCard";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#030405] px-4 py-4">
      <section className="relative mx-auto min-h-[820px] w-full max-w-[1480px] overflow-visible rounded-[28px] border border-orange-950/70 bg-[#030405]">
        <Header />

        <div className="grid min-h-[740px] grid-cols-[32%_36%_32%] items-center pt-16">
          {/* Левая часть */}
          <div className="relative z-10 self-stretch px-10 pb-8">
            <Hero />
          </div>

          {/* Центральный бургер */}
          <div className="relative z-0 flex min-h-[690px] items-center justify-center overflow-visible">
            <BurgerScene />
          </div>

          {/* Правая часть */}
          <div className="relative z-10 flex min-h-[720px] items-center px-5 pb-5 pt-2">
            <LoginCard />
          </div>
        </div>
                {/* Нижняя панель */}
        <div className="absolute bottom-5 left-0 right-0 z-20 flex items-center justify-center gap-10 text-[13px] text-zinc-500">
          {/* Telegram Bot */}
          <button className="flex items-center gap-2 transition hover:text-white">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="#229ED9"
              aria-hidden="true"
            >
              <path d="M21.8 3.2 2.9 10.5c-1.3.5-1.3 1.3-.2 1.6l4.8 1.5 1.9 5.8c.2.7.1 1 .8 1 .5 0 .7-.2 1-.5l2.4-2.3 5 3.7c.9.5 1.6.2 1.8-.9L23.7 5c.3-1.4-.5-2-1.9-1.8ZM9.2 13.2l9.4-5.9c.5-.3.9-.1.5.2l-7.7 7-0.3 3.5-1.9-4.8Z" />
            </svg>
            <span>Telegram Bot</span>
          </button>

          {/* App Store */}
          <button className="flex items-center gap-2 transition hover:text-white">
            <span className="text-[19px] leading-none text-white"></span>
            <span>App Store</span>
          </button>

          {/* Google Play */}
          <button className="flex items-center gap-2 transition hover:text-white">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path fill="#34A853" d="M3 2.8v18.4l9.2-9.2L3 2.8Z" />
              <path fill="#4285F4" d="m3 2.8 11.4 6.6-2.2 2.6L3 2.8Z" />
              <path fill="#FBBC04" d="m3 21.2 11.4-6.6-2.2-2.6L3 21.2Z" />
              <path
                fill="#EA4335"
                d="m14.4 9.4 4.8 2.8c.7.4.7 1.2 0 1.6l-4.8 2.8-2.2-4.6 2.2-2.6Z"
              />
            </svg>
            <span>Google Play</span>
          </button>
        </div>
      </section>
    </main>
  );
}