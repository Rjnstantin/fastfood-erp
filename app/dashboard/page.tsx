"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Logo from "../../components/Logo/Logo";
import CourierDialog from "../../components/CourierDialog";
import {
  getOrders,
  subscribeToOrders,
} from "../../lib/orders";

import type { Order } from "../../lib/order";

type IconName =
  | "location"
  | "bell"
  | "calendar"
  | "clock"
  | "logout"
  | "refresh"
  | "staff"
  | "courier"
  | "orders"
  | "wallet"
  | "cash"
  | "stock"
  | "assistant"
  | "more"
  | "message"
  | "arrow"
  | "box"
  | "warning";

type IconProps = {
  name: IconName;
  className?: string;
};

type ActiveEmployeeSession = {
  sessionId: string;
  employeeId: number;
  employeeName: string;
  point: string;
  position: string;
  startedAt: string;
};
type ActiveCourierSession = {
  sessionId: string;
  courierId: number;
  courierName: string;
  phone: string;
  role: "Кур'єр" | "Водій-кур'єр";
  startedAt: string;
  status: "Вільний" | "Зайнятий";
};
const employeePhones: Record<number, string> = {
  1: "+380986792140",
  2: "+380507402535",
  3: "+380967661302",
  4: "+380985651489",
  5: "+380954693090",
  6: "+380964234323",
  7: "+380675311358",
  8: "+380970730445",
  9: "+380960209824",
  10: "+380675776346",
  11: "+380684377914",
  12: "+380989978857",
  13: "+380962605542",
  14: "+380966086671",
  15: "+380660573493",
  16: "+380984349500",
  17: "+380508771430",
  18: "+380950625429",
  19: "+380988984571",
  20: "+380990609216",
  21: "+380960972131",
  22: "+380987769824",
  23: "+380687997791",
  24: "+380965292221",
  25: "+380505305251",
  26: "+380986022285",
  27: "+380974013815",
  28: "+380677475861",
};

