"use client";

import { useEffect, useMemo, useState } from "react";
import {
  callCourierForOrder,
  getAvailableDeliveryOrders,
} from "../lib/orders";
import type {
  CourierArrivalType,
  Order,
} from "../lib/order";

type CourierTaskType =
  | "delivery"
  | "transfer"
  | "purchase";

type CourierDialogStep =
  | "task"
  | "delivery-order"
  | "transfer"
  | "payout"
  | "time"
  | "success";

type PointName =
  | "Портова"
  | "Опорний"
  | "Ринок"
  | "Героїв Дніпра 72"
  | "Маслова 14"
  | "Лесі Українки 51"
  | "Кухня Миру 1"
  | "Кухня Славутич";

  type CourierPayout = {
  id: string;

  courierId: number;
  courierName: string;

  point: string;

  amount: number;

  status: "requested" | "paid";

  requestedAt: string;
  paidAt: string | null;

  earningIds: string[];
};

const COURIER_PAYOUTS_KEY = "tema-courier-payouts";
const COURIER_PAYOUTS_EVENT = "tema-courier-payouts-updated";

type Props = {
  open: boolean;
  currentPoint: string;
  employeeName: string;
  onClose: () => void;
};

type SimpleCourierTask = {
  id: string;
  type: "transfer" | "purchase";
  status: "waiting";
  createdAt: string;

  requestedBy: string;
  requestedFromPoint: string;

  fromPoint: string;
  toPoint: string | null;

  arrivalType: CourierArrivalType;
  requestedForTime: string | null;

  courierId: number | null;
  acceptedAt: string | null;
  completedAt: string | null;

  courierSalary: number;
};

const SIMPLE_TASKS_KEY = "tema-simple-courier-tasks";
const SIMPLE_TASKS_EVENT = "tema-simple-courier-tasks-updated";

const points: PointName[] = [
  "Портова",
  "Опорний",
  "Ринок",
  "Героїв Дніпра 72",
  "Маслова 14",
  "Лесі Українки 51",
  "Кухня Миру 1",
  "Кухня Славутич",
];

const timeOptions: Array<{
  value: CourierArrivalType;
  label: string;
}> = [
  {
    value: "now",
    label: "Зараз",
  },
  {
    value: "15min",
    label: "Через 15 хв",
  },
  {
    value: "20min",
    label: "Через 20 хв",
  },
  {
    value: "25min",
    label: "Через 25 хв",
  },
  {
    value: "specificTime",
    label: "На конкретний час",
  },
];

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatPayment(paymentType: Order["paymentType"]) {
  return paymentType === "cash" ? "Готівка" : "Термінал";
}

function formatAddress(order: Order) {
  if (!order.delivery) return "Адресу не вказано";

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
    entrance ? `під'їзд ${entrance}` : "",
    location,
  ]
    .filter(Boolean)
    .join(", ");
}

function saveSimpleCourierTask(task: SimpleCourierTask) {
  const saved = window.localStorage.getItem(SIMPLE_TASKS_KEY);

  let tasks: SimpleCourierTask[] = [];

  if (saved) {
    try {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        tasks = parsed as SimpleCourierTask[];
      }
    } catch {
      tasks = [];
    }
  }

  const updatedTasks = [task, ...tasks];

  window.localStorage.setItem(
    SIMPLE_TASKS_KEY,
    JSON.stringify(updatedTasks),
  );

  window.dispatchEvent(
    new CustomEvent(SIMPLE_TASKS_EVENT, {
      detail: updatedTasks,
    }),
  );
}

