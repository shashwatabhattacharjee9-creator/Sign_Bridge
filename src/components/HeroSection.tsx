'use client';

import React, { useState, useRef } from 'react';
import { ChevronDown, Menu, X, ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react';

interface HeroSectionProps {
  onStartTranslating?: () => void;
  onPracticeSigns?: () => void;
  onOpenDictionary?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartTranslating,
  onPracticeSigns,
  onOpenDictionary,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [activeMobileAccordion, setActiveMobileAccordion] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (menuKey: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setOpenDropdown(menuKey);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  const toggleMobileAccordion = (key: string) => {
    setActiveMobileAccordion(activeMobileAccordion === key ? null : key);
  };

  const navLinks = [
    {
      key: 'technology',
      label: 'Technology',
      items: [
        { label: 'Edge Vision Engine', action: onStartTranslating },
        { label: 'Landmark Normalization', action: onStartTranslating },
        { label: '100% Offline TTS', action: onStartTranslating },
      ],
    },
    {
      key: 'solutions',
      label: 'Solutions',
      items: [
        { label: 'Campus Accessibility', action: onPracticeSigns },
        { label: 'Healthcare Triage', action: onStartTranslating },
        { label: 'Public Helpdesks', action: onStartTranslating },
        { label: 'Emergency Services', action: onStartTranslating },
      ],
    },
    {
      key: 'resources',
      label: 'Resources',
      items: [
        { label: 'ISL Vocabulary Bank', action: onOpenDictionary },
        { label: 'Sign-Along Guide', action: onPracticeSigns },
        { label: 'Benchmark Latency', action: onStartTranslating },
      ],
    },
    {
      key: 'dictionary',
      label: 'Dictionary',
      action: onOpenDictionary,
    },
  ];

  return (
    <section className="relative h-screen w-full overflow-hidden flex flex-col justify-between select-none">
      {/* Background Autoplaying Loop Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260703_053131_1ec3dd1c-d627-44fb-ab20-6e1fce41b0d5.mp4"
      />

      {/* Subtle Dark Overlay */}
      <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-30 w-full px-5 sm:px-6 md:px-12 lg:px-16 py-4 sm:py-5 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onStartTranslating}>
          {/* Inline SVG diamond/waveform bridge shape */}
          <svg
            className="w-7 h-7 shrink-0"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14 2L26 14L14 26L2 14L14 2Z"
              stroke="white"
              strokeWidth="2.2"
              strokeLinejoin="round"
              strokeOpacity="0.9"
            />
            <path
              d="M7 14C9.5 11 11.5 11 14 14C16.5 17 18.5 17 21 14"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.5"
            />
          </svg>
          <span className="text-white text-lg sm:text-xl font-medium tracking-tight">
            SignBridge
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-9">
          {navLinks.map((link) => {
            if (link.items) {
              const isOpen = openDropdown === link.key;
              return (
                <div
                  key={link.key}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(link.key)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    className="flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium transition-colors py-1 focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span>{link.label}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-white' : 'text-white/70'
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isOpen && (
                    <div
                      className="!absolute top-full left-0 mt-2 min-w-[190px] rounded-xl py-3 px-2 liquid-glass shadow-xl animate-dropdown z-40"
                      onMouseEnter={() => handleMouseEnter(link.key)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {link.items.map((subItem, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setOpenDropdown(null);
                            if (subItem.action) subItem.action();
                          }}
                          className="w-full text-left text-white/80 hover:text-white text-sm rounded-lg hover:bg-white/5 px-3 py-1.5 transition-colors block"
                        >
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={link.key}
                onClick={link.action}
                className="text-white/90 hover:text-white text-sm font-medium transition-colors py-1 focus:outline-none"
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex items-center gap-5">
          <button
            onClick={onPracticeSigns}
            className="text-white/90 hover:text-white text-sm font-medium transition-colors focus:outline-none"
          >
            Docs
          </button>
          <button
            onClick={onStartTranslating}
            className="liquid-glass rounded-full px-5 py-2 text-white text-sm font-medium hover:bg-white/10 transition-all focus:outline-none"
          >
            Launch Studio
          </button>
        </div>

        {/* Mobile Menu Trigger Button */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="relative w-10 h-10 flex items-center justify-center text-white focus:outline-none rounded-xl bg-white/5 border border-white/10"
            aria-label="Toggle navigation menu"
          >
            <div className="relative w-5 h-5">
              <Menu
                className={`absolute inset-0 w-5 h-5 transition-all duration-300 transform ${
                  mobileMenuOpen
                    ? 'opacity-0 rotate-90 scale-50'
                    : 'opacity-100 rotate-0 scale-100'
                }`}
              />
              <X
                className={`absolute inset-0 w-5 h-5 transition-all duration-300 transform ${
                  mobileMenuOpen
                    ? 'opacity-100 rotate-0 scale-100'
                    : 'opacity-0 -rotate-90 scale-50'
                }`}
              />
            </div>
          </button>
        </div>

        {/* Mobile Slide-In Menu */}
        <div
          className={`md:hidden absolute top-full left-0 right-0 z-50 px-5 sm:px-6 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            mobileMenuOpen
              ? 'opacity-100 translate-y-2 pointer-events-auto'
              : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
        >
          <div className="bg-black/95 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl border border-white/10 space-y-4 text-white">
            {navLinks.map((link) => {
              if (link.items) {
                const isOpen = activeMobileAccordion === link.key;
                return (
                  <div key={link.key} className="space-y-2">
                    <button
                      onClick={() => toggleMobileAccordion(link.key)}
                      className="w-full flex items-center justify-between text-base font-medium text-white/90 hover:text-white py-1.5 text-left"
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-white' : 'text-white/60'
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="pl-4 space-y-1.5 border-l border-white/10 ml-1 py-1">
                        {link.items.map((sub, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setMobileMenuOpen(false);
                              if (sub.action) sub.action();
                            }}
                            className="block w-full text-left text-sm text-white/70 hover:text-white py-1.5 transition-colors"
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={link.key}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (link.action) link.action();
                  }}
                  className="block w-full text-left text-base font-medium text-white/90 hover:text-white py-1.5"
                >
                  {link.label}
                </button>
              );
            })}

            {/* Mobile Footer Buttons */}
            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onPracticeSigns) onPracticeSigns();
                }}
                className="w-full py-2.5 text-center text-sm font-medium text-white/80 hover:text-white"
              >
                Docs
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onStartTranslating) onStartTranslating();
                }}
                className="w-full py-3 liquid-glass rounded-full text-center text-sm font-medium text-white shadow-lg"
              >
                Launch Studio
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Content (Top-Aligned, Below Nav) */}
      <div className="flex-1 flex items-start justify-center pt-16 sm:pt-20 md:pt-24 relative z-20">
        <div className="text-center max-w-4xl px-4 sm:px-6">
          {/* Main Heading */}
          <h1 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[1.05] tracking-[-0.02em] font-medium">
            Bridge the<br className="hidden sm:inline" /> silence.{' '}
            <span className="text-white/60">Real-time ISL,</span><br className="hidden sm:inline" />
            <span className="text-white/60">pure edge AI.</span>
          </h1>

          {/* Subheading */}
          <p className="text-white/80 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl mx-auto mt-6 sm:mt-8 font-normal">
            Zero-latency Indian Sign Language translation running 100% locally on your device.
            No cloud dependencies, no video uploads—just instant, private, two-way communication.
          </p>

          {/* Dual Action CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
            <button
              onClick={onStartTranslating}
              className="px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Start Translating</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onPracticeSigns}
              className="px-5 sm:px-6 py-2.5 sm:py-3 liquid-glass rounded-full text-white text-sm font-semibold hover:bg-white/10 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Practice Signs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Edge Indicator */}
      <div className="relative z-20 pb-4 px-6 flex justify-between items-center text-[11px] text-white/50 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Edge-AI Engine: Online (Client Local)</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-white/60">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero Server Data Ingestion</span>
        </div>
      </div>
    </section>
  );
};
