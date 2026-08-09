"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateDeliveryPricing,
  createOrder,
  getOrders,
  subscribeToOrders,
} from "../../lib/orders";
import CourierDialog from "../../components/CourierDialog";

type SauceChoice = "garlic" | "red";
type PotatoChoice = "fries" | "country";
type SausageChoice = "milk" | "smoked";

type Product = {
  id: string;
  name: string;
  receiptName?: string;
  description?: string;
  price: number;
  sectionLabel?: string;
  includesSauce?: boolean;
  requiresGrillOptions?: boolean;
  requiresSausageChoice?: boolean;
};

type ProductGroup = {
  id: string;
  title: string;
  products: Product[];
};

type Category = {
  id: string;
  title: string;
  groups: ProductGroup[];
};

type CartItem = Product & {
  cartId: string;
  quantity: number;
  addons: Product[];
  removed: string[];
  comment: string;
  sauce: SauceChoice | null;
  potato: PotatoChoice | null;
  sausage: SausageChoice | null;
};

const categories: Category[] = [
  {
    id: "shawarma",
    title: "Шавуха",
    groups: [
      {
        id: "shawarma-menu",
        title: "Меню",
        products: [
          {
            id: "shawarma-chicken-combo",
            name: "Шавуха комбо куряча з картоплею фрі та соусом",
            receiptName: "Шавуха комбо куряча",
            price: 130,
            includesSauce: true,
          },
          {
            id: "shawarma-pork-combo",
            name: "Шавуха комбо зі свининою з картоплею фрі та соусом",
            receiptName: "Шавуха комбо зі свининою",
            price: 150,
            includesSauce: true,
          },
          {
            id: "shawarma-grill-combo",
            name: "Шавуха комбо гриль з картоплею фрі та соусом",
            receiptName: "Шавуха комбо гриль",
            price: 120,
            includesSauce: true,
          },
          {
            id: "lulya-lavash-combo",
            name: "Люля-кебаб комбо у лаваші з картоплею фрі та соусом",
            receiptName: "Люля-кебаб комбо у лаваші",
            price: 120,
            includesSauce: true,
          },
          {
            id: "shawarma-chicken",
            name: "Шавуха куряча",
            price: 110,
          },
          {
            id: "shawarma-pork",
            name: "Шавуха зі свининою",
            price: 130,
          },
          {
            id: "shawarma-grill",
            name: "Шавуха гриль",
            price: 100,
          },
          {
            id: "lulya-lavash",
            name: "Люля-кебаб у лаваші",
            price: 100,
          },
        ],
      },
    ],
  },
  {
    id: "burgers",
    title: "Бургери",
    groups: [
      {
        id: "burgers-menu",
        title: "Меню",
        products: [
          {
            id: "cheeseburger-combo",
            name: "Чізбургер комбо з картоплею фрі та соусом",
            receiptName: "Чізбургер комбо",
            price: 130,
            includesSauce: true,
          },
          {
            id: "double-cheeseburger-combo",
            name: "Дабл чізбургер комбо з картоплею фрі та соусом",
            receiptName: "Дабл чізбургер комбо",
            price: 180,
            includesSauce: true,
          },
          {
            id: "cheeseburger",
            name: "Чізбургер",
            price: 110,
          },
          {
            id: "double-cheeseburger",
            name: "Дабл чізбургер",
            price: 150,
          },
        ],
      },
    ],
  },
  {
    id: "chebureki",
    title: "Чебуреки",
    groups: [
      {
        id: "chebureki-menu",
        title: "Меню",
        products: [
          { id: "cheburek-chicken", name: "Чебурек з куркою", price: 35 },
          { id: "cheburek-chicken-cheese", name: "Чебурек з куркою та сиром", price: 50 },
          { id: "cheburek-pork-beef", name: "Чебурек зі свининою та яловичиною", price: 40 },
          { id: "cheburek-pork-beef-cheese", name: "Чебурек зі свининою, яловичиною та сиром", price: 55 },
          {
            id: "cheburek-farmer",
            name: "Чебурек Фермерський",
            description: "Яловичина, помідор, сир, цибуля",
            price: 50,
          },
          { id: "cheburek-three-cheese", name: "Чебурек Три сири", price: 45 },
          {
            id: "cheburek-signature",
            name: "Чебурек Фірмовий",
            description: "Свинина, яловичина, печериці, сир",
            price: 55,
          },
          {
            id: "cheburek-hunter",
            name: "Чебурек Мисливський",
            description: "Ковбаски, сир, помідор, цибуля",
            price: 55,
          },
          {
            id: "cheburek-pizza",
            name: "Чебурек Pizza",
            description: "Шинка, печериці, сир, помідор, маслини",
            price: 55,
          },
        ],
      },
    ],
  },
  {
    id: "hotdogs",
    title: "Хот-доги",
    groups: [
      {
        id: "hotdogs-menu",
        title: "Меню",
        products: [
          {
            id: "signature-hotdog-combo",
            name: "Хот-дог фірмовий комбо з картоплею фрі та соусом",
            receiptName: "Хот-дог фірмовий комбо",
            price: 110,
            includesSauce: true,
          },
          {
            id: "signature-hotdog",
            name: "Хот-дог фірмовий",
            price: 80,
          },
          {
            id: "french-hotdog-smoked",
            name: "Хот-дог по-французьки з копченою сосискою",
            receiptName: "Хот-дог по-французьки",
            description: "Копчена сосиска",
            price: 55,
          },
          {
            id: "french-hotdog-milk",
            name: "Хот-дог по-французьки з молочною сосискою",
            receiptName: "Хот-дог по-французьки",
            description: "Молочна сосиска",
            price: 50,
          },
        ],
      },
    ],
  },
  {
    id: "potatoes",
    title: "Картопля фрі / по-селянськи",
    groups: [
      {
        id: "potatoes-menu",
        title: "Меню",
        products: [
          {
            id: "fries-120",
            name: "Картопля фрі",
            description: "120 г · соус часниковий або червоний",
            price: 60,
            includesSauce: true,
          },
          {
            id: "country-potatoes-120",
            name: "Картопля по-селянськи",
            description: "120 г · соус часниковий або червоний",
            price: 65,
            includesSauce: true,
          },
        ],
      },
    ],
  },
  {
    id: "pizza",
    title: "Піца",
    groups: [
      {
        id: "pizza-menu",
        title: "Меню",
        products: [
          {
            id: "pizza-chicken-pineapple",
            name: "Піца з куркою, ананасом та сиром",
            description: "400 г",
            price: 90,
          },
          {
            id: "pizza-signature",
            name: "Піца Фірмова",
            description: "400 г",
            price: 90,
          },
          {
            id: "pizza-hunter",
            name: "Піца з мисливськими ковбасками",
            description: "400 г",
            price: 90,
          },
        ],
      },
    ],
  },
  {
    id: "ready-meals",
    title: "Готові страви",
    groups: [
      {
        id: "main-dishes",
        title: "Другі страви",
        products: [
          {
            id: "gratin-chicken-mushrooms",
            name: "Гратен з куркою та печерицями",
            description: "260 г",
            price: 80,
          },
          {
            id: "pork-pilaf",
            name: "Плов зі свининою",
            description: "270 г",
            price: 80,
          },
          {
            id: "chicken-cutlet-mash",
            name: "Котлета куряча з картопляним пюре",
            description: "280 г",
            price: 80,
          },
          {
            id: "noodles-chicken-vegetables",
            name: "Локшина з куркою та овочами",
            description: "280 г",
            price: 80,
          },
          {
            id: "sweet-sour-chicken-rice",
            name: "Курка в кисло-солодкому соусі з рисом",
            description: "300 г",
            price: 80,
          },
          {
            id: "pork-goulash-buckwheat",
            name: "Гуляш зі свинини з гречаною кашею",
            description: "320 г",
            price: 80,
          },
        ],
      },
      {
        id: "salads",
        title: "Салати",
        products: [
          { id: "vegetable-salad", name: "Салат овочевий", description: "130 г", price: 30 },
          { id: "cabbage-cucumber-greens-salad", name: "Салат з капустою, огірком та зеленню", description: "110 г", price: 30 },
          { id: "caesar-salad", name: "Салат Цезар", description: "180 г", price: 60 },
        ],
      },
      {
        id: "first-courses",
        title: "Перші страви",
        products: [
          { id: "okroshka-chicken", name: "Окрошка з куркою", description: "400 мл", price: 75 },
          { id: "ramen-pork", name: "Рамен зі свининою", description: "400 г", price: 50 },
          { id: "red-borscht-chicken", name: "Борщ червоний з куркою", description: "400 г", price: 50 },
        ],
      },
      {
        id: "desserts",
        title: "Десерти",
        products: [
          {
            id: "syrnyky-condensed-milk",
            name: "Сирники зі згущеним молоком",
            description: "3 шт · сирники 120 г · згущене молоко 30 г",
            price: 40,
          },
        ],
      },
      {
        id: "breakfasts",
        title: "Сніданки",
        products: [],
      },
    ],
  },
  {
    id: "grill-menu",
    title: "Мангал меню",
    groups: [
      {
        id: "grill-menu-products",
        title: "Меню",
        products: [
          {
            id: "grill-pork-neck",
            name: "Шашлик зі свинячого ошийка з картоплею та соусом на вибір",
            receiptName: "Шашлик зі свинячого ошийка",
            description: "350 г",
            price: 130,
            sectionLabel: "Мангал меню",
            includesSauce: true,
            requiresGrillOptions: true,
          },
          {
            id: "grill-chicken-thigh",
            name: "Шашлик з курячого стегна з картоплею та соусом на вибір",
            receiptName: "Шашлик з курячого стегна",
            description: "350 г",
            price: 130,
            sectionLabel: "Мангал меню",
            includesSauce: true,
            requiresGrillOptions: true,
          },
          {
            id: "grill-lulya-chicken-cheese",
            name: "Люля-кебаб з курки та сиром з картоплею та соусом на вибір",
            receiptName: "Люля-кебаб з курки та сиром",
            description: "350 г",
            price: 130,
            sectionLabel: "Мангал меню",
            includesSauce: true,
            requiresGrillOptions: true,
          },
          {
            id: "grill-sausage",
            name: "Сосиска на мангалі з картоплею та соусом на вибір",
            receiptName: "Сосиска на мангалі",
            description: "350 г",
            price: 120,
            sectionLabel: "Мангал меню",
            includesSauce: true,
            requiresGrillOptions: true,
            requiresSausageChoice: true,
          },
        ],
      },
    ],
  },
  {
    id: "hot-drinks",
    title: "Гарячі напої",
    groups: [
      {
        id: "hot-drinks-menu",
        title: "Меню",
        products: [
          { id: "americano", name: "Американо", price: 30 },
          { id: "americano-milk", name: "Американо з молоком", price: 35 },
          { id: "espresso", name: "Еспресо", price: 25 },
          { id: "espresso-milk", name: "Еспресо з молоком", price: 30 },
          { id: "cappuccino", name: "Капучіно", price: 45 },
          { id: "flat-white", name: "Флет уайт", price: 60 },
        ],
      },
    ],
  },
  {
    id: "cold-drinks",
    title: "Холодні напої",
    groups: [
      {
        id: "cold-drinks-menu",
        title: "Меню",
        products: [
          { id: "pepsi-033", name: "Пепсі 0.33", price: 25 },
          { id: "pepsi-05", name: "Пепсі 0.5", price: 30 },
          { id: "pepsi-125", name: "Пепсі 1.25", price: 50 },
          { id: "mirinda-05", name: "Мірінда 0.5", price: 30 },
          { id: "seven-up-05", name: "7UP 0.5", price: 30 },
          { id: "lipton-05", name: "Чай Lipton 0.5", price: 35 },
          { id: "juice-02", name: "Сік 0.2", price: 25 },
          { id: "tomato-juice-05", name: "Сік томатний 0.5", price: 45 },
          { id: "water-still-05", name: "Вода без газу 0.5", price: 25 },
          { id: "water-sparkling-05", name: "Вода газована 0.5", price: 25 },
        ],
      },
    ],
  },
];

