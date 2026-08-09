"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  completeCourierOrder,
  getCourierActiveOrders,
  subscribeToOrders,
} from "../../../lib/orders";
import type { Order } from "../../../lib/order";

type CourierRole = "Кур'єр" | "Водій-кур'єр";

type CourierSession = {
  sessionId: string;
  courierId: number;
  courierName: string;
  phone: string;
  role: CourierRole;
  startedAt: string;
  status: "Вільний" | "Зайнятий";
};

const ACTIVE_SESSIONS_KEY = "tema-active-courier-sessions";
const CURRENT_SESSION_KEY = "tema-current-courier-session";
const supportPoints = [
  {
    id: "portova",
    name: "Портова",
    phone: "",
  },
  {
    id: "opornyi",
    name: "Опорний",
    phone: "",
  },
  {
    id: "rynok",
    name: "Ринок",
    phone: "",
  },
  {
    id: "heroiv-dnipra",
    name: "Героїв Дніпра 72",
    phone: "",
  },
  {
    id: "maslova",
    name: "Маслова 14",
    phone: "",
  },
  {
    id: "lesi-ukrainky",
    name: "Лесі Українки 51",
    phone: "",
  },
  {
    id: "kitchen-myru",
    name: "Кухня Миру 1",
    phone: "",
  },
  {
    id: "kitchen-slavutych",
    name: "Кухня Славутич",
    phone: "",
  },
];

