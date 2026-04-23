import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * GSAP Scroll Reveal Hook
 * Animates elements as they enter the viewport
 */
export const useGSAPReveal = (options = {}) => {
  const ref = useRef(null);
  const {
    delay = 0,
    duration = 1,
    y = 50,
    opacity = 0,
    ease = "power3.out",
  } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    gsap.fromTo(
      element,
      {
        y,
        opacity,
      },
      {
        y: 0,
        opacity: 1,
        duration,
        delay,
        ease,
        scrollTrigger: {
          trigger: element,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse",
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [delay, duration, y, opacity, ease]);

  return ref;
};

/**
 * GSAP Fade In Component
 */
export const GSAPFadeIn = ({ children, delay = 0, className = "" }) => {
  const ref = useGSAPReveal({ delay, opacity: 0, y: 30 });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

/**
 * GSAP Stagger Children Component
 */
export const GSAPStagger = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const children = element.children;
    gsap.fromTo(
      children,
      {
        y: 50,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        delay,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: element,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

/**
 * GSAP Smooth Scroll Setup
 */
export const useSmoothScroll = () => {
  useEffect(() => {
    // Smooth scroll behavior using GSAP
    if (typeof window !== "undefined") {
      // Enable smooth scrolling for anchor links
      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute("href"));
          if (target) {
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - 80;
            gsap.to(window, {
              duration: 1.5,
              scrollTo: { y: targetPosition },
              ease: "power3.inOut",
            });
          }
        });
      });
      
      // Enable smooth scrolling for buttons with onClick scroll
      document.querySelectorAll('[data-scroll-to]').forEach((button) => {
        button.addEventListener("click", function (e) {
          const targetId = this.getAttribute("data-scroll-to");
          const target = document.querySelector(targetId);
          if (target) {
            e.preventDefault();
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - 80;
            gsap.to(window, {
              duration: 1.5,
              scrollTo: { y: targetPosition },
              ease: "power3.inOut",
            });
          }
        });
      });
    }
  }, []);
};

/**
 * Smooth scroll to element helper using GSAP
 */
export const smoothScrollTo = (elementId, offset = 80) => {
  if (typeof window === "undefined") return;
  const target = document.querySelector(elementId);
  if (target) {
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
    gsap.to(window, {
      duration: 1.5,
      scrollTo: { y: targetPosition },
      ease: "power3.inOut",
    });
  }
};

/**
 * GSAP Parallax Effect
 */
export const useParallax = (speed = 0.5) => {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    gsap.to(element, {
      yPercent: -50 * speed,
      ease: "none",
      scrollTrigger: {
        trigger: element.parentElement,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [speed]);

  return ref;
};

