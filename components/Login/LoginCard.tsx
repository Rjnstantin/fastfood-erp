"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Employee = {
  id: number;
  name: string;
  phone: string;
};

type ActiveEmployeeSession = {
  sessionId: string;
  employeeId: number;
  employeeName: string;
  point: string;
  position: string;
  startedAt: string;
};

const employees: Employee[] = [
  { id: 1, name: "Баженова Галина", phone: "+380986792140" },
  { id: 2, name: "Безверха Тамара", phone: "+380507402535" },
  { id: 3, name: "Бондарчук Алла", phone: "+380967661302" },
  { id: 4, name: "Боцула Людмила", phone: "+380985651489" },
  { id: 5, name: "Гринченко Катерина", phone: "+380954693090" },
  { id: 6, name: "Гуляєва Інна", phone: "+380964234323" },
  { id: 7, name: "Дейкун Олена", phone: "+380675311358" },
  { id: 8, name: "Довгун Світлана", phone: "+380970730445" },
  { id: 9, name: "Дрок Максим", phone: "+380960209824" },
  { id: 10, name: "Кас'янова Олена", phone: "+380675776346" },
  { id: 11, name: "Кенебас Олександр", phone: "+380684377914" },
  { id: 12, name: "Кенебас Яна", phone: "+380989978857" },
  { id: 13, name: "Кльонова Яна", phone: "+380962605542" },
  { id: 14, name: "Лєсовікова Катерина", phone: "+380966086671" },
  { id: 15, name: "Малюк Ольга", phone: "+380660573493" },
  { id: 16, name: "Нагдалієва Тетяна", phone: "+380984349500" },
  { id: 17, name: "Нікітіна Світлана", phone: "+380508771430" },
  { id: 18, name: "Плотникова Лариса", phone: "+380950625429" },
  { id: 19, name: "Похил Таміла", phone: "+380988984571" },
  { id: 20, name: "Пріз Каріна", phone: "+380990609216" },
  { id: 21, name: "Прийма Оксана", phone: "+380960972131" },
  { id: 22, name: "Соловйова Леся", phone: "+380987769824" },
  { id: 23, name: "Тептя Костянтин", phone: "+380687997791" },
  { id: 24, name: "Троцько Тетяна", phone: "+380965292221" },
  { id: 25, name: "Чергенець Світлана", phone: "+380505305251" },
  { id: 26, name: "Черевань Наталія", phone: "+380986022285" },
  { id: 27, name: "Чорна Анастасія", phone: "+380974013815" },
  { id: 28, name: "Чорна Наталія", phone: "+380677475861" },
];
const ADMIN_PASSWORD = "3744";

type SelectionModal = "point" | "employee" | "position" | null;

const points = [
  "Портова",
  "Ринок",
  "Опорний",
  "Героїв Дніпра",
  "Маслова 14",
  "Лесі Українки 51",
  "Кухня Миру 1",
  "Кухня Славутич",
];

