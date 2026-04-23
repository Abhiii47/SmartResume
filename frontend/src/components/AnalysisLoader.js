import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Search, BarChart2, CheckCircle } from "lucide-react";

export default function AnalysisLoader() {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        { text: "Reading PDF Content...", icon: FileText, color: "text-gray-400" },
        { text: "Analyzing Keywords...", icon: Search, color: "text-gray-600" },
        { text: "Checking Formatting...", icon: BarChart2, color: "text-gray-700" },
        { text: "Finalizing ATS Score...", icon: CheckCircle, color: "text-gray-900" },
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 1500);

        return () => clearInterval(timer);
    }, []);

    const CurrentIcon = steps[currentStep].icon;

    return (
        <div className="w-full flex flex-col items-center justify-center py-12 space-y-8">
            {/* Elegant Scanning Animation */}
            <div className="relative w-24 h-24 flex items-center justify-center">

                {/* Outer Ring */}
                <motion.div
                    className="absolute inset-0 border-2 border-gray-100 rounded-full"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Scanning Line Effect */}
                <div className="absolute inset-0 rounded-full overflow-hidden">
                    <motion.div
                        className="w-full h-1 bg-gradient-to-r from-transparent via-gray-900 to-transparent opacity-50 absolute top-0"
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
                    className={`relative z-10 w-16 h-16 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center ${steps[currentStep].color}`}
                >
                    <CurrentIcon size={32} strokeWidth={1.5} />
                </motion.div>
            </div>

            {/* Text Animation */}
            <div className="h-16 flex flex-col items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-col items-center space-y-2"
                    >
                        <h3 className="text-xl font-bold text-gray-900 font-display">
                            {steps[currentStep].text}
                        </h3>
                        <p className="text-sm text-gray-400">Processing resume details...</p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Progress Bar (Monochrome) */}
            <div className="w-64 h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
                <motion.div
                    className="absolute top-0 left-0 h-full bg-gray-900"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    transition={{ duration: 1.5, ease: "linear" }}
                />
            </div>
        </div>
    );
}