const addons: Product[] = [
  {
    id: "addon-mozzarella",
    name: "Сир моцарела",
    description: "20 г",
    price: 15,
  },
  {
    id: "addon-mushrooms",
    name: "Печериці",
    description: "20 г",
    price: 15,
  },
  {
    id: "addon-tomato",
    name: "Помідор",
    description: "20 г",
    price: 10,
  },
  {
    id: "addon-garlic-sauce",
    name: "Соус часниковий",
    description: "25 г",
    price: 15,
  },
  {
    id: "addon-red-sauce",
    name: "Соус червоний",
    description: "25 г",
    price: 15,
  },
  {
    id: "addon-fries",
    name: "Картопля фрі",
    description: "50 г",
    price: 20,
  },
  {
    id: "addon-chicken",
    name: "М'ясо куряче",
    description: "50 г",
    price: 50,
  },
  {
    id: "addon-pork",
    name: "М'ясо свинини",
    description: "50 г",
    price: 55,
  },
];


type EditMode = "addons" | "remove" | "comment" | "sauce" | null;
type OrderType = "pickup" | "delivery" | null;
type OrderStep = "idle" | "choosing" | "editing" | "review" | "delivery";
type PaymentType = "cash" | "card" | null;

type DeliveryData = {
  name: string;
  phone: string;
  street: string;
  house: string;
  entrance: string;
  apartment: string;
  location: string;
  payment: PaymentType;
  needsChange: boolean | null;
  changeFrom: string;
};

const removableIngredients = [
  "Цибуля",
  "Цибуля сушена",
  "Огірок солоний",
  "Огірок свіжий",
  "Помідор",
  "Капуста",
  "Соус білий",
  "Соус червоний",
  "Соус жовтий",
  "М'ясо",
];

