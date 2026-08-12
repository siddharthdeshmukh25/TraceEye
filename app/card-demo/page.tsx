"use client";

import AgentCard from "@/components/agent-card";

export default function CardDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-12 text-[#10251C]" style={{ fontFamily: 'Playfair Display, serif' }}>
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