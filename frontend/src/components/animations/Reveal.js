import React, { useEffect, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";

/**
 * Reveal Component
 * Triggers animations when the element enters the viewport.
 * 
 * Props:
 * - children: The content to animate
 * - width: Width of the container (default: "fit-content")
 * - variant: "fade-up" | "fade-in" | "scale-up" | "slide-right"
 * - delay: Delay in seconds
 * - duration: Duration in seconds
 */
export const Reveal = ({
    children,
    width = "fit-content",
    variant = "fade-up",
    delay = 0,
    duration = 0.5,
    className = ""
}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px 0px" });
    const mainControls = useAnimation();

    useEffect(() => {
        if (isInView) {
            mainControls.start("visible");
        }
    }, [isInView, mainControls]);

    // Define variants logic
    const getVariants = () => {
        switch (variant) {
            case "fade-in":
                return {
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { duration, delay } },
                };
            case "scale-up":
                return {
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { opacity: 1, scale: 1, transition: { duration, delay, ease: "easeOut" } },
                };
            case "slide-right":
                return {
                    hidden: { opacity: 0, x: -75 },
                    visible: { opacity: 1, x: 0, transition: { duration, delay, ease: "easeOut" } },
                };
            case "fade-up":
            default:
                return {
                    hidden: { opacity: 0, y: 75 },
                    visible: { opacity: 1, y: 0, transition: { duration, delay, ease: "easeOut" } },
                };
        }
    };

    return (
        <div ref={ref} style={{ position: "relative", width, overflow: "hidden" }} className={className}>
            <motion.div
                variants={getVariants()}
                initial="hidden"
                animate={mainControls}
            >
                {children}
            </motion.div>
        </div>
    );
};
