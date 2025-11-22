import React from "react";

interface CustomCardProps{
  title: string,
  amount: string,
}

export default function CustomCard({ title, amount }: CustomCardProps) {
  return (
    <div className="m-2 p-6 rounded-2xl shadow-xl bg-white flex flex-col items-center justify-center gap-2">
      <h2 className="text-xl font-semibold text-gray-700 text-center">
        {title}
      </h2>
      <p className="text-4xl font-bold text-gray-900 text-center">
        {amount}
      </p>
    </div>
  );
}
