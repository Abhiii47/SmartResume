import React, { useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { StaggerText } from "./animations/StaggerText";
import { Reveal } from "./animations/Reveal";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

const HeroSection = ({ onUploadClick, onCheckScoreClick }) => {
    const heroRef = useRef(null);
    const titleRef = useRef(null);
    const featuresRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    });

    const yBackground = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacityBackground = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    // GSAP animations on mount
    useEffect(() => {
        if (titleRef.current) {
            gsap.fromTo(
                titleRef.current,
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1.2,
                    ease: "power3.out",
                    delay: 0.3,
                }
            );
        }

        if (featuresRef.current) {
            const features = featuresRef.current.children;
            gsap.fromTo(
                features,
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    stagger: 0.15,
                    ease: "power3.out",
                    delay: 0.8,
                    scrollTrigger: {
                        trigger: featuresRef.current,
                        start: "top 80%",
                        toggleActions: "play none none reverse",
                    },
                }
            );
        }
    }, []);

    return (
        <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-white pt-24">
            {/* Subtle grid background */}
            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            {/* Animated Background Blobs with Parallax - Muted Slate/Gray */}
            <motion.div
                style={{ y: yBackground, opacity: opacityBackground }}
                className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
                animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 10, -10, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
                style={{ y: yBackground, opacity: opacityBackground }}
                className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-300/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, -15, 15, 0],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20">
                <div className="text-center flex flex-col items-center">


                    {/* Main Headline */}
                    <div className="mb-8" ref={titleRef}>
                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-display font-bold text-foreground leading-[1.1] tracking-tight">
                            <StaggerText text="Build Job-Ready" className="justify-center" delay={0.2} />
                            <div className="flex justify-center gap-4 flex-wrap">
                                <span className="text-primary">
                                    <StaggerText text="Resumes" delay={0.6} className="justify-center" />
                                </span>
                                <StaggerText text="with AI" delay={0.8} className="justify-center" />
                            </div>
                        </h1>
                    </div>


                    <Reveal delay={1.1}>
                        <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-xl mx-auto leading-relaxed">
                            AI-powered resume review aligned with ATS & recruiters logic.
                        </p>
                    </Reveal>

                    {/* CTA Buttons */}
                    <Reveal delay={1.2} variant="scale-up">
                        <div className="flex flex-wrap gap-4 justify-center mb-24">
                            <button
                                onClick={onUploadClick}
                                className="group px-8 py-4 bg-primary text-primary-foreground rounded-xl font-medium text-lg shadow-lg hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3"
                            >
                                <span>Upload Resume</span>
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </button>
                            <button
                                onClick={onCheckScoreClick}
                                className="px-8 py-4 bg-background text-foreground border border-input rounded-xl font-medium text-lg hover:bg-accent hover:text-accent-foreground transition-all duration-300 flex items-center gap-2"
                            >
                                <span>Check ATS Score</span>
                            </button>
                        </div>
                    </Reveal>

                    {/* Features Grid */}
                    <div ref={featuresRef} className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
                        <Reveal delay={1.4} variant="fade-up" className="h-full">
                            <div className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-all duration-300 h-full group">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">Placement Ready</h3>
                                <p className="text-muted-foreground leading-relaxed">Optimized specifically for campus placements and internship drives.</p>
                            </div>
                        </Reveal>

                        <Reveal delay={1.5} variant="fade-up" className="h-full">
                            <div className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-all duration-300 h-full group">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">Instant ATS Score</h3>
                                <p className="text-muted-foreground leading-relaxed">Get accurate scores based on keyword matching and formatting rules.</p>
                            </div>
                        </Reveal>

                        <Reveal delay={1.6} variant="fade-up" className="h-full">
                            <div className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-all duration-300 h-full group">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">Career Growth</h3>
                                <p className="text-muted-foreground leading-relaxed">Tailored advice to help move from student to professional.</p>
                            </div>
                        </Reveal>
                    </div>


                </div>
            </div>
        </section>
    );
};

export default HeroSection;
