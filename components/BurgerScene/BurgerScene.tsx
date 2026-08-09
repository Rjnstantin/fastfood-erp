export default function BurgerScene() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-visible">
      <img
        src="/images/burger-scene.png"
        alt="Бургер ТЕМА з овочами"
        draggable={false}
        className="
          relative
          z-10
          h-auto
          w-[735px]
          max-w-none
          -translate-x-[8px]
          -translate-y-[28px]
          select-none
          object-contain
        "
      />
    </div>
  );
}