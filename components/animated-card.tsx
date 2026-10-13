"use client";

import { ReactNode, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  tiltIntensity?: number;
}

export default function AnimatedCard({
  children,
  className = "",
  tiltIntensity = 10,
}: AnimatedCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 300, damping: 25 });
  const mouseY = useSpring(y, { stiffness: 300, damping: 25 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [tiltIntensity, -tiltIntensity]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-tiltIntensity, tiltIntensity]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseXPos = (event.clientX - rect.left) / width - 0.5;
    const mouseYPos = (event.clientY - rect.top) / height - 0.5;

    x.set(mouseXPos);
    y.set(mouseYPos);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <motion.div
        style={{
          transform: "translateZ(20px)",
        }}
        animate={{
          boxShadow: isHovered
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            : "0 8px 0 -4px rgba(0, 0, 0, 0.05)",
        }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