export default function CourierDialog({
  open,
  currentPoint,
  employeeName,
  onClose,
}: Props) {
  const [step, setStep] =
    useState<CourierDialogStep>("task");

  const [taskType, setTaskType] =
    useState<CourierTaskType | null>(null);

  const [deliveryOrders, setDeliveryOrders] =
    useState<Order[]>([]);

  const [selectedOrderId, setSelectedOrderId] =
    useState<string | null>(null);

  const [fromPoint, setFromPoint] =
    useState(currentPoint);

  const [toPoint, setToPoint] =
    useState("");

  const [arrivalType, setArrivalType] =
    useState<CourierArrivalType>("now");

  const [specificTime, setSpecificTime] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

    const [courierPayouts, setCourierPayouts] =
  useState<CourierPayout[]>([]);

  const selectedOrder = useMemo(
    () =>
      deliveryOrders.find(
        (order) => order.id === selectedOrderId,
      ) ?? null,
    [deliveryOrders, selectedOrderId],
  );

  useEffect(() => {
    if (!open) return;

    setStep("task");
    setTaskType(null);
    setSelectedOrderId(null);
    setFromPoint(currentPoint);
    setToPoint("");
    setArrivalType("now");
    setSpecificTime("");
    setErrorMessage("");

    setDeliveryOrders(
      getAvailableDeliveryOrders(currentPoint),
    );
  }, [open, currentPoint]);

  useEffect(() => {
    if (!open) return;

    function handleOrdersUpdate() {
      setDeliveryOrders(
        getAvailableDeliveryOrders(currentPoint),
      );
    }

    window.addEventListener(
      "tema-orders-updated",
      handleOrdersUpdate,
    );

    window.addEventListener(
      "storage",
      handleOrdersUpdate,
    );

    return () => {
      window.removeEventListener(
        "tema-orders-updated",
        handleOrdersUpdate,
      );

      window.removeEventListener(
        "storage",
        handleOrdersUpdate,
      );
    };
  }, [open, currentPoint]);
  useEffect(() => {
  if (!open) return;

  function refreshCourierPayouts() {
    try {
      const saved = window.localStorage.getItem(
        COURIER_PAYOUTS_KEY,
      );

      if (!saved) {
        setCourierPayouts([]);
        return;
      }

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) {
        setCourierPayouts([]);
        return;
      }

      setCourierPayouts(parsed as CourierPayout[]);
    } catch {
      setCourierPayouts([]);
    }
  }

  refreshCourierPayouts();

  window.addEventListener(
    COURIER_PAYOUTS_EVENT,
    refreshCourierPayouts,
  );

  window.addEventListener(
    "storage",
    refreshCourierPayouts,
  );

  return () => {
    window.removeEventListener(
      COURIER_PAYOUTS_EVENT,
      refreshCourierPayouts,
    );

    window.removeEventListener(
      "storage",
      refreshCourierPayouts,
    );
  };
}, [open]);

 function handlePayCourier(payoutId: string) {
  const updatedPayouts = courierPayouts.map((payout) =>
    payout.id === payoutId
      ? {
          ...payout,
          status: "paid" as const,
          paidAt: new Date().toISOString(),
        }
      : payout,
  );

  window.localStorage.setItem(
    COURIER_PAYOUTS_KEY,
    JSON.stringify(updatedPayouts),
  );

  window.dispatchEvent(
    new Event(COURIER_PAYOUTS_EVENT),
  );

  setCourierPayouts(updatedPayouts);
} 
function closeDialog() {
    if (isSubmitting) return;

    setErrorMessage("");
    onClose();
  }

  function selectTask(type: CourierTaskType) {
    setTaskType(type);
    setErrorMessage("");

    if (type === "delivery") {
      setDeliveryOrders(
        getAvailableDeliveryOrders(currentPoint),
      );
      setStep("delivery-order");
      return;
    }

    if (type === "transfer") {
      setFromPoint(currentPoint);
      setToPoint("");
      setStep("transfer");
      return;
    }

    setFromPoint(currentPoint);
    setStep("time");
  }

  function goBack() {
    setErrorMessage("");

     if (step === "payout") {
    setStep("task");
    return;
  }

    if (step === "delivery-order") {
      setSelectedOrderId(null);
      setTaskType(null);
      setStep("task");
      return;
    }

    if (step === "transfer") {
      setTaskType(null);
      setStep("task");
      return;
    }

    if (step === "time") {
      if (taskType === "delivery") {
        setStep("delivery-order");
        return;
      }

      if (taskType === "transfer") {
        setStep("transfer");
        return;
      }

      setTaskType(null);
      setStep("task");
    }
  }

  function continueFromDelivery() {
    if (!selectedOrderId) {
      setErrorMessage("Оберіть замовлення.");
      return;
    }

    setErrorMessage("");
    setStep("time");
  }

  function continueFromTransfer() {
    if (!fromPoint || !toPoint) {
      setErrorMessage(
        "Оберіть точку відправлення та отримання.",
      );
      return;
    }

    if (fromPoint === toPoint) {
      setErrorMessage(
        "Точка відправлення і отримання мають бути різними.",
      );
      return;
    }

    setErrorMessage("");
    setStep("time");
  }

  function validateTime() {
    if (
      arrivalType === "specificTime" &&
      !specificTime
    ) {
      setErrorMessage("Вкажіть конкретний час.");
      return false;
    }

    setErrorMessage("");
    return true;
  }
