import type {
  CourierArrivalType,
  CourierInfo,
  CourierTaskPreview,
  CreateOrderInput,
  DeliveryPriceMode,
  Order,
  OrderHistoryAction,
  OrderHistoryEntry,
  OrderStatus,
  TaxiReason,
} from "./order";

const ORDERS_STORAGE_KEY = "tema-orders";
const ORDERS_UPDATED_EVENT = "tema-orders-updated";

type OrderListener = (orders: Order[]) => void;

function isBrowser() {
  return typeof window !== "undefined";
}

function createId(prefix: string) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

function parseOrders(value: string | null): Order[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch (error) {
    console.error("Не вдалося прочитати замовлення:", error);
    return [];
  }
}

function saveOrders(orders: Order[]) {
  if (!isBrowser()) return;

  window.localStorage.setItem(
    ORDERS_STORAGE_KEY,
    JSON.stringify(orders),
  );

  window.dispatchEvent(
    new CustomEvent(ORDERS_UPDATED_EVENT, {
      detail: orders,
    }),
  );
}

function createHistoryEntry(
  action: OrderHistoryAction,
  options?: {
    employeeName?: string;
    courierName?: string;
    previousStatus?: OrderStatus;
    nextStatus?: OrderStatus;
    comment?: string;
  },
): OrderHistoryEntry {
  return {
    id: createId("history"),
    action,
    createdAt: new Date().toISOString(),
    ...options,
  };
}

function updateOrderById(
  orderId: string,
  updater: (order: Order) => Order,
) {
  const orders = getOrders();
  let updatedOrder: Order | null = null;

  const updatedOrders = orders.map((order) => {
    if (order.id !== orderId) return order;

    updatedOrder = updater(order);
    return updatedOrder;
  });

  if (!updatedOrder) {
    throw new Error(`Замовлення ${orderId} не знайдено.`);
  }

  saveOrders(updatedOrders);

  return updatedOrder;
}

function buildAddress(order: Order) {
  if (!order.delivery) return "";

  const { street, house, apartment, entrance, location } =
    order.delivery.address;

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

/**
 * Возвращает все заказы.
 */
export function getOrders(): Order[] {
  if (!isBrowser()) return [];

  return parseOrders(
    window.localStorage.getItem(ORDERS_STORAGE_KEY),
  );
}

/**
 * Возвращает один заказ по ID.
 */
export function getOrderById(orderId: string) {
  return getOrders().find((order) => order.id === orderId) ?? null;
}

/**
 * Создает новый заказ.
 */
export function createOrder(input: CreateOrderInput): Order {
  const now = new Date().toISOString();

  const order: Order = {
    id: createId("order"),
    orderNumber: input.orderNumber,
    point: input.point,
    type: input.type,
    status: "new",

    createdAt: now,
    updatedAt: now,
    completedAt: null,

    createdBy: input.createdBy,

    items: input.items,
    subtotal: input.subtotal,
    total: input.total,
    paymentType: input.paymentType,

    delivery:
      input.type === "delivery" && input.delivery
        ? {
            ...input.delivery,
            courierCall: null,
          }
        : null,

    history: [
      createHistoryEntry("created", {
        employeeName: input.createdBy,
        nextStatus: "new",
      }),
    ],
  };

  const orders = getOrders();

  saveOrders([order, ...orders]);

  return order;
}

/**
 * Полностью заменяет заказ.
 */
export function updateOrder(updatedOrder: Order) {
  return updateOrderById(updatedOrder.id, () => ({
    ...updatedOrder,
    updatedAt: new Date().toISOString(),
  }));
}

/**
 * Обновляет статус заказа.
 */
export function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
  options?: {
    employeeName?: string;
    courierName?: string;
    comment?: string;
  },
) {
  return updateOrderById(orderId, (order) => {
    const now = new Date().toISOString();
    const previousStatus = order.status;

    let action: OrderHistoryAction = "startedCooking";

    if (nextStatus === "ready") {
      action = "ready";
    } else if (nextStatus === "courierAccepted") {
      action = "courierAccepted";
    } else if (nextStatus === "courierArrived") {
      action = "courierArrived";
    } else if (nextStatus === "handedToCourier") {
      action = "handedToCourier";
    } else if (nextStatus === "delivered") {
      action = "delivered";
    } else if (nextStatus === "cancelled") {
      action = "cancelled";
    } else if (nextStatus === "taxi") {
      action = "taxiCalled";
    }

    return {
      ...order,
      status: nextStatus,
      updatedAt: now,
      completedAt:
        nextStatus === "delivered" ||
        nextStatus === "cancelled"
          ? now
          : order.completedAt,
      history: [
        ...order.history,
        createHistoryEntry(action, {
          employeeName: options?.employeeName,
          courierName: options?.courierName,
          previousStatus,
          nextStatus,
          comment: options?.comment,
        }),
      ],
    };
  });
}

