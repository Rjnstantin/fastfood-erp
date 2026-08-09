type FeatureType = "control" | "stock" | "staff" | "analytics";

type FeatureProps = {
  type: FeatureType;
  title: string;
  description: string;
};

const colors: Record<FeatureType, string> = {
  control: "border-orange-500/40 bg-orange-500/10 text-orange-400",
  stock: "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-400",
  staff: "border-green-500/40 bg-green-500/10 text-green-400",
  analytics: "border-sky-500/40 bg-sky-500/10 text-sky-400",
};

function Icon({ type }: { type: FeatureType }) {
  switch (type) {
    case "control":
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="5" r="2" />
          <circle cx="5" cy="19" r="2" />
          <circle cx="19" cy="19" r="2" />
          <path d="M11 7 6.5 17" />
          <path d="M13 7 17.5 17" />
          <path d="M7 19h10" />
        </svg>
      );

    case "stock":
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="20" r="1.5" />
          <circle cx="18" cy="20" r="1.5" />
          <path d="M2 3h3l2.5 11h11l2-8H6.5" />
        </svg>
      );

    case "staff":
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5" />
          <path d="M16 15c2.5 0 5 1.5 5 5" />
        </svg>
      );

    default:
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 20V10" />
          <path d="M10 20V6" />
          <path d="M16 20v-8" />
          <path d="M22 20V3" />
        </svg>
      );
  }
}

export default function Feature({
  type,
  title,
  description,
}: FeatureProps) {
  return (
    <div className="flex items-center gap-5">
      <div
        className={`flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-[15px] border ${colors[type]}`}
      >
        <Icon type={type} />
      </div>

      <div>
        <h3 className="text-[18px] font-semibold text-white">{title}</h3>

        <p className="mt-2 text-[15px] text-[#9ca9bd]">
          {description}
        </p>
      </div>
    </div>
  );
}