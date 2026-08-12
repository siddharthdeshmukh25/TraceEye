"use client";

import AgentCard from "@/components/agent-card";

export default function CardDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-16 px-2 sm:px-4 overflow-x-hidden">
      <div className="w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-[#10251C]" style={{ fontFamily: 'Playfair Display, serif' }}>
          Premium Agent Card Demo
        </h1>
        <AgentCard
          id="TE-20260811-A8DD16"
          title="Premium"
          highlightedWord="Roma"
          subtitle="Tomatoes"
          location="Nashik, Maharashtra"
          category="green valley"
          passportUrl="http://localhost:3000/trace/TE-20260811-A8DD16"
        />
      </div>
    </div>
  );
}