function Icon({ name, className = "h-6 w-6" }: IconProps) {
  const paths: Record<IconName, React.ReactNode> = {
    location: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5M15 12H3" />
        <path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M4 17v-5h5" />
        <path d="M6.1 9a7 7 0 0 1 11.4-2L20 9M4 15l2.5 2a7 7 0 0 0 11.4-2" />
      </>
    ),
    staff: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2M15 14a5 5 0 0 1 6 4v2" />
      </>
    ),
    courier: (
      <>
        <path d="M5 16h10l2-5h3l1 5" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
        <path d="M8 10h6l2 6M10 7h4" />
      </>
    ),
    orders: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4V2h6v2M9 10h6M9 14h6" />
      </>
    ),
    wallet: (
      <>
        <path d="M3 7a3 3 0 0 1 3-3h12v4H6a3 3 0 0 0 0 6h15v6H6a3 3 0 0 1-3-3Z" />
        <path d="M16 11h5v5h-5a2.5 2.5 0 0 1 0-5Z" />
      </>
    ),
    cash: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M7 8h10M7 12h5M7 16h3" />
        <circle cx="16" cy="15" r="2" />
      </>
    ),
    stock: (
      <>
        <path d="m12 3 8 4-8 4-8-4 8-4Z" />
        <path d="m4 7 8 4 8-4v10l-8 4-8-4Z" />
        <path d="M12 11v10" />
      </>
    ),
    assistant: (
      <>
        <path d="M6 12a6 6 0 0 1 12 0v4" />
        <path d="M6 13H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2ZM18 13h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2Z" />
        <path d="M18 19c0 2-2 3-5 3" />
        <circle cx="11" cy="22" r="1" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    message: (
      <>
        <path d="M4 5h16v12H8l-4 4Z" />
        <path d="M8 10h.01M12 10h.01M16 10h.01" />
      </>
    ),
    arrow: <path d="m9 18 6-6-6-6" />,
    box: (
      <>
        <path d="m12 3 8 4-8 4-8-4 8-4Z" />
        <path d="m4 7 8 4 8-4v10l-8 4-8-4Z" />
      </>
    ),
    warning: (
      <>
        <path d="M12 3 2.5 20h19Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

const baseStats = [
  {
    title: "Кур’єрів на зміні",
    value: "2",
    status: "В роботі",
    icon: "courier" as IconName,
    color: "text-[#1597ff]",
    glow: "shadow-[0_0_24px_rgba(21,151,255,0.12)]",
  },
  {
    title: "Замовлень сьогодні",
    value: "18",
    status: "+5 за годину",
    icon: "orders" as IconName,
    color: "text-[#b549ff]",
    glow: "shadow-[0_0_24px_rgba(181,73,255,0.12)]",
  },
  {
    title: "Каса сьогодні",
    value: "12 430 ₴",
    status: "Оборот",
    icon: "wallet" as IconName,
    color: "text-[#19d64d]",
    glow: "shadow-[0_0_24px_rgba(25,214,77,0.12)]",
  },
];

const events = [
  {
    time: "09:21",
    title: "Прийнято товар",
    description: "Маслова — лаваш",
    icon: "box" as IconName,
    color: "text-[#19d64d]",
    background: "bg-[#19d64d]/10",
  },
  {
    time: "09:18",
    title: "Нове замовлення",
    description: "№125 на 320 ₴",
    icon: "orders" as IconName,
    color: "text-[#ff6500]",
    background: "bg-[#ff6500]/10",
  },
  {
    time: "09:12",
    title: "Передача між точками",
    description: "Портова → Ринок",
    icon: "courier" as IconName,
    color: "text-[#1597ff]",
    background: "bg-[#1597ff]/10",
  },
  {
    time: "09:07",
    title: "Нове повідомлення",
    description: "Від: Нікітіна Світлана",
    icon: "message" as IconName,
    color: "text-[#b549ff]",
    background: "bg-[#b549ff]/10",
  },
  {
    time: "09:02",
    title: "Мало товару",
    description: "Лаваш класичний",
    icon: "warning" as IconName,
    color: "text-[#e6ad00]",
    background: "bg-[#e6ad00]/10",
  },
  {
    time: "08:55",
    title: "Каса перевищила",
    description: "10 000 ₴",
    icon: "wallet" as IconName,
    color: "text-[#9ad800]",
    background: "bg-[#9ad800]/10",
  },
];

function ArrowButton({ color = "text-white" }: { color?: string }) {
  return (
    <span
      className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.035] ${color}`}
    >
      <Icon name="arrow" className="h-5 w-5" />
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [showCourierDialog, setShowCourierDialog] = useState(false);
  const [activeCouriers, setActiveCouriers] = useState<ActiveCourierSession[]>([]);
const [couriersModalOpen, setCouriersModalOpen] = useState(false);
useEffect(() => {
  function loadActiveCouriers() {
    try {
      const savedSessions = window.localStorage.getItem(
        "tema-active-courier-sessions",
      );

      if (!savedSessions) {
        setActiveCouriers([]);
        return;
      }

      const parsedSessions = JSON.parse(
        savedSessions,
      ) as ActiveCourierSession[];

      setActiveCouriers(
        Array.isArray(parsedSessions) ? parsedSessions : [],
      );
    } catch (error) {
      console.error(
        "Не вдалося завантажити кур'єрів на зміні:",
        error,
      );
      setActiveCouriers([]);
    }
  }

  loadActiveCouriers();

  window.addEventListener("storage", loadActiveCouriers);
  window.addEventListener("focus", loadActiveCouriers);

  return () => {
    window.removeEventListener("storage", loadActiveCouriers);
    window.removeEventListener("focus", loadActiveCouriers);
  };
}, []);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const refreshOrders = () => {
      setOrders(getOrders());
    };

    refreshOrders();

    return subscribeToOrders(refreshOrders);
  }, []);
  const [activeEmployees, setActiveEmployees] = useState<
    ActiveEmployeeSession[]
  >([]);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [allPointsStaffModalOpen, setAllPointsStaffModalOpen] =
  useState(false);
  const [finishWorkModalOpen, setFinishWorkModalOpen] =
    useState(false);
  const [finishShiftModalOpen, setFinishShiftModalOpen] =
    useState(false);
  const [selectedSession, setSelectedSession] =
    useState<ActiveEmployeeSession | null>(null);

  useEffect(() => {
    function loadActiveEmployees() {
      try {
        const savedSessions = window.localStorage.getItem(
          "tema-active-employees",
        );

        if (!savedSessions) {
          setActiveEmployees([]);
          return;
        }

        const parsedSessions = JSON.parse(
          savedSessions,
        ) as ActiveEmployeeSession[];

        setActiveEmployees(
          Array.isArray(parsedSessions) ? parsedSessions : [],
        );
      } catch (error) {
        console.error(
          "Не вдалося завантажити працівників на зміні:",
          error,
        );
        setActiveEmployees([]);
      }
    }

    loadActiveEmployees();

    window.addEventListener("storage", loadActiveEmployees);
    window.addEventListener("focus", loadActiveEmployees);

    return () => {
      window.removeEventListener("storage", loadActiveEmployees);
      window.removeEventListener("focus", loadActiveEmployees);
    };
  }, []);

  const currentPoint =
    activeEmployees[0]?.point ??
    (typeof window !== "undefined"
      ? window.localStorage.getItem("tema-active-point")
      : null) ??
    "Портова";
      const todayOrdersCount = useMemo(() => {
    const today = new Date();

    return orders.filter((order) => {
      const createdAt = new Date(order.createdAt);

      return (
        order.point === currentPoint &&
        createdAt.getFullYear() === today.getFullYear() &&
        createdAt.getMonth() === today.getMonth() &&
        createdAt.getDate() === today.getDate()
      );
    }).length;
  }, [orders, currentPoint]);

  function formatWorkedTime(startedAt: string, endedAt = new Date()) {
    const started = new Date(startedAt);
    const diffMinutes = Math.max(
      0,
      Math.floor(
        (endedAt.getTime() - started.getTime()) / 60000,
      ),
    );

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    return `${hours} год ${minutes} хв`;
  }

  function readFinishedSessions() {
    try {
      const saved = window.localStorage.getItem(
        "tema-finished-employee-sessions",
      );

      const parsed = saved ? JSON.parse(saved) : [];

      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveFinishedSessions(
    sessions: Array<
      ActiveEmployeeSession & {
        finishedAt: string;
        workedMinutes: number;
      }
    >,
  ) {
    const previous = readFinishedSessions();

    window.localStorage.setItem(
      "tema-finished-employee-sessions",
      JSON.stringify([...previous, ...sessions]),
    );
  }

  function createFinishedSession(
    session: ActiveEmployeeSession,
    finishedAt: Date,
  ) {
    const startedAt = new Date(session.startedAt);
    const workedMinutes = Math.max(
      0,
      Math.floor(
        (finishedAt.getTime() - startedAt.getTime()) / 60000,
      ),
    );

    return {
      ...session,
      finishedAt: finishedAt.toISOString(),
      workedMinutes,
    };
  }

  function openFinishWorkConfirmation(
    session: ActiveEmployeeSession,
  ) {
    setSelectedSession(session);
  }

  function confirmFinishSelectedEmployee() {
    if (!selectedSession) return;

    const finishedAt = new Date();
    const finishedSession = createFinishedSession(
      selectedSession,
      finishedAt,
    );

    saveFinishedSessions([finishedSession]);

    const remainingEmployees = activeEmployees.filter(
      (session) =>
        session.sessionId !== selectedSession.sessionId,
    );

    window.localStorage.setItem(
      "tema-active-employees",
      JSON.stringify(remainingEmployees),
    );

    if (remainingEmployees.length === 0) {
      window.localStorage.removeItem("tema-active-point");
      window.localStorage.removeItem(
        "tema-current-employee-session",
      );
    } else {
      window.localStorage.setItem(
        "tema-current-employee-session",
        JSON.stringify(remainingEmployees[0]),
      );
    }

    setActiveEmployees(remainingEmployees);
    setSelectedSession(null);
    setFinishWorkModalOpen(false);
    setStaffModalOpen(false);

    router.push("/");
  }

  function confirmFinishWholeShift() {
    if (activeEmployees.length === 0) return;

    const finishedAt = new Date();
    const finishedSessions = activeEmployees.map((session) =>
      createFinishedSession(session, finishedAt),
    );

    saveFinishedSessions(finishedSessions);

    window.localStorage.removeItem("tema-active-employees");
    window.localStorage.removeItem("tema-active-point");
    window.localStorage.removeItem(
      "tema-current-employee-session",
    );

    setActiveEmployees([]);
    setFinishShiftModalOpen(false);
    setStaffModalOpen(false);

    router.push("/");
  }

    const stats = useMemo(
    () => [
      {
        title: "Працівників на зміні",
        value: String(activeEmployees.length),
        status:
          activeEmployees.length > 0
            ? "Працюють зараз"
            : "Нікого немає",
        icon: "staff" as IconName,
        color: "text-[#ff6500]",
        glow: "shadow-[0_0_24px_rgba(255,101,0,0.12)]",
      },
      ...baseStats.map((stat) => {
  if (stat.title === "Кур’єрів на зміні") {
    return {
      ...stat,
      value: String(activeCouriers.length),
      status:
        activeCouriers.length > 0
          ? "В роботі"
          : "Немає на зміні",
    };
  }

  if (stat.title === "Замовлень сьогодні") {
    return {
      ...stat,
      value: String(todayOrdersCount),
    };
  }

  return stat;
}),
    ],
    [activeEmployees.length, activeCouriers.length, todayOrdersCount],
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#02070c] px-3 py-2 text-white">
      <div className="mx-auto w-full max-w-[1540px]">
        {/* Верхняя панель */}
        <header className="grid min-h-[70px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3">
          {/* Ліва частина: логотип і точка */}
          <div className="flex min-w-0 items-center gap-5">
            <Logo width={125} height={37} />

            <div className="hidden h-10 w-px bg-white/[0.07] lg:block" />

            <div className="hidden items-center gap-3 md:flex">
              <Icon
                name="location"
                className="h-6 w-6 text-[#ff6500]"
              />

              <div>
                <p className="text-[16px] font-semibold text-white">
                  {currentPoint}
                </p>
                <p className="mt-1 text-[12px] text-[#778190]">
                  Поточна точка
                </p>
              </div>
            </div>
          </div>

          {/* Центр: чотири основні кнопки */}
          <div className="flex min-w-0 items-center justify-center gap-2">
            <button
              type="button"
              className="relative hidden h-[38px] items-center gap-2 rounded-[10px] border border-[#ff6500]/50 bg-[#ff6500]/[0.035] px-3 text-[12px] font-semibold transition hover:bg-[#ff6500]/[0.08] lg:flex"
            >
              <Icon
                name="bell"
                className="h-4 w-4 text-[#ffb000]"
              />

              <span>Важливі події</span>

              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff5a00] px-1 text-[10px] font-bold">
                3
              </span>
            </button>

            <Link
              href="/"
              className="flex h-[38px] items-center gap-2 rounded-[10px] border border-[#19d64d]/45 bg-[#19d64d]/[0.04] px-3 text-[12px] font-semibold text-[#56e47e] transition hover:bg-[#19d64d]/10"
            >
              <span className="text-[15px] leading-none">+</span>
              <span className="hidden xl:inline">
                Додати працівника
              </span>
              <span className="xl:hidden">Додати</span>
              <Icon name="staff" className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={() => setFinishWorkModalOpen(true)}
              className="flex h-[38px] items-center gap-2 rounded-[10px] border border-[#f2b300]/45 bg-[#f2b300]/[0.04] px-3 text-[12px] font-semibold text-[#f4c542] transition hover:bg-[#f2b300]/10"
            >
              <span className="hidden xl:inline">
                Завершити роботу
              </span>
              <span className="xl:hidden">Роботу</span>
              <Icon name="staff" className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setFinishShiftModalOpen(true)}
              className="flex h-[38px] items-center gap-2 rounded-[10px] border border-[#ff6500]/70 px-3 text-[12px] font-semibold text-[#ff7a22] transition hover:bg-[#ff6500]/10"
            >
              <span className="hidden xl:inline">
                Завершити зміну
              </span>
              <span className="xl:hidden">Зміну</span>
              <Icon name="logout" className="h-4 w-4" />
            </button>
          </div>

          {/* Права частина: дата, час і сповіщення */}
          <div className="flex items-center justify-end gap-3">
            <div className="hidden items-center gap-2 md:flex">
              <Icon
                name="calendar"
                className="h-5 w-5 text-[#8995a7]"
              />

              <div>
                <p className="text-[13px] font-semibold">
                  01.08.2026
                </p>
                <p className="mt-0.5 text-[11px] text-[#778190]">
                  П’ятниця
                </p>
              </div>
            </div>

            <div className="hidden h-8 w-px bg-white/[0.07] md:block" />

            <div className="hidden items-center gap-2 sm:flex">
              <Icon
                name="clock"
                className="h-5 w-5 text-[#8995a7]"
              />
              <p className="text-[14px] font-semibold">09:24</p>
            </div>

            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-[11px] text-[#8995a7] transition hover:bg-white/[0.05] hover:text-white"
            >
              <Icon name="bell" className="h-5 w-5" />

              <span className="absolute right-0.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff5a00] px-1 text-[9px] font-bold text-white">

              </span>
            </button>
          </div>
        </header>

        {/* Основная область */}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_350px]">
          <section className="rounded-[22px] border border-white/[0.055] bg-gradient-to-br from-[#09121b] via-[#071019] to-[#050b11] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-[30px] font-bold tracking-[-1px]">
                  Головна
                </h1>

                <p className="mt-1 text-[16px] text-[#9ba4b3]">
                  Ваш робочий простір
                </p>
              </div>

              <button
  type="button"
  className="flex h-[46px] items-center gap-2 rounded-[12px] border border-white/[0.07] bg-white/[0.025] px-4 text-[14px] text-[#a7afbc] transition hover:bg-white/[0.055] hover:text-white"
>
  <Icon name="refresh" className="h-5 w-5" />
  Оновити
</button>
            </div>

            {/* Показатели */}
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {stats.map((stat) => (
                <button
                  key={stat.title}
                  type="button"
                  onClick={() => {
  if (stat.title === "Працівників на зміні") {
    setStaffModalOpen(true);
  }

  if (stat.title === "Кур’єрів на зміні") {
    setCouriersModalOpen(true);
  }
}}
                  className={`rounded-[17px] border border-white/[0.07] bg-gradient-to-br from-[#111b25] to-[#0b131b] px-4 py-3 text-left ${stat.glow} ${
                    stat.title === "Працівників на зміні" ||
stat.title === "Кур’єрів на зміні"
  ? "cursor-pointer transition hover:-translate-y-0.5 hover:border-[#ff6500]/45"
  : "cursor-default"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Icon
                      name={stat.icon}
                      className={`h-9 w-9 shrink-0 ${stat.color}`}
                    />

                    <div className="min-w-0">
                      <p className="text-[13px] text-[#aab1bc]">
                        {stat.title}
                      </p>

                      <p className="mt-1 text-[23px] font-bold">
                        {stat.value}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#21d35b]" />
                    <span className="text-[13px] text-[#aab1bc]">
                      {stat.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Основные карточки */}
            <div className="mt-4 grid gap-3 lg:grid-cols-[1.35fr_1fr_1fr]">
              <Link
  href="/cashier"
                className="group relative min-h-[215px] overflow-hidden rounded-[20px] border border-[#ff6500]/70 bg-gradient-to-br from-[#8a2900] via-[#461503] to-[#140b08] p-5 text-left shadow-[0_0_30px_rgba(255,82,0,0.18)] transition hover:-translate-y-1 hover:shadow-[0_0_44px_rgba(255,82,0,0.28)]"
              >
                <div className="relative z-10">
                  <h2 className="text-[31px] font-bold">Каса</h2>

                  <p className="mt-3 max-w-[230px] text-[16px] leading-[1.55] text-orange-50/85">
                    Продажі, замовлення
                    <br />
                    та оплата на точці
                  </p>
                </div>

                <div className="absolute bottom-4 left-5 z-10">
                  <ArrowButton color="text-white" />
                </div>

                <div className="absolute bottom-0 right-0 h-[170px] w-[200px] transition duration-300 group-hover:scale-[1.03]">
  <img
    src="/images/cash-terminal.png"
    alt=""
    className="h-full w-full object-contain"
  />
</div>
              </Link>

              <button
                type="button"
                className="group min-h-[215px] rounded-[20px] border border-[#168cff]/30 bg-gradient-to-br from-[#0b2440] to-[#07121e] p-5 text-left transition hover:-translate-y-1 hover:border-[#168cff]/60 hover:shadow-[0_0_35px_rgba(22,140,255,0.14)]"
              >
                <Icon
                  name="courier"
                  className="h-11 w-11 text-[#1597ff]"
                />

                <h2 className="mt-4 text-[23px] font-bold">Замовлення</h2>

                <p className="mt-3 text-[15px] leading-[1.55] text-[#aab3c0]">
                  Кухні, Опорний
                  <br />
                  та передача між точками
                </p>

                <div className="mt-4">
                  <ArrowButton color="text-[#1597ff]" />
                </div>
              </button>

              <button
                type="button"
                className="group min-h-[215px] rounded-[20px] border border-[#14ce50]/25 bg-gradient-to-br from-[#082d22] to-[#071713] p-5 text-left transition hover:-translate-y-1 hover:border-[#14ce50]/55 hover:shadow-[0_0_35px_rgba(20,206,80,0.13)]"
              >
                <Icon name="stock" className="h-11 w-11 text-[#19d64d]" />

                <h2 className="mt-4 text-[23px] font-bold">Склад</h2>

                <p className="mt-3 text-[15px] leading-[1.55] text-[#aab3c0]">
                  Приймання, залишки
                  <br />
                  та інвентаризація
                </p>

                <div className="mt-4">
                  <ArrowButton color="text-[#19d64d]" />
                </div>
              </button>
            </div>

            {/* Нижний ряд модулей */}
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <button
                type="button"
                className="group relative min-h-[145px] overflow-hidden rounded-[20px] border border-purple-500/20 bg-gradient-to-br from-[#201331] to-[#0b1019] p-5 text-left transition hover:-translate-y-1 hover:border-purple-500/45"
              >
                <div className="flex items-center gap-5">
                  <div className="relative -ml-5 -mb-5 h-[145px] w-[140px] shrink-0 self-end">
  <img
    src="/images/ai-assistant.png"
    alt="AI помічник"
    className="h-full w-full object-contain object-bottom"
  />
</div>

                  <div>
                    <h2 className="text-[21px] font-bold">AI помічник</h2>

                    <p className="mt-3 text-[14px] leading-[1.55] text-[#aab3c0]">
                      Інтелектуальна допомога
                      <br />
                      та швидкі дії
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-5 right-5">
                  <ArrowButton color="text-purple-300" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAllPointsStaffModalOpen(true)}
                className="relative min-h-[145px] rounded-[20px] border border-[#e9a900]/20 bg-gradient-to-br from-[#211c11] to-[#0b1017] p-5 text-left transition hover:-translate-y-1 hover:border-[#e9a900]/45"
              >
                <div className="flex items-start gap-5">
                  <Icon name="staff" className="h-13 w-13 text-[#f2b300]" />

                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-[21px] font-bold">
                        Працівники
                      </h2>
                      <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#e9a900]/15 px-2 text-[12px] font-bold text-[#f2b300]">
                        {activeEmployees.length}
                      </span>
                    </div>

                    <p className="mt-3 text-[14px] leading-[1.55] text-[#aab3c0]">
  Хто сьогодні працює
  <br />
  на точках
</p>
                  </div>
                </div>

                <div className="absolute bottom-5 right-5">
                  <ArrowButton color="text-[#f2b300]" />
                </div>
              </button>

              <button
                type="button"
                className="relative min-h-[145px] rounded-[20px] border border-white/[0.07] bg-gradient-to-br from-[#14202b] to-[#0a1118] p-5 text-left transition hover:-translate-y-1 hover:border-white/[0.16]"
              >
                <div className="flex items-start gap-5">
                  <Icon name="more" className="h-13 w-13 text-[#91a0b2]" />

                  <div>
                    <h2 className="text-[21px] font-bold">Ще</h2>

                    <p className="mt-3 text-[14px] leading-[1.55] text-[#aab3c0]">
                      Фінанси, аналітика,
                      <br />
                      архів та налаштування
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-5 right-5">
                  <ArrowButton color="text-[#aab3c0]" />
                </div>
              </button>
            </div>
          </section>

          {/* Правая колонка событий */}
          <aside className="rounded-[22px] border border-white/[0.055] bg-gradient-to-br from-[#09121b] to-[#050b11] p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[22px] font-bold">Події сьогодні</h2>

              <button
                type="button"
                className="rounded-[11px] border border-white/[0.07] bg-white/[0.025] px-4 py-2 text-[13px] text-[#9ba4b3] transition hover:bg-white/[0.055] hover:text-white"
              >
                Всі події
              </button>
            </div>

            <div className="mt-3">
         
              {events.map((event) => (
                <div
                  key={`${event.time}-${event.title}`}
                  className="grid grid-cols-[48px_44px_1fr] items-start gap-3 border-b border-white/[0.055] py-3 last:border-b-0"
                >
                  <p className="pt-3 text-[13px] text-[#9ba4b3]">
                    {event.time}
                  </p>

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.06] ${event.background} ${event.color}`}
                  >
                    <Icon name={event.icon} className="h-5 w-5" />
                  </div>

                  <div className="pt-1">
                    <p className="text-[14px] font-semibold text-white">
                      {event.title}
                    </p>

                    <p className="mt-1 text-[13px] text-[#9ba4b3]">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="mt-3 flex h-[58px] w-full items-center justify-between rounded-[14px] border border-white/[0.07] bg-white/[0.025] px-5 text-[15px] font-semibold transition hover:bg-white/[0.055]"
            >
              Всі події
              <Icon name="arrow" className="h-5 w-5 text-[#9ba4b3]" />
            </button>
          </aside>
        </div>

        {/* Маленькая нижняя панель */}
        <footer className="mt-3 flex justify-center">
          <div className="flex w-full max-w-[760px] items-center justify-center gap-5 rounded-[18px] border border-white/[0.06] bg-[#071019] px-5 py-2 shadow-[0_20px_55px_rgba(0,0,0,0.28)]">
            <button
              type="button"
              onClick={() => setShowCourierDialog(true)}
              className="group flex h-[48px] min-w-[265px] items-center justify-between rounded-[14px] border border-[#ff6500]/35 bg-[#ff6500]/[0.035] px-5 transition hover:border-[#ff6500]/70 hover:bg-[#ff6500]/[0.08]"
            >
              <div className="flex items-center gap-4">
                <Icon
                  name="courier"
                  className="h-7 w-7 text-[#ff6500]"
                />

                <span className="text-[16px] font-semibold">
                  Виклик кур’єра
                </span>
              </div>

              <Icon
                name="arrow"
                className="h-5 w-5 text-[#ff6500] transition group-hover:translate-x-1"
              />
            </button>

            <div className="h-9 w-px bg-white/[0.08]" />

            <button
              type="button"
              className="group relative flex h-[48px] min-w-[300px] items-center justify-between rounded-[14px] border border-[#1597ff]/30 bg-[#1597ff]/[0.035] px-5 transition hover:border-[#1597ff]/65 hover:bg-[#1597ff]/[0.08]"
            >
              <div className="flex items-center gap-4">
                <Icon
                  name="message"
                  className="h-7 w-7 text-[#1597ff]"
                />

                <span className="text-[16px] font-semibold">
                  Зв’язок з точкою / всіма
                </span>
              </div>

              <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ff5a00] px-1.5 text-[11px] font-bold">
                2
              </span>

              <Icon
                name="arrow"
                className="h-5 w-5 text-[#1597ff] transition group-hover:translate-x-1"
              />
            </button>
          </div>
        </footer>

        <div className="mt-2 flex items-center gap-3 px-4 pb-1 text-[12px] text-[#87919f]">
          <span className="h-3 w-3 rounded-full bg-[#20d05a] shadow-[0_0_13px_rgba(32,208,90,0.8)]" />
          <span className="font-semibold text-white">Система працює</span>
          <span className="h-4 w-px bg-white/10" />
          <span>Всі сервіси активні</span>
        </div>
      </div>

      {finishWorkModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => {
            setFinishWorkModalOpen(false);
            setSelectedSession(null);
          }}
        >
          <div
            className="w-full max-w-[680px] rounded-[22px] border border-[#f2b300]/25 bg-[#09131d] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] uppercase tracking-[1.3px] text-[#f2b300]">
                  {currentPoint}
                </p>
                <h2 className="mt-2 text-[25px] font-bold">
                  Завершити роботу
                </h2>
                <p className="mt-1 text-[13px] text-[#87919f]">
                  Оберіть працівника, який завершує роботу.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFinishWorkModalOpen(false);
                  setSelectedSession(null);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-[22px] text-[#aab3c0] transition hover:bg-white/[0.07] hover:text-white"
              >
                ×
              </button>
            </div>

            {activeEmployees.length === 0 ? (
              <div className="mt-6 rounded-[16px] border border-dashed border-white/[0.1] bg-white/[0.02] px-5 py-10 text-center">
                <p className="text-[16px] font-semibold">
                  Активних працівників немає
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {activeEmployees.map((session) => (
                  <div
                    key={session.sessionId}
                    className="flex items-center justify-between gap-4 rounded-[15px] border border-[#f2b300]/20 bg-[#111b25] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold">
                        {session.employeeName}
                      </p>
                      <p className="mt-1 text-[12px] text-[#8f98a6]">
                        {session.position}
                      </p>
                      <p className="mt-1 text-[12px] text-[#c0c7d1]">
                        Початок:{" "}
                        {new Date(
                          session.startedAt,
                        ).toLocaleTimeString("uk-UA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" · "}
                        Відпрацьовано:{" "}
                        {formatWorkedTime(session.startedAt)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openFinishWorkConfirmation(session)
                      }
                      className="shrink-0 rounded-[11px] border border-[#f2b300]/40 bg-[#f2b300]/[0.07] px-4 py-2.5 text-[12px] font-bold text-[#f4c542] transition hover:bg-[#f2b300]/15"
                    >
                      Завершити
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedSession && (
              <div className="mt-5 rounded-[16px] border border-red-400/25 bg-red-500/[0.05] p-4">
                <p className="text-[16px] font-bold text-white">
                  Ви впевнені?
                </p>
                <p className="mt-2 text-[14px] text-[#cfd5de]">
                  {selectedSession.employeeName}
                </p>
                <p className="mt-1 text-[13px] text-[#9ca6b4]">
                  Відпрацьовано:{" "}
                  {formatWorkedTime(selectedSession.startedAt)}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedSession(null)}
                    className="h-[46px] rounded-[12px] border border-white/[0.1] bg-white/[0.03] text-[13px] font-semibold text-[#b8c0cb] transition hover:bg-white/[0.07]"
                  >
                    Скасувати
                  </button>

                  <button
                    type="button"
                    onClick={confirmFinishSelectedEmployee}
                    className="h-[46px] rounded-[12px] bg-[#ff5a00] text-[13px] font-bold text-white transition hover:bg-[#ff6b16]"
                  >
                    Так, завершити
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {finishShiftModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setFinishShiftModalOpen(false)}
        >
          <div
            className="w-full max-w-[700px] rounded-[22px] border border-[#ff6500]/30 bg-[#09131d] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] uppercase tracking-[1.3px] text-[#ff7a22]">
                  {currentPoint}
                </p>
                <h2 className="mt-2 text-[25px] font-bold">
                  Завершити зміну
                </h2>
                <p className="mt-1 text-[13px] text-[#87919f]">
                  Роботу буде завершено всім активним працівникам.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFinishShiftModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-[22px] text-[#aab3c0] transition hover:bg-white/[0.07] hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {activeEmployees.map((session) => (
                <div
                  key={session.sessionId}
                  className="rounded-[15px] border border-[#ff6500]/20 bg-[#111b25] px-4 py-3"
                >
                  <p className="text-[15px] font-semibold">
                    {session.employeeName}
                  </p>
                  <p className="mt-1 text-[12px] text-[#8f98a6]">
                    {session.position}
                  </p>
                  <p className="mt-1 text-[12px] text-[#c0c7d1]">
                    {new Date(
                      session.startedAt,
                    ).toLocaleTimeString("uk-UA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" — "}
                    {new Date().toLocaleTimeString("uk-UA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" · "}
                    {formatWorkedTime(session.startedAt)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[15px] border border-red-400/20 bg-red-500/[0.05] px-4 py-3 text-[13px] leading-[1.5] text-red-100">
              Ви впевнені? Після підтвердження зміну точки буде
              закрито, а всім працівникам буде зафіксовано час
              завершення роботи.
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFinishShiftModalOpen(false)}
                className="h-[50px] rounded-[13px] border border-white/[0.1] bg-white/[0.03] text-[14px] font-semibold text-[#b8c0cb] transition hover:bg-white/[0.07]"
              >
                Скасувати
              </button>

              <button
                type="button"
                onClick={confirmFinishWholeShift}
                disabled={activeEmployees.length === 0}
                className="h-[50px] rounded-[13px] bg-[#ff5a00] text-[14px] font-bold text-white transition hover:bg-[#ff6b16] disabled:cursor-not-allowed disabled:bg-[#512617] disabled:text-white/35"
              >
                Так, завершити зміну
              </button>
            </div>
          </div>
        </div>
      )}

      {staffModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setStaffModalOpen(false)}
        >
          <div
            className="w-full max-w-[620px] rounded-[22px] border border-[#ff6500]/25 bg-[#09131d] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] uppercase tracking-[1.3px] text-[#ff7a22]">
                  {currentPoint}
                </p>
                <h2 className="mt-2 text-[25px] font-bold">
                  Працівники на зміні
                </h2>
                <p className="mt-1 text-[13px] text-[#87919f]">
                  Зараз працює: {activeEmployees.length}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-[22px] text-[#aab3c0] transition hover:bg-white/[0.07] hover:text-white"
              >
                ×
              </button>
            </div>

            {activeEmployees.length === 0 ? (
              <div className="mt-6 rounded-[16px] border border-dashed border-white/[0.1] bg-white/[0.02] px-5 py-10 text-center">
                <p className="text-[16px] font-semibold">
                  На зміні поки нікого немає
                </p>
                <p className="mt-2 text-[13px] text-[#87919f]">
                  Додайте працівника через кнопку у верхній панелі.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {activeEmployees.map((session, index) => (
                  <div
                    key={session.sessionId}
                    className="flex items-center justify-between gap-4 rounded-[15px] border border-[#ff6500]/20 bg-[#111b25] px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ff6500]/12 text-[14px] font-bold text-[#ff8a3d]">
                        {index + 1}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold">
                          {session.employeeName}
                        </p>
                        <p className="mt-1 text-[12px] text-[#8f98a6]">
                          {session.position}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-[12px] text-[#87919f]">
                        Початок роботи
                      </p>
                      <p className="mt-1 text-[14px] font-bold text-[#56e47e]">
                        {new Date(
                          session.startedAt,
                        ).toLocaleTimeString("uk-UA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link
              href="/"
              className="mt-6 flex h-[54px] w-full items-center justify-center gap-3 rounded-[14px] bg-[#ff5a00] text-[15px] font-bold text-white transition hover:bg-[#ff6b16]"
            >
              <span className="text-[21px] leading-none">+</span>
              Додати працівника
            </Link>
          </div>
        </div>
      )}
            {allPointsStaffModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setAllPointsStaffModalOpen(false)}
        >
          <div
            className="w-full max-w-[760px] rounded-[22px] border border-[#e9a900]/25 bg-[#09131d] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] uppercase tracking-[1.3px] text-[#f2b300]">
                  Працівники
                </p>

                <h2 className="mt-2 text-[25px] font-bold">
                  Хто сьогодні працює на точках
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setAllPointsStaffModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-[22px] text-[#aab3c0] transition hover:bg-white/[0.07] hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {activeEmployees.length === 0 ? (
                <div className="rounded-[16px] border border-dashed border-white/[0.1] bg-white/[0.02] px-5 py-10 text-center">
                  <p className="text-[16px] font-semibold">
                    Сьогодні ще ніхто не працює
                  </p>
                </div>
              ) : (
                Array.from(
                  new Set(activeEmployees.map((session) => session.point)),
                ).map((pointName) => (
                  <div
                    key={pointName}
                    className="rounded-[16px] border border-[#e9a900]/20 bg-[#111b25] p-4"
                  >
                    <p className="text-[14px] font-bold uppercase tracking-[1px] text-[#f2b300]">
                      {pointName}
                    </p>

                    <div className="mt-3 space-y-3">
                      {activeEmployees
                        .filter((session) => session.point === pointName)
                        .map((session) => (
                          <div
                            key={session.sessionId}
                            className="rounded-[12px] border border-white/[0.06] bg-white/[0.025] px-4 py-3"
                          >
                            <p className="text-[15px] font-semibold">
                              {session.employeeName}
                            </p>

                            <p className="mt-1 text-[12px] text-[#8f98a6]">
                              {session.position}
                            </p>

                            <p className="mt-1 text-[13px] text-[#cbd3dd]">
                              {employeePhones[session.employeeId] ?? "Телефон не вказано"}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
            {couriersModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setCouriersModalOpen(false)}
        >
          <div
            className="w-full max-w-[620px] rounded-[22px] border border-[#1597ff]/25 bg-[#09131d] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] uppercase tracking-[1.3px] text-[#1597ff]">
                  Кур’єрська служба
                </p>

                <h2 className="mt-2 text-[25px] font-bold">
                  Кур’єри на зміні
                </h2>

                <p className="mt-1 text-[13px] text-[#87919f]">
                  Зараз онлайн: {activeCouriers.length}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCouriersModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-[22px] text-[#aab3c0] transition hover:bg-white/[0.07] hover:text-white"
              >
                ×
              </button>
            </div>

            {activeCouriers.length === 0 ? (
              <div className="mt-6 rounded-[16px] border border-dashed border-white/[0.1] bg-white/[0.02] px-5 py-10 text-center">
                <p className="text-[16px] font-semibold">
                  Кур’єрів на зміні немає
                </p>

                <p className="mt-2 text-[13px] text-[#87919f]">
                  Зараз жоден кур’єр не увійшов у зміну.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {activeCouriers.map((courier, index) => (
                  <div
                    key={courier.sessionId}
                    className="flex items-center justify-between gap-4 rounded-[15px] border border-[#1597ff]/20 bg-[#111b25] px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1597ff]/10 text-[14px] font-bold text-[#45adff]">
                        {index + 1}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold">
                          {courier.courierName}
                        </p>

                        <p className="mt-1 text-[12px] text-[#8f98a6]">
                          {courier.role}
                        </p>

                        <p className="mt-1 text-[13px] font-medium text-[#cbd3dd]">
                          {courier.phone}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p
                        className={`text-[13px] font-bold ${
                          courier.status === "Вільний"
                            ? "text-[#56e47e]"
                            : "text-[#f2b300]"
                        }`}
                      >
                        {courier.status}
                      </p>

                      <p className="mt-1 text-[11px] text-[#87919f]">
                        з{" "}
                        {new Date(courier.startedAt).toLocaleTimeString(
                          "uk-UA",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <CourierDialog
  open={showCourierDialog}
  currentPoint={currentPoint}
  employeeName=""
  onClose={() => setShowCourierDialog(false)}
/>
    </main>
  );
}