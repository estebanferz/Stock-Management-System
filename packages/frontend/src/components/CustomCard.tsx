import React from "react";

interface CustomCardProps{
  title: string,
  amount: string,
  secondaryData?: string,
}

export default function CustomCard({ title, amount, secondaryData }: CustomCardProps) {
  return (
    <div className="m-2 p-6 rounded-2xl shadow-xl bg-white hover:bg-gray-100 flex flex-col gap-2">
      <h2 className="text-xl font-semibold text-gray-700 text-center">
        {title}
      </h2>
      <div className="flex justify-evenly items-center">
        {secondaryData && (
          <div className="text-4xl font-bold text-gray-900 text-center" dangerouslySetInnerHTML={{ __html: secondaryData }} />
        )}
        <p className="text-4xl font-bold text-gray-900 text-center">
          {amount}
        </p>
      </div>
    </div>
  );
}