export default function CashierPage() {
  const [activeCategoryId, setActiveCategoryId] = useState(
    categories[0].id,
  );
  const [activeGroupId, setActiveGroupId] = useState(
    categories[0].groups[0].id,
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [editingCartId, setEditingCartId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [orderType, setOrderType] = useState<OrderType>(null);
  const [orderStep, setOrderStep] = useState<OrderStep>("idle");
  const [pickupPayment, setPickupPayment] = useState<PaymentType>(null);
  const [deliveryData, setDeliveryData] = useState<DeliveryData>({
    name: "",
    phone: "+380",
    street: "",
    house: "",
    entrance: "",
    apartment: "",
    location: "",
    payment: null,
    needsChange: null,
    changeFrom: "",
  });
  const [showCourierDialog, setShowCourierDialog] = useState(false);
  const [ordersCount, setOrdersCount] = useState(0);

useEffect(() => {
  const refreshOrdersCount = () => {
    const currentPoint =
      window.localStorage.getItem("tema-active-point") ?? "Портова";

    const count = getOrders().filter((order) => {
  return (
    order.point === currentPoint &&
    order.status !== "delivered" &&
    order.status !== "cancelled"
  );
}).length;

    setOrdersCount(count);
  };

  refreshOrdersCount();

  return subscribeToOrders(refreshOrdersCount);
}, []);

const [courierTask, setCourierTask] = useState<
  "delivery" | "transfer" | "purchase" | null
>(null);

const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

const [courierTime, setCourierTime] = useState<
  "now" | "15" | "20" | "30" | "custom"
>("now");

const [customCourierTime, setCustomCourierTime] = useState("");

  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [orderNumber, setOrderNumber] = useState("001");
  const [lastAddedCartId, setLastAddedCartId] =
    useState<string | null>(null);
  const [addedMessage, setAddedMessage] = useState("");
  const cartListRef = useRef<HTMLDivElement | null>(null);

  const [pendingGrillProduct, setPendingGrillProduct] =
    useState<Product | null>(null);
  const [pendingPotato, setPendingPotato] =
    useState<PotatoChoice | null>(null);
  const [pendingSauce, setPendingSauce] =
    useState<SauceChoice>("garlic");
  const [pendingSausage, setPendingSausage] =
    useState<SausageChoice | null>(null);

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem(
        "tema-cashier-current-cart",
      );

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart) as CartItem[];

        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      }
    } catch (error) {
      console.error("Не вдалося відновити кошик:", error);
    } finally {
      setCartLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;

    try {
      window.localStorage.setItem(
        "tema-cashier-current-cart",
        JSON.stringify(cart),
      );
    } catch (error) {
      console.error("Не вдалося зберегти кошик:", error);
    }
  }, [cart, cartLoaded]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const savedDate = window.localStorage.getItem(
      "cashier-order-date",
    );
    const savedNumber = Number(
      window.localStorage.getItem("cashier-order-number") ?? "0",
    );

    const nextNumber =
      savedDate === todayKey ? savedNumber + 1 : 1;

    window.localStorage.setItem("cashier-order-date", todayKey);
    window.localStorage.setItem(
      "cashier-order-number",
      String(nextNumber),
    );

    setOrderNumber(String(nextNumber).padStart(3, "0"));
  }, []);

  useEffect(() => {
    if (!lastAddedCartId) return;

    cartListRef.current?.scrollTo({
      top: cartListRef.current.scrollHeight,
      behavior: "smooth",
    });

    const timer = window.setTimeout(() => {
      setLastAddedCartId(null);
      setAddedMessage("");
    }, 1600);

    return () => window.clearTimeout(timer);
  }, [lastAddedCartId]);

  const activeCategory =
    categories.find(
      (category) => category.id === activeCategoryId,
    ) ?? categories[0];

  const activeGroup =
    activeCategory.groups.find(
      (group) => group.id === activeGroupId,
    ) ?? activeCategory.groups[0];

  function selectCategory(category: Category) {
    setActiveCategoryId(category.id);
    setActiveGroupId(category.groups[0].id);
  }

  const total = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
    [cart],
  );

  function showAddedItem(cartId: string, productName: string) {
    setLastAddedCartId(cartId);
    setAddedMessage(`Додано: ${productName}`);
  }

  function addProductToCart(product: Product) {
    if (!orderType || orderStep !== "editing") return;

    if (product.requiresGrillOptions) {
      setPendingGrillProduct(product);
      setPendingPotato(null);
      setPendingSauce("garlic");
      setPendingSausage(null);
      return;
    }

    const newItem: CartItem = {
      ...product,
      cartId: crypto.randomUUID(),
      quantity: 1,
      addons: [],
      removed: [],
      comment: "",
      sauce: product.includesSauce ? "garlic" : null,
      potato: product.id.includes("combo") ? "fries" : null,
      sausage: null,
    };

    setCart((current) => [...current, newItem]);
    showAddedItem(
      newItem.cartId,
      newItem.receiptName ?? newItem.name,
    );
  }

  function confirmGrillProduct() {
    if (!orderType || orderStep !== "editing") return;
    if (!pendingGrillProduct || !pendingPotato) return;

    if (
      pendingGrillProduct.requiresSausageChoice &&
      !pendingSausage
    ) {
      return;
    }

    const newItem: CartItem = {
      ...pendingGrillProduct,
      cartId: crypto.randomUUID(),
      quantity: 1,
      addons: [],
      removed: [],
      comment: "",
      sauce: pendingSauce,
      potato: pendingPotato,
      sausage: pendingSausage,
    };

    setCart((current) => [...current, newItem]);
    showAddedItem(
      newItem.cartId,
      newItem.receiptName ?? newItem.name,
    );
    setPendingGrillProduct(null);
    setPendingPotato(null);
    setPendingSauce("garlic");
    setPendingSausage(null);
  }

  function updateSauce(cartId: string, sauce: SauceChoice) {
    setCart((current) =>
      current.map((item) =>
        item.cartId === cartId ? { ...item, sauce } : item,
      ),
    );
  }

  function increaseQuantity(cartId: string) {
    setCart((current) =>
      current.map((item) =>
        item.cartId === cartId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }

  function decreaseQuantity(cartId: string) {
    setCart((current) =>
      current
        .map((item) =>
          item.cartId === cartId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(cartId: string) {
    const isLastItem =
      cart.length === 1 && cart[0]?.cartId === cartId;

    if (isLastItem) {
      clearCart();
      return;
    }

    setCart((current) =>
      current.filter((item) => item.cartId !== cartId),
    );

    if (editingCartId === cartId) {
      setEditingCartId(null);
      setEditMode(null);
    }
  }

  function toggleAddon(cartId: string, addon: Product) {
    setCart((current) =>
      current.map((item) => {
        if (item.cartId !== cartId) return item;

        const exists = item.addons.some(
          (selectedAddon) => selectedAddon.id === addon.id,
        );

        return {
          ...item,
          addons: exists
            ? item.addons.filter(
                (selectedAddon) => selectedAddon.id !== addon.id,
              )
            : [...item.addons, addon],
          price: exists
            ? item.price - addon.price
            : item.price + addon.price,
        };
      }),
    );
  }

  function toggleRemovedIngredient(
    cartId: string,
    ingredient: string,
  ) {
    setCart((current) =>
      current.map((item) => {
        if (item.cartId !== cartId) return item;

        const exists = item.removed.includes(ingredient);

        return {
          ...item,
          removed: exists
            ? item.removed.filter((value) => value !== ingredient)
            : [...item.removed, ingredient],
        };
      }),
    );
  }

  function updateComment(cartId: string, comment: string) {
    setCart((current) =>
      current.map((item) =>
        item.cartId === cartId ? { ...item, comment } : item,
      ),
    );
  }

  function toggleEditor(cartId: string, mode: EditMode) {
    if (editingCartId === cartId && editMode === mode) {
      setEditingCartId(null);
      setEditMode(null);
      return;
    }

    setEditingCartId(cartId);
    setEditMode(mode);
  }

  function clearCart() {
    setCart([]);
    setEditingCartId(null);
    setEditMode(null);
    setLastAddedCartId(null);
    setAddedMessage("");

    // Повний скидання поточного замовлення.
    // Після очищення кнопка знову стає «Нове замовлення».
    setOrderType(null);
    setOrderStep("idle");
    setPickupPayment(null);
    setDeliveryData({
      name: "",
      phone: "+380",
      street: "",
      house: "",
      entrance: "",
      apartment: "",
      location: "",
      payment: null,
      needsChange: null,
      changeFrom: "",
    });

    window.localStorage.removeItem(
      "tema-cashier-current-cart",
    );
  }

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "");

    let localDigits = digits;

    if (localDigits.startsWith("380")) {
      localDigits = localDigits.slice(3);
    } else if (localDigits.startsWith("0")) {
      localDigits = localDigits.slice(1);
    }

    return `+380${localDigits.slice(0, 9)}`;
  }

  function startNewOrder() {
    clearCart();
    setOrderType(null);
    setOrderStep("choosing");
    setPickupPayment(null);
    setDeliveryData({
      name: "",
      phone: "+380",
      street: "",
      house: "",
      entrance: "",
      apartment: "",
      location: "",
      payment: null,
      needsChange: null,
      changeFrom: "",
    });
  }

  function chooseOrderType(type: Exclude<OrderType, null>) {
    setOrderType(type);
    setOrderStep("editing");
  }

  function openOrderReview() {
    if (!orderType || cart.length === 0) return;
    setEditingCartId(null);
    setEditMode(null);
    setOrderStep("review");
  }

  function returnToCart() {
    setOrderStep("editing");
  }
  function getCurrentPoint() {
  return (
    window.localStorage.getItem("tema-active-point") ??
    "Портова"
  );
}

function getCurrentEmployeeName() {
  try {
    const savedSession = window.localStorage.getItem(
      "tema-current-employee-session",
    );

    if (!savedSession) {
      return "Працівник каси";
    }

    const parsedSession = JSON.parse(savedSession) as {
      employeeName?: string;
    };

    return parsedSession.employeeName ?? "Працівник каси";
  } catch {
    return "Працівник каси";
  }
}

  function incrementOrderNumber() {
    const todayKey = new Date().toISOString().slice(0, 10);
    const currentNumber = Number(
      window.localStorage.getItem("cashier-order-number") ?? "0",
    );
    const nextNumber = currentNumber + 1;

    window.localStorage.setItem("cashier-order-date", todayKey);
    window.localStorage.setItem(
      "cashier-order-number",
      String(nextNumber),
    );
    setOrderNumber(String(nextNumber).padStart(3, "0"));
  }

  function finishOrder() {
  if (!orderType) {
    window.alert("Оберіть тип замовлення.");
    return;
  }

  if (cart.length === 0) {
    window.alert("Замовлення порожнє.");
    return;
  }

  const selectedPayment =
    orderType === "pickup"
      ? pickupPayment
      : deliveryData.payment;

  if (!selectedPayment) {
    window.alert("Оберіть спосіб оплати.");
    return;
  }

  const completedNumber = orderNumber;
  const currentPoint = getCurrentPoint();
  const currentEmployeeName = getCurrentEmployeeName();

  const orderItems = cart.map((item) => ({
    id: item.cartId,
    productId: item.id,
    name: item.name,
    receiptName: item.receiptName,
    quantity: item.quantity,
    unitPrice: item.price,
    totalPrice: item.price * item.quantity,
    description: item.description,

    addons: item.addons.map((addon) => ({
      id: addon.id,
      name: addon.name,
      price: addon.price,
    })),

    removedIngredients: item.removed,
    comment: item.comment,
    sauce: item.sauce,
    potato: item.potato,
    sausage: item.sausage,
  }));

  try {
    if (orderType === "delivery") {
      const pricing = calculateDeliveryPricing({
        productsTotal: total,
      });

      createOrder({
        orderNumber: completedNumber,
        point: currentPoint,
        type: "delivery",
        createdBy: currentEmployeeName,
        items: orderItems,
        subtotal: total,
        total: total + pricing.customerDeliveryPrice,
        paymentType: selectedPayment,

        delivery: {
          customer: {
            name: deliveryData.name,
            phone: deliveryData.phone,
            comment: "",
          },

          address: {
            street: deliveryData.street,
            house: deliveryData.house,
            apartment: deliveryData.apartment,
            entrance: deliveryData.entrance,
            location: deliveryData.location,
          },

          payment: {
            type: selectedPayment,
            needsChange:
              selectedPayment === "cash"
                ? deliveryData.needsChange
                : null,
            changeFrom:
              selectedPayment === "cash" &&
              deliveryData.needsChange === true &&
              deliveryData.changeFrom.trim()
                ? Number(deliveryData.changeFrom)
                : null,
          },

          pricing,
        },
      });
    } else {
      createOrder({
        orderNumber: completedNumber,
        point: currentPoint,
        type: "pickup",
        createdBy: currentEmployeeName,
        items: orderItems,
        subtotal: total,
        total,
        paymentType: selectedPayment,
        delivery: null,
      });
    }

    clearCart();
    incrementOrderNumber();

    window.alert(
      `Замовлення №${completedNumber} оформлено та збережено`,
    );
  } catch (error) {
    console.error("Не вдалося зберегти замовлення:", error);

    window.alert(
      error instanceof Error
        ? error.message
        : "Не вдалося зберегти замовлення.",
    );
  }
}

  function confirmReviewedOrder() {
    if (orderType === "pickup") {
      finishOrder();
      return;
    }

    setOrderStep("delivery");
  }

  return (
    <main className="min-h-screen bg-[#02070c] p-3 text-white">
      <div className="mx-auto w-full max-w-[1540px]">
        <header className="grid min-h-[70px] grid-cols-[1fr_auto_1fr] items-center border-b border-white/[0.07] px-3">
          <div className="justify-self-start">
            <p className="text-[13px] text-[#7f8999]">
              Робоче місце
            </p>

            <h1 className="mt-1 text-[28px] font-bold">
              Каса
            </h1>

            <p className="mt-1 text-[12px] font-medium text-[#8f98a6]">
              {currentDateTime.toLocaleDateString("uk-UA")} ·{" "}
              {currentDateTime.toLocaleTimeString("uk-UA", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
  <button
    type="button"
    className="rounded-[11px] border border-[#ff6500]/30 bg-[#ff6500]/10 px-5 py-2.5 text-[13px] font-semibold text-[#ff7a22] transition hover:bg-[#ff6500]/20"
  >
    Акції
  </button>

  <button
    type="button"
    className="rounded-[11px] border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-[13px] font-semibold text-[#c7ced8] transition hover:bg-white/[0.06]"
  >
    Техкарти
  </button>

  
</div>

          <div className="flex items-center justify-self-end gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-[13px] font-semibold leading-[1.25]">
                Портова
              </p>

              <p className="mt-1 text-[12px] text-[#7f8999]">
                Поточна точка
              </p>
            </div>
            <Link
  href="/cashier/orders"
  className="group flex h-[46px] min-w-[170px] items-center justify-between gap-4 rounded-[12px] border border-[#ff6500]/55 bg-[#ff6500]/[0.05] px-4 text-[14px] font-bold text-white shadow-[0_0_22px_rgba(255,101,0,0.10)] transition hover:border-[#ff6500] hover:bg-[#ff6500]/10"
>
  <span className="flex items-center gap-3">
    

    <span>Замовлення</span>
  </span>

  <span className="flex h-7 min-w-7 items-center justify-center rounded-[8px] bg-[#ff6500] px-2 text-[12px] font-black text-white">
    {ordersCount}

  </span>
</Link>


            <Link
              href="/dashboard"
              className="flex h-[44px] items-center rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-4 text-[14px] font-semibold text-[#b7bec9] transition hover:bg-white/[0.07] hover:text-white"
            >
              Назад
            </Link>
          </div>
        </header>

        <div className="mt-4 grid gap-4 xl:grid-cols-[230px_minmax(0,1fr)_420px]">
          <aside className="rounded-[20px] border border-white/[0.06] bg-[#071019] p-4">
            <h2 className="text-[17px] font-bold">
              Категорії
            </h2>

            <div className="mt-4 max-h-[720px] space-y-2 overflow-y-auto pr-1">
              {categories.map((category) => {
                const isActive =
                  category.id === activeCategoryId;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => selectCategory(category)}
                    className={`relative flex min-h-[52px] w-full items-center overflow-hidden rounded-[13px] px-4 py-3 text-left text-[14px] font-semibold leading-[1.35] transition ${
                      isActive
                        ? "border border-[#ff6500]/60 bg-gradient-to-r from-[#ff6500]/15 to-[#ff6500]/[0.04] text-[#ff7a22] shadow-[0_0_24px_rgba(255,101,0,0.08)]"
                        : "border border-white/[0.06] bg-white/[0.025] text-[#aab3c0] hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-[#ff6500] shadow-[0_0_12px_rgba(255,101,0,0.8)]" />
                    )}

                    <span>{category.title}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="relative overflow-hidden rounded-[20px] border border-white/[0.06] bg-gradient-to-br from-[#09121b] to-[#050b11] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <div className="pointer-events-none absolute -top-32 left-1/3 h-[280px] w-[420px] rounded-full bg-[#ff6500]/[0.045] blur-[90px]" />

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[23px] font-bold">
                    {activeCategory.title}
                  </h2>

                  <p className="mt-1 text-[14px] text-[#87919f]">
                    Натисніть на товар, щоб додати його
                  </p>

                  {activeCategory.groups.length > 1 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {activeCategory.groups.map((group) => {
                        const isActiveGroup =
                          group.id === activeGroup.id;

                        return (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => setActiveGroupId(group.id)}
                            className={`rounded-[10px] border px-4 py-2 text-[12px] font-semibold transition ${
                              isActiveGroup
                                ? "border-[#ff6500]/55 bg-[#ff6500]/12 text-[#ff8a3d]"
                                : "border-white/[0.07] bg-white/[0.025] text-[#aab3c0] hover:bg-white/[0.05]"
                            }`}
                          >
                            {group.title}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="shrink-0 rounded-[12px] border border-white/[0.06] bg-white/[0.025] px-4 py-2 text-[13px] text-[#8f98a6]">
                  Нове замовлення
                </div>
              </div>

              {activeGroup.products.length === 0 ? (
                <div className="mt-6 flex min-h-[220px] items-center justify-center rounded-[16px] border border-dashed border-white/[0.08] bg-white/[0.015]">
                  <div className="text-center">
                    <p className="text-[16px] font-semibold text-[#c5cbd4]">
                      Позиції ще не додані
                    </p>
                    <p className="mt-2 text-[13px] text-[#747e8d]">
                      Цей розділ заповнимо пізніше
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activeGroup.products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProductToCart(product)}
                    disabled={!orderType || orderStep !== "editing"}
                    className="group relative flex min-h-[150px] flex-col justify-between overflow-hidden rounded-[17px] border border-white/[0.07] bg-gradient-to-br from-[#121a23] to-[#0a1118] p-4 text-left transition enabled:hover:-translate-y-1 enabled:hover:border-[#ff6500]/45 enabled:hover:shadow-[0_0_28px_rgba(255,101,0,0.1)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="absolute left-4 right-4 top-0 h-[2px] rounded-b-full bg-gradient-to-r from-transparent via-[#ff6500]/70 to-transparent opacity-35 transition group-hover:opacity-100" />

                    <div>
                      <h3 className="text-[16px] font-bold leading-[1.4]">
                        {product.name}
                      </h3>

                      {product.description && (
                        <p className="mt-2 text-[13px] leading-[1.45] text-[#7f8999]">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 flex items-end justify-between">
                      <p className="text-[21px] font-bold text-[#ff7a22]">
                        {product.price} ₴
                      </p>

                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ff6500]/35 bg-[#ff6500]/10 text-[24px] text-[#ff7a22] transition group-hover:scale-110 group-hover:bg-[#ff6500] group-hover:text-white">
                        +
                      </span>
                    </div>
                  </button>
                ))}
                </div>
              )}
            </div>
          </section>

          <aside className="relative flex min-h-[740px] flex-col overflow-hidden rounded-[20px] border border-[#ff6500]/15 bg-gradient-to-b from-[#0a141e] to-[#071019] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
            <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#ff6500] to-transparent opacity-80" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[21px] font-bold">
                  Замовлення №{orderNumber}
                </h2>

                <p className="mt-1 text-[13px] text-[#87919f]">
                  {orderStep === "idle"
                    ? "Натисніть «Нове замовлення»"
                    : orderStep === "choosing"
                      ? "Оберіть спосіб отримання"
                      : cart.length === 0
                        ? orderType === "pickup"
                          ? "Самовивіз · додайте першу позицію"
                          : "Доставка · додайте першу позицію"
                        : `${orderType === "pickup" ? "Самовивіз" : "Доставка"} · ${cart.length} позицій`}
                </p>
              </div>

              <button
                type="button"
                onClick={clearCart}
                disabled={cart.length === 0 || orderStep !== "editing"}
                className="text-[13px] font-semibold text-red-300 transition disabled:cursor-not-allowed disabled:opacity-35"
              >
                Очистити
              </button>
            </div>

            {addedMessage && (
              <div className="mt-4 rounded-[11px] border border-[#ff6500]/35 bg-[#ff6500]/10 px-3 py-2 text-[12px] font-semibold text-[#ff9a59]">
                {addedMessage}
              </div>
            )}

            <div
              ref={cartListRef}
              className="mt-5 flex-1 overflow-y-auto pr-1"
            >
              {orderStep === "choosing" ? (
                <div className="rounded-[16px] border border-[#ff6500]/55 bg-[#ff6500]/[0.035] p-4 shadow-[0_0_30px_rgba(255,101,0,0.08)]">
                  <p className="text-center text-[15px] font-bold text-[#dce2ea]">
                    Як клієнт бажає отримати замовлення?
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => chooseOrderType("pickup")}
                      className="rounded-[14px] border border-white/[0.09] bg-white/[0.025] p-4 text-center transition hover:border-[#ff6500]/55 hover:bg-[#ff6500]/10"
                    >
                      <span className="text-[28px]">▣</span>
                      <p className="mt-2 text-[14px] font-bold text-[#ff7a22]">
                        Самовивіз
                      </p>
                      <p className="mt-1 text-[11px] leading-[1.35] text-[#87919f]">
                        Клієнт забере замовлення самостійно
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => chooseOrderType("delivery")}
                      className="rounded-[14px] border border-white/[0.09] bg-white/[0.025] p-4 text-center transition hover:border-[#ff6500]/55 hover:bg-[#ff6500]/10"
                    >
                      <span className="text-[28px]">◇</span>
                      <p className="mt-2 text-[14px] font-bold text-[#ff7a22]">
                        Доставка
                      </p>
                      <p className="mt-1 text-[11px] leading-[1.35] text-[#87919f]">
                        Замовлення буде доставлено кур’єром
                      </p>
                    </button>
                  </div>
                </div>
              ) : cart.length === 0 ? (
                <div className="flex h-full min-h-[310px] items-center justify-center rounded-[16px] border border-dashed border-white/[0.08] bg-white/[0.015]">
                  <div className="px-5 text-center">
                    <p className="text-[16px] font-semibold text-[#c5cbd4]">
                      {orderStep === "idle"
                        ? "Нове замовлення не розпочато"
                        : "Замовлення порожнє"}
                    </p>

                    <p className="mt-2 text-[13px] text-[#747e8d]">
                      {orderStep === "idle"
                        ? "Натисніть кнопку нижче"
                        : "Натисніть на товар, щоб додати його"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => {
                    const isEditing =
                      editingCartId === item.cartId;

                    return (
                      <div
                        key={item.cartId}
                        
                        className={`cursor-pointer rounded-[14px] border-[3px] p-3 transition-all duration-300
${
  lastAddedCartId === item.cartId
      ? "border-[#ff6500] bg-[#23140b] shadow-[0_0_34px_rgba(255,101,0,0.50),inset_0_0_0_2px_rgba(255,170,90,0.30)]"
      : "border-[#ff6500] bg-[#111b25] shadow-[0_0_18px_rgba(255,101,0,0.22),inset_0_0_0_1px_rgba(255,101,0,0.18)]"
}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[15px] font-semibold">
                              {item.receiptName ?? item.name}
                            </p>

                            {item.potato && (
                              <p className="mt-0.5 text-[11px] leading-[1.2] text-[#aeb7c3]">
                                {item.potato === "fries"
                                  ? "Картопля фрі"
                                  : "Картопля по-селянськи"}
                              </p>
                            )}

                            {item.sausage && (
                              <p className="mt-0.5 text-[11px] leading-[1.2] text-[#aeb7c3]">
                                {item.sausage === "milk"
                                  ? "Сосиска молочна"
                                  : "Сосиска копчена"}
                              </p>
                            )}

                            {item.sauce && (
                              <p className="mt-0.5 text-[11px] leading-[1.2] text-[#aeb7c3]">
                                {item.sauce === "garlic"
                                  ? "Соус часниковий"
                                  : "Соус червоний"}
                              </p>
                            )}

                            {item.description && (
                              <p className="mt-0.5 text-[10px] leading-[1.2] text-[#788291]">
                                {item.description}
                              </p>
                            )}

                            {item.addons.map((addon) => (
                              <p
                                key={addon.id}
                                className="mt-0.5 text-[10px] font-semibold leading-[1.2] text-[#ff8a3d]"
                              >
                                + {addon.name}
                              </p>
                            ))}

                            {item.removed.map((ingredient) => (
                              <p
                                key={ingredient}
                                className="mt-0.5 text-[10px] font-semibold leading-[1.2] text-red-300"
                              >
                                − Без: {ingredient}
                              </p>
                            ))}

                            {item.comment && (
                              <p className="mt-1.5 rounded-[7px] bg-amber-400/10 px-2 py-1 text-[10px] leading-[1.25] text-amber-200">
                                {item.comment}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.cartId)}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[15px] text-[#697484] hover:bg-red-500/10 hover:text-red-300"
                          >
                            ×
                          </button>
                        </div>

                        <div className="mt-2.5 grid grid-cols-4 gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              toggleEditor(item.cartId, "addons")
                            }
                            className={`min-h-[31px] rounded-[8px] border px-1 py-1.5 text-[9px] font-semibold leading-[1.1] transition ${
                              isEditing && editMode === "addons"
                                ? "border-[#ff6500]/60 bg-[#ff6500]/15 text-[#ff8a3d]"
                                : "border-[#ff6500]/20 bg-[#ff6500]/[0.045] text-[#d7b29a]"
                            }`}
                          >
                            Додатки{item.addons.length > 0 ? ` (${item.addons.length})` : ""}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleEditor(item.cartId, "remove")
                            }
                            className={`min-h-[31px] rounded-[8px] border px-1 py-1.5 text-[9px] font-semibold leading-[1.1] transition ${
                              isEditing && editMode === "remove"
                                ? "border-red-400/50 bg-red-500/12 text-red-200"
                                : "border-red-400/15 bg-red-500/[0.035] text-[#d0a8a8]"
                            }`}
                          >
                            Прибрати{item.removed.length > 0 ? ` (${item.removed.length})` : ""}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleEditor(item.cartId, "comment")
                            }
                            className={`min-h-[31px] rounded-[8px] border px-1 py-1.5 text-[9px] font-semibold leading-[1.1] transition ${
                              isEditing && editMode === "comment"
                                ? "border-amber-400/50 bg-amber-400/12 text-amber-200"
                                : "border-amber-400/15 bg-amber-400/[0.035] text-[#d3c09b]"
                            }`}
                          >
                            Коментар{item.comment.trim() ? " •" : ""}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              item.includesSauce
                                ? toggleEditor(item.cartId, "sauce")
                                : undefined
                            }
                            disabled={!item.includesSauce}
                            className={`min-h-[31px] rounded-[8px] border px-1 py-1.5 text-[8px] font-semibold leading-[1.05] transition ${
                              !item.includesSauce
                                ? "cursor-not-allowed border-white/[0.04] bg-white/[0.015] text-[#4f5966]"
                                : isEditing && editMode === "sauce"
                                  ? "border-sky-400/50 bg-sky-400/12 text-sky-200"
                                  : "border-sky-400/15 bg-sky-400/[0.035] text-[#a9c5d3]"
                            }`}
                          >
                            Заміна соусу
                          </button>
                        </div>

                        {isEditing && editMode === "addons" && (
                          <div className="mt-2 rounded-[11px] border border-[#ff6500]/20 bg-[#ff6500]/[0.035] p-2.5">
                            <p className="text-[12px] font-semibold text-[#ff8a3d]">
                              Оберіть додатки
                            </p>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                              {addons.map((addon) => {
                                const isSelected =
                                  item.addons.some(
                                    (selectedAddon) =>
                                      selectedAddon.id === addon.id,
                                  );

                                return (
                                  <button
                                    key={addon.id}
                                    type="button"
                                    onClick={() =>
                                      toggleAddon(item.cartId, addon)
                                    }
                                    className={`rounded-[10px] border px-3 py-2 text-left transition ${
                                      isSelected
                                        ? "border-[#ff6500]/60 bg-[#ff6500]/15 text-white"
                                        : "border-white/[0.07] bg-white/[0.025] text-[#aab3c0]"
                                    }`}
                                  >
                                    <p className="text-[12px] font-semibold">
                                      {addon.name}
                                    </p>

                                    <p className="mt-1 text-[11px] text-[#788291]">
                                      {addon.description}
                                    </p>

                                    <p className="mt-1 text-[12px] font-bold text-[#ff8a3d]">
                                      +{addon.price} ₴
                                    </p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {isEditing && editMode === "remove" && (
                          <div className="mt-2 rounded-[11px] border border-red-400/15 bg-red-500/[0.025] p-2.5">
                            <p className="text-[12px] font-semibold text-red-200">
                              Що прибрати
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {removableIngredients.map(
                                (ingredient) => {
                                  const isRemoved =
                                    item.removed.includes(ingredient);

                                  return (
                                    <button
                                      key={ingredient}
                                      type="button"
                                      onClick={() =>
                                        toggleRemovedIngredient(
                                          item.cartId,
                                          ingredient,
                                        )
                                      }
                                      className={`rounded-[8px] border px-3 py-2 text-[11px] font-semibold transition ${
                                        isRemoved
                                          ? "border-red-400/50 bg-red-500/15 text-red-100"
                                          : "border-white/[0.07] bg-white/[0.025] text-[#9da7b5]"
                                      }`}
                                    >
                                      {isRemoved ? "− " : ""}
                                      {ingredient}
                                    </button>
                                  );
                                },
                              )}
                            </div>
                          </div>
                        )}

                        {isEditing && editMode === "comment" && (
                          <div className="mt-2 rounded-[11px] border border-amber-400/15 bg-amber-400/[0.025] p-2.5">
                            <p className="text-[12px] font-semibold text-amber-200">
                              Коментар повару
                            </p>

                            <textarea
                              value={item.comment}
                              onChange={(event) =>
                                updateComment(
                                  item.cartId,
                                  event.target.value,
                                )
                              }
                              placeholder="Наприклад: добре просмажити"
                              className="mt-3 min-h-[72px] w-full resize-none rounded-[10px] border border-white/[0.08] bg-white/[0.025] p-3 text-[12px] text-white outline-none placeholder:text-[#596372] focus:border-amber-400/40"
                            />
                          </div>
                        )}

                        {isEditing && editMode === "sauce" && item.includesSauce && (
                          <div className="mt-2 rounded-[11px] border border-sky-400/15 bg-sky-400/[0.025] p-2.5">
                            <p className="text-[12px] font-semibold text-sky-200">
                              Заміна соусу
                            </p>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateSauce(item.cartId, "garlic")
                                }
                                className={`rounded-[10px] border px-3 py-2.5 text-[12px] font-semibold ${
                                  item.sauce === "garlic"
                                    ? "border-[#ff6500]/55 bg-[#ff6500]/12 text-[#ff8a3d]"
                                    : "border-white/[0.07] bg-white/[0.025] text-[#aab3c0]"
                                }`}
                              >
                                Часниковий
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  updateSauce(item.cartId, "red")
                                }
                                className={`rounded-[10px] border px-3 py-2.5 text-[12px] font-semibold ${
                                  item.sauce === "red"
                                    ? "border-red-400/50 bg-red-500/12 text-red-200"
                                    : "border-white/[0.07] bg-white/[0.025] text-[#aab3c0]"
                                }`}
                              >
                                Червоний
                              </button>
                            </div>

                            <p className="mt-3 text-[11px] text-[#788291]">
                              Заміна не змінює вартість позиції.
                            </p>
                          </div>
                        )}

                        <div className="mt-2.5 flex items-center justify-end">
                          <p className="text-[16px] font-bold">
                            {item.price} ₴
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-white/[0.07] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-[#9ba4b3]">
                  Разом
                </span>

                <span className="text-[29px] font-bold">
                  {total} ₴
                </span>
              </div>

              <button
                type="button"
                onClick={
                  orderStep === "idle"
                    ? startNewOrder
                    : orderStep === "editing"
                      ? openOrderReview
                      : undefined
                }
                disabled={
                  orderStep === "choosing" ||
                  (orderStep === "editing" && cart.length === 0) ||
                  orderStep === "review" ||
                  orderStep === "delivery"
                }
                className="mt-4 h-[58px] w-full rounded-[15px] bg-[#ff5a00] text-[17px] font-bold transition hover:bg-[#ff6b16] disabled:cursor-not-allowed disabled:bg-[#512617] disabled:text-white/35"
              >
                {orderStep === "idle"
                  ? "Нове замовлення"
                  : orderStep === "choosing"
                    ? "Оберіть тип замовлення"
                    : "Прийняти замовлення"}
              </button>
            </div>
          </aside>
        </div>
      </div>
      {pendingGrillProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[500px] rounded-[22px] border border-white/[0.09] bg-[#09131d] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] uppercase tracking-[1.4px] text-[#ff7a22]">
                  Мангал меню
                </p>
                <h2 className="mt-2 text-[23px] font-bold">
                  {pendingGrillProduct.receiptName}
                </h2>
                <p className="mt-2 text-[14px] text-[#87919f]">
                  Оберіть картоплю та соус
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPendingGrillProduct(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-[20px]"
              >
                ×
              </button>
            </div>

            {pendingGrillProduct.requiresSausageChoice && (
              <div className="mt-6">
                <p className="text-[13px] font-bold">Сосиска</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPendingSausage("milk")}
                    className={`rounded-[13px] border px-4 py-3 text-[13px] font-semibold ${
                      pendingSausage === "milk"
                        ? "border-[#ff6500]/55 bg-[#ff6500]/12 text-[#ff8a3d]"
                        : "border-white/[0.08] bg-white/[0.025] text-[#b5bdc8]"
                    }`}
                  >
                    Молочна
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingSausage("smoked")}
                    className={`rounded-[13px] border px-4 py-3 text-[13px] font-semibold ${
                      pendingSausage === "smoked"
                        ? "border-[#ff6500]/55 bg-[#ff6500]/12 text-[#ff8a3d]"
                        : "border-white/[0.08] bg-white/[0.025] text-[#b5bdc8]"
                    }`}
                  >
                    Копчена
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6">
              <p className="text-[13px] font-bold">Картопля</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPendingPotato("fries")}
                  className={`rounded-[13px] border px-4 py-3 text-[13px] font-semibold ${
                    pendingPotato === "fries"
                      ? "border-[#ff6500]/55 bg-[#ff6500]/12 text-[#ff8a3d]"
                      : "border-white/[0.08] bg-white/[0.025] text-[#b5bdc8]"
                  }`}
                >
                  Картопля фрі
                </button>
                <button
                  type="button"
                  onClick={() => setPendingPotato("country")}
                  className={`rounded-[13px] border px-4 py-3 text-[13px] font-semibold ${
                    pendingPotato === "country"
                      ? "border-[#ff6500]/55 bg-[#ff6500]/12 text-[#ff8a3d]"
                      : "border-white/[0.08] bg-white/[0.025] text-[#b5bdc8]"
                  }`}
                >
                  По-селянськи
                </button>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[13px] font-bold">Соус</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPendingSauce("garlic")}
                  className={`rounded-[13px] border px-4 py-3 text-[13px] font-semibold ${
                    pendingSauce === "garlic"
                      ? "border-[#ff6500]/55 bg-[#ff6500]/12 text-[#ff8a3d]"
                      : "border-white/[0.08] bg-white/[0.025] text-[#b5bdc8]"
                  }`}
                >
                  Часниковий
                </button>
                <button
                  type="button"
                  onClick={() => setPendingSauce("red")}
                  className={`rounded-[13px] border px-4 py-3 text-[13px] font-semibold ${
                    pendingSauce === "red"
                      ? "border-red-400/50 bg-red-500/12 text-red-200"
                      : "border-white/[0.08] bg-white/[0.025] text-[#b5bdc8]"
                  }`}
                >
                  Червоний
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={confirmGrillProduct}
              disabled={
                !pendingPotato ||
                (pendingGrillProduct.requiresSausageChoice &&
                  !pendingSausage)
              }
              className="mt-6 h-[56px] w-full rounded-[14px] bg-[#ff5a00] text-[16px] font-bold transition hover:bg-[#ff6b16] disabled:cursor-not-allowed disabled:bg-[#512617] disabled:text-white/35"
            >
              Додати в замовлення
            </button>
          </div>
        </div>
      )}


      {(orderStep === "review" || orderStep === "delivery") && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-[680px] overflow-y-auto rounded-[24px] border border-[#ff6500]/35 bg-gradient-to-b from-[#0c1721] to-[#071019] p-6 shadow-[0_35px_120px_rgba(0,0,0,0.72)]">
            {orderStep === "review" ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[1.4px] text-[#ff7a22]">{orderType === "pickup" ? "Самовивіз" : "Доставка"}</p>
                    <h2 className="mt-2 text-[26px] font-bold">Перевірте замовлення</h2>
                    <p className="mt-2 text-[14px] text-[#8f98a6]">Повторіть замовлення клієнту та дочекайтеся підтвердження.</p>
                  </div>
                  <div className="rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-[#aeb7c3]">№{orderNumber}</div>
                </div>
                <div className="mt-5 space-y-2">
                  {cart.map((item) => (
                    <div key={item.cartId} className="rounded-[14px] border border-white/[0.07] bg-white/[0.025] p-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[15px] font-semibold">{item.receiptName ?? item.name}</p>
                          {item.addons.map((addon) => <p key={addon.id} className="mt-1 text-[11px] text-[#ff9a59]">+ {addon.name}</p>)}
                          {item.removed.map((ingredient) => <p key={ingredient} className="mt-1 text-[11px] text-red-300">Без: {ingredient}</p>)}
                          {item.comment && <p className="mt-1 text-[11px] text-amber-200">{item.comment}</p>}
                        </div>
                        <p className="shrink-0 text-[16px] font-bold">{item.price} ₴</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-white/[0.08] pt-4"><span className="text-[#9ba4b3]">Разом</span><span className="text-[30px] font-bold">{total} ₴</span></div>
                {orderType === "pickup" && (
                  <div className="mt-5 rounded-[16px] border border-white/[0.07] bg-white/[0.02] p-4">
                    <p className="text-[14px] font-bold">Спосіб оплати</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setPickupPayment("cash")} className={`rounded-[13px] border px-4 py-3 text-[13px] font-semibold ${pickupPayment === "cash" ? "border-[#ff6500]/60 bg-[#ff6500]/15 text-[#ff8a3d]" : "border-white/[0.08] bg-white/[0.025] text-[#b5bdc8]"}`}>Готівка</button>
                      <button type="button" onClick={() => setPickupPayment("card")} className={`rounded-[13px] border px-4 py-3 text-[13px] font-semibold ${pickupPayment === "card" ? "border-[#ff6500]/60 bg-[#ff6500]/15 text-[#ff8a3d]" : "border-white/[0.08] bg-white/[0.025] text-[#b5bdc8]"}`}>Безготівкова</button>
                    </div>
                  </div>
                )}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button type="button" onClick={returnToCart} className="h-[54px] rounded-[14px] border border-white/[0.09] bg-white/[0.035] text-[15px] font-bold text-[#c5ccd6]">Редагувати</button>
                  <button type="button" onClick={confirmReviewedOrder} disabled={orderType === "pickup" && !pickupPayment} className="h-[54px] rounded-[14px] bg-[#ff5a00] text-[15px] font-bold disabled:cursor-not-allowed disabled:bg-[#512617] disabled:text-white/35">{orderType === "pickup" ? "Підтвердити" : "Дані доставки"}</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[12px] font-semibold uppercase tracking-[1.4px] text-[#ff7a22]">Доставка · №{orderNumber}</p>
                <h2 className="mt-2 text-[26px] font-bold">Дані доставки</h2>
                <p className="mt-2 text-[13px] text-[#87919f]">Заповніть відомі дані. Порожні поля не блокують оформлення.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <input value={deliveryData.name} onChange={(e) => setDeliveryData((c) => ({...c, name:e.target.value}))} placeholder="Ім’я" className="h-[48px] rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-4 text-[13px] outline-none" />
                  <input value={deliveryData.phone} onChange={(e) => setDeliveryData((c) => ({...c, phone:formatPhone(e.target.value)}))} onFocus={() => setDeliveryData((c) => ({...c, phone:c.phone || "+380"}))} inputMode="tel" maxLength={13} placeholder="+380990609216" className="h-[48px] rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-4 text-[13px] outline-none" />
                  <input value={deliveryData.street} onChange={(e) => setDeliveryData((c) => ({...c, street:e.target.value}))} placeholder="Вулиця" className="h-[48px] rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-4 text-[13px] outline-none sm:col-span-2" />
                  <input value={deliveryData.house} onChange={(e) => setDeliveryData((c) => ({...c, house:e.target.value}))} placeholder="Будинок" className="h-[48px] rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-4 text-[13px] outline-none" />
                  <input value={deliveryData.entrance} onChange={(e) => setDeliveryData((c) => ({...c, entrance:e.target.value}))} placeholder="Під’їзд" className="h-[48px] rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-4 text-[13px] outline-none" />
                  <input value={deliveryData.apartment} onChange={(e) => setDeliveryData((c) => ({...c, apartment:e.target.value}))} placeholder="Квартира" className="h-[48px] rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-4 text-[13px] outline-none" />
                  <input value={deliveryData.location} onChange={(e) => setDeliveryData((c) => ({...c, location:e.target.value}))} placeholder="Локація" className="h-[48px] rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-4 text-[13px] outline-none sm:col-span-2" />
                </div>
                <div className="mt-5 rounded-[16px] border border-white/[0.07] bg-white/[0.02] p-4">
                  <p className="text-[14px] font-bold">Спосіб оплати</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setDeliveryData((c) => ({...c, payment:"cash"}))} className={`rounded-[13px] border px-4 py-3 text-[13px] font-semibold ${deliveryData.payment === "cash" ? "border-[#ff6500]/60 bg-[#ff6500]/15 text-[#ff8a3d]" : "border-white/[0.08] bg-white/[0.025] text-[#b5bdc8]"}`}>Готівка</button>
                    <button type="button" onClick={() => setDeliveryData((c) => ({...c, payment:"card", needsChange:null, changeFrom:""}))} className={`rounded-[13px] border px-4 py-3 text-[13px] font-semibold ${deliveryData.payment === "card" ? "border-[#ff6500]/60 bg-[#ff6500]/15 text-[#ff8a3d]" : "border-white/[0.08] bg-white/[0.025] text-[#b5bdc8]"}`}>Безготівкова</button>
                  </div>
                  {deliveryData.payment === "cash" && (
                    <div className="mt-4">
                      <p className="text-[13px] font-semibold">Потрібна решта?</p>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => setDeliveryData((c) => ({...c, needsChange:true}))} className={`rounded-[12px] border px-4 py-2.5 text-[13px] font-semibold ${deliveryData.needsChange === true ? "border-[#ff6500]/60 bg-[#ff6500]/15 text-[#ff8a3d]" : "border-white/[0.08] bg-white/[0.025] text-[#b5bdc8]"}`}>Так</button>
                        <button type="button" onClick={() => setDeliveryData((c) => ({...c, needsChange:false, changeFrom:""}))} className={`rounded-[12px] border px-4 py-2.5 text-[13px] font-semibold ${deliveryData.needsChange === false ? "border-[#ff6500]/60 bg-[#ff6500]/15 text-[#ff8a3d]" : "border-white/[0.08] bg-white/[0.025] text-[#b5bdc8]"}`}>Ні</button>
                      </div>
                      {deliveryData.needsChange === true && <input value={deliveryData.changeFrom} onChange={(e) => setDeliveryData((c) => ({...c, changeFrom:e.target.value.replace(/\D/g, "")}))} inputMode="numeric" placeholder="З якої суми?" className="mt-3 h-[48px] w-full rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-4 text-[13px] outline-none" />}
                    </div>
                  )}
                </div>
                <div className="mt-5 flex items-center justify-between rounded-[14px] border border-white/[0.07] bg-white/[0.02] p-4"><span className="text-[#9ba4b3]">Замовлення</span><span className="text-[22px] font-bold">{total} ₴</span></div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button type="button" onClick={returnToCart} className="h-[54px] rounded-[14px] border border-white/[0.09] bg-white/[0.035] text-[14px] font-bold text-[#c5ccd6]">Редагувати замовлення</button>
                  <button type="button" onClick={finishOrder} className="h-[54px] rounded-[14px] bg-[#ff5a00] text-[14px] font-bold">Оформити замовлення</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
            <CourierDialog
        open={showCourierDialog}
        currentPoint={getCurrentPoint()}
        employeeName={getCurrentEmployeeName()}
        onClose={() => setShowCourierDialog(false)}
      />
    </main>
  );
}