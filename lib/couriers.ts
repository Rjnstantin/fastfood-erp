export type CourierStatus =
  | "offline"
  | "free"
  | "busy";

export interface CourierSession {
  courierId: number;
  fullName: string;
  phone: string;

  status: CourierStatus;

  currentOrderId: string | null;

  shiftStartedAt: string;
}

const STORAGE_KEY = "tema-couriers";

function isBrowser() {
  return typeof window !== "undefined";
}

function save(data: CourierSession[]) {
  if (!isBrowser()) return;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data),
  );
}

export function getCourierSessions(): CourierSession[] {
  if (!isBrowser()) return [];

  const value = localStorage.getItem(STORAGE_KEY);

  if (!value) return [];

  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

export function getCourierCount() {
  return getCourierSessions().filter(
    (x) => x.status !== "offline",
  ).length;
}

export function getFreeCourierCount() {
  return getCourierSessions().filter(
    (x) => x.status === "free",
  ).length;
}

export function courierLogin(
  courierId: number,
  fullName: string,
  phone: string,
) {
  const list = getCourierSessions();

  const index = list.findIndex(
    (x) => x.courierId === courierId,
  );

  const courier: CourierSession = {
    courierId,
    fullName,
    phone,

    status: "free",

    currentOrderId: null,

    shiftStartedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    list[index] = courier;
  } else {
    list.push(courier);
  }

  save(list);
}

export function courierLogout(
  courierId: number,
) {
  const list = getCourierSessions();

  const courier = list.find(
    (x) => x.courierId === courierId,
  );

  if (!courier) return;

  courier.status = "offline";
  courier.currentOrderId = null;

  save(list);
}

export function courierTakeOrder(
  courierId: number,
  orderId: string,
) {
  const list = getCourierSessions();

  const courier = list.find(
    (x) => x.courierId === courierId,
  );

  if (!courier) return;

  courier.status = "busy";
  courier.currentOrderId = orderId;

  save(list);
}

export function courierFinishOrder(
  courierId: number,
) {
  const list = getCourierSessions();

  const courier = list.find(
    (x) => x.courierId === courierId,
  );

  if (!courier) return;

  courier.status = "free";
  courier.currentOrderId = null;

  save(list);
}