/**
 * Возвращает заказы на доставку.
 */
export function getDeliveryOrders() {
  return getOrders().filter(
    (order) => order.type === "delivery",
  );
}

/**
 * Возвращает активные доставки конкретной точки,
 * которым можно вызвать курьера.
 */
export function getAvailableDeliveryOrders(point?: string) {
  return getOrders().filter((order) => {
    if (order.type !== "delivery") return false;
    if (!order.delivery) return false;
    if (point && order.point !== point) return false;

    return (
      order.status !== "delivered" &&
      order.status !== "cancelled" &&
      order.status !== "taxi" &&
      order.delivery.courierCall === null
    );
  });
}

/**
 * Вызывает курьера для конкретного заказа.
 */
export function callCourierForOrder(options: {
  orderId: string;
  requestedBy: string;
  arrivalType: CourierArrivalType;
  requestedForTime?: string | null;
}) {
  return updateOrderById(options.orderId, (order) => {
    if (order.type !== "delivery" || !order.delivery) {
      throw new Error(
        "Виклик кур’єра доступний лише для доставки.",
      );
    }

    if (order.delivery.courierCall) {
      throw new Error(
        "Для цього замовлення кур’єра вже викликано.",
      );
    }

    const now = new Date().toISOString();

    return {
      ...order,
      status: "waitingCourier",
      updatedAt: now,
      delivery: {
        ...order.delivery,
        courierCall: {
          taskId: createId("courier-task"),
          type: "delivery",
          status: "waiting",

          requestedAt: now,
          requestedBy: options.requestedBy,
          requestedFromPoint: order.point,

          arrivalType: options.arrivalType,
          requestedForTime:
            options.requestedForTime ?? null,

          acceptedAt: null,
          arrivedAt: null,
          handedAt: null,
          completedAt: null,
          cancelledAt: null,

          courier: null,
          taxi: null,
        },
      },
      history: [
        ...order.history,
        createHistoryEntry("courierCalled", {
          employeeName: options.requestedBy,
          previousStatus: order.status,
          nextStatus: "waitingCourier",
          comment: options.requestedForTime
            ? `Кур’єр потрібен на ${options.requestedForTime}`
            : `Тип виклику: ${options.arrivalType}`,
        }),
      ],
    };
  });
}

/**
 * Отменяет вызов курьера.
 * После этого заказ снова можно отправить курьерам.
 */
export function cancelCourierCall(
  orderId: string,
  employeeName: string,
) {
  return updateOrderById(orderId, (order) => {
    if (!order.delivery?.courierCall) {
      throw new Error(
        "Для цього замовлення немає активного виклику.",
      );
    }

    const now = new Date().toISOString();

    return {
      ...order,
      status: "ready",
      updatedAt: now,
      delivery: {
        ...order.delivery,
        courierCall: null,
      },
      history: [
        ...order.history,
        createHistoryEntry("courierCallCancelled", {
          employeeName,
          previousStatus: order.status,
          nextStatus: "ready",
        }),
      ],
    };
  });
}

/**
 * Возвращает задачи, доступные всем курьерам.
 */
export function getCourierOrders(): CourierTaskPreview[] {
  return getOrders()
    .filter((order) => {
      const call = order.delivery?.courierCall;

      return (
        order.type === "delivery" &&
        order.delivery !== null &&
        call != null &&
        call.status === "waiting" &&
        call.courier === null
      );
    })
    .map((order) => {
      const delivery = order.delivery!;
      const call = delivery.courierCall!;

      return {
        taskId: call.taskId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        point: order.point,

        type: call.type,
        status: call.status,

        requestedAt: call.requestedAt,
        requestedForTime: call.requestedForTime,
        arrivalType: call.arrivalType,

        customerName: delivery.customer.name,
        customerPhone: delivery.customer.phone,

        address: buildAddress(order),
        paymentType: order.paymentType,
        total: order.total,
        comment: delivery.customer.comment,
      };
    });
}

/**
 * Первый курьер принимает заказ.
 */
export function acceptCourierOrder(
  orderId: string,
  courier: CourierInfo,
) {
  return updateOrderById(orderId, (order) => {
    const call = order.delivery?.courierCall;

    if (!order.delivery || !call) {
      throw new Error("Виклик кур’єра не знайдено.");
    }

    if (call.status !== "waiting" || call.courier) {
      throw new Error(
        "Це замовлення вже прийняв інший кур’єр.",
      );
    }

    const now = new Date().toISOString();

    return {
      ...order,
      status: "courierAccepted",
      updatedAt: now,
      delivery: {
        ...order.delivery,
        courierCall: {
          ...call,
          status: "accepted",
          acceptedAt: now,
          courier,
        },
      },
      history: [
        ...order.history,
        createHistoryEntry("courierAccepted", {
          courierName: courier.name,
          previousStatus: order.status,
          nextStatus: "courierAccepted",
        }),
      ],
    };
  });
}

/**
 * Возвращает активные заказы конкретного курьера.
 */
export function getCourierActiveOrders(sessionId: string) {
  return getOrders().filter((order) => {
    const call = order.delivery?.courierCall;

    return (
      call?.courier?.sessionId === sessionId &&
      call.status !== "completed" &&
      call.status !== "cancelled" &&
      call.status !== "taxi"
    );
  });
}

/**
 * Курьер сообщает, что прибыл на точку.
 */
export function markCourierArrived(
  orderId: string,
  sessionId: string,
) {
  return updateOrderById(orderId, (order) => {
    const call = order.delivery?.courierCall;

    if (!order.delivery || !call?.courier) {
      throw new Error("Кур’єр для замовлення не призначений.");
    }

    if (call.courier.sessionId !== sessionId) {
      throw new Error(
        "Це замовлення закріплене за іншим кур’єром.",
      );
    }

    const now = new Date().toISOString();

    return {
      ...order,
      status: "courierArrived",
      updatedAt: now,
      delivery: {
        ...order.delivery,
        courierCall: {
          ...call,
          status: "arrived",
          arrivedAt: now,
        },
      },
      history: [
        ...order.history,
        createHistoryEntry("courierArrived", {
          courierName: call.courier.name,
          previousStatus: order.status,
          nextStatus: "courierArrived",
        }),
      ],
    };
  });
}

/**
 * Сотрудник передал заказ курьеру.
 */
export function handOrderToCourier(
  orderId: string,
  employeeName: string,
) {
  return updateOrderById(orderId, (order) => {
    const call = order.delivery?.courierCall;

    if (!order.delivery || !call?.courier) {
      throw new Error("Кур’єр для замовлення не призначений.");
    }

    const now = new Date().toISOString();

    return {
      ...order,
      status: "handedToCourier",
      updatedAt: now,
      delivery: {
        ...order.delivery,
        courierCall: {
          ...call,
          status: "received",
          handedAt: now,
        },
      },
      history: [
        ...order.history,
        createHistoryEntry("handedToCourier", {
          employeeName,
          courierName: call.courier.name,
          previousStatus: order.status,
          nextStatus: "handedToCourier",
        }),
      ],
    };
  });
}

/**
 * Курьер завершает доставку.
 */
export function completeCourierOrder(
  orderId: string,
  sessionId: string,
) {
  return updateOrderById(orderId, (order) => {
    const call = order.delivery?.courierCall;

    if (!order.delivery || !call?.courier) {
      throw new Error("Кур’єр для замовлення не призначений.");
    }

    if (call.courier.sessionId !== sessionId) {
      throw new Error(
        "Це замовлення закріплене за іншим кур’єром.",
      );
    }

    const now = new Date().toISOString();

    return {
      ...order,
      status: "delivered",
      updatedAt: now,
      completedAt: now,
      delivery: {
        ...order.delivery,
        courierCall: {
          ...call,
          status: "completed",
          completedAt: now,
        },
      },
      history: [
        ...order.history,
        createHistoryEntry("delivered", {
          courierName: call.courier.name,
          previousStatus: order.status,
          nextStatus: "delivered",
        }),
      ],
    };
  });
}

/**
 * Фиксирует вызов такси.
 */
