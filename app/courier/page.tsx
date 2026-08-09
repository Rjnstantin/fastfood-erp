"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Logo from "../../components/Logo/Logo";
import {
  acceptCourierOrder,
  completeCourierOrder,
  getCourierActiveOrders,
  getCourierOrders,
  getOrders,
  subscribeToOrders,
} from "../../lib/orders";

import type {
  CourierTaskPreview,
  Order,
} from "../../lib/order";

type Courier = {
  id: number;
  surname: string;
  name: string;
  phone: string;
};

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

const couriers: Courier[] = [
  {
    id: 1,
    surname: "Тептя",
    name: "Костянтин",
    phone: "+380687997791",
  },
  {
    id: 2,
    surname: "Овсюк",
    name: "Артем",
    phone: "+380961484494",
  },
  {
    id: 3,
    surname: "Сильченко",
    name: "Матвій",
    phone: "+380979718883",
  },
  {
    id: 4,
    surname: "Востріков",
    name: "Олександр",
    phone: "+380967076890",
  },
  {
    id: 5,
    surname: "Свинаренко",
    name: "Максим",
    phone: "+380660710182",
  },
  {
    id: 6,
    surname: "Суханов",
    name: "Денис",
    phone: "+380970971611",
  },
];

const ACTIVE_SESSIONS_KEY = "tema-active-courier-sessions";
const CURRENT_SESSION_KEY = "tema-current-courier-session";
type SimpleCourierTask = {
  id: string;
  type: "transfer" | "purchase";
  status: "waiting" | "accepted" | "completed";
  createdAt: string;

  requestedBy: string;
  requestedFromPoint: string;

  fromPoint: string;
  toPoint: string | null;

  arrivalType:
    | "now"
    | "15min"
    | "20min"
    | "25min"
    | "specificTime";

  requestedForTime: string | null;

  courierId: number | null;
  acceptedAt: string | null;
  completedAt: string | null;

  courierSalary: number;
};

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

const SIMPLE_TASKS_KEY = "tema-simple-courier-tasks";
const SIMPLE_TASKS_EVENT = "tema-simple-courier-tasks-updated";

const COURIER_PAYOUTS_KEY = "tema-courier-payouts";
const COURIER_PAYOUTS_EVENT = "tema-courier-payouts-updated";