const positions = [
  "Касир",
  "Повар шаурми",
  "Повар чебуреків",
  "Повар кухні",
  "Повар кухні Славутич",
  "М'ясний цех",
  "Мийка посуду",
  "Підробіток",
  "Стажер",
  "Прибирання",
  "Адміністратор",
];
export default function LoginCard() {
  const router = useRouter();

  const [point, setPoint] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [position, setPosition] = useState("");
  const [activePoint, setActivePoint] = useState("");
  const [activeEmployees, setActiveEmployees] = useState<
    ActiveEmployeeSession[]
  >([]);
  const [selectionModal, setSelectionModal] =
    useState<SelectionModal>(null);
  const [pendingSelection, setPendingSelection] = useState("");
  const EMPLOYEES_PER_PAGE = 12;
  const [employeePage, setEmployeePage] = useState(0);

  useEffect(() => {
    try {
      const savedSessions = window.localStorage.getItem(
        "tema-active-employees",
      );

      if (!savedSessions) return;

      const parsedSessions = JSON.parse(
        savedSessions,
      ) as ActiveEmployeeSession[];

      if (!Array.isArray(parsedSessions)) return;

      setActiveEmployees(parsedSessions);

      const firstActiveSession = parsedSessions[0];

      if (firstActiveSession) {
        setActivePoint(firstActiveSession.point);
        setPoint(firstActiveSession.point);
      }
    } catch (error) {
      console.error(
        "Не вдалося завантажити активних працівників:",
        error,
      );
    }
  }, []);

  const selectedEmployee = useMemo(
    () =>
      employees.find(
        (employee) => employee.id === Number(employeeId),
      ),
    [employeeId],
  );

  function handleStartShift() {
    if (!point || !selectedEmployee || !position) {
      window.alert(
        "Оберіть точку, своє ім'я та посаду.",
      );
      return;
    }

    if (activePoint && point !== activePoint) {
      window.alert(
        `На планшеті вже відкрита точка «${activePoint}».`,
      );
      return;
    }

    const employeeAlreadyActive = activeEmployees.some(
      (session) =>
        session.employeeId === selectedEmployee.id &&
        session.point === point,
    );

    if (employeeAlreadyActive) {
      window.alert(
        `${selectedEmployee.name} уже працює на точці «${point}».`,
      );
      return;
    }

    if (position === "Адміністратор") {
      const enteredPassword = window.prompt(
        "Введіть пароль адміністратора",
      );

      if (enteredPassword !== ADMIN_PASSWORD) {
        window.alert("Невірний пароль");
        return;
      }
    }

    const newSession: ActiveEmployeeSession = {
      sessionId: crypto.randomUUID(),
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      point,
      position,
      startedAt: new Date().toISOString(),
    };

    const updatedSessions = [...activeEmployees, newSession];

    window.localStorage.setItem(
      "tema-active-employees",
      JSON.stringify(updatedSessions),
    );
    window.localStorage.setItem(
      "tema-active-point",
      point,
    );
    window.localStorage.setItem(
      "tema-current-employee-session",
      JSON.stringify(newSession),
    );

    setActiveEmployees(updatedSessions);
    setActivePoint(point);

    router.push("/dashboard");
  }

  function handleReturnToWork() {
    if (activeEmployees.length === 0) return;
    router.push("/dashboard");
  }

  function openSelectionModal(modal: Exclude<SelectionModal, null>) {
    if (modal === "point" && activePoint) return;

    setSelectionModal(modal);

    if (modal === "point") {
      setPendingSelection(point);
      return;
    }

    if (modal === "employee") {
      setPendingSelection(employeeId);

      const selectedEmployeeIndex = employees.findIndex(
        (employee) => String(employee.id) === employeeId,
      );

      setEmployeePage(
        Math.floor(
          Math.max(0, selectedEmployeeIndex) / EMPLOYEES_PER_PAGE,
        ),
      );
      return;
    }

    setPendingSelection(position);
  }

  function cancelSelection() {
    if (selectionModal === "point") {
      setPoint("");
      setEmployeeId("");
      setPosition("");
    }

    if (selectionModal === "employee") {
      setEmployeeId("");
      setPosition("");
    }

    if (selectionModal === "position") {
      setPosition("");
    }

    setPendingSelection("");
    setSelectionModal(null);
  }

  function confirmSelection() {
    if (!selectionModal || !pendingSelection) return;

    if (selectionModal === "point") {
      const pointChanged = point !== pendingSelection;

      setPoint(pendingSelection);

      if (pointChanged) {
        setEmployeeId("");
        setPosition("");
      }
    }

    if (selectionModal === "employee") {
      const employeeChanged = employeeId !== pendingSelection;

      setEmployeeId(pendingSelection);

      if (employeeChanged) {
        setPosition("");
      }
    }

    if (selectionModal === "position") {
      setPosition(pendingSelection);
    }

    setPendingSelection("");
    setSelectionModal(null);
  }

  const selectionTitle =
    selectionModal === "point"
      ? "Оберіть точку"
      : selectionModal === "employee"
        ? "Оберіть своє ім’я"
        : "Оберіть посаду";

  return (
    <section className="flex h-full w-full -translate-y-4 flex-col items-center justify-center px-4 pb-4 pt-0">
      {/* Неоновая иконка бургера */}
<div className="relative mb-2 flex h-[188px] w-[188px] items-center justify-center">
  {/* Мягкое внешнее свечение */}
  <div className="pointer-events-none absolute inset-[18px] rounded-full bg-[#ff7300]/15 blur-[30px]" />

  {/* Тонкая внешняя окружность */}
  <div className="pointer-events-none absolute h-[154px] w-[154px] rounded-full border border-[#ff8a00]/45" />

  {/* Основное неоновое кольцо */}
  <div className="relative flex h-[132px] w-[132px] items-center justify-center rounded-full border-[4px] border-[#ff8a00] bg-[#090806] shadow-[0_0_14px_rgba(255,138,0,0.95),0_0_38px_rgba(255,100,0,0.5)]">
    <svg
  width="120"
  height="120"
  viewBox="0 0 72 72"
  fill="none"
  aria-hidden="true"
  className="translate-x-[6px] translate-y-[2px]"
>
      {/* Верхняя булка */}
<path
  d="M16 27C17.5 19.2 23.6 14.5 32 14.5C40.4 14.5 46.5 19.2 48 27H16Z"
  stroke="#ff9800"
  strokeWidth="1.8"
  strokeLinecap="round"
  strokeLinejoin="round"
/>

{/* Сыр с волной */}
<path
  d="M17 34H47"
  stroke="#ff9800"
  strokeWidth="1.8"
  strokeLinecap="round"
  strokeLinejoin="round"
/>

{/* Нижняя булка */}
<path
  d="M17 41H47V45C47 48.5 44.5 51 41 51H23C19.5 51 17 48.5 17 45V41Z"
  stroke="#ff9800"
  strokeWidth="1.8"
  strokeLinecap="round"
  strokeLinejoin="round"
/>
    </svg>
  </div>
</div>

{/* Заголовок */}  
      <div className="mt-3 text-center">
        <h2 className="text-[32px] font-extrabold leading-none text-white">
          З поверненням!
        </h2>

        <p className="mt-4 text-[17px] text-[#9da5b4]">
          Почнімо робочий день
        </p>
      </div>

      {/* Поля выбора */}
      <div className="mt-7 w-full max-w-[470px] space-y-5">
        {/* Точка */}
        <div className="grid grid-cols-[52px_1fr] gap-4">
          <span className="mt-[2px] flex h-[52px] w-[52px] items-center justify-center rounded-[13px] border border-orange-500/30 bg-[#160d06] text-[#ff7a00]">
            <svg
              width="27"
              height="27"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <circle
                cx="12"
                cy="10"
                r="2.2"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          </span>

          <div>
            <span className="mb-2 block text-[16px] font-semibold text-white">
              Оберіть точку
            </span>

            <button
              type="button"
              onClick={() => openSelectionModal("point")}
              disabled={Boolean(activePoint)}
              className="relative flex h-[52px] w-full items-center justify-between rounded-[12px] border border-white/10 bg-[#0d1016] px-4 text-left text-[15px] text-[#a9b0bd] outline-none transition hover:border-orange-500/45 focus:border-orange-500/60 focus:shadow-[0_0_0_3px_rgba(255,122,0,0.08)] disabled:cursor-not-allowed disabled:border-orange-500/25 disabled:bg-[#15100c] disabled:text-[#ff8a3d]"
            >
              <span className={point ? "text-white" : "text-[#737b89]"}>
                {point || "Оберіть точку..."}
              </span>

              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="shrink-0"
              >
                <path
                  d="m6 9 6 6 6-6"
                  stroke="#c9ced7"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {activePoint && (
              <span className="mt-2 block text-[12px] font-medium text-[#ff8a3d]">
                Точку вже відкрито. Додається ще один працівник.
              </span>
            )}
          </div>
        </div>

        {/* Имя */}
        <div className="grid grid-cols-[52px_1fr] gap-4">
          <span className="mt-[2px] flex h-[52px] w-[52px] items-center justify-center rounded-[13px] border border-orange-500/30 bg-[#160d06] text-[#ff7a00]">
            <svg
              width="27"
              height="27"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="8"
                r="4"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M4.5 21c.5-4.5 3.1-6.8 7.5-6.8s7 2.3 7.5 6.8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>

          <div>
            <span className="mb-2 block text-[16px] font-semibold text-white">
              Оберіть своє ім&apos;я
            </span>

            <button
              type="button"
              onClick={() => openSelectionModal("employee")}
              className="relative flex h-[52px] w-full items-center justify-between rounded-[12px] border border-white/10 bg-[#0d1016] px-4 text-left text-[15px] text-[#a9b0bd] outline-none transition hover:border-orange-500/45 focus:border-orange-500/60 focus:shadow-[0_0_0_3px_rgba(255,122,0,0.08)]"
            >
              <span className={selectedEmployee ? "text-white" : "text-[#737b89]"}>
                {selectedEmployee?.name || "Оберіть своє ім’я..."}
              </span>

              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="shrink-0"
              >
                <path
                  d="m6 9 6 6 6-6"
                  stroke="#c9ced7"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Должность */}
        <div className="grid grid-cols-[52px_1fr] gap-4">
          <span className="mt-[2px] flex h-[52px] w-[52px] items-center justify-center rounded-[13px] border border-orange-500/30 bg-[#160d06] text-[#ff7a00]">
            <svg
              width="27"
              height="27"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="4"
                y="7"
                width="16"
                height="13"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          </span>

          <div>
            <span className="mb-2 block text-[16px] font-semibold text-white">
              Оберіть посаду
            </span>

            <button
              type="button"
              onClick={() => openSelectionModal("position")}
              className="relative flex h-[52px] w-full items-center justify-between rounded-[12px] border border-white/10 bg-[#0d1016] px-4 text-left text-[15px] text-[#a9b0bd] outline-none transition hover:border-orange-500/45 focus:border-orange-500/60 focus:shadow-[0_0_0_3px_rgba(255,122,0,0.08)]"
            >
              <span className={position ? "text-white" : "text-[#737b89]"}>
                {position || "Оберіть посаду..."}
              </span>

              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="shrink-0"
              >
                <path
                  d="m6 9 6 6 6-6"
                  stroke="#c9ced7"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Кнопка */}
      <button
        type="button"
        onClick={handleStartShift}
        className="mt-7 flex h-[68px] w-full max-w-[460px] items-center rounded-[13px] bg-gradient-to-r from-[#ff4b00] via-[#ff6500] to-[#ff3d18] px-5 text-[23px] font-bold text-white shadow-[0_10px_34px_rgba(255,80,0,0.28)] transition hover:brightness-110 active:scale-[0.99]"
      >
        <span className="flex-1 pl-9 text-center">Почати роботу</span>

        <svg
          width="29"
          height="29"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 12h15"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="m14 7 5 5-5 5"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {activeEmployees.length > 0 && (
        <button
          type="button"
          onClick={handleReturnToWork}
          className="mt-3 flex h-[56px] w-full max-w-[460px] items-center justify-center gap-3 rounded-[13px] border border-[#19d64d]/45 bg-[#19d64d]/[0.055] text-[16px] font-bold text-[#62e889] transition hover:bg-[#19d64d]/10"
        >
          Повернутися до робочої сторінки
        </button>
      )}

      {activeEmployees.length > 0 && (
        <div className="mt-5 w-full max-w-[460px] rounded-[13px] border border-orange-500/20 bg-[#120d09] px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-white">
              Зараз на точці
            </p>
            <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-[11px] font-bold text-[#ff8a3d]">
              {activeEmployees.length}
            </span>
          </div>

          <div className="mt-2 space-y-1.5">
            {activeEmployees.map((session) => (
              <div
                key={session.sessionId}
                className="flex items-center justify-between gap-3 text-[12px]"
              >
                <span className="truncate text-[#c8ced8]">
                  {session.employeeName}
                </span>
                <span className="shrink-0 text-[#8f98a6]">
                  {session.position} ·{" "}
                  {new Date(session.startedAt).toLocaleTimeString(
                    "uk-UA",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Статус */}
      <div className="mt-6 flex items-center justify-center gap-3 text-[15px] text-[#a8afbc]">
        <span className="h-[11px] w-[11px] rounded-full bg-[#00e645] shadow-[0_0_14px_rgba(0,230,69,0.9)]" />
        <span>Система готова до роботи</span>
      </div>

      {selectionModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={cancelSelection}
        >
          <div
            className={`flex max-h-[92vh] w-full flex-col rounded-[24px] border border-orange-500/35 bg-gradient-to-b from-[#10141b] to-[#080a0e] p-6 shadow-[0_35px_120px_rgba(0,0,0,0.78)] ${
              selectionModal === "employee"
                ? "max-w-[920px]"
                : selectionModal === "position"
                  ? "max-w-[720px]"
                  : "max-w-[560px]"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-center">
              <p className="text-[12px] font-semibold uppercase tracking-[1.5px] text-[#ff7a22]">
                Робоча зміна
              </p>
              <h3 className="mt-2 text-[28px] font-extrabold text-white">
                {selectionTitle}
              </h3>
              <p className="mt-2 text-[13px] text-[#87919f]">
                Оберіть потрібний варіант та підтвердьте вибір.
              </p>
            </div>

            <div
              className={`mt-6 grid gap-2.5 ${
                selectionModal === "point"
                  ? "grid-cols-1"
                  : selectionModal === "employee"
                    ? "grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-2"
              }`}
            >
              {selectionModal === "point" &&
                points.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPendingSelection(item)}
                    className={`min-h-[48px] rounded-[13px] border px-4 py-3 text-left text-[14px] font-semibold transition ${
                      pendingSelection === item
                        ? "border-[#ff6500] bg-[#ff6500]/15 text-white shadow-[0_0_22px_rgba(255,101,0,0.16)]"
                        : "border-white/[0.09] bg-white/[0.025] text-[#b8c0cb] hover:border-[#ff6500]/45 hover:bg-[#ff6500]/[0.06]"
                    }`}
                  >
                    {item}
                  </button>
                ))}

              {selectionModal === "employee" &&
                employees
                  .slice(
                    employeePage * EMPLOYEES_PER_PAGE,
                    employeePage * EMPLOYEES_PER_PAGE + EMPLOYEES_PER_PAGE,
                  )
                  .map((employee) => (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() =>
                      setPendingSelection(String(employee.id))
                    }
                    className={`min-h-[48px] rounded-[13px] border px-4 py-3 text-left text-[13px] font-semibold transition ${
                      pendingSelection === String(employee.id)
                        ? "border-[#ff6500] bg-[#ff6500]/15 text-white shadow-[0_0_22px_rgba(255,101,0,0.16)]"
                        : "border-white/[0.09] bg-white/[0.025] text-[#b8c0cb] hover:border-[#ff6500]/45 hover:bg-[#ff6500]/[0.06]"
                    }`}
                  >
                    {employee.name}
                  </button>
                ))}

              {selectionModal === "position" &&
                positions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPendingSelection(item)}
                    className={`min-h-[48px] rounded-[13px] border px-4 py-3 text-left text-[13px] font-semibold transition ${
                      pendingSelection === item
                        ? "border-[#ff6500] bg-[#ff6500]/15 text-white shadow-[0_0_22px_rgba(255,101,0,0.16)]"
                        : "border-white/[0.09] bg-white/[0.025] text-[#b8c0cb] hover:border-[#ff6500]/45 hover:bg-[#ff6500]/[0.06]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
            </div>

            {selectionModal === "employee" && (
              <div className="mt-5 flex items-center justify-between border-t border-white/[0.08] pt-4">
                <button
                  type="button"
                  onClick={() => setEmployeePage((p)=>Math.max(0,p-1))}
                  disabled={employeePage===0}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-40"
                >
                  ◀ Попередня
                </button>

                <div className="text-sm font-semibold text-[#b8c0cb]">
                  Сторінка {employeePage+1} із {Math.ceil(employees.length/EMPLOYEES_PER_PAGE)}
                </div>

                <button
                  type="button"
                  onClick={() => setEmployeePage((p)=>Math.min(Math.ceil(employees.length/EMPLOYEES_PER_PAGE)-1,p+1))}
                  disabled={employeePage>=Math.ceil(employees.length/EMPLOYEES_PER_PAGE)-1}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-40"
                >
                  Наступна ▶
                </button>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/[0.08] pt-5">
              <button
                type="button"
                onClick={cancelSelection}
                className="h-[52px] rounded-[13px] border border-white/[0.11] bg-white/[0.035] text-[14px] font-bold text-[#c2c9d3] transition hover:bg-white/[0.08]"
              >
                Скасувати
              </button>

              <button
                type="button"
                onClick={confirmSelection}
                disabled={!pendingSelection}
                className="h-[52px] rounded-[13px] bg-gradient-to-r from-[#ff4b00] via-[#ff6500] to-[#ff3d18] text-[14px] font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-none disabled:bg-[#512617] disabled:text-white/35"
              >
                Підтвердити
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}