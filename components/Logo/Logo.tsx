type LogoProps = {
  width?: number;
  height?: number;
};

export default function Logo({
  width = 182,
  height = 54,
}: LogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 430 116"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ТЕМА"
    >
      {/* Т */}
      <path d="M0 0H88V19H55V108H32V19H0V0Z" fill="white" />

      {/* Е */}
      <rect x="101" y="0" width="82" height="19" fill="white" />
      <rect x="101" y="44" width="67" height="19" fill="white" />
      <rect x="101" y="89" width="82" height="19" fill="white" />

      {/* М */}
      <path
        d="M198 0H225L258 70L291 0H318V108H294V43L267 99H249L222 43V108H198V0Z"
        fill="white"
      />

      {/* А без перекладины */}
      <path
        d="M322 108L358 0H393L426 108H398L375.5 29L352 108H322Z"
        fill="#ff5a00"
      />
    </svg>
  );
}