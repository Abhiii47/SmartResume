import React, { useState } from "react";
import { cn } from "../../utils";



export function Skills({ items = [] }) {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    // Use provided items or fallback to default for demo/empty state
    const displaySkills = items.length > 0 ? items : [
        { name: "ATS Score", level: 0 },
        { name: "Keywords", level: 0 },
        { name: "Formatting", level: 0 }
    ];

    return (
        <div className="flex flex-col w-full">
            <div className="flex items-center gap-4 mb-6">
                <div className="h-px w-12 bg-gray-900/20 dark:bg-white/10" />
                <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gray-500">Analysis Breakdown</span>
            </div>

            {/* Skills list */}
            <div className="flex flex-col gap-1">
                {displaySkills.map((skill, index) => (
                    <div
                        key={skill.name}
                        className="group relative"
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <div
                            className={cn(
                                "relative flex items-center justify-between py-5 px-4 -mx-4 cursor-pointer",
                                "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                                "rounded-lg",
                                hoveredIndex === index ? "bg-gray-900/[0.03] dark:bg-white/[0.05]" : "bg-transparent",
                            )}
                        >
                            {/* Left side - skill name with animated elements */}
                            <div className="relative flex items-center gap-4">
                                <div
                                    className={cn(
                                        "h-5 w-0.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                                        hoveredIndex === index ? "bg-purple-600 scale-y-100 opacity-100" : "bg-gray-200 scale-y-50 opacity-0",
                                    )}
                                />

                                {/* Skill name */}
                                <span
                                    className={cn(
                                        "text-base font-medium tracking-tight transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                                        hoveredIndex === index ? "text-gray-900 dark:text-white translate-x-0" : "text-gray-500 -translate-x-5",
                                    )}
                                >
                                    {skill.name}
                                </span>
                            </div>

                            {/* Right side - progress visualization */}
                            <div className="flex items-center gap-4">
                                <div className="relative w-24 h-1 rounded-full overflow-hidden bg-gray-200/50 dark:bg-white/10">
                                    {/* Background track */}
                                    <div className="absolute inset-0 bg-gray-100/50 dark:bg-white/5" />

                                    {/* Animated fill */}
                                    <div
                                        className={cn(
                                            "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                                            "bg-gradient-to-r from-purple-500/80 to-purple-600",
                                        )}
                                        style={{
                                            width: hoveredIndex === index ? `${skill.level}%` : "0%",
                                            transitionDelay: hoveredIndex === index ? "100ms" : "0ms",
                                        }}
                                    />

                                    {/* Shine effect on hover */}
                                    <div
                                        className={cn(
                                            "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent",
                                            "transition-transform duration-700 ease-out",
                                            hoveredIndex === index ? "translate-x-full" : "-translate-x-full",
                                        )}
                                        style={{
                                            transitionDelay: hoveredIndex === index ? "300ms" : "0ms",
                                        }}
                                    />
                                </div>

                                <div className="relative w-10 overflow-hidden">
                                    <span
                                        className={cn(
                                            "block text-sm font-mono tabular-nums text-right",
                                            "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                                            hoveredIndex === index
                                                ? "text-gray-900 dark:text-white opacity-100 translate-y-0 blur-0"
                                                : "text-gray-400 opacity-0 translate-y-3 blur-sm",
                                        )}
                                    >
                                        {skill.level}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {index < displaySkills.length - 1 && (
                            <div
                                className={cn(
                                    "mx-4 h-px transition-all duration-500",
                                    hoveredIndex === index || hoveredIndex === index + 1
                                        ? "bg-transparent"
                                        : "bg-gray-200/30 dark:bg-white/10",
                                )}
                            />
                        )}
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-3 mt-10 pt-6 border-t border-gray-200/30 dark:border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500/60 animate-pulse" />
                <p className="text-[11px] text-gray-500 tracking-wide">Hover to explore</p>
            </div>
        </div>
    );
}

export default Skills;