export default function CourierOrdersPage() {
  const router = useRouter();

  const [currentSession, setCurrentSession] =
    useState<CourierSession | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedSession = window.localStorage.getItem(
        CURRENT_SESSION_KEY,
      );

      if (!savedSession) {
        setCurrentSession(null);
        setOrders([]);
        setIsLoaded(true);
        return;
      }

      const parsedSession = JSON.parse(
        savedSession,
      ) as CourierSession;

      setCurrentSession(parsedSession);
      setOrders(
        getCourierActiveOrders(parsedSession.sessionId),
      );
    } catch (error) {
      console.error(
        "Не вдалося завантажити замовлення кур'єра:",
        error,
      );

      setCurrentSession(null);
      setOrders([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!currentSession) return;

    const refreshOrders = () => {
      setOrders(
        getCourierActiveOrders(currentSession.sessionId),
      );
    };

    refreshOrders();

    return subscribeToOrders(refreshOrders);
  }, [currentSession]);

  function handleCompleteOrder(orderId: string) {
    if (!currentSession) return;

    try {
      completeCourierOrder(
        orderId,
        currentSession.sessionId,
      );

      const remainingOrders = getCourierActiveOrders(
        currentSession.sessionId,
      );

      setOrders(remainingOrders);

      const updatedSession: CourierSession = {
        ...currentSession,
        status:
          remainingOrders.length > 0
            ? "Зайнятий"
            : "Вільний",
      };

      const savedSessions = window.localStorage.getItem(
        ACTIVE_SESSIONS_KEY,
      );

      const activeSessions: CourierSession[] = savedSessions
        ? JSON.parse(savedSessions)
        : [];

      const updatedSessions = activeSessions.map((session) =>
        session.sessionId === currentSession.sessionId
          ? updatedSession
          : session,
      );

      window.localStorage.setItem(
        CURRENT_SESSION_KEY,
        JSON.stringify(updatedSession),
      );

      window.localStorage.setItem(
        ACTIVE_SESSIONS_KEY,
        JSON.stringify(updatedSessions),
      );

      setCurrentSession(updatedSession);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Не вдалося завершити замовлення.",
      );
    }
  }

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020508] text-white">
        <p className="text-[18px] text-[#9ca4ae]">
          Завантаження...
        </p>
      </main>
    );
  }

  if (!currentSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020508] p-5 text-white">
        <div className="w-full max-w-[560px] rounded-[24px] border border-white/[0.08] bg-[#081017] p-7 text-center">
          <h1 className="text-[30px] font-black">
            Зміна не відкрита
          </h1>

          <p className="mt-3 text-[16px] leading-7 text-[#9ca4ae]">
            Поверніться до кур'єрської служби та почніть
            зміну.
          </p>

          <button
            type="button"
            onClick={() => router.push("/courier")}
            className="mt-6 h-[54px] rounded-[14px] bg-[#ff5a00] px-7 text-[16px] font-black text-white transition hover:bg-[#ff6b16]"
          >
            Повернутися
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020508] p-4 text-white lg:p-6">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-4 rounded-[20px] border border-white/[0.08] bg-[#081017] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push("/courier")}
              className="flex h-[48px] items-center justify-center rounded-[12px] border border-[#ff6500] px-5 text-[15px] font-bold text-[#ff6500] transition hover:bg-[#ff6500]/10"
            >
              ← Назад
            </button>

            <div>
              <p className="text-[13px] font-bold uppercase tracking-[1.4px] text-[#ff6500]">
                Кур'єрська служба
              </p>

              <h1 className="mt-1 text-[30px] font-black">
                Мої замовлення
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-[14px] border border-white/[0.07] bg-white/[0.025] px-4 py-3">
            <div>
              <p className="text-[13px] text-[#8f98a5]">
                Кур'єр
              </p>

              <p className="mt-1 text-[16px] font-bold">
                {currentSession.courierName}
              </p>
            </div>

            <span
              className={`h-3 w-3 rounded-full ${
                orders.length > 0
                  ? "bg-[#ff6500] shadow-[0_0_13px_rgba(255,101,0,0.85)]"
                  : "bg-emerald-400 shadow-[0_0_13px_rgba(52,211,153,0.85)]"
              }`}
            />
          </div>
        </header>

        <section className="mt-4 rounded-[20px] border border-white/[0.08] bg-[linear-gradient(145deg,#0a1117,#071017)] p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-[25px] font-black">
                Активні замовлення
              </h2>

              <span className="flex h-8 min-w-8 items-center justify-center rounded-[9px] border border-[#ff6500] px-2 text-[13px] font-bold text-[#ff6500]">
                {orders.length}
              </span>
            </div>

            <p className="hidden text-[13px] text-[#9ca4ae] sm:block">
              Статуси оновлюються автоматично
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="mt-5 flex min-h-[520px] items-center justify-center rounded-[17px] border border-white/[0.05] bg-[#081017] p-5 text-center">
              <div>
                <p className="text-[28px] font-black">
                  Активних замовлень немає
                </p>

                <p className="mt-3 text-[16px] leading-7 text-[#929ba8]">
                  Прийняті замовлення автоматично
                  з'являться у цьому розділі.
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/courier")}
                  className="mt-6 h-[52px] rounded-[13px] border border-[#ff6500] px-6 text-[15px] font-bold text-[#ff6500] transition hover:bg-[#ff6500]/10"
                >
                  Перейти до нових замовлень
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-auto mt-5 flex w-full max-w-[560px] flex-col gap-6">
              {orders.map((order) => {
                const delivery = order.delivery;

                const address = delivery
                  ? [
                      delivery.address.street,
                      delivery.address.house
                        ? `буд. ${delivery.address.house}`
                        : "",
                      delivery.address.apartment
                        ? `кв. ${delivery.address.apartment}`
                        : "",
                      delivery.address.entrance
                        ? `під'їзд ${delivery.address.entrance}`
                        : "",
                      delivery.address.location,
                    ]
                      .filter(Boolean)
                      .join(", ")
                  : "Адресу не вказано";

                const isGoingToClient =
                  order.status === "handedToCourier";

                return (
                  <article
                    key={order.id}
                    className="rounded-[18px] border border-[#ff6500]/55 bg-[#081017] p-5 shadow-[0_0_25px_rgba(255,101,0,0.07)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="rounded-[13px] border border-[#ff6500]/25 bg-[#ff6500]/[0.07] px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-[1.3px] text-[#ff7519]">
                          Статус
                        </p>

                        <p className="mt-1 text-[18px] font-black">
                          {isGoingToClient
                            ? "Кур'єр прямує до клієнта"
                            : "Кур'єр прямує на точку"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[27px] font-black text-[#ff6500]">
                          №{order.orderNumber}
                        </p>

                        <p className="mt-1 text-[14px] text-[#a6adb7]">
                          Доставка
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[13px] border border-white/[0.07] bg-white/[0.025] p-4">
                      <p className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#ff7519]">
                        Забрати на точці
                      </p>

                      <p className="mt-1 text-[25px] font-black">
                        {order.point}
                      </p>
                    </div>

                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      <div>
                        <p className="text-[13px] text-[#8f98a5]">
                          Адреса клієнта
                        </p>

                        <p className="mt-1 text-[16px] font-semibold">
                          {address || "Адресу не вказано"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[13px] text-[#8f98a5]">
                          Клієнт
                        </p>

                        <p className="mt-1 text-[16px] font-semibold">
                          {delivery?.customer.name ||
                            "Ім'я не вказано"}
                        </p>

                        <p className="mt-1 text-[14px] text-[#b8bec7]">
                          {delivery?.customer.phone ||
                            "Телефон не вказано"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4 border-y border-dashed border-white/[0.12] py-5">
                      <div>
                        <p className="text-[13px] text-[#a6adb7]">
                          Оплата
                        </p>

                        <p className="mt-1 text-[17px] font-bold">
                          {order.paymentType === "cash"
                            ? "Готівка"
                            : "Термінал"}
                        </p>

                        {order.paymentType === "cash" &&
                          delivery?.payment.needsChange ===
                            true &&
                          delivery.payment.changeFrom && (
                            <p className="mt-2 text-[13px] text-[#ff9a59]">
                              Решта з{" "}
                              {delivery.payment.changeFrom} ₴
                            </p>
                          )}
                      </div>

                      <div>
                        <p className="text-[13px] text-[#a6adb7]">
                          Сума
                        </p>

                        <p className="mt-1 text-[28px] font-black">
                          {order.total} ₴
                        </p>
                      </div>
                    </div>

                    {delivery?.customer.comment && (
                      <div className="mt-4 rounded-[12px] border border-[#ff6500]/20 bg-[#ff6500]/[0.05] p-4">
                        <p className="text-[13px] font-semibold text-[#ff7519]">
                          Коментар
                        </p>

                        <p className="mt-1 text-[15px] text-[#d2d5da]">
                          {delivery.customer.comment}
                        </p>
                      </div>
                    )}

                    {!isGoingToClient && (
                      <div className="mt-5 rounded-[13px] border border-amber-400/20 bg-amber-400/[0.07] px-4 py-4 text-center">
                        <p className="text-[15px] font-semibold text-amber-200">
                          Очікуйте, поки точка передасть
                          замовлення кур'єру
                        </p>
                      </div>
                    )}

                    {isGoingToClient && (
                      <button
                        type="button"
                        onClick={() =>
                          handleCompleteOrder(order.id)
                        }
                        className="mt-5 h-[58px] w-full rounded-[13px] bg-[#ff5a00] text-[17px] font-black text-white transition hover:bg-[#ff6b16]"
                      >
                        Передав замовлення клієнту
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}