function getRequestedForTime() {
  if (arrivalType === "now") {
    return null;
  }

  if (arrivalType === "specificTime") {
    return specificTime || null;
  }

  const minutesMap: Partial<Record<CourierArrivalType, number>> = {
    "15min": 15,
    "20min": 20,
    "25min": 25,
  };

  const minutes = minutesMap[arrivalType];

  if (!minutes) {
    return null;
  }

  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);

  return date.toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

  async function confirmCourierCall() {
    if (!taskType || !validateTime()) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (taskType === "delivery") {
        if (!selectedOrderId) {
          throw new Error("Замовлення не вибрано.");
        }

        callCourierForOrder({
          orderId: selectedOrderId,
          requestedBy: employeeName,
          arrivalType,
          requestedForTime: getRequestedForTime(),
        });
      } else {
        const task: SimpleCourierTask = {
          id: createId(),
          type: taskType,
          status: "waiting",
          createdAt: new Date().toISOString(),

          requestedBy: employeeName,
          requestedFromPoint: currentPoint,

          fromPoint,
          toPoint:
            taskType === "transfer"
              ? toPoint
              : null,

          arrivalType,
          requestedForTime: getRequestedForTime(),

          courierId: null,
          acceptedAt: null,
          completedAt: null,

          courierSalary: 50,
        };

        saveSimpleCourierTask(task);
      }

      setStep("success");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Не вдалося викликати кур'єра.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 p-4 backdrop-blur-[4px]">
      <div className="flex max-h-[92vh] w-full max-w-[820px] flex-col overflow-hidden rounded-[26px] border border-white/[0.11] bg-[linear-gradient(160deg,#101923,#071019)] shadow-[0_35px_120px_rgba(0,0,0,0.78)]">
        <header className="flex shrink-0 items-start justify-between gap-5 border-b border-white/[0.08] px-6 py-5">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[1.6px] text-[#ff6500]">
              Кур'єрська служба
            </p>

            <h2 className="mt-2 text-[27px] font-black">
              {step === "task" &&
                "Виклик кур'єра"}

              {step === "delivery-order" &&
                "Оберіть доставку"}

              {step === "transfer" &&
                "Передача між точками"}

              {step === "time" &&
                "Коли потрібен кур'єр?"}

              {step === "success" &&
                "Кур'єра викликано"}
            </h2>

            <p className="mt-2 text-[14px] text-[#8f99a7]">
              Поточна точка:{" "}
              <span className="font-semibold text-white">
                {currentPoint}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={closeDialog}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.025] text-[22px] text-[#aab2bd] transition hover:border-[#ff6500]/50 hover:text-white"
          >
            ×
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {step === "task" && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <TaskButton
                icon="🛵"
                title="Доставка"
                description="Виклик для готового замовлення клієнта"
                onClick={() => selectTask("delivery")}
              />

              <TaskButton
                icon="📦"
                title="Передача"
                description="Перевезення товару між точками"
                onClick={() => selectTask("transfer")}
              />

              <TaskButton
                icon="🛒"
                title="Закупка"
                description="Кур'єр приїде на точку за завданням"
                onClick={() => selectTask("purchase")}
              />
              <TaskButton
  icon="💵"
  title="Виплата кур'єру"
  description="Виплатити заробіток кур'єру"
  onClick={() => setStep("payout")}
/>
            </div>
          )}

          {step === "payout" && (
  <div className="space-y-4">
    {courierPayouts.filter(
      (payout) =>
        payout.point === currentPoint &&
        payout.status === "requested",
    ).length === 0 ? (
      <div className="flex min-h-[300px] items-center justify-center rounded-[18px] border border-dashed border-white/[0.09] bg-black/10 p-6 text-center">
        <div>
          <p className="text-[20px] font-bold">
            Запитів на виплату немає
          </p>

          <p className="mt-3 text-[14px] leading-6 text-[#8f99a7]">
            Кур'єр має спочатку запросити виплату
            <br />
            для точки {currentPoint}.
          </p>
        </div>
      </div>
    ) : (
      courierPayouts
        .filter(
          (payout) =>
            payout.point === currentPoint &&
            payout.status === "requested",
        )
        .map((payout) => (
          <div
            key={payout.id}
            className="rounded-[18px] border border-[#ff6500]/35 bg-[#ff6500]/[0.04] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[1.4px] text-[#ff6500]">
                  Виплата кур'єру
                </p>

                <p className="mt-2 text-[22px] font-black">
                  {payout.courierName}
                </p>

                <p className="mt-2 text-[13px] text-[#8f99a7]">
                  Запит:{" "}
                  {new Date(payout.requestedAt).toLocaleTimeString(
                    "uk-UA",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[28px] font-black text-[#ff6500]">
                  {payout.amount} ₴
                </p>

                <p className="mt-1 text-[12px] text-[#8f99a7]">
                  До виплати
                </p>
              </div>
            </div>

            <button
  type="button"
  onClick={() => handlePayCourier(payout.id)}
  className="mt-5 h-[52px] w-full rounded-[12px] bg-[#ff5a00] text-[15px] font-black text-white transition hover:bg-[#ff6b16]"
>
  Виплатити {payout.amount} ₴
</button>
          </div>
        ))
    )}
  </div>
)}
          {step === "delivery-order" && (
  <>
    {deliveryOrders.length === 0 ? (
      <div className="flex min-h-[300px] items-center justify-center rounded-[18px] border border-dashed border-white/[0.09] bg-black/10 p-6 text-center">
        <div>
          <p className="text-[19px] font-bold">
            Доставок для виклику немає
          </p>

          <p className="mt-3 text-[14px] leading-6 text-[#8f99a7]">
            Спочатку оформіть доставку в касі.
            <br />
            Після цього вона з&apos;явиться тут.
          </p>
        </div>
      </div>
    ) : (
      <div className="space-y-4">
        {deliveryOrders.map((order) => {
          const selected = selectedOrderId === order.id;

          return (
            <button
              key={order.id}
              type="button"
              onClick={() => {
                setSelectedOrderId(order.id);
                setErrorMessage("");
              }}
              className={`w-full rounded-[20px] border p-5 text-left transition ${
                selected
                  ? "border-[#ff6500] bg-[#ff6500]/10 shadow-[0_0_24px_rgba(255,101,0,0.13)]"
                  : "border-white/[0.08] bg-white/[0.025] hover:border-[#ff6500]/35"
              }`}
            >
              {/* Номер / точка / сумма */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-[21px] font-black text-[#ff7519]">
                      Замовлення №{order.orderNumber}
                    </p>

                    {selected && (
                      <span className="rounded-full bg-[#ff6500] px-3 py-1 text-[11px] font-black text-white">
                        ОБРАНО
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-[13px] font-semibold text-white">
                    {order.point}
                  </p>

                  <p className="mt-1 text-[12px] text-[#8f99a7]">
                    Доставка
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[24px] font-black text-white">
                    {order.total} ₴
                  </p>

                  <p className="mt-1 text-[12px] text-[#8f99a7]">
                    {formatPayment(order.paymentType)}
                  </p>
                </div>
              </div>

              {/* Клиент */}
              <div className="mt-4 grid gap-3 border-t border-white/[0.07] pt-4 md:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[1px] text-[#6f7a88]">
                    Клієнт
                  </p>

                  <p className="mt-1 text-[15px] font-bold text-white">
                    {order.delivery?.customer.name ||
                      "Ім'я не вказано"}
                  </p>

                  <p className="mt-1 text-[13px] text-[#aab2bd]">
                    {order.delivery?.customer.phone ||
                      "Телефон не вказано"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[1px] text-[#6f7a88]">
                    Адреса
                  </p>

                  <p className="mt-1 text-[14px] font-medium leading-6 text-[#d5d9df]">
                    {formatAddress(order)}
                  </p>
                </div>
              </div>

              {/* Состав заказа */}
              <div className="mt-4 border-t border-white/[0.07] pt-4">
                <p className="mb-3 text-[11px] uppercase tracking-[1px] text-[#6f7a88]">
                  Склад замовлення
                </p>

                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[13px] border border-white/[0.06] bg-black/15 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-white">
                            {item.quantity} × {item.name}
                          </p>

                          {item.description && (
                            <p className="mt-1 text-[12px] leading-5 text-[#8f99a7]">
                              {item.description}
                            </p>
                          )}

                          {item.addons.length > 0 && (
                            <p className="mt-1 text-[12px] leading-5 text-[#9da6b2]">
                              +{" "}
                              {item.addons
                                .map((addon) => addon.name)
                                .join(", ")}
                            </p>
                          )}

                          {item.removedIngredients.length > 0 && (
                            <p className="mt-1 text-[12px] leading-5 text-[#d39a76]">
                              Без:{" "}
                              {item.removedIngredients.join(", ")}
                            </p>
                          )}

                          {item.sauce && (
                            <p className="mt-1 text-[12px] text-[#9da6b2]">
                              Соус: {item.sauce}
                            </p>
                          )}

                          {item.potato && (
                            <p className="mt-1 text-[12px] text-[#9da6b2]">
                              Картопля: {item.potato}
                            </p>
                          )}

                          {item.sausage && (
                            <p className="mt-1 text-[12px] text-[#9da6b2]">
                              Сосиска: {item.sausage}
                            </p>
                          )}

                          {item.comment && (
                            <p className="mt-2 text-[12px] font-semibold text-[#ff9a5c]">
                              Коментар: {item.comment}
                            </p>
                          )}
                        </div>

                        <p className="shrink-0 text-[14px] font-black text-white">
                          {item.totalPrice} ₴
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Комментарий клиента */}
              {order.delivery?.customer.comment && (
                <div className="mt-4 rounded-[13px] border border-[#ff6500]/20 bg-[#ff6500]/[0.05] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[1px] text-[#ff8a42]">
                    Коментар до доставки
                  </p>

                  <p className="mt-2 text-[13px] leading-5 text-[#d5d9df]">
                    {order.delivery.customer.comment}
                  </p>
                </div>
              )}

              {/* Итого */}
              <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-4">
                <span className="text-[13px] text-[#8f99a7]">
                  Разом
                </span>

                <span className="text-[20px] font-black text-white">
                  {order.total} ₴
                </span>
              </div>
            </button>
          );
        })}
      </div>
    )}
  </>
)}

          {step === "transfer" && (
            <div className="grid gap-5 md:grid-cols-2">
              <PointSelect
                label="Звідки забрати"
                value={fromPoint}
                onChange={setFromPoint}
              />

              <PointSelect
                label="Куди доставити"
                value={toPoint}
                onChange={setToPoint}
                placeholder="Оберіть точку"
              />

              <div className="md:col-span-2 rounded-[16px] border border-[#ff6500]/20 bg-[#ff6500]/[0.045] p-4">
                <p className="text-[14px] leading-6 text-[#b9c0ca]">
                  Кур'єр побачить тільки, звідки
                  забрати та куди доставити. Склад
                  передачі кур'єру не показується.
                </p>
              </div>
            </div>
          )}

          {step === "time" && (
            <div>
              <div className="grid gap-3 sm:grid-cols-2">
                {timeOptions.map((option) => {
                  const selected =
                    arrivalType === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setArrivalType(option.value);
                        setErrorMessage("");
                      }}
                      className={`flex min-h-[62px] items-center justify-between rounded-[15px] border px-4 text-left transition ${
                        selected
                          ? "border-[#ff6500] bg-[#ff6500]/10 text-white"
                          : "border-white/[0.08] bg-white/[0.025] text-[#aab2bd]"
                      }`}
                    >
                      <span className="font-semibold">
                        {option.label}
                      </span>

                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                          selected
                            ? "border-[#ff6500] bg-[#ff6500]"
                            : "border-white/20"
                        }`}
                      >
                        {selected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>

              {arrivalType === "specificTime" && (
                <div className="mt-5">
                  <label className="text-[13px] font-semibold text-[#bfc5cd]">
                    Вкажіть час
                  </label>

                  <input
                    type="time"
                    value={specificTime}
                    onChange={(event) => {
                      setSpecificTime(event.target.value);
                      setErrorMessage("");
                    }}
                    className="mt-2 h-[56px] w-full rounded-[14px] border border-white/[0.09] bg-[#080f16] px-4 text-[17px] text-white outline-none focus:border-[#ff6500]"
                  />
                </div>
              )}

              <div className="mt-5 rounded-[16px] border border-white/[0.07] bg-black/15 p-4">
                <p className="text-[12px] uppercase tracking-[1.2px] text-[#7f8997]">
                  Завдання
                </p>

                <p className="mt-2 text-[17px] font-bold">
                  {taskType === "delivery" &&
                    `Доставка №${selectedOrder?.orderNumber ?? ""}`}

                  {taskType === "transfer" &&
                    `${fromPoint} → ${toPoint}`}

                  {taskType === "purchase" &&
                    `Закупка · ${fromPoint}`}
                </p>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="flex min-h-[330px] items-center justify-center text-center">
              <div>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/10 text-[34px] text-emerald-400">
                  ✓
                </div>

                <p className="mt-6 text-[25px] font-black">
                  Завдання відправлено кур'єрам
                </p>

                <p className="mt-3 text-[15px] leading-6 text-[#929ba8]">
                  Завдання вже доступне всім
                  кур'єрам, які перебувають на зміні.
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mt-5 rounded-[13px] border border-red-400/25 bg-red-500/10 px-4 py-3 text-[13px] font-semibold text-red-200">
              {errorMessage}
            </div>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.08] px-6 py-5">
          <div>
            {step !== "task" &&
              step !== "success" && (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={isSubmitting}
                  className="h-[50px] rounded-[13px] border border-white/[0.09] bg-white/[0.025] px-5 text-[14px] font-bold text-[#b8c0ca] transition hover:bg-white/[0.06]"
                >
                  Назад
                </button>
              )}
          </div>

          <div className="flex gap-3">
            {step === "task" && (
              <button
                type="button"
                onClick={closeDialog}
                className="h-[50px] rounded-[13px] border border-white/[0.09] bg-white/[0.025] px-6 text-[14px] font-bold text-[#b8c0ca]"
              >
                Скасувати
              </button>
            )}

            {step === "delivery-order" && (
              <button
                type="button"
                onClick={continueFromDelivery}
                disabled={
                  !selectedOrderId ||
                  deliveryOrders.length === 0
                }
                className="h-[50px] rounded-[13px] bg-[#ff5a00] px-7 text-[14px] font-black text-white transition hover:bg-[#ff6b16] disabled:cursor-not-allowed disabled:bg-[#512617] disabled:text-white/35"
              >
                Далі
              </button>
            )}

            {step === "transfer" && (
              <button
                type="button"
                onClick={continueFromTransfer}
                disabled={!fromPoint || !toPoint}
                className="h-[50px] rounded-[13px] bg-[#ff5a00] px-7 text-[14px] font-black text-white transition hover:bg-[#ff6b16] disabled:cursor-not-allowed disabled:bg-[#512617] disabled:text-white/35"
              >
                Далі
              </button>
            )}

            {step === "time" && (
              <button
                type="button"
                onClick={confirmCourierCall}
                disabled={
                  isSubmitting ||
                  (arrivalType === "specificTime" &&
                    !specificTime)
                }
                className="h-[50px] rounded-[13px] bg-[#ff5a00] px-7 text-[14px] font-black text-white transition hover:bg-[#ff6b16] disabled:cursor-not-allowed disabled:bg-[#512617] disabled:text-white/35"
              >
                {isSubmitting
                  ? "Відправляємо..."
                  : "Викликати"}
              </button>
            )}

            {step === "success" && (
              <button
                type="button"
                onClick={closeDialog}
                className="h-[50px] rounded-[13px] bg-[#ff5a00] px-8 text-[14px] font-black text-white transition hover:bg-[#ff6b16]"
              >
                Готово
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

function TaskButton({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-h-[210px] rounded-[20px] border border-white/[0.08] bg-white/[0.025] p-5 text-left transition hover:-translate-y-1 hover:border-[#ff6500]/60 hover:bg-[#ff6500]/[0.07] hover:shadow-[0_0_28px_rgba(255,101,0,0.10)]"
    >
      <span className="text-[42px]">{icon}</span>

      <p className="mt-5 text-[20px] font-black">
        {title}
      </p>

      <p className="mt-3 text-[13px] leading-6 text-[#929ba8]">
        {description}
      </p>
    </button>
  );
}

function PointSelect({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label>
      <span className="text-[13px] font-semibold text-[#bfc5cd]">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 h-[56px] w-full rounded-[14px] border border-white/[0.09] bg-[#080f16] px-4 text-[15px] text-white outline-none focus:border-[#ff6500]"
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}

        {points.map((point) => (
          <option key={point} value={point}>
            {point}
          </option>
        ))}
      </select>
    </label>
  );
}