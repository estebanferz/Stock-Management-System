type Props = {
  title: string;
  amount: string;
  icon?: string | { src: string };
  secondaryData?: string,
};

export default function StatCard({ title, amount, icon, secondaryData }: Props) {
  const iconSrc = typeof icon === "string" ? icon : icon?.src;

  return (
    <div className=" w-full h-32 rounded-2xl border-black bg-white p-4 shadow-lg">
      <div className="flex flex-row h-full w-full items-center">
        {/* Icon block (top-left) */}
        <div className="flex md:h-1/2 lg:h-3/4 aspect-square rounded-2xl bg-gray-300 opacity-85 shadow-lg items-center justify-center">
          {iconSrc && <img src={iconSrc} className="h-1/2 w-1/2 fill-current" alt="" />}
        </div>

        {/* Title (top-ish, centered-left) */}
        <div className="flex flex-col gap-2 text-sm font-normal text-black w-full p-3">
          {title}
          <div className="lg:text-xl md:text-lg font-extrabold text-gray-700">
              {secondaryData && ( 
                <div className="md:text-lg lg:text-xl font-bold text-gray-900" dangerouslySetInnerHTML={{ __html: secondaryData }} /> 
              )}

              <p className="md:text-lg lg:text-xl font-bold text-gray-900"> 
                {amount} 
              </p> 
          </div>
        </div>
      </div>
        {/* Amount (bottom-right-ish) */}
    </div>
  );
}