function formatTaskTime(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CourierPage() {
  const router = useRouter();
  const [selectedCourierId, setSelectedCourierId] = useState("");
  const [selectedRole, setSelectedRole] =
    useState<CourierRole>("Кур'єр");
  const [activeSessions, setActiveSessions] = useState<CourierSession[]>([]);
  const [currentSession, setCurrentSession] =
    useState<CourierSession | null>(null);
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [pendingCourierId, setPendingCourierId] = useState("");
  const [newOrders, setNewOrders] = useState<CourierTaskPreview[]>([]);
  const [simpleTasks, setSimpleTasks] = useState<SimpleCourierTask[]>([]);
  const [mySimpleTasks, setMySimpleTasks] = useState<SimpleCourierTask[]>([]);
  const [completedSimpleTasks, setCompletedSimpleTasks] =
  useState<SimpleCourierTask[]>([]);
const [myOrders, setMyOrders] = useState<Order[]>([]);
const [allOrders, setAllOrders] = useState<Order[]>([]);
const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
const [courierPayouts, setCourierPayouts] =
  useState<CourierPayout[]>([]);

const [activeSection, setActiveSection] = useState<
  "home" | "newOrders" | "myOrders" | "archive" | "income"
>("home");

  useEffect(() => {
    try {
      const savedSessions = window.localStorage.getItem(ACTIVE_SESSIONS_KEY);
      const savedCurrentSession =
        window.localStorage.getItem(CURRENT_SESSION_KEY);

      if (savedSessions) {
        const parsed = JSON.parse(savedSessions) as CourierSession[];

        if (Array.isArray(parsed)) {
          setActiveSessions(parsed);
        }
      }

      if (savedCurrentSession) {
        setCurrentSession(
          JSON.parse(savedCurrentSession) as CourierSession,
        );
      }
    } catch (error) {
      console.error("Не вдалося завантажити кур'єрську зміну:", error);
    }
  }, []);
  useEffect(() => {
  function refreshSimpleTasks() {
    try {
      const saved = window.localStorage.getItem(SIMPLE_TASKS_KEY);

      if (!saved) {
        setSimpleTasks([]);
        return;
      }

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) {
        setSimpleTasks([]);
        return;
      }

      const tasks = parsed as SimpleCourierTask[];

setSimpleTasks(
  tasks.filter((task) => task.status === "waiting"),
);

setMySimpleTasks(
  currentSession
    ? tasks.filter(
        (task) =>
          task.status === "accepted" &&
          task.courierId === currentSession.courierId,
      )
    : [],
);
setCompletedSimpleTasks(
  currentSession
    ? tasks.filter(
        (task) =>
          task.status === "completed" &&
          task.courierId === currentSession.courierId,
      )
    : [],
);
    } catch {
      setSimpleTasks([]);
    }
  }

  refreshSimpleTasks();

  window.addEventListener(
    SIMPLE_TASKS_EVENT,
    refreshSimpleTasks,
  );

  window.addEventListener(
    "storage",
    refreshSimpleTasks,
  );

  return () => {
    window.removeEventListener(
      SIMPLE_TASKS_EVENT,
      refreshSimpleTasks,
    );

    window.removeEventListener(
      "storage",
      refreshSimpleTasks,
    );
  };
}, [currentSession]);
useEffect(() => {
  function refreshCourierPayouts() {
    try {
      const saved = window.localStorage.getItem(COURIER_PAYOUTS_KEY);

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
}, []);
  useEffect(() => {
  const refreshOrders = () => {
    setNewOrders(getCourierOrders());
    setAllOrders(getOrders());

    if (currentSession) {
      setMyOrders(
        getCourierActiveOrders(currentSession.sessionId),
      );
    } else {
      setMyOrders([]);
    }
  };

  refreshOrders();

  return subscribeToOrders(refreshOrders);
}, [currentSession]);
const courierFeed = useMemo(() => {
  const today = new Date();

  const isToday = (dateValue: string | null | undefined) => {
    if (!dateValue) return false;

    const date = new Date(dateValue);

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const events = allOrders.flatMap((order) => {
    const call = order.delivery?.courierCall;

    if (!call) return [];

    const orderEvents: Array<{
      id: string;
      time: string;
      point: string;
      orderNumber: string;
      type: "called" | "accepted" | "handed" | "completed";
      courierName: string | null;
    }> = [];

    if (isToday(call.requestedAt)) {
      orderEvents.push({
        id: `${order.id}-called`,
        time: call.requestedAt,
        point: order.point,
        orderNumber: order.orderNumber,
        type: "called",
        courierName: null,
      });
    }

    if (isToday(call.acceptedAt)) {
      orderEvents.push({
        id: `${order.id}-accepted`,
        time: call.acceptedAt!,
        point: order.point,
        orderNumber: order.orderNumber,
        type: "accepted",
        courierName: call.courier?.name ?? null,
      });
    }

    if (isToday(call.handedAt)) {
      orderEvents.push({
        id: `${order.id}-handed`,
        time: call.handedAt!,
        point: order.point,
        orderNumber: order.orderNumber,
        type: "handed",
        courierName: call.courier?.name ?? null,
      });
    }

    if (isToday(call.completedAt)) {
      orderEvents.push({
        id: `${order.id}-completed`,
        time: call.completedAt!,
        point: order.point,
        orderNumber: order.orderNumber,
        type: "completed",
        courierName: call.courier?.name ?? null,
      });
    }

    return orderEvents;
  });

  return events.sort(
    (first, second) =>
      new Date(second.time).getTime() -
      new Date(first.time).getTime(),
  );
}, [allOrders]);

const simpleTasksIncome = useMemo(
  () =>
    completedSimpleTasks.reduce(
      (sum, task) => sum + (task.courierSalary || 0),
      0,
    ),
  [completedSimpleTasks],
);
const deliveryIncome = useMemo(() => {
  if (!currentSession) return 0;

  return allOrders.reduce((sum, order) => {
    const call = order.delivery?.courierCall;

    if (
      !call ||
      !call.completedAt ||
      call.courier?.sessionId !== currentSession.sessionId
    ) {
      return sum;
    }

    return sum + (order.delivery?.pricing.courierSalary || 0);
  }, 0);
}, [allOrders, currentSession]);

const totalCourierIncome = simpleTasksIncome + deliveryIncome;
const paidCourierIncome = useMemo(() => {
  if (!currentSession) return 0;

  return courierPayouts
    .filter(
      (payout) =>
        payout.courierId === currentSession.courierId &&
        payout.status === "paid",
    )
    .reduce((sum, payout) => sum + payout.amount, 0);
}, [courierPayouts, currentSession]);

const pendingCourierIncome = useMemo(() => {
  if (!currentSession) return 0;

  return courierPayouts
    .filter(
      (payout) =>
        payout.courierId === currentSession.courierId &&
        payout.status === "requested",
    )
    .reduce((sum, payout) => sum + payout.amount, 0);
}, [courierPayouts, currentSession]);


const completedDeliveryOrders = useMemo(() => {
  if (!currentSession) return [];

  return allOrders.filter((order) => {
    const call = order.delivery?.courierCall;

    return (
      order.status === "delivered" &&
      !!call?.completedAt &&
      call.courier?.sessionId === currentSession.sessionId
    );
  });
}, [allOrders, currentSession]);
const courierIncomeToPay = useMemo(() => {
  if (!currentSession) return 0;

  const paidEarningIds = new Set(
    courierPayouts
      .filter(
        (payout) =>
          payout.courierId === currentSession.courierId &&
          payout.status === "paid",
      )
      .flatMap((payout) => payout.earningIds),
  );

  let total = 0;

  completedDeliveryOrders.forEach((order) => {
    const earningId = `delivery:${order.id}`;

    if (paidEarningIds.has(earningId)) return;

    total += order.delivery?.pricing.courierSalary || 0;
  });

  completedSimpleTasks.forEach((task) => {
    const earningId = `task:${task.id}`;

    if (paidEarningIds.has(earningId)) return;

    total += task.courierSalary || 0;
  });

  return total;
}, [
  completedDeliveryOrders,
  completedSimpleTasks,
  courierPayouts,
  currentSession,
]);
const completedTodayCount = useMemo(() => {
  if (!currentSession) return 0;

  const today = new Date();

  const isToday = (value: string | null | undefined) => {
    if (!value) return false;

    const date = new Date(value);

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const deliveryCount = allOrders.filter((order) => {
    const call = order.delivery?.courierCall;

    return (
      order.status === "delivered" &&
      call?.courier?.sessionId === currentSession.sessionId &&
      isToday(call.completedAt)
    );
  }).length;

  const simpleCount = completedSimpleTasks.filter((task) =>
    isToday(task.completedAt),
  ).length;

  return deliveryCount + simpleCount;
}, [allOrders, completedSimpleTasks, currentSession]);
const incomeByPoint = useMemo(() => {
  if (!currentSession) return [];

  const lockedEarningIds = new Set(
    courierPayouts
      .filter(
        (payout) =>
          payout.courierId === currentSession.courierId &&
          (payout.status === "requested" || payout.status === "paid"),
      )
      .flatMap((payout) => payout.earningIds),
  );

  const points = new Map<
    string,
    {
      point: string;
      amount: number;
      earningIds: string[];
      ordersCount: number;
    }
  >();

  completedDeliveryOrders.forEach((order) => {
    const earningId = `delivery:${order.id}`;

    if (lockedEarningIds.has(earningId)) return;

    const amount =
      order.delivery?.pricing.courierSalary || 0;

    if (amount <= 0) return;

    const current = points.get(order.point) || {
      point: order.point,
      amount: 0,
      earningIds: [],
      ordersCount: 0,
    };

    current.amount += amount;
    current.earningIds.push(earningId);
    current.ordersCount += 1;

    points.set(order.point, current);
  });

  completedSimpleTasks.forEach((task) => {
    const earningId = `task:${task.id}`;

    if (lockedEarningIds.has(earningId)) return;

    const point = task.requestedFromPoint;
    const amount = task.courierSalary || 0;

    if (!point || amount <= 0) return;

    const current = points.get(point) || {
      point,
      amount: 0,
      earningIds: [],
      ordersCount: 0,
    };

    current.amount += amount;
    current.earningIds.push(earningId);
    current.ordersCount += 1;

    points.set(point, current);
  });

  return Array.from(points.values()).sort(
    (a, b) => b.amount - a.amount,
  );
}, [
  completedDeliveryOrders,
  completedSimpleTasks,
  courierPayouts,
  currentSession,
]);
  const selectedCourier = useMemo(
    () =>
      couriers.find(
        (courier) => courier.id === Number(selectedCourierId),
      ),
    [selectedCourierId],
  );

  function openCourierModal() {
    setPendingCourierId(selectedCourierId);
    setIsCourierModalOpen(true);
  }

  function cancelCourierSelection() {
    setPendingCourierId("");
    setIsCourierModalOpen(false);
  }

  function confirmCourierSelection() {
    if (!pendingCourierId) return;

    setSelectedCourierId(pendingCourierId);
    setIsCourierModalOpen(false);
  }

  function handleStartShift() {
    if (!selectedCourier) {
      window.alert("Оберіть кур'єра.");
      return;
    }

    const alreadyActive = activeSessions.some(
      (session) => session.courierId === selectedCourier.id,
    );

    if (alreadyActive) {
      window.alert(`${selectedCourier.name} уже перебуває на зміні.`);
      return;
    }

    const newSession: CourierSession = {
      sessionId: crypto.randomUUID(),
      courierId: selectedCourier.id,
      courierName: `${selectedCourier.surname} ${selectedCourier.name}`,
      phone: selectedCourier.phone,
      role: selectedRole,
      startedAt: new Date().toISOString(),
      status: "Вільний",
    };

    const updatedSessions = [...activeSessions, newSession];

    window.localStorage.setItem(
      ACTIVE_SESSIONS_KEY,
      JSON.stringify(updatedSessions),
    );
    window.localStorage.setItem(
      CURRENT_SESSION_KEY,
      JSON.stringify(newSession),
    );

    setActiveSessions(updatedSessions);
    setCurrentSession(newSession);
  }

  function handleEndShift() {
    if (!currentSession) return;

    const updatedSessions = activeSessions.filter(
      (session) => session.sessionId !== currentSession.sessionId,
    );

    window.localStorage.setItem(
      ACTIVE_SESSIONS_KEY,
      JSON.stringify(updatedSessions),
    );
    window.localStorage.removeItem(CURRENT_SESSION_KEY);

    setActiveSessions(updatedSessions);
    setCurrentSession(null);
    setSelectedCourierId("");
    setSelectedRole("Кур'єр");
  }
  function handleAcceptOrder(orderId: string) {
  if (!currentSession) return;

  try {
    acceptCourierOrder(orderId, {
      courierId: currentSession.courierId,
      sessionId: currentSession.sessionId,
      name: currentSession.courierName,
      phone: currentSession.phone,
      role: currentSession.role,
    });

    const updatedCurrentSession: CourierSession = {
      ...currentSession,
      status: "Зайнятий",
    };

    const updatedSessions = activeSessions.map((session) =>
      session.sessionId === currentSession.sessionId
        ? updatedCurrentSession
        : session,
    );

    window.localStorage.setItem(
      ACTIVE_SESSIONS_KEY,
      JSON.stringify(updatedSessions),
    );

    window.localStorage.setItem(
      CURRENT_SESSION_KEY,
      JSON.stringify(updatedCurrentSession),
    );

    setActiveSessions(updatedSessions);
    setCurrentSession(updatedCurrentSession);
  } catch (error) {
    window.alert(
      error instanceof Error
        ? error.message
        : "Не вдалося прийняти замовлення.",
    );
  }
}
function handleAcceptSimpleTask(taskId: string) {
  if (!currentSession) return;

  try {
    const saved = window.localStorage.getItem(SIMPLE_TASKS_KEY);

    if (!saved) {
      throw new Error("Завдання не знайдено.");
    }

    const tasks = JSON.parse(saved) as SimpleCourierTask[];

    const selectedTask = tasks.find(
      (task) => task.id === taskId,
    );

    if (!selectedTask || selectedTask.status !== "waiting") {
      throw new Error("Це завдання вже прийняв інший кур’єр.");
    }

    const acceptedAt = new Date().toISOString();

    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status: "accepted" as const,
            courierId: currentSession.courierId,
            acceptedAt,
          }
        : task,
    );

    window.localStorage.setItem(
      SIMPLE_TASKS_KEY,
      JSON.stringify(updatedTasks),
    );

    window.dispatchEvent(new Event(SIMPLE_TASKS_EVENT));

    setSimpleTasks(
      updatedTasks.filter(
        (task) => task.status === "waiting",
      ),
    );
    setMySimpleTasks(
  updatedTasks.filter(
    (task) =>
      task.status === "accepted" &&
      task.courierId === currentSession.courierId,
  ),
);


    const updatedCurrentSession: CourierSession = {
      ...currentSession,
      status: "Зайнятий",
    };

    const updatedSessions = activeSessions.map((session) =>
      session.sessionId === currentSession.sessionId
        ? updatedCurrentSession
        : session,
    );

    window.localStorage.setItem(
      ACTIVE_SESSIONS_KEY,
      JSON.stringify(updatedSessions),
    );

    window.localStorage.setItem(
      CURRENT_SESSION_KEY,
      JSON.stringify(updatedCurrentSession),
    );

    setActiveSessions(updatedSessions);
    setCurrentSession(updatedCurrentSession);
  } catch (error) {
    window.alert(
      error instanceof Error
        ? error.message
        : "Не вдалося прийняти завдання.",
    );
  }
}

function handleCompleteSimpleTask(taskId: string) {
  if (!currentSession) return;

  try {
    const saved = window.localStorage.getItem(SIMPLE_TASKS_KEY);

    if (!saved) {
      throw new Error("Завдання не знайдено.");
    }

    const tasks = JSON.parse(saved) as SimpleCourierTask[];

    const selectedTask = tasks.find(
      (task) => task.id === taskId,
    );

    if (!selectedTask) {
      throw new Error("Завдання не знайдено.");
    }

    if (
      selectedTask.status !== "accepted" ||
      selectedTask.courierId !== currentSession.courierId
    ) {
      throw new Error("Це завдання не належить поточному кур’єру.");
    }

    const completedAt = new Date().toISOString();

    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status: "completed" as const,
            completedAt,
            courierSalary: 50,
          }
        : task,
    );

    window.localStorage.setItem(
      SIMPLE_TASKS_KEY,
      JSON.stringify(updatedTasks),
    );

    window.dispatchEvent(new Event(SIMPLE_TASKS_EVENT));

    setSimpleTasks(
      updatedTasks.filter(
        (task) => task.status === "waiting",
      ),
    );

    setMySimpleTasks(
      updatedTasks.filter(
        (task) =>
          task.status === "accepted" &&
          task.courierId === currentSession.courierId,
      ),
    );

    const updatedCurrentSession: CourierSession = {
      ...currentSession,
      status: "Вільний",
    };

    const updatedSessions = activeSessions.map((session) =>
      session.sessionId === currentSession.sessionId
        ? updatedCurrentSession
        : session,
    );

    window.localStorage.setItem(
      ACTIVE_SESSIONS_KEY,
      JSON.stringify(updatedSessions),
    );

    window.localStorage.setItem(
      CURRENT_SESSION_KEY,
      JSON.stringify(updatedCurrentSession),
    );

    setActiveSessions(updatedSessions);
    setCurrentSession(updatedCurrentSession);
  } catch (error) {
    window.alert(
      error instanceof Error
        ? error.message
        : "Не вдалося завершити завдання.",
    );
  }
}
function handleRequestPayout(
  point: string,
  amount: number,
  earningIds: string[],
) {
  if (!currentSession) return;

  if (amount <= 0 || earningIds.length === 0) {
    window.alert("Немає коштів для виплати.");
    return;
  }

  const newPayout: CourierPayout = {
    id: crypto.randomUUID(),

    courierId: currentSession.courierId,
    courierName: currentSession.courierName,

    point,

    amount,

    status: "requested",

    requestedAt: new Date().toISOString(),
    paidAt: null,

    earningIds,
  };

  const updatedPayouts = [...courierPayouts, newPayout];

  window.localStorage.setItem(
    COURIER_PAYOUTS_KEY,
    JSON.stringify(updatedPayouts),
  );

  window.dispatchEvent(
    new Event(COURIER_PAYOUTS_EVENT),
  );

  setCourierPayouts(updatedPayouts);
}
function handleCompleteOrder(orderId: string) {
  if (!currentSession) return;

  try {
    completeCourierOrder(
      orderId,
      currentSession.sessionId,
    );

    const updatedCurrentSession: CourierSession = {
      ...currentSession,
      status: "Вільний",
    };

    const updatedSessions = activeSessions.map((session) =>
      session.sessionId === currentSession.sessionId
        ? updatedCurrentSession
        : session,
    );

    window.localStorage.setItem(
      ACTIVE_SESSIONS_KEY,
      JSON.stringify(updatedSessions),
    );

    window.localStorage.setItem(
      CURRENT_SESSION_KEY,
      JSON.stringify(updatedCurrentSession),
    );

    setActiveSessions(updatedSessions);
    setCurrentSession(updatedCurrentSession);
  } catch (error) {
    window.alert(
      error instanceof Error
        ? error.message
        : "Не вдалося завершити доставку.",
    );
  }
}

  if (currentSession) {
    const shiftStartedAt = new Date(currentSession.startedAt);
    const shiftTime = shiftStartedAt.toLocaleTimeString("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const shiftDate = shiftStartedAt.toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const elapsedMinutes = Math.max(
      0,
      Math.floor((Date.now() - shiftStartedAt.getTime()) / 60000),
    );
    const elapsedTime = `${String(Math.floor(elapsedMinutes / 60)).padStart(2, "0")}:${String(
      elapsedMinutes % 60,
    ).padStart(2, "0")}`;

    return (
      <main className="min-h-[100dvh] bg-[#020508] pb-[calc(82px+env(safe-area-inset-bottom))] text-white lg:h-[100dvh] lg:overflow-hidden lg:pb-0">
        <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col px-4 py-2 lg:px-5">
          <header className="flex h-[64px] shrink-0 items-center justify-between gap-4 px-4">
            <div className="flex min-w-0 items-center gap-6">
              <div className="w-[170px] shrink-0">
                <Logo />
              </div>
              <span className="hidden h-11 w-px bg-white/[0.10] sm:block" />
              <p className="truncate text-[20px] font-medium text-[#d1d4d9] sm:text-[23px]">
                Кур&apos;єрська служба
              </p>
            </div>

            <button
              type="button"
              onClick={handleEndShift}
              className="flex h-[54px] shrink-0 items-center gap-3 rounded-[13px] border border-[#ff5a00] px-5 text-[14px] font-bold text-[#ff6b16] transition hover:bg-[#ff5a00]/10 sm:text-[16px]"
            >
              <PowerIcon size={23} />
              <span className="hidden sm:inline">Завершити зміну</span>
              <span className="sm:hidden">Завершити</span>
            </button>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 pb-2 lg:grid-cols-[292px_minmax(0,1fr)]">
            <aside className="hidden min-h-0 flex-col rounded-[20px] border border-white/[0.08] bg-[linear-gradient(180deg,#0b1117,#071017)] p-3 shadow-[0_25px_80px_rgba(0,0,0,0.38)] lg:flex">
              <nav className="space-y-2">
  <CourierNavButton
    active={activeSection === "home"}
    icon={<HomeIcon size={25} />}
    label="Головна"
    onClick={() => setActiveSection("home")}
  />

  <CourierNavButton
  active={activeSection === "newOrders"}
  icon={<ScooterIcon size={29} />}
  label="Нові замовлення"
  badge={String(newOrders.length + simpleTasks.length)}
  onClick={() => setActiveSection("newOrders")}
/>

<CourierNavButton
  active={activeSection === "myOrders"}
  icon={<ClipboardIcon size={25} />}
  label="Моє замовлення"
  badge={String(myOrders.length + mySimpleTasks.length)}
  onClick={() => setActiveSection("myOrders")}
/>

  <CourierNavButton
    active={activeSection === "archive"}
    icon={<ArchiveIcon size={25} />}
    label="Архів"
    onClick={() => setActiveSection("archive")}
  />
</nav>

              <div className="my-4 h-px bg-white/[0.07]" />

              <button
                type="button"
                onClick={() => setActiveSection("income")}
                className="flex h-[78px] w-full items-center justify-between rounded-[15px] border border-[#ff6500] bg-[#ff6500]/[0.025] px-4 text-left transition hover:bg-[#ff6500]/[0.07]"
              >
                <span className="flex items-center gap-4">
                  <span className="text-[#ff6a00]">
                    <WalletOutlineIcon size={30} />
                  </span>
                  <div>
  <span className="text-[17px] font-semibold">
    Мій дохід
  </span>

  <p className="mt-1 text-[13px] font-bold text-[#ff6500]">
    {courierIncomeToPay} ₴
  </p>
</div>
                </span>
                <ChevronRightIcon size={26} />
              </button>

              <div className="mt-auto space-y-3">
                <CourierNavButton
                  icon={<SettingsIcon size={25} />}
                  label="Налаштування"
                />

                <button
  type="button"
  onClick={() => setIsSupportModalOpen(true)}
  className="flex w-full items-center justify-between rounded-[15px] border border-white/[0.08] bg-white/[0.03] px-4 py-4 transition hover:border-[#ff6500] hover:bg-[#ff6500]/10"
>
  <div className="flex items-center gap-4">
    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#ff6500]/30 bg-[#ff6500]/10 text-[#ff6500]">
      <PhoneOutlineIcon size={24} />
    </div>

    <div>
      <p className="text-[16px] font-semibold text-white">
        Зв'язок з точкою
      </p>

      <p className="mt-1 text-[12px] text-[#9ca4ae]">
        Обрати точку для зв'язку
      </p>
    </div>
  </div>

  <ChevronRightIcon size={24} />
</button>
              </div>
            </aside>

            <section className="flex min-h-0 min-w-0 flex-col gap-3">
              <section className="grid shrink-0 items-center gap-4 rounded-[20px] border border-white/[0.08] bg-[linear-gradient(145deg,#0a1117,#071017)] px-5 py-4 shadow-[0_24px_70px_rgba(0,0,0,0.30)] xl:grid-cols-[minmax(430px,1.2fr)_minmax(500px,1fr)]">
                <div className="flex min-w-0 items-center gap-6">
                  <div className="h-[132px] w-[132px] shrink-0 overflow-hidden rounded-full border-2 border-[#ff5a00]">
  <img
    src="/couriers/teptya-konstantin.jpg"
    alt={currentSession.courierName}
    className="h-full w-full object-cover object-[47%_50%]"
  />
</div>

                  <div className="min-w-0">
                    <h1 className="text-[24px] font-black leading-tight tracking-[-0.5px] sm:text-[34px]">
                      {currentSession.courierName}
                    </h1>
                    <div className="mt-2 flex items-center gap-3 text-[17px] text-[#c7cbd1]">
                      <span className="text-[#ff6500]">
                        <ScooterIcon size={27} />
                      </span>
                      {currentSession.role}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-[17px] text-[#c7cbd1]">
                      <PhoneOutlineIcon size={24} />
                      {currentSession.phone}
                    </div>
                    <div
  className={`mt-3 inline-flex items-center gap-3 rounded-full border px-4 py-2 ${
    currentSession.status === "Вільний"
      ? "border-emerald-400/20 bg-emerald-500/[0.13]"
      : "border-[#ff6500]/25 bg-[#ff6500]/10"
  }`}
>
  <span
    className={`h-3 w-3 rounded-full ${
      currentSession.status === "Вільний"
        ? "bg-emerald-400 shadow-[0_0_13px_rgba(52,211,153,0.85)]"
        : "bg-[#ff6500] shadow-[0_0_13px_rgba(255,101,0,0.85)]"
    }`}
  />

  <span
    className={`text-[20px] font-bold ${
      currentSession.status === "Вільний"
        ? "text-emerald-400"
        : "text-[#ff7519]"
    }`}
  >
    {currentSession.status}
  </span>
</div>

<p className="mt-2 text-[14px] text-[#a5abb4]">
  {currentSession.status === "Вільний"
    ? "Готовий до нових замовлень"
    : "Виконує поточне замовлення"}
</p>
                  </div>
                </div>

                <div className="grid h-full min-h-[132px] grid-cols-3 divide-x divide-white/[0.10]">
                  <ProfileMetric
                    icon={<CalendarOutlineIcon size={24} />}
                    label="Початок зміни"
                    value={shiftTime}
                    note={shiftDate}
                  />
                  <ProfileMetric
                    icon={<StopwatchIcon size={25} />}
                    label="На зміні"
                    value={elapsedTime}
                    note="год хв"
                  />
                  <ProfileMetric
                    icon={<TrophyIcon size={25} />}
                    label="Виконано сьогодні"
                    value={String(completedTodayCount)}
                    note="замовлень"
                    orange
                  />
                </div>
              </section>

              <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(370px,0.9fr)]">
                <section className="flex min-h-0 min-w-0 flex-col rounded-[20px] border border-white/[0.08] bg-[linear-gradient(145deg,#0a1117,#071017)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.30)]">
                {(activeSection === "home" ||
  activeSection === "newOrders") && (
  <>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-[25px] font-black">Нові замовлення</h2>
                      <span className="flex h-8 min-w-8 items-center justify-center rounded-[9px] border border-[#ff6500] px-2 text-[13px] font-bold text-[#ff6500]">
                        {newOrders.length + simpleTasks.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-[#a6adb7]">
                      Автооновлення
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </div>
                  </div>

                  {newOrders.length + simpleTasks.length === 0 ? (
  <div className="mt-4 flex flex-1 items-center justify-center rounded-[17px] border border-white/[0.035] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.018),transparent_62%)] px-5 text-center">
    <div>
      <p className="text-[28px] font-black">
        Нових замовлень немає
      </p>

      <p className="mt-4 text-[17px] leading-7 text-[#a3aab4]">
        Очікуємо нові замовлення від точок.
        <br />
        Ви будете сповіщені автоматично.
      </p>
    </div>
  </div>
) : (
  <div className="mx-auto mt-4 w-full max-w-[560px] flex-1 space-y-6 overflow-y-auto pr-1">
    {newOrders.map((order) => (
      <article
        key={order.taskId}
        className="rounded-[17px] border border-[#ff6500]/55 bg-[#081017] p-5 shadow-[0_0_24px_rgba(255,101,0,0.08)]"
      >
        
        <div className="flex items-start justify-between gap-4">
  <div>
    <p className="text-[12px] font-bold uppercase tracking-[1.3px] text-[#ff6500]">
      Їхати на точку
    </p>

    <p className="mt-1 text-[25px] font-black">
      {order.point}
    </p>
  </div>

  <div className="text-right">
    <p className="text-[23px] font-black text-[#ff6500]">
      №{order.orderNumber}
    </p>

    <div className="mt-2 text-[10px] leading-[1.5] text-[#77818e]">
      <p>
        Виклик: {formatTaskTime(order.requestedAt)}
      </p>

      <p>
        На: {order.requestedForTime || "Зараз"}
      </p>
    </div>
  </div>
</div>

            <p className="mt-1 text-[13px] text-[#a6adb7]">
              Доставка
            </p>
            <p className="mt-2 text-[14px] font-black text-[#ff9a59]">
  Прибути:{" "}
  {order.requestedForTime
    ? order.requestedForTime
    : "Зараз"}
</p>

        <div className="mt-5 space-y-4 border-t border-dashed border-white/[0.12] pt-4">
          <div className="flex items-start gap-3">
            <MapPinIcon size={22} />

            <div>
              <p className="text-[12px] text-[#8f98a5]">
                Адреса клієнта
              </p>

              <p className="mt-1 text-[16px] font-medium">
                {order.address || "Адресу не вказано"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <PhoneOutlineIcon size={22} />

            <div>
              <p className="text-[12px] text-[#8f98a5]">
                Клієнт
              </p>

              <p className="mt-1 text-[16px] font-medium">
                {order.customerName || "Ім’я не вказано"}
              </p>

              <p className="mt-1 text-[14px] text-[#b8bec7]">
                {order.customerPhone || "Телефон не вказано"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-dashed border-white/[0.12] pt-4">
          <div>
            <p className="text-[12px] text-[#8f98a5]">
              Оплата
            </p>

            <p className="mt-1 text-[16px] font-semibold">
              {order.paymentType === "cash"
                ? "Готівка"
                : "Термінал"}

            </p>
            {(() => {
  const fullOrder = allOrders.find(
    (fullOrder) => fullOrder.id === order.orderId,
  );

  const payment = fullOrder?.delivery?.payment;

  if (
    order.paymentType !== "cash" ||
    payment?.needsChange !== true ||
    !payment.changeFrom
  ) {
    return null;
  }

  return (
    <>
      <p className="mt-2 text-[13px] font-bold text-[#ff9a59]">
        Решта з {payment.changeFrom} ₴
      </p>

      <p className="mt-1 text-[12px] text-[#a6adb7]">
        Підготувати решту:{" "}
        {Math.max(
          0,
          Number(payment.changeFrom) - order.total,
        )}{" "}
        ₴
      </p>
    </>
  );
})()}
            
          </div>

          <div>
            <p className="text-[12px] text-[#8f98a5]">
              Сума
            </p>

            <p className="mt-1 text-[22px] font-black">
              {order.total} ₴
            </p>
          </div>
        </div>

        {order.comment && (
          <div className="mt-4 rounded-[11px] border border-[#ff6500]/20 bg-[#ff6500]/[0.05] p-3">
            <p className="text-[12px] font-semibold text-[#ff7519]">
              Коментар
            </p>

            <p className="mt-1 text-[14px] text-[#d2d5da]">
              {order.comment}
            </p>
          </div>
        )}

        <button
  type="button"
  onClick={() => handleAcceptOrder(order.orderId)}
  className="mt-5 h-[52px] w-full rounded-[12px] bg-[#ff5a00] text-[15px] font-black text-white transition hover:bg-[#ff6b16]"
>
  Прийняти замовлення
</button>
            </article>
    ))}

    {simpleTasks.map((task) => (
      <article
        key={task.id}
        className="rounded-[17px] border border-[#ff6500]/55 bg-[#081017] p-5 shadow-[0_0_24px_rgba(255,101,0,0.08)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[1.3px] text-[#ff6500]">
              {task.type === "transfer"
                ? "Передача між точками"
                : "Закупка"}
            </p>

            <p className="mt-1 text-[25px] font-black">
              {task.requestedFromPoint}
            </p>
          </div>

          <div className="text-right">
  <p className="text-[13px] text-[#a6adb7]">
    {task.type === "transfer"
      ? "Передача"
      : "Закупка"}
  </p>

  <div className="mt-2 text-[10px] leading-[1.5] text-[#77818e]">
    <p>
      Виклик: {formatTaskTime(task.createdAt)}
    </p>

    <p>
      На: {task.requestedForTime || "Зараз"}
    </p>
  </div>
</div>
        </div>

        <div className="mt-5 space-y-4 border-t border-dashed border-white/[0.12] pt-4">
          <div className="flex items-start gap-3">
            <MapPinIcon size={22} />

            <div>
              <p className="text-[12px] text-[#8f98a5]">
                {task.type === "transfer"
                  ? "Забрати"
                  : "Точка виклику"}
              </p>

              <p className="mt-1 text-[16px] font-medium">
                {task.fromPoint || task.requestedFromPoint}
              </p>
            </div>
          </div>

          {task.type === "transfer" && task.toPoint && (
            <div className="flex items-start gap-3">
              <MapPinIcon size={22} />

              <div>
                <p className="text-[12px] text-[#8f98a5]">
                  Доставити
                </p>

                <p className="mt-1 text-[16px] font-medium">
                  {task.toPoint}
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleAcceptSimpleTask(task.id)}
          className="mt-5 h-[52px] w-full rounded-[12px] bg-[#ff5a00] text-[15px] font-black text-white transition hover:bg-[#ff6b16]"
        >
          Прийняти завдання
        </button>
      </article>
    ))}
  </div>
)}
  </>
)}
{activeSection === "myOrders" && (
  <>
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <h2 className="text-[25px] font-black">
          Моє замовлення
        </h2>

        <span className="flex h-8 min-w-8 items-center justify-center rounded-[9px] border border-[#ff6500] px-2 text-[13px] font-bold text-[#ff6500]">
          {myOrders.length}
        </span>
      </div>

      <p className="text-[13px] text-[#a6adb7]">
        Активні замовлення
      </p>
    </div>

    <div className="mt-4 flex-1 overflow-y-auto pr-1">
  {myOrders.length + mySimpleTasks.length === 0 ? (
    <div className="flex h-full items-center justify-center rounded-[17px] border border-white/[0.07] bg-[#081017]">
      <div className="text-center">
        <p className="text-[28px] font-black">
          Активних замовлень немає
        </p>

        <p className="mt-3 text-[#9aa3af]">
          Прийміть перше замовлення.
        </p>
      </div>
    </div>
  ) : (
    <>
      {myOrders.map((order) => (
        <div
          key={order.id}
          className="mb-4 rounded-[17px] border border-[#ff6500]/40 bg-[#081017] p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] text-[#ff6500]">
                Статус
              </p>

              <h3 className="mt-1 text-[24px] font-black">
                {order.status === "handedToCourier"
                  ? "Кур'єр прямує до клієнта"
                  : "Кур'єр прямує на точку"}
              </h3>
            </div>

            <span className="text-[18px] font-black text-[#ff6500]">
              №{order.orderNumber}
            </span>
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="text-[12px] uppercase tracking-[1.4px] text-[#8f98a5]">
              Точка
            </p>

            <p className="mt-1 text-[20px] font-bold">
              {order.point}
            </p>
          </div>

          {order.delivery && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-[12px] uppercase tracking-[1.4px] text-[#8f98a5]">
                Клієнт
              </p>

              <p className="mt-1 text-[18px] font-bold">
                {order.delivery.customer.name || "Ім'я не вказано"}
              </p>

              <p className="mt-1 text-[15px] text-[#c7cdd4]">
                {order.delivery.customer.phone}
              </p>

              <p className="mt-3 text-[15px] text-[#c7cdd4]">
                {[
                  order.delivery.address.street,
                  order.delivery.address.house,
                  order.delivery.address.apartment
                    ? `кв. ${order.delivery.address.apartment}`
                    : "",
                  order.delivery.address.entrance
                    ? `під'їзд ${order.delivery.address.entrance}`
                    : "",
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>

              {order.delivery.address.location && (
                <p className="mt-1 text-[14px] text-[#9aa3af]">
                  {order.delivery.address.location}
                </p>
              )}

              {order.delivery.customer.comment && (
                <div className="mt-3 rounded-[11px] border border-[#ff6500]/20 bg-[#ff6500]/5 p-3">
                  <p className="text-[12px] font-semibold text-[#ff7519]">
                    Коментар
                  </p>

                  <p className="mt-1 text-[14px] text-[#d2d5da]">
                    {order.delivery.customer.comment}
                  </p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <div>
                  <p className="text-[12px] text-[#8f98a5]">
                    Оплата
                  </p>

                  <p className="mt-1 font-bold">
                    {order.paymentType === "cash"
                      ? "Готівка"
                      : "Термінал"}
                  </p>
                  {order.paymentType === "cash" &&
  order.delivery?.payment.needsChange === true &&
  order.delivery.payment.changeFrom && (
    <>
      <p className="mt-2 text-[13px] font-bold text-[#ff9a59]">
        Решта з {order.delivery.payment.changeFrom} ₴
      </p>

      <p className="mt-1 text-[12px] text-[#a6adb7]">
        Підготувати решту:{" "}
        {Math.max(
          0,
          Number(order.delivery.payment.changeFrom) - order.total,
        )}{" "}
        ₴
      </p>
    </>
  )}
                </div>

                <div className="text-right">
                  <p className="text-[12px] text-[#8f98a5]">
                    Сума
                  </p>

                  <p className="mt-1 text-[21px] font-black text-[#ff6500]">
                    {order.total} грн
                  </p>
                </div>
              </div>
            </div>
          )}
                    {order.status === "handedToCourier" && (
            <button
              type="button"
              onClick={() => handleCompleteOrder(order.id)}
              className="mt-5 h-[54px] w-full rounded-[12px] bg-[#ff5a00] text-[16px] font-black text-white transition hover:bg-[#ff6b16]"
            >
              Передав клієнту
            </button>
          )}
        </div>
      ))}

      {mySimpleTasks.map((task) => (
        <div
          key={task.id}
          className="mb-4 rounded-[17px] border border-[#ff6500]/40 bg-[#081017] p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[1.4px] text-[#ff6500]">
                {task.type === "transfer"
                  ? "Передача між точками"
                  : "Закупка"}
              </p>

              <h3 className="mt-1 text-[24px] font-black">
                {task.type === "transfer"
                  ? "Передача"
                  : "Закупка"}
              </h3>
            </div>

            <div className="text-right">
  <span className="inline-flex rounded-full border border-[#ff6500]/30 px-3 py-1 text-[12px] font-bold text-[#ff6500]">
    Прийнято
  </span>

  <div className="mt-2 text-[10px] leading-[1.5] text-[#77818e]">
    <p>
      Виклик: {formatTaskTime(task.createdAt)}
    </p>

    <p>
      На: {task.requestedForTime || "Зараз"}
    </p>

    <p>
      Прийнято: {formatTaskTime(task.acceptedAt)}
    </p>
  </div>
</div>
          </div>

          <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
            <div>
              <p className="text-[12px] text-[#8f98a5]">
                Виклик з точки
              </p>

              <p className="mt-1 text-[18px] font-bold">
                {task.requestedFromPoint}
              </p>
            </div>

            {task.type === "transfer" && task.toPoint && (
              <div>
                <p className="text-[12px] text-[#8f98a5]">
                  Доставити на точку
                </p>

                <p className="mt-1 text-[18px] font-bold">
                  {task.toPoint}
                </p>
              </div>
            )}

            

            <div>
              <p className="text-[12px] text-[#8f98a5]">
                Прибути
              </p>

              <p className="mt-1 text-[16px] font-bold">
                {task.requestedForTime || "Зараз"}
              </p>
            </div>
          </div>
          <button
  type="button"
  onClick={() => handleCompleteSimpleTask(task.id)}
  className="mt-5 h-[54px] w-full rounded-[12px] bg-[#ff5a00] text-[16px] font-black text-white transition hover:bg-[#ff6b16]"
>
  {task.type === "transfer"
    ? "Передав на точці"
    : "Передав на точку"}
</button>
        </div>
      ))}
    </>
  )}
</div>
  </>
)}

{activeSection === "archive" && (
  <>
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <h2 className="text-[25px] font-black">
          Архів
        </h2>

        <span className="flex h-8 min-w-8 items-center justify-center rounded-[9px] border border-[#ff6500]/40 bg-[#ff6500]/10 px-2 text-[13px] font-bold text-[#ff6500]">
          {completedDeliveryOrders.length + completedSimpleTasks.length}
        </span>
      </div>

      <p className="text-[13px] text-[#a6adb7]">
        Виконані замовлення
      </p>
    </div>

    <div className="mt-4 flex-1 overflow-y-auto pr-1">
      {completedDeliveryOrders.length + completedSimpleTasks.length === 0 ? (
        <div className="flex h-full items-center justify-center rounded-[17px] border border-white/[0.07] bg-[#081017]">
          <div className="text-center">
            <p className="text-[28px] font-black">
              Архів порожній
            </p>

            <p className="mt-3 text-[14px] text-[#9aa3af]">
              Виконані замовлення з'являться тут
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {completedDeliveryOrders.map((order) => {
  const call = order.delivery?.courierCall;

  return (
    <article
      key={`archive-delivery-${order.id}`}
      className="rounded-[17px] border border-white/[0.08] bg-[#081017] p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[1.4px] text-[#ff6500]">
            Доставка
          </p>

          <h3 className="mt-1 text-[22px] font-black">
            Замовлення №{order.orderNumber}
          </h3>

          <p className="mt-1 text-[14px] text-[#a6adb7]">
            {order.point}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[18px] font-black text-[#ff6500]">
            +{order.delivery?.pricing.courierSalary || 0} ₴
          </p>

          <p className="mt-1 text-[11px] text-[#77818e]">
            Виконано
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
        <div>
          <p className="text-[11px] text-[#77818e]">
            Виклик
          </p>

          <p className="mt-1 text-[13px] font-semibold">
            {formatTaskTime(call?.requestedAt)}
          </p>
        </div>

        <div>
          <p className="text-[11px] text-[#77818e]">
            Прийнято
          </p>

          <p className="mt-1 text-[13px] font-semibold">
            {formatTaskTime(call?.acceptedAt)}
          </p>
        </div>

        <div>
          <p className="text-[11px] text-[#77818e]">
            Виконано
          </p>

          <p className="mt-1 text-[13px] font-semibold">
            {formatTaskTime(call?.completedAt)}
          </p>
        </div>
      </div>
    </article>
  );
})}
          {completedSimpleTasks.map((task) => (
            <article
              key={task.id}
              className="rounded-[17px] border border-white/[0.08] bg-[#081017] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[1.4px] text-[#ff6500]">
                    {task.type === "transfer"
                      ? "Передача між точками"
                      : "Закупка"}
                  </p>

                  <h3 className="mt-1 text-[22px] font-black">
                    {task.requestedFromPoint}
                  </h3>
                </div>

                <div className="text-right">
                  <p className="text-[18px] font-black text-[#ff6500]">
                    +{task.courierSalary || 0} ₴
                  </p>

                  <p className="mt-1 text-[11px] text-[#77818e]">
                    Виконано
                  </p>
                </div>
              </div>

              {task.type === "transfer" && task.toPoint && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="text-[12px] text-[#8f98a5]">
                    Маршрут
                  </p>

                  <p className="mt-1 text-[17px] font-bold">
                    {task.fromPoint} → {task.toPoint}
                  </p>
                </div>
              )}

              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
                <div>
                  <p className="text-[11px] text-[#77818e]">
                    Виклик
                  </p>
                  <p className="mt-1 text-[13px] font-semibold">
                    {formatTaskTime(task.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-[#77818e]">
                    Прийнято
                  </p>
                  <p className="mt-1 text-[13px] font-semibold">
                    {formatTaskTime(task.acceptedAt)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-[#77818e]">
                    Виконано
                  </p>
                  <p className="mt-1 text-[13px] font-semibold">
                    {formatTaskTime(task.completedAt)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  </>
)}
{activeSection === "income" && (
  <>
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[12px] font-bold uppercase tracking-[1.4px] text-[#ff6500]">
          Кур'єрський заробіток
        </p>

        <h2 className="mt-1 text-[25px] font-black">
          Мій дохід
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-5 text-right">
  <div>
    <p className="text-[12px] text-[#8f98a5]">
      Зароблено
    </p>

    <p className="mt-1 text-[26px] font-black text-[#ff6500]">
      {totalCourierIncome} ₴
    </p>
  </div>

  <div>
    <p className="text-[12px] text-[#8f98a5]">
      Виплачено
    </p>

    <p className="mt-1 text-[26px] font-black text-emerald-400">
      {paidCourierIncome} ₴
    </p>
  </div>

  <div>
    <p className="text-[12px] text-[#8f98a5]">
      До виплати
    </p>

    <p className="mt-1 text-[26px] font-black text-white">
      {courierIncomeToPay} ₴
    </p>
  </div>
</div>
    </div>

    {incomeByPoint.length > 0 && (
  <div className="grid gap-3 md:grid-cols-2">
    {incomeByPoint.map((item) => (
      <div
        key={item.point}
        className="rounded-[15px] border border-[#ff6500]/25 bg-[#ff6500]/[0.04] p-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] uppercase tracking-[1.3px] text-[#8f98a5]">
              До виплати від точки
            </p>

            <p className="mt-1 text-[19px] font-black">
              {item.point}
            </p>

            <p className="mt-1 text-[12px] text-[#8f98a5]">
              {item.ordersCount} виконаних замовлень
            </p>
          </div>

          <p className="text-[22px] font-black text-[#ff6500]">
            {item.amount} ₴
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            handleRequestPayout(
              item.point,
              item.amount,
              item.earningIds,
            )
          }
          className="mt-4 h-[46px] w-full rounded-[11px] border border-[#ff6500] bg-[#ff6500]/10 text-[14px] font-black text-[#ff7519] transition hover:bg-[#ff6500]/20"
        >
          Отримати виплату
        </button>
      </div>
    ))}
  </div>
)}

    <div className="mt-4 flex-1 overflow-y-auto pr-1">
      {completedDeliveryOrders.length + completedSimpleTasks.length === 0 ? (
        <div className="flex h-full items-center justify-center rounded-[17px] border border-white/[0.07] bg-[#081017]">
          <div className="text-center">
            <p className="text-[28px] font-black">
              Нарахувань ще немає
            </p>

            <p className="mt-3 text-[14px] text-[#9aa3af]">
              Дохід з'явиться після виконання замовлення
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">

          {completedDeliveryOrders.map((order) => {
            const call = order.delivery?.courierCall;

            return (
              <article
                key={`income-delivery-${order.id}`}
                className="rounded-[17px] border border-white/[0.08] bg-[#081017] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-[1.4px] text-[#ff6500]">
                      Доставка
                    </p>

                    <h3 className="mt-1 text-[22px] font-black">
                      Замовлення №{order.orderNumber}
                    </h3>

                    <p className="mt-1 text-[14px] text-[#a6adb7]">
                      {order.point}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[22px] font-black text-emerald-400">
                      +{order.delivery?.pricing.courierSalary || 0} ₴
                    </p>

                    <p className="mt-1 text-[11px] text-[#77818e]">
                      Виконано {formatTaskTime(call?.completedAt)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}

          {completedSimpleTasks.map((task) => (
            <article
              key={`income-task-${task.id}`}
              className="rounded-[17px] border border-white/[0.08] bg-[#081017] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[1.4px] text-[#ff6500]">
                    {task.type === "transfer"
                      ? "Передача між точками"
                      : "Закупка"}
                  </p>

                  <h3 className="mt-1 text-[22px] font-black">
                    {task.type === "transfer" && task.toPoint
                      ? `${task.fromPoint} → ${task.toPoint}`
                      : task.requestedFromPoint}
                  </h3>
                </div>

                <div className="text-right">
                  <p className="text-[22px] font-black text-emerald-400">
                    +{task.courierSalary || 0} ₴
                  </p>

                  <p className="mt-1 text-[11px] text-[#77818e]">
                    Виконано {formatTaskTime(task.completedAt)}
                  </p>
                </div>
              </div>
            </article>
          ))}

        </div>
      )}
    </div>
  </>
)}
                </section>

               <aside className="flex min-h-0 flex-col rounded-[20px] border border-white/[0.08] bg-[linear-gradient(145deg,#0a1117,#071017)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.30)]">
  <div className="flex items-center justify-between gap-3">
    <div>
      <p className="text-[12px] font-bold uppercase tracking-[1.4px] text-[#ff6500]">
        Сьогодні
      </p>

      <h2 className="mt-1 text-[25px] font-black">
        Лента подій
      </h2>
    </div>

    <span className="flex h-8 min-w-8 items-center justify-center rounded-[9px] border border-[#ff6500] px-2 text-[13px] font-bold text-[#ff6500]">
      {courierFeed.length}
    </span>
  </div>

  {courierFeed.length === 0 ? (
    <div className="mt-4 flex flex-1 items-center justify-center rounded-[17px] border border-white/[0.05] bg-[#081017] p-5 text-center">
      <div>
        <p className="text-[22px] font-black">
          Подій ще немає
        </p>

        <p className="mt-3 text-[15px] leading-6 text-[#929ba8]">
          Виклики та дії кур'єрів
          автоматично з'являться тут.
        </p>
      </div>
    </div>
  ) : (
    <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
      {courierFeed.map((event) => {
        const time = new Date(event.time).toLocaleTimeString(
          "uk-UA",
          {
            hour: "2-digit",
            minute: "2-digit",
          },
        );

        const text =
          event.type === "called"
            ? `${event.point} викликала кур'єра`
            : event.type === "accepted"
            ? `${event.courierName} прийняв замовлення`
            : event.type === "handed"
            ? "Замовлення передано кур'єру"
            : `${event.courierName} передав клієнту`;

        return (
          <article
            key={event.id}
            className="rounded-[15px] border border-white/[0.07] bg-[#081017] p-4"
          >
            <div className="flex items-start gap-3">
              <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#ff6500]" />

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[17px] font-bold">
                    №{event.orderNumber}
                  </p>

                  <span className="text-[12px] text-[#9098a4]">
                    {time}
                  </span>
                </div>

                <p className="mt-2 text-[15px]">
                  {text}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  )}
</aside>
              </div>

              <footer className="flex shrink-0 flex-col items-center justify-between gap-3 rounded-[15px] border border-white/[0.08] bg-[#081017] px-5 py-2 text-[13px] sm:flex-row">
                <div className="flex items-center gap-3 text-emerald-400">
                  <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_13px_rgba(52,211,153,0.8)]" />
                  <span className="font-semibold">З&apos;єднання активне</span>
                </div>
                <p className="text-[#afb5be]">
                  Система працює • Нові замовлення надходять автоматично
                </p>
                <span className="text-emerald-400">
                  <WifiIcon size={25} />
                </span>
              </footer>
            </section>
          </div>
        </div>
        <nav className="fixed inset-x-0 bottom-0 z-[90] border-t border-white/[0.10] bg-[#071017]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
  <div className="mx-auto grid h-[72px] max-w-[620px] grid-cols-4">
    <button
      type="button"
      onClick={() => setActiveSection("home")}
      className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
        activeSection === "home" ? "text-[#ff6500]" : "text-[#9ca4ae]"
      }`}
    >
      <HomeIcon size={23} />
      Головна
    </button>

    <button
      type="button"
      onClick={() => setActiveSection("newOrders")}
      className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
        activeSection === "newOrders" ? "text-[#ff6500]" : "text-[#9ca4ae]"
      }`}
    >
      <ScooterIcon size={25} />

      {newOrders.length + simpleTasks.length > 0 && (
        <span className="absolute right-[20%] top-[8px] flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff5a00] px-1 text-[10px] font-black text-white">
          {newOrders.length + simpleTasks.length}
        </span>
      )}

      Нові
    </button>

    <button
      type="button"
      onClick={() => setActiveSection("myOrders")}
      className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
        activeSection === "myOrders" ? "text-[#ff6500]" : "text-[#9ca4ae]"
      }`}
    >
      <ClipboardIcon size={23} />

      {myOrders.length + mySimpleTasks.length > 0 && (
        <span className="absolute right-[20%] top-[8px] flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff5a00] px-1 text-[10px] font-black text-white">
          {myOrders.length + mySimpleTasks.length}
        </span>
      )}

      Моє
    </button>

    <button
      type="button"
      onClick={() => setActiveSection("archive")}
      className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
        activeSection === "archive" ? "text-[#ff6500]" : "text-[#9ca4ae]"
      }`}
    >
      <ArchiveIcon size={23} />
      Архів
    </button>
  </div>
</nav>
        {isSupportModalOpen && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75">
    <div className="rounded-[20px] border border-white/10 bg-[#0a1016] p-6 text-white">
      <p className="text-[24px] font-black">
        Оберіть точку
      </p>

      <button
        type="button"
        onClick={() => setIsSupportModalOpen(false)}
        className="mt-5 rounded-[12px] border border-[#ff6500] px-5 py-3 text-[#ff6500]"
      >
        Закрити
      </button>
    </div>
  </div>
)}
      </main>
    );
  }

  return (
    <main className="courier-page bg-[#020304] text-white">
      <section className="relative min-h-[100dvh] w-full bg-[#020304]">

        <div className="courier-content mx-auto flex w-full max-w-[620px] flex-col items-center px-4">
          <div className="tema-ring relative flex shrink-0 items-center justify-center rounded-full border-[3px] border-[#ff7100] bg-[#030405] shadow-[0_0_22px_rgba(255,113,0,1),0_0_70px_rgba(255,78,0,0.48),inset_0_0_22px_rgba(255,106,0,0.08)]">
            <div className="tema-logo-wrap">
              <Logo />
            </div>
          </div>

          <div className="title-block text-center">
            <h1 className="courier-title font-black leading-tight">
              Кур&apos;єрська служба
            </h1>
            <p className="courier-subtitle font-medium text-[#a4a8b0]">
              Швидко. Надійно.{" "}
              <span className="text-[#ff6a00]">Вчасно.</span>
            </p>
          </div>

          <section className="person-card w-full rounded-[26px] border border-white/[0.14] bg-[linear-gradient(180deg,rgba(16,19,25,0.98),rgba(8,10,14,0.98))] shadow-[0_28px_90px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.025)]">
            <div className="section-heading flex items-center gap-3 text-[#ff6a00]">
              <UserOutlineIcon size={28} />
              <p className="font-medium text-white">Оберіть себе</p>
            </div>

            <div className="person-list">
              <button
                type="button"
                onClick={openCourierModal}
                className={`person-button flex w-full items-center justify-between rounded-[20px] border px-5 text-left transition ${
                  selectedCourier
                    ? "border-[#ff6500] bg-[#ff6500]/10 shadow-[0_0_22px_rgba(255,101,0,0.15)]"
                    : "border-white/[0.12] bg-[#0c1016]"
                }`}
              >
                {selectedCourier ? (
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="avatar flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8a00] to-[#ff4b00] text-white shadow-[0_0_18px_rgba(255,96,0,0.35)]">
                      <UserFillIcon size={34} />
                    </span>

                    <div className="min-w-0">
                      <p className="person-name truncate font-extrabold">
                        {selectedCourier.surname} {selectedCourier.name}
                      </p>
                      <p className="person-phone text-[#9ca2ab]">
                        {selectedCourier.phone}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="person-placeholder text-[#747b86]">
                    не вибрано
                  </span>
                )}

                <ChevronDownIcon />
              </button>
            </div>
          </section>

          <section className="role-card w-full rounded-[26px] border border-white/[0.14] bg-[linear-gradient(180deg,rgba(16,19,25,0.98),rgba(8,10,14,0.98))] shadow-[0_28px_90px_rgba(0,0,0,0.52),inset_0_1px_0_rgba(255,255,255,0.025)]">
            <div className="section-heading flex items-center gap-3 text-[#ff6a00]">
              <BriefcaseIcon size={28} />
              <p className="font-medium text-white">Оберіть посаду</p>
            </div>

            <div className="role-grid grid grid-cols-2 gap-4">
              {(["Кур'єр", "Водій-кур'єр"] as CourierRole[]).map(
                (role) => {
                  const isSelected = selectedRole === role;

                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`role-button relative rounded-[22px] border px-3 transition ${
                        isSelected
                          ? "border-[2px] border-[#ff6500] bg-[radial-gradient(circle_at_center,rgba(255,98,0,0.24),rgba(255,98,0,0.07)_72%)] text-[#ff7b19] shadow-[0_0_18px_rgba(255,101,0,0.55),inset_0_0_28px_rgba(255,101,0,0.10)]"
                          : "border-white/[0.12] bg-[#0c1016] text-[#d0d3d9]"
                      }`}
                    >
                      {isSelected && (
                        <span className="check-badge absolute right-3 top-3 flex items-center justify-center rounded-full bg-white font-black text-[#ff6500]">
                          ✓
                        </span>
                      )}

                      <div className="flex h-full flex-col items-center justify-center">
  <div className="flex h-[74px] items-center justify-center">
    {role === "Кур'єр" ? (
      <ScooterIcon size={72} />
    ) : (
      <CarSideIcon size={82} />
    )}
  </div>

  <span className="role-title mt-3 font-medium text-center leading-none">
    {role}
  </span>
</div>
                    </button>
                  );
                },
              )}
            </div>
          </section>

          <button
            type="button"
            onClick={handleStartShift}
            className="start-button flex w-full items-center justify-center gap-5 rounded-[20px] bg-gradient-to-r from-[#ff4b00] via-[#ff6500] to-[#ff3d18] font-black shadow-[0_14px_36px_rgba(255,80,0,0.34),0_8px_26px_rgba(255,80,0,0.24)] transition hover:brightness-110 active:scale-[0.99]"
          >
            ПОЧАТИ ЗМІНУ
            <ArrowRightIcon size={34} />
          </button>

          <section className="shift-card w-full rounded-[22px] border border-white/[0.10] bg-[#090c11] px-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <span className="users-badge flex shrink-0 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.025] text-[#b8bdc5]">
                  <UsersIcon size={38} />
                </span>

                <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_13px_rgba(52,211,153,0.8)]" />

                <div className="min-w-0">
                  <p className="shift-label text-[#b9bec6]">
                    Зараз на зміні:
                  </p>
                  <p className="shift-value truncate font-medium text-emerald-400">
                    {activeSessions.length === 0
                      ? "немає кур’єрів"
                      : `${activeSessions.length} на зміні`}
                  </p>
                </div>
              </div>

              <ChevronRightIcon size={34} />
            </div>
          </section>

          <div className="benefits-grid grid w-full grid-cols-3 overflow-hidden rounded-[22px] border border-white/[0.10] bg-[#090c11]">
            <Benefit icon={<BoltIcon size={38} />} title="Швидка доставка" />
            <Benefit icon={<ShieldIcon size={38} />} title="Надійний сервіс" />
            <Benefit icon={<LikeIcon size={38} />} title="Довіра клієнтів" />
          </div>
        </div>
      </section>

      {isCourierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-[3px]">
          <div className="w-full max-w-[430px] rounded-[24px] border border-white/[0.12] bg-[#0b0e13] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.75)]">
            <div className="text-center">
              <p className="text-[12px] font-semibold uppercase tracking-[1.5px] text-[#ff6a00]">
                Кур&apos;єрська служба
              </p>
              <h2 className="mt-2 text-[24px] font-black">
                Оберіть себе
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              {couriers.map((courier) => {
                const isPending =
                  pendingCourierId === String(courier.id);

                return (
                  <button
                    key={courier.id}
                    type="button"
                    onClick={() =>
                      setPendingCourierId(String(courier.id))
                    }
                    className={`flex w-full items-center justify-between rounded-[16px] border px-4 py-3 text-left transition ${
                      isPending
                        ? "border-[#ff6500] bg-[#ff6500]/10 shadow-[0_0_18px_rgba(255,101,0,0.18)]"
                        : "border-white/[0.09] bg-white/[0.025]"
                    }`}
                  >
                    <div>
                      <p className="text-[16px] font-extrabold">
                        {courier.surname} {courier.name}
                      </p>
                      <p className="mt-1 text-[13px] text-[#8f98a5]">
                        {courier.phone}
                      </p>
                    </div>

                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                        isPending
                          ? "border-[#ff6500] bg-[#ff6500] text-white"
                          : "border-white/20 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={cancelCourierSelection}
                className="h-[52px] rounded-[14px] border border-white/[0.10] bg-white/[0.03] text-[14px] font-bold text-[#c3c9d1]"
              >
                Скасувати
              </button>

              <button
                type="button"
                onClick={confirmCourierSelection}
                disabled={!pendingCourierId}
                className="h-[52px] rounded-[14px] bg-gradient-to-r from-[#ff4b00] via-[#ff6500] to-[#ff3d18] text-[14px] font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Підтвердити
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        .courier-page {
          min-height: 100dvh;
          overflow-x: hidden;
          overflow-y: auto;
          background: #020304;
        }

        .courier-content {
          min-height: 100dvh;
          max-width: 620px;
          padding-top: 24px;
          padding-bottom: 18px;
          gap: 14px;
        }

        .tema-ring {
          width: 230px;
          height: 230px;
          border-width: 4px;
          border-color: #ff7300;
          box-shadow:
            0 0 18px rgba(255, 115, 0, 0.98),
            0 0 44px rgba(255, 115, 0, 0.82),
            0 0 96px rgba(255, 115, 0, 0.42),
            inset 0 0 20px rgba(255, 115, 0, 0.1);
        }

        .tema-logo-wrap {
          width: 170px;
        }

        .tema-logo-wrap svg {
          display: block;
          width: 100%;
          height: auto;
        }

        .courier-title {
          font-size: 38px;
          font-weight: 900;
        }

        .courier-subtitle {
          margin-top: 7px;
          font-size: 18px;
        }

        .person-card,
        .role-card {
          padding: 20px;
          border-radius: 28px;
        }

        .section-heading p {
          font-size: 20px;
        }

        .person-list,
        .role-grid {
          margin-top: 16px;
        }

        .person-button {
          min-height: 98px;
          border-radius: 20px;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.035),
            inset 0 -12px 24px rgba(0, 0, 0, 0.28);
        }

        .avatar {
          width: 62px;
          height: 62px;
        }

        .person-name {
          font-size: 22px;
        }

        .person-phone {
          margin-top: 4px;
          font-size: 17px;
        }

        .person-placeholder {
          font-size: 22px;
          font-weight: 500;
        }

        .role-button {
          min-height: 154px;
          border-radius: 24px;
        }

        .role-button svg {
          transition: transform 0.25s ease;
        }

        .role-button:hover svg {
          transform: scale(1.03);
        }

        .check-badge {
          width: 34px;
          height: 34px;
          font-size: 18px;
        }

        .role-title {
          font-size: 22px;
        }

        .start-button {
          min-height: 82px;
          border-radius: 22px;
          font-size: 28px;
          box-shadow:
            0 0 28px rgba(255, 90, 0, 0.42),
            0 18px 42px rgba(255, 90, 0, 0.3);
        }

        .shift-card {
          padding: 18px 20px;
          border-radius: 22px;
        }

        .users-badge {
          width: 64px;
          height: 64px;
        }

        .shift-label {
          font-size: 18px;
        }

        .shift-value {
          margin-top: 4px;
          font-size: 20px;
        }

        .benefits-grid {
          border-radius: 22px;
        }

        .benefits-grid > div {
          min-height: 100px;
        }

        @media (min-width: 768px) and (max-height: 930px) {
          .courier-page {
            overflow-y: hidden;
          }

          .courier-content {
            height: 100dvh;
            min-height: 0;
            padding-top: 16px;
            padding-bottom: 8px;
            gap: 9px;
          }

          .tema-ring {
            width: 172px;
            height: 172px;
          }

          .tema-logo-wrap {
            width: 126px;
          }

          .courier-title {
            font-size: 31px;
          }

          .courier-subtitle {
            margin-top: 4px;
            font-size: 15px;
          }

          .person-card,
          .role-card {
            padding: 14px;
            border-radius: 22px;
          }

          .section-heading p {
            font-size: 16px;
          }

          .person-list,
          .role-grid {
            margin-top: 10px;
          }

          .person-button {
            min-height: 72px;
            border-radius: 17px;
            padding-left: 14px;
            padding-right: 14px;
          }

          .avatar {
            width: 48px;
            height: 48px;
          }

          .person-name {
            font-size: 18px;
          }

          .person-phone {
            margin-top: 2px;
            font-size: 13px;
          }

          .person-placeholder {
            font-size: 17px;
          }

          .role-grid {
            gap: 12px;
          }

          .role-button {
            min-height: 104px;
            border-radius: 18px;
          }

          .role-button svg {
            transform: scale(0.82);
          }

          .check-badge {
            width: 27px;
            height: 27px;
            font-size: 14px;
          }

          .role-title {
            margin-top: -2px;
            font-size: 17px;
          }

          .start-button {
            min-height: 62px;
            border-radius: 17px;
            font-size: 21px;
          }

          .shift-card {
            padding: 10px 14px;
            border-radius: 18px;
          }

          .users-badge {
            width: 46px;
            height: 46px;
          }

          .users-badge svg {
            transform: scale(0.8);
          }

          .shift-label {
            font-size: 14px;
          }

          .shift-value {
            margin-top: 1px;
            font-size: 15px;
          }

          .benefits-grid {
            border-radius: 18px;
          }

          .benefits-grid > div {
            min-height: 66px;
            gap: 8px;
            padding-left: 8px;
            padding-right: 8px;
          }

          .benefits-grid svg {
            transform: scale(0.76);
          }

          .benefits-grid span:last-child {
            font-size: 12px;
            line-height: 15px;
          }
        }

        @media (max-width: 640px) {
          .courier-content {
            padding-top: 28px;
          }

          .tema-ring {
            width: 205px;
            height: 205px;
          }

          .tema-logo-wrap {
            width: 150px;
          }

          .courier-title {
            font-size: 32px;
          }

          .person-name {
            font-size: 18px;
          }

          .person-phone {
            font-size: 14px;
          }

          .person-placeholder {
            font-size: 18px;
          }

          .role-button {
            min-height: 132px;
          }

          .role-title {
            font-size: 18px;
          }

          .start-button {
            min-height: 72px;
            font-size: 22px;
          }

          .benefits-grid > div {
            min-height: 84px;
          }
        }
      `}</style>
    </main>
  );
}

function Benefit({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center justify-center gap-3 border-r border-white/[0.08] px-3 last:border-r-0">
      <span className="shrink-0 text-[#ff6a00]">{icon}</span>
      <span className="text-[16px] font-medium leading-5 text-[#c5cad1]">
        {title}
      </span>
    </div>
  );
}



function CourierNavButton({
  icon,
  label,
  active = false,
  badge,
  orangeIcon = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  orangeIcon?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[48px] w-full items-center justify-between rounded-[12px] px-4 text-left text-[14px] font-semibold transition ${
        active
          ? "bg-[linear-gradient(90deg,#ff5a00,#ff6f00)] text-white shadow-[0_10px_26px_rgba(255,90,0,0.20)]"
          : "text-[#a5adb8] hover:bg-white/[0.045] hover:text-white"
      }`}
    >
      <span className="flex items-center gap-3">
        <span className={orangeIcon ? "text-[#ff7519]" : "text-current"}>
          {icon}
        </span>
        {label}
      </span>

      {badge && (
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ff6500]/15 px-1.5 text-[11px] font-black text-[#ff7519]">
          {badge}
        </span>
      )}
    </button>
  );
}

function CourierMetric({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-[14px] border border-white/[0.07] bg-black/15 px-3 py-3 text-center">
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#ff6500]/[0.07] text-[#ff7519]">
        {icon}
      </div>
      <p className="mt-2 text-[17px] font-black">{value}</p>
      <p className="mt-1 text-[10px] leading-4 text-[#858e99]">{label}</p>
    </div>
  );
}

function HomeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-7h6v7" />
    </svg>
  );
}
function BellOutlineIcon({ size = 22 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M10 21h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function ClipboardIcon({ size = 22 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M9 4V2h6v2M9 10h6M9 14h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function ArchiveIcon({ size = 22 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 7h16v13H4z" stroke="currentColor" strokeWidth="1.8"/><path d="M3 4h18v3H3zM9 11h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function WalletOutlineIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6.5h13.5A2.5 2.5 0 0 1 20 9v9a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7.5A3.5 3.5 0 0 1 5.5 4H17" />
      <path d="M20 11h-5a2 2 0 0 0 0 4h5" />
      <circle cx="15" cy="13" r=".7" fill="currentColor" stroke="none" />
    </svg>
  );
}
function SettingsIcon({ size = 22 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round"/></svg>;
}
function HeadsetIcon({ size = 28 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 13v-1a7 7 0 0 1 14 0v1" stroke="currentColor" strokeWidth="1.8"/><path d="M5 13H3v5h3M19 13h2v5h-3M18 18c0 2-2 3-5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="11.5" cy="21" r="1" fill="currentColor"/></svg>;
}
function PowerIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 3v9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/><path d="M7.1 5.8a8 8 0 1 0 9.8 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>;
}
function ClockSmallIcon({ size = 21 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function CheckCircleIcon({ size = 21 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="m8 12 2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function StopwatchIcon({ size = 21 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M9 2h6M12 5v2M17.5 7.5 19 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function RefreshSmallIcon({ size = 17 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M20 7v5h-5M4 17v-5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M6.1 9a7 7 0 0 1 11.4-2L20 9M4 15l2.5 2a7 7 0 0 0 11.4-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}


function ProfileMetric({
  icon,
  label,
  value,
  note,
  orange = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  orange?: boolean;
}) {
  return (
    <div className="flex flex-col justify-center px-5">
      <div className="flex items-center gap-3 text-[#d5d8dd]">
        <span className={orange ? "text-[#ff6500]" : "text-white"}>{icon}</span>
        <span className="text-[14px] text-[#c2c6cc]">{label}</span>
      </div>
      <p className="mt-4 text-[34px] font-black leading-none">{value}</p>
      <p className="mt-3 text-[13px] text-[#a0a7b0]">{note}</p>
    </div>
  );
}

function CourierAvatarIcon({ size = 116 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <path d="M38 40c0-14 10-24 22-24s22 10 22 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M42 33c5-5 31-5 36 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M47 26c4-6 22-6 26 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M42 43c1 17 7 27 18 27s17-10 18-27" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M45 48c4 3 26 3 30 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M52 70v9l8 8 8-8v-9" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M28 105c2-17 8-27 24-31l8 13 8-13c16 4 22 14 24 31" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M38 82v23M82 82v23M48 93h8M64 93h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function PhoneOutlineIcon({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 4h4l2 5-2.5 1.5a15 15 0 0 0 5 5L15 13l5 2v4c0 1-1 2-2 2C10 21 3 14 3 6c0-1 1-2 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function CalendarOutlineIcon({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 3v4M16 3v4M3 10h18M8 14h3M13 14h3M8 18h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function TrophyIcon({ size = 25 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" stroke="currentColor" strokeWidth="1.8"/><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 13v4M9 21h6M10 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function MapPinIcon({ size = 25 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>;
}
function MoneyIcon({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M6 9h.01M18 15h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>;
}
function WifiIcon({ size = 25 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 9a14 14 0 0 1 18 0M6 12a9 9 0 0 1 12 0M9 15a4.5 4.5 0 0 1 6 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/><circle cx="12" cy="19" r="1.2" fill="currentColor"/></svg>;
}

function UserOutlineIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5.5 20c.5-4.2 2.8-6.3 6.5-6.3s6 2.1 6.5 6.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function UserFillIcon({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.6" fill="currentColor" />
      <path d="M5.3 20c.5-4.3 2.8-6.4 6.7-6.4s6.2 2.1 6.7 6.4H5.3Z" fill="currentColor" />
    </svg>
  );
}

function BriefcaseIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="7" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="27" height="27" viewBox="0 0 24 24" fill="none" className="text-[#ff6a00]">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-[#b7bcc4]">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 12h15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m14 7 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UsersIcon({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16.5" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.8 19c.4-3.7 2.1-5.5 5.2-5.5s4.8 1.8 5.2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14.2 14c2.8.1 4.4 1.7 4.8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ScooterIcon({ size = 72 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 72"
      fill="none"
    >
      {/* кофр */}
      <rect
        x="8"
        y="22"
        width="22"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="3.6"
      />

      {/* крепление */}
      <path
        d="M30 37H41"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
      />

      {/* дека */}
      <path
        d="M40 37H58"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
      />

      {/* стойка */}
      <path
        d="M56 37L51 18"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
      />

      {/* руль */}
      <path
        d="M49 18H60"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
      />

      {/* передняя вилка */}
      <path
        d="M56 37L67 47"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
      />

      {/* задняя вилка */}
      <path
        d="M40 37L29 47"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
      />

      {/* заднее колесо */}
      <circle
        cx="25"
        cy="53"
        r="10"
        stroke="currentColor"
        strokeWidth="3.6"
      />

      {/* переднее колесо */}
      <circle
        cx="71"
        cy="53"
        r="10"
        stroke="currentColor"
        strokeWidth="3.6"
      />

      {/* ступицы */}
      <circle cx="25" cy="53" r="3.2" fill="currentColor" />
      <circle cx="71" cy="53" r="3.2" fill="currentColor" />
    </svg>
  );
}

function CarSideIcon({ size = 82 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.58}
      viewBox="0 0 112 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 42L17 40L29 24C31 21 35 19 40 19H69C74 19 78 21 82 25L94 38L103 41C106 42 108 45 108 49V52H4V48C4 45 5 43 8 42Z"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      <path
        d="M35 23L29 38H53V23H35Z"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path
        d="M58 23V38H87L76 25C74 23 71 23 68 23H58Z"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path d="M54 23V42" stroke="currentColor" strokeWidth="3" />
      <path d="M79 38V42" stroke="currentColor" strokeWidth="3" />
      <path
        d="M44 34H49"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M68 34H73"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M4 47H12"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M100 46H108"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle
        cx="27"
        cy="51"
        r="10"
        fill="#0c1016"
        stroke="currentColor"
        strokeWidth="3.4"
      />
      <circle
        cx="87"
        cy="51"
        r="10"
        fill="#0c1016"
        stroke="currentColor"
        strokeWidth="3.4"
      />
      <circle cx="27" cy="51" r="3" fill="currentColor" />
      <circle cx="87" cy="51" r="3" fill="currentColor" />
    </svg>
  );
}

function BoltIcon({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M13 2 5 13h6l-1 9 8-12h-6l1-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3 19 6v5c0 4.7-2.5 7.8-7 10-4.5-2.2-7-5.3-7-10V6l7-3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LikeIcon({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M8 10v10H4V10h4Zm2 10V9l4-6c1.2.4 2 1.5 2 2.8V9h3.5c1.4 0 2.4 1.3 2 2.6l-2 6.6A2.5 2.5 0 0 1 17.1 20H10Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}