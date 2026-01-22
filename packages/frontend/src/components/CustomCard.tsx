type Props = {
  title: string;
  description: string;
  amount: number | string;
  icon?: string | { src: string };
  secondaryData?: string;
};

export default function CustomCard({
  title,
  description,
  amount,
  icon,
  secondaryData,
}: Props) {
  const iconSrc = typeof icon === "string" ? icon : icon?.src;

  return (
    <div className="w-full h-auto bg-white p-1 transition hover:shadow-lg hover:bg-gray-100 cursor-pointer hover:scale-[1.02]">
      <div className="flex h-full items-center gap-4">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
          {iconSrc && (
            <img
              src={iconSrc}
              alt=""
              className="h-5 w-5 opacity-90"
            />
          )}
        </div>

        <div className="flex items-center1 justify-between w-full overflow-hidden">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-gray-800 text-left">
              {title}
            </h3>
            <p className="text-xs text-gray-600 text-left">
              {description}
            </p>
          </div>
          <span className="text-2xl font-semibold text-gray-800 leading-tight">
            {amount}
          </span>
          {secondaryData && (
            <div
              className="text-xs text-gray-500 mt-1 truncate"
              dangerouslySetInnerHTML={{ __html: secondaryData }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
