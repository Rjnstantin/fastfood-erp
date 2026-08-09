export type OrderType = "pickup" | "delivery";

export type PaymentType = "cash" | "card";

export type OrderStatus =
  | "new"
  | "cooking"
  | "ready"
  | "waitingCourier"
  | "courierAccepted"
  | "courierArrived"
  | "handedToCourier"
  | "taxi"
  | "delivered"
  | "cancelled";

export type CourierTaskType =
  | "delivery"
  | "transfer"
  | "purchase";

export type CourierTaskStatus =
  | "waiting"
  | "accepted"
  | "arrived"
  | "received"
  | "completed"
  | "cancelled"
  | "taxi";

export type CourierArrivalType =
  | "now"
  | "15min"
  | "20min"
  | "25min"
  | "specificTime";

export type DeliveryPriceMode =
  | "free"
  | "fixed50"
  | "fixed90"
  | "custom";

export type TaxiReason =
  | "noCouriers"
  | "couriersBusy"
  | "courierNotAccepted"
  | "manual";

export type OrderItemAddon = {
  id: string;
  name: string;
  price: number;
};

export type OrderItem = {
  id: string;
  productId: string;
  name: string;
  receiptName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;

  description?: string;
  addons: OrderItemAddon[];
  removedIngredients: string[];
  comment: string;

  sauce?: string | null;
  potato?: string | null;
  sausage?: string | null;
};

export type DeliveryAddress = {
  street: string;
  house: string;
  apartment: string;
  entrance: string;
  location: string;
};

export type DeliveryCustomer = {
  name: string;
  phone: string;
  comment: string;
};

export type DeliveryPayment = {
  type: PaymentType;
  needsChange: boolean | null;
  changeFrom: number | null;
};

export type DeliveryPricing = {
  /**
   * Сумма товаров без доставки.
   */
  productsTotal: number;

  /**
   * Стоимость доставки для клиента.
   * Может быть 0 при бесплатной доставке.
   */
  customerDeliveryPrice: number;

  /**
   * Заработок собственного курьера.
   * Бесплатная доставка от 400 грн всё равно даёт курьеру 50 грн.
   */
  courierSalary: number;

  /**
   * Фактический расход точки на такси.
   */
  taxiCost: number;

  /**
   * Как была определена стоимость доставки.
   */
  priceMode: DeliveryPriceMode;

  /**
   * Автоматически ли доставка стала бесплатной.
   */
  isFreeDelivery: boolean;

  /**
   * Сотрудник вручную добавил платную доставку,
   * несмотря на сумму заказа от 400 грн.
   */
  freeDeliveryOverridden: boolean;
};

export type CourierInfo = {
  courierId: number;
  sessionId: string;
  name: string;
  phone: string;
  role: "Кур'єр" | "Водій-кур'єр";
};

export type TaxiInfo = {
  calledAt: string;
  cost: number;
  reason: TaxiReason;
};

export type CourierCall = {
  taskId: string;
  type: CourierTaskType;
  status: CourierTaskStatus;

  requestedAt: string;
  requestedBy: string;
  requestedFromPoint: string;

  arrivalType: CourierArrivalType;
  requestedForTime: string | null;

  acceptedAt: string | null;
  arrivedAt: string | null;
  handedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;

  courier: CourierInfo | null;
  taxi: TaxiInfo | null;
};

export type OrderHistoryAction =
  | "created"
  | "startedCooking"
  | "ready"
  | "courierCalled"
  | "courierCallCancelled"
  | "courierAccepted"
  | "courierArrived"
  | "handedToCourier"
  | "taxiCalled"
  | "delivered"
  | "cancelled"
  | "deliveryPriceChanged";

export type OrderHistoryEntry = {
  id: string;
  action: OrderHistoryAction;
  createdAt: string;

  employeeName?: string;
  courierName?: string;

  previousStatus?: OrderStatus;
  nextStatus?: OrderStatus;

  comment?: string;
};

export type Order = {
  id: string;

  /**
   * Номер, который видит сотрудник и курьер.
   * Например: "009".
   */
  orderNumber: string;

  point: string;
  type: OrderType;
  status: OrderStatus;

  createdAt: string;
  updatedAt: string;
  completedAt: string | null;

  createdBy: string;

  items: OrderItem[];

  /**
   * Стоимость товаров без доставки.
   */
  subtotal: number;

  /**
   * Полная сумма заказа с учётом платной доставки.
   */
  total: number;

  paymentType: PaymentType;

  delivery: {
    customer: DeliveryCustomer;
    address: DeliveryAddress;
    payment: DeliveryPayment;
    pricing: DeliveryPricing;
    courierCall: CourierCall | null;
  } | null;

  history: OrderHistoryEntry[];
};

export type CreateOrderInput = {
  orderNumber: string;
  point: string;
  type: OrderType;
  createdBy: string;

  items: OrderItem[];

  subtotal: number;
  total: number;

  paymentType: PaymentType;

  delivery?: {
    customer: DeliveryCustomer;
    address: DeliveryAddress;
    payment: DeliveryPayment;
    pricing: DeliveryPricing;
  } | null;
};

export type CourierTaskPreview = {
  taskId: string;
  orderId: string;
  orderNumber: string;
  point: string;

  type: CourierTaskType;
  status: CourierTaskStatus;

  requestedAt: string;
  requestedForTime: string | null;
  arrivalType: CourierArrivalType;

  customerName: string;
  customerPhone: string;

  address: string;
  paymentType: PaymentType;
  total: number;
  comment: string;
};