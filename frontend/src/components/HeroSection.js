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
        <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background pt-24 grid-bg">
            <div className="scanline"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20 w-full">
                <div className="flex flex-col items-start w-full">

                    <div className="mb-4">
                        <span className="index-label block mb-2">001.SYSTEM_STATUS</span>
                        <div className="w-16 h-1 bg-primary mb-8"></div>
                    </div>

                    <div className="mb-8 w-full" ref={titleRef}>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black text-foreground leading-[1] tracking-tighter uppercase">
                            <StaggerText text="Build" className="justify-start" delay={0.2} />
                            <StaggerText text="Job-Ready" className="justify-start" delay={0.4} />
                            <div className="flex justify-start gap-4 flex-wrap mt-2">
                                <span className="text-primary border-b-8 border-primary pb-1">
                                    <StaggerText text="Resumes" delay={0.6} className="justify-start" />
                                </span>
                                <StaggerText text="Resumes." delay={0.8} className="justify-start" />
                            </div>
                        </h1>
                    </div>

                    <Reveal delay={1.1}>
                        <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl font-mono leading-relaxed border-l-2 border-border pl-4">
                            &gt; Advanced resume review aligned with technical logic.
                            <br/>
                            &gt; Precision scoring. Zero guesswork.
                        </p>
                    </Reveal>

                    <Reveal delay={1.2}>
                        <div className="flex flex-wrap gap-6 mb-24 w-full">
                            <button
                                onClick={onUploadClick}
                                className="brutalist-btn brutalist-btn-primary px-8 py-4 text-lg flex items-center gap-3"
                            >
                                <span>[ UPLOAD_RESUME ]</span>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </button>
                            <button
                                onClick={onCheckScoreClick}
                                className="brutalist-btn px-8 py-4 text-lg flex items-center gap-2"
                            >
                                <span>&gt; CHECK_ATS_SCORE</span>
                            </button>
                        </div>
                    </Reveal>

                    {/* Features Grid */}
                    <div ref={featuresRef} className="grid md:grid-cols-3 gap-8 w-full border-t-2 border-border pt-12 mt-12 relative">
                        <div className="absolute top-0 left-0 w-4 h-4 bg-primary -translate-y-1/2"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 bg-primary -translate-y-1/2"></div>
                        
                        <Reveal delay={1.4} variant="fade-up" className="h-full">
                            <div className="brutalist-card p-8 h-full flex flex-col justify-between">
                                <div>
                                    <span className="index-label block mb-6">SEC.01</span>
                                    <h3 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">Placement<br/>Ready</h3>
                                </div>
                                <p className="text-muted-foreground font-mono text-sm leading-relaxed mt-4 pt-4 border-t border-border">Optimized specifically for campus placements and internship drives.</p>
                            </div>
                        </Reveal>

                        <Reveal delay={1.5} variant="fade-up" className="h-full">
                            <div className="brutalist-card p-8 h-full flex flex-col justify-between border-primary">
                                <div>
                                    <span className="index-label block mb-6 text-primary">SEC.02</span>
                                    <h3 className="text-2xl font-black text-primary mb-4 uppercase tracking-tight">Instant<br/>Diagnostic</h3>
                                </div>
                                <p className="text-muted-foreground font-mono text-sm leading-relaxed mt-4 pt-4 border-t border-border">Get accurate scores based on strict keyword matching and formatting rules.</p>
                            </div>
                        </Reveal>

                        <Reveal delay={1.6} variant="fade-up" className="h-full">
                            <div className="brutalist-card p-8 h-full flex flex-col justify-between">
                                <div>
                                    <span className="index-label block mb-6">SEC.03</span>
                                    <h3 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">Career<br/>Growth</h3>
                                </div>
                                <p className="text-muted-foreground font-mono text-sm leading-relaxed mt-4 pt-4 border-t border-border">Tailored advice to help move from student to professional engineer.</p>
                            </div>
                        </Reveal>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default HeroSection;

