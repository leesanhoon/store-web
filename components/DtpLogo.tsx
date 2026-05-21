"use client";

import React from "react";

const DtpLogo = ({ className = "" }: { className?: string }) => (
    <svg
        className={`text-brand-forest ${className}`}
        width="60"
        height="60"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="DTP Logo"
    >
        <defs>
            <linearGradient
                id="logoGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
            >
                <stop
                    offset="0%"
                    style={{
                        stopColor: "#059669",
                        stopOpacity: 1,
                    }}
                />
                <stop
                    offset="100%"
                    style={{
                        stopColor: "#064e3b",
                        stopOpacity: 1,
                    }}
                />
            </linearGradient>
        </defs>
        <g className="transform transition-transform duration-300 ease-in-out group-hover:scale-105">
            {/* D */}
            <path
                d="M20 20 H50 Q60 20 60 30 V70 Q60 80 50 80 H20 V20"
                fill="url(#logoGradient)"
                stroke="currentColor"
                strokeWidth="3"
                className="drop-shadow-sm"
            />
            {/* T */}
            <path
                d="M55 20 H85 M70 20 V80"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="drop-shadow-sm"
            />
            {/* P */}
            <path
                d="M80 50 H95 V80 H80"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="drop-shadow-sm"
            />
        </g>
    </svg>
);

export default DtpLogo;
