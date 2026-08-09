"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  callCourierForOrder,
  getOrders,
  handOrderToCourier,
  subscribeToOrders,
  updateOrderStatus,
} from "../../../lib/orders";

import type {
  Order,
  OrderStatus,
} from "../../../lib/order";

const finishedStatuses: OrderStatus[] = [
  "delivered",
  "cancelled",
  "taxi",
];

function getCurrentPoint() {
  if (typeof window === "undefined") {
    return "Портова";
  }

  return (
    window.localStorage.getItem("tema-active-point") ??
    "Портова"
  );
}

function getCurrentEmployeeName() {
  if (typeof window === "undefined") {
    return "Працівник кухні";
  }

  try {
    const savedSession = window.localStorage.getItem(
      "tema-current-employee-session",
    );

    if (!savedSession) {
      return "Працівник кухні";
    }

    const parsedSession = JSON.parse(savedSession) as {
      employeeName?: string;
    };

    return (
      parsedSession.employeeName ??
      "Працівник кухні"
    );
  } catch {
    return "Працівник кухні";
  }
}

function isToday(value: string) {
  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildDeliveryAddress(order: Order) {
  if (!order.delivery) {
    return "";
  }

  const {
    street,
    house,
    apartment,
    entrance,
    location,
  } = order.delivery.address;

  return [
    street,
    house ? `буд. ${house}` : "",
    apartment ? `кв. ${apartment}` : "",
    entrance ? `під’їзд ${entrance}` : "",
    location,
  ]
    .filter(Boolean)
    .join(", ");
}

function getStatusText(order: Order) {
  const courierCall = order.delivery?.courierCall;

  if (order.status === "new") {
    return "Нове замовлення";
  }

  if (order.status === "cooking") {
    return "Готуємо";
  }

  if (order.status === "ready") {
    return order.type === "pickup"
      ? "Очікує видачі"
      : "Замовлення готове";
  }

  if (order.status === "waitingCourier") {
    return "Очікуємо кур’єра";
  }

  if (order.status === "courierAccepted") {
    return courierCall?.courier
      ? `Кур’єр прямує на точку · ${courierCall.courier.name}`
      : "Кур’єр прямує на точку";
  }

  if (order.status === "courierArrived") {
    return "Кур’єр очікує на точці";
  }

  if (order.status === "handedToCourier") {
    return courierCall?.courier
      ? `Передали кур’єру · ${courierCall.courier.name}`
      : "Передали кур’єру";
  }

  if (order.status === "delivered") {
    return "Замовлення доставлено";
  }

  return "Замовлення в роботі";
}
function getCookingStartTime(order: Order) {
  const startedCooking = order.history.find(
    (item) => item.action === "startedCooking",
  );

  return startedCooking?.createdAt ?? null;
}

function getCookingEndTime(order: Order) {
  if (order.type === "delivery") {
    const courierCalled = order.history.find(
      (item) => item.action === "courierCalled",
    );

    return courierCalled?.createdAt ?? null;
  }

  const delivered = order.history.find(
    (item) => item.action === "delivered",
  );

  return delivered?.createdAt ?? null;
}

function formatCookingDuration(milliseconds: number) {
  const totalSeconds = Math.max(
    0,
    Math.floor(milliseconds / 1000),
  );

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes} хв ${seconds
    .toString()
    .padStart(2, "0")} сек`;
}
export default function CashierOrdersPage() {
  const router = useRouter();

  const [timerNow, setTimerNow] = useState(Date.now());

useEffect(() => {
  const timer = window.setInterval(() => {
    setTimerNow(Date.now());
  }, 1000);

  return () => window.clearInterval(timer);
}, []);
    

  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPoint, setCurrentPoint] =
    useState("Портова");
    const [courierOrderId, setCourierOrderId] =
  useState<string | null>(null);

const [showCourierTimeModal, setShowCourierTimeModal] =
  useState(false);

const [customCourierTime, setCustomCourierTime] =
  useState("");

  useEffect(() => {
    setCurrentPoint(getCurrentPoint());

    const refreshOrders = () => {
      setOrders(getOrders());
    };

    refreshOrders();

    return subscribeToOrders(refreshOrders);
  }, []);

  const pointOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.point === currentPoint,
      ),
    [orders, currentPoint],
  );

  const todayOrders = useMemo(
    () =>
      pointOrders.filter((order) =>
        isToday(order.createdAt),
      ),
    [pointOrders],
  );

  const activeOrders = useMemo(
    () =>
      pointOrders
        .filter(
          (order) =>
            !finishedStatuses.includes(order.status),
        )
        .sort(
          (first, second) =>
            new Date(first.createdAt).getTime() -
            new Date(second.createdAt).getTime(),
        ),
    [pointOrders],
  );

  const pickupCount = todayOrders.filter(
    (order) => order.type === "pickup",
  ).length;

  const deliveryCount = todayOrders.filter(
    (order) => order.type === "delivery",
  ).length;

  function handleStartCooking(orderId: string) {
    try {
      updateOrderStatus(orderId, "cooking", {
        employeeName: getCurrentEmployeeName(),
      });
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Не вдалося почати приготування.",
      );
    }
  }

  function handleGivePickupToCustomer(
    orderId: string,
  ) {
    try {
      updateOrderStatus(orderId, "delivered", {
        employeeName: getCurrentEmployeeName(),
        comment: "Самовивіз передано клієнту",
      });
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Не вдалося завершити замовлення.",
      );
    }
  }
  function handleOpenCourierTimeModal(orderId: string) {
  setCourierOrderId(orderId);
  setCustomCourierTime("");
  setShowCourierTimeModal(true);
}

function handleCallCourier(
  minutes?: number,
  customTime?: string,
) {
  if (!courierOrderId) return;

  try {
    let requestedForTime: string | null = null;

    if (minutes) {
      const targetTime = new Date(
        Date.now() + minutes * 60 * 1000,
      );

      requestedForTime = targetTime.toLocaleTimeString(
        "uk-UA",
        {
          hour: "2-digit",
          minute: "2-digit",
        },
      );
    }

    if (customTime) {
      requestedForTime = customTime;
    }

    callCourierForOrder({
      orderId: courierOrderId,
      requestedBy: getCurrentEmployeeName(),
      arrivalType: "now",
      requestedForTime,
    });

    setShowCourierTimeModal(false);
    setCourierOrderId(null);
    setCustomCourierTime("");
  } catch (error) {
    window.alert(
      error instanceof Error
        ? error.message
        : "Не вдалося викликати кур’єра.",
    );
  }
}

function handleHandToCourier(orderId: string) {
  try {
    handOrderToCourier(
      orderId,
      getCurrentEmployeeName(),
    );
  } catch (error) {
    window.alert(
      error instanceof Error
        ? error.message
        : "Не вдалося передати замовлення кур’єру.",
    );
  }
}

  return (
    <main className="min-h-screen bg-[#02070c] p-4 text-white">
      <div className="mx-auto w-full max-w-[1540px]">
        <header className="flex items-center justify-between gap-5 rounded-[22px] border border-white/[0.07] bg-gradient-to-br from-[#09121b] to-[#050b11] px-6 py-5">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[1.5px] text-[#ff6500]">
              {currentPoint}
            </p>

            <h1 className="mt-2 text-[32px] font-black">
              Замовлення
            </h1>

            <p className="mt-1 text-[14px] text-[#8f99a7]">
              Робочий екран кухні
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/cashier")}
            className="h-[50px] rounded-[13px] border border-[#ff6500]/70 px-6 text-[14px] font-bold text-[#ff7a22] transition hover:bg-[#ff6500]/10"
          >
            ← Повернутися до каси
          </button>
        </header>

        <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <CounterCard
            label="Усього сьогодні"
            value={todayOrders.length}
            note="усі замовлення"
          />

          <CounterCard
            label="Самовивіз"
            value={pickupCount}
            note="за сьогодні"
          />

          <CounterCard
            label="Доставка"
            value={deliveryCount}
            note="за сьогодні"
            orange
          />

          <CounterCard
            label="Активні зараз"
            value={activeOrders.length}
            note="ще не завершені"
          />
        </section>

        <section className="mt-4 rounded-[22px] border border-white/[0.07] bg-gradient-to-br from-[#09121b] to-[#050b11] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[25px] font-black">
                Активні замовлення
              </h2>

              <p className="mt-1 text-[14px] text-[#8993a1]">
                Самовивіз і доставка в одній черзі
              </p>
            </div>

            <span className="flex h-10 min-w-10 items-center justify-center rounded-[11px] border border-[#ff6500]/60 px-3 text-[14px] font-black text-[#ff7a22]">
              {activeOrders.length}
            </span>
          </div>

          {activeOrders.length === 0 ? (
            <div className="mt-5 flex min-h-[470px] items-center justify-center rounded-[18px] border border-dashed border-white/[0.09] bg-white/[0.015]">
              <div className="text-center">
                <p className="text-[27px] font-black">
                  Активних замовлень немає
                </p>

                <p className="mt-3 text-[15px] text-[#8d97a5]">
                  Нові замовлення з каси з’являться тут
                  автоматично.
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto mt-5 flex w-full max-w-[560px] flex-col gap-6">
              {activeOrders.map((order) => {
                const isDelivery =
                  order.type === "delivery";

                const deliveryAddress =
                  buildDeliveryAddress(order);

                const courier =
                  order.delivery?.courierCall?.courier;

                const canStartCooking =
                  order.status === "new";

                const canGivePickup =
                  order.type === "pickup" &&
                  order.status === "cooking";

                return (
                  <article
                    key={order.id}
                    className={`relative overflow-hidden rounded-[20px] border p-5 ${
                      isDelivery
                        ? "border-[#ff6500]/75 bg-gradient-to-br from-[#231208] via-[#11161c] to-[#081017] shadow-[0_0_30px_rgba(255,101,0,0.10)]"
                        : "border-white/[0.09] bg-gradient-to-br from-[#111b25] to-[#081017]"
                    }`}
                  >
                    {isDelivery && (
                      <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#ff6500] to-transparent" />
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span
                          className={`inline-flex rounded-[8px] border px-3 py-1 text-[11px] font-black uppercase tracking-[1.2px] ${
                            isDelivery
                              ? "border-[#ff6500]/55 bg-[#ff6500]/10 text-[#ff7a22]"
                              : "border-sky-400/30 bg-sky-400/[0.07] text-sky-200"
                          }`}
                        >
                          {isDelivery
                            ? "Доставка"
                            : "Самовивіз"}
                        </span>

                        <h3 className="mt-3 text-[28px] font-black text-white">
                          №{order.orderNumber}
                        </h3>

                        <p className="mt-1 text-[13px] text-[#8f99a7]">
                          Оформлено о{" "}
                          {formatTime(order.createdAt)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[12px] text-[#8993a1]">
                          Сума
                        </p>

                        <p className="mt-1 text-[25px] font-black text-white">
                          {order.total} ₴
                        </p>
                      </div>
                    </div>

                    <div
                      className={`mt-4 rounded-[14px] border px-4 py-3 ${
                        isDelivery
                          ? "border-[#ff6500]/25 bg-[#ff6500]/[0.06]"
                          : "border-white/[0.07] bg-white/[0.025]"
                      }`}
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#ff7a22]">
                        Статус
                      </p>

                      <p className="mt-1 text-[17px] font-black">
                        {getStatusText(order)}
                      </p>
                      {(() => {
  const cookingStartedAt = getCookingStartTime(order);

  if (!cookingStartedAt) return null;

  const cookingEndedAt = getCookingEndTime(order);

  const duration =
    (cookingEndedAt
      ? new Date(cookingEndedAt).getTime()
      : timerNow) -
    new Date(cookingStartedAt).getTime();

  return (
    <p className="mt-2 text-[13px] font-bold text-[#ff9a59]">
      {cookingEndedAt ? "Готувалося" : "Готується"} ·{" "}
      {formatCookingDuration(duration)}
    </p>
  );
})()}
                    </div>

                    <div className="mt-4">
                      <p className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#8993a1]">
                        Склад замовлення
                      </p>

                      <div className="mt-3 space-y-2">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-[13px] border border-white/[0.07] bg-white/[0.025] px-4 py-3"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-[15px] font-bold">
                                  {item.quantity} ×{" "}
                                  {item.receiptName ??
                                    item.name}
                                </p>

                                {item.description && (
                                  <p className="mt-1 text-[12px] text-[#8993a1]">
                                    {item.description}
                                  </p>
                                )}

                                {item.addons.map((addon) => (
                                  <p
                                    key={addon.id}
                                    className="mt-1 text-[12px] font-semibold text-[#ff8a3d]"
                                  >
                                    + {addon.name}
                                  </p>
                                ))}

                                {item.removedIngredients.map(
                                  (ingredient) => (
                                    <p
                                      key={ingredient}
                                      className="mt-1 text-[12px] font-semibold text-red-300"
                                    >
                                      − Без: {ingredient}
                                    </p>
                                  ),
                                )}

                                {item.comment && (
                                  <p className="mt-2 rounded-[8px] bg-amber-400/10 px-2 py-1.5 text-[12px] text-amber-200">
                                    {item.comment}
                                  </p>
                                )}
                              </div>

                              <p className="shrink-0 text-[14px] font-bold">
                                {item.totalPrice} ₴
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {isDelivery && order.delivery && (
                      <div className="mt-4 rounded-[14px] border border-[#ff6500]/20 bg-[#ff6500]/[0.035] p-4">
                        <p className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#ff7a22]">
                          Дані доставки
                        </p>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-[11px] text-[#8993a1]">
                              Клієнт
                            </p>

                            <p className="mt-1 text-[14px] font-bold">
                              {order.delivery.customer.name ||
                                "Ім’я не вказано"}
                            </p>

                            <p className="mt-1 text-[13px] text-[#b2bac5]">
                              {order.delivery.customer.phone}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] text-[#8993a1]">
                              Адреса
                            </p>

                            <p className="mt-1 text-[14px] font-bold">
                              {deliveryAddress ||
                                "Адресу не вказано"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] text-[#8993a1]">
                              Оплата
                            </p>

                            <p className="mt-1 text-[14px] font-bold">
                              {order.paymentType === "cash"
                                ? "Готівка"
                                : "Термінал"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] text-[#8993a1]">
                              Кур’єр
                            </p>

                            <p className="mt-1 text-[14px] font-bold">
                              {courier?.name ??
                                "Ще не призначений"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {canStartCooking && (
                      <button
                        type="button"
                        onClick={() =>
                          handleStartCooking(order.id)
                        }
                        className="mt-5 h-[56px] w-full rounded-[13px] bg-[#ff5a00] text-[16px] font-black text-white transition hover:bg-[#ff6b16]"
                      >
                        Готуємо
                      </button>
                    )}

                    {canGivePickup && (
                      <button
                        type="button"
                        onClick={() =>
                          handleGivePickupToCustomer(
                            order.id,
                          )
                        }
                        className="mt-5 h-[56px] w-full rounded-[13px] bg-emerald-500 text-[16px] font-black text-white transition hover:bg-emerald-400"
                      >
                        Віддали клієнту
                      </button>
                    )}

                    {isDelivery &&
  order.status === "cooking" && (
    <button
      type="button"
      onClick={() => handleOpenCourierTimeModal(order.id)}
      className="mt-5 h-[52px] w-full rounded-[12px] bg-[#ff5a00] text-[15px] font-black text-white transition hover:bg-[#ff6b16]"
    >
      Викликати кур’єра
    </button>
)}
{isDelivery &&
  order.status === "waitingCourier" && (
    <div className="mt-5 rounded-[12px] border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3 text-center">
      <p className="text-[14px] font-bold text-amber-200">
        Очікуємо, поки кур’єр прийме замовлення
      </p>
    </div>
)}
{isDelivery &&
  (order.status === "courierAccepted" ||
    order.status === "courierArrived") && (
    <button
      type="button"
      onClick={() => handleHandToCourier(order.id)}
      className="mt-5 h-[52px] w-full rounded-[12px] border border-emerald-400/40 bg-emerald-400/[0.08] text-[15px] font-black text-emerald-300 transition hover:bg-emerald-400/[0.15]"
    >
      Передали кур’єру
    </button>
)}
                    {order.status ===
                      "handedToCourier" && (
                      <div className="mt-5 rounded-[13px] border border-emerald-400/25 bg-emerald-400/[0.06] px-4 py-4 text-center">
                        <p className="text-[15px] font-bold text-emerald-200">
                          Замовлення передано кур’єру.
                          Очікуємо підтвердження доставки
                          клієнту.
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
      {showCourierTimeModal && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
    <div className="w-full max-w-[420px] rounded-[22px] border border-white/10 bg-[#0b141d] p-6 shadow-2xl">
      <p className="text-[24px] font-black text-white">
        Коли потрібен кур’єр?
      </p>

      <p className="mt-2 text-[13px] text-[#8f99a6]">
        Оберіть час прибуття кур’єра на точку
      </p>

      <div className="mt-6 grid grid-cols-4 gap-3">
        <button
  type="button"
  onClick={() => handleCallCourier()}
  className="h-[52px] rounded-[12px] border border-[#ff6500]/50 bg-[#ff6500]/10 font-black text-[#ff7a22]"
>
  Зараз
</button>
        <button
          type="button"
          onClick={() => handleCallCourier(10)}
          className="h-[52px] rounded-[12px] border border-[#ff6500]/50 bg-[#ff6500]/10 font-black text-[#ff7a22]"
        >
          10 хв
        </button>

        <button
          type="button"
          onClick={() => handleCallCourier(15)}
          className="h-[52px] rounded-[12px] border border-[#ff6500]/50 bg-[#ff6500]/10 font-black text-[#ff7a22]"
        >
          15 хв
        </button>

        <button
          type="button"
          onClick={() => handleCallCourier(20)}
          className="h-[52px] rounded-[12px] border border-[#ff6500]/50 bg-[#ff6500]/10 font-black text-[#ff7a22]"
        >
          20 хв
        </button>
      </div>

      <div className="mt-5 rounded-[14px] border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[13px] font-bold text-[#aab2bd]">
          На конкретний час
        </p>

        <input
          type="time"
          value={customCourierTime}
          onChange={(event) =>
            setCustomCourierTime(event.target.value)
          }
          className="mt-3 h-[50px] w-full rounded-[10px] border border-white/10 bg-[#081017] px-4 text-white outline-none"
        />

        <button
          type="button"
          disabled={!customCourierTime}
          onClick={() =>
            handleCallCourier(undefined, customCourierTime)
          }
          className="mt-3 h-[50px] w-full rounded-[10px] bg-[#ff5a00] font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Викликати на цей час
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          setShowCourierTimeModal(false);
          setCourierOrderId(null);
          setCustomCourierTime("");
        }}
        className="mt-5 h-[48px] w-full rounded-[12px] border border-white/10 text-[14px] font-bold text-[#aab2bd]"
      >
        Скасувати
      </button>
    </div>
  </div>
)}
    </main>
  );
}

function CounterCard({
  label,
  value,
  note,
  orange = false,
}: {
  label: string;
  value: number;
  note: string;
  orange?: boolean;
}) {
  return (
    <div
      className={`rounded-[18px] border px-5 py-4 ${
        orange
          ? "border-[#ff6500]/45 bg-[#ff6500]/[0.055]"
          : "border-white/[0.07] bg-gradient-to-br from-[#101a24] to-[#081017]"
      }`}
    >
      <p className="text-[13px] text-[#9ba4b1]">
        {label}
      </p>

      <div className="mt-2 flex items-end justify-between gap-3">
        <p
          className={`text-[32px] font-black ${
            orange
              ? "text-[#ff7a22]"
              : "text-white"
          }`}
        >
          {value}
        </p>

        <p className="pb-1 text-[11px] text-[#747e8c]">
          {note}
        </p>
      </div>
    </div>
  );
}