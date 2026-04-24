import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Search, BarChart2, CheckCircle } from "lucide-react";

export default function AnalysisLoader() {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        { text: "READING_SOURCE_PDF...", icon: FileText, color: "text-foreground" },
        { text: "EXTRACTING_KEYVECTORS...", icon: Search, color: "text-foreground" },
        { text: "VALIDATING_STRUCTURE...", icon: BarChart2, color: "text-foreground" },
        { text: "COMPUTING_FINAL_SCORE...", icon: CheckCircle, color: "text-foreground" },
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 1500);

        return () => clearInterval(timer);
    }, []);

    const CurrentIcon = steps[currentStep].icon;

    return (
        <div className="w-full flex flex-col items-center justify-center py-12 space-y-8 font-mono">
            {/* Brutalist Scanning Animation */}
            <div className="relative w-28 h-28 flex items-center justify-center">

                {/* Outer Frame */}
                <motion.div
                    className="absolute inset-0 border-4 border-foreground"
                    animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Scanning Line Effect */}
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                        className="w-full h-1 bg-foreground opacity-50 absolute top-0"
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                </div>

                {/* Icon Container */}
                <motion.div
                    key={currentStep}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`relative z-10 w-20 h-20 bg-white border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center ${steps[currentStep].color}`}
                >
                    <CurrentIcon size={40} strokeWidth={2.5} />
                </motion.div>
            </div>

            {/* Text Animation */}
            <div className="h-20 flex flex-col items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-col items-center space-y-2"
                    >
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tighter">
                            {steps[currentStep].text}
                        </h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">STATUS: IN_PROGRESS</p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Progress Bar (Brutalist) */}
            <div className="w-64 h-4 bg-muted border-2 border-foreground overflow-hidden relative">
                <motion.div
                    className="absolute top-0 left-0 h-full bg-foreground"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    transition={{ duration: 1.5, ease: "linear" }}
                />
            </div>
        </div>
    );
}