export function callTaxi(options: {
  orderId: string;
  employeeName: string;
  cost?: number;
  reason?: TaxiReason;
}) {
  return updateOrderById(options.orderId, (order) => {
    if (order.type !== "delivery" || !order.delivery) {
      throw new Error(
        "Таксі можна викликати лише для доставки.",
      );
    }

    const now = new Date().toISOString();
    const cost = options.cost ?? 90;

    return {
      ...order,
      status: "taxi",
      updatedAt: now,
      delivery: {
        ...order.delivery,
        pricing: {
          ...order.delivery.pricing,
          courierSalary: 0,
          taxiCost: cost,
        },
        courierCall: {
          taskId:
            order.delivery.courierCall?.taskId ??
            createId("taxi-task"),
          type: "delivery",
          status: "taxi",

          requestedAt:
            order.delivery.courierCall?.requestedAt ?? now,
          requestedBy: options.employeeName,
          requestedFromPoint: order.point,

          arrivalType:
            order.delivery.courierCall?.arrivalType ?? "now",
          requestedForTime:
            order.delivery.courierCall?.requestedForTime ??
            null,

          acceptedAt:
            order.delivery.courierCall?.acceptedAt ?? null,
          arrivedAt:
            order.delivery.courierCall?.arrivedAt ?? null,
          handedAt:
            order.delivery.courierCall?.handedAt ?? null,
          completedAt: null,
          cancelledAt: null,

          courier: null,
          taxi: {
            calledAt: now,
            cost,
            reason: options.reason ?? "manual",
          },
        },
      },
      history: [
        ...order.history,
        createHistoryEntry("taxiCalled", {
          employeeName: options.employeeName,
          previousStatus: order.status,
          nextStatus: "taxi",
          comment: `Витрати точки на таксі: ${cost} ₴`,
        }),
      ],
    };
  });
}

/**
 * Рассчитывает стоимость доставки и зарплату курьера.
 */
export function calculateDeliveryPricing(options: {
  productsTotal: number;
  selectedDeliveryPrice?: number | null;
}) {
  const isAutomaticallyFree = options.productsTotal >= 400;
  const hasManualPrice =
    typeof options.selectedDeliveryPrice === "number" &&
    options.selectedDeliveryPrice > 0;

  const customerDeliveryPrice = hasManualPrice
    ? options.selectedDeliveryPrice!
    : isAutomaticallyFree
      ? 0
      : 50;

  let priceMode: DeliveryPriceMode = "fixed50";

  if (!hasManualPrice && isAutomaticallyFree) {
    priceMode = "free";
  } else if (customerDeliveryPrice === 90) {
    priceMode = "fixed90";
  } else if (customerDeliveryPrice !== 50) {
    priceMode = "custom";
  }

  return {
    productsTotal: options.productsTotal,
    customerDeliveryPrice,
    courierSalary:
      customerDeliveryPrice > 0
        ? customerDeliveryPrice
        : 50,
    taxiCost: 0,
    priceMode,
    isFreeDelivery:
      isAutomaticallyFree && !hasManualPrice,
    freeDeliveryOverridden:
      isAutomaticallyFree && hasManualPrice,
  };
}

/**
 * Доход курьера по выполненным доставкам.
 */
export function getCourierIncome(
  courierId: number,
  fromDate?: Date,
) {
  return getOrders()
    .filter((order) => {
      const call = order.delivery?.courierCall;

      if (
        order.status !== "delivered" ||
        call?.courier?.courierId !== courierId
      ) {
        return false;
      }

      if (!fromDate) return true;

      const completedAt =
        call.completedAt ?? order.completedAt;

      return (
        completedAt !== null &&
        new Date(completedAt) >= fromDate
      );
    })
    .reduce(
      (sum, order) =>
        sum +
        (order.delivery?.pricing.courierSalary ?? 0),
      0,
    );
}

/**
 * Архив заказов.
 */
export function getArchivedOrders(point?: string) {
  return getOrders().filter((order) => {
    if (point && order.point !== point) return false;

    return (
      order.status === "delivered" ||
      order.status === "cancelled" ||
      order.status === "taxi"
    );
  });
}

/**
 * Подписка страниц на обновление заказов.
 */
export function subscribeToOrders(listener: OrderListener) {
  if (!isBrowser()) {
    return () => undefined;
  }

  function handleCustomEvent(event: Event) {
    const customEvent = event as CustomEvent<Order[]>;

    listener(
      Array.isArray(customEvent.detail)
        ? customEvent.detail
        : getOrders(),
    );
  }

  function handleStorage(event: StorageEvent) {
    if (event.key !== ORDERS_STORAGE_KEY) return;

    listener(parseOrders(event.newValue));
  }

  window.addEventListener(
    ORDERS_UPDATED_EVENT,
    handleCustomEvent,
  );
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(
      ORDERS_UPDATED_EVENT,
      handleCustomEvent,
    );
    window.removeEventListener("storage", handleStorage);
  };
}

/**
 * Только для разработки.
 * Удаляет все заказы из localStorage.
 */
export function clearAllOrders() {
  if (!isBrowser()) return;

  window.localStorage.removeItem(ORDERS_STORAGE_KEY);

  window.dispatchEvent(
    new CustomEvent(ORDERS_UPDATED_EVENT, {
      detail: [],
    }),
  );
}