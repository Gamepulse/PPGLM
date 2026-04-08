import { FC } from "react";

interface LogoProps {
  onClick?: () => void;
}

export const Logo: FC<LogoProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2 cursor-pointer group"
      title="Pascal Personal Game Manager"
    >
      {/* Logo SVG - Style gaming moderne */}
      <div className="relative w-10 h-10 flex items-center justify-center">
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Hexagone de fond avec dégradé */}
          <path
            d="M20 2L36.5 11.5V30.5L20 40L3.5 30.5V11.5L20 2Z"
            className="fill-indigo-600 stroke-indigo-400"
            strokeWidth="2"
          />
          {/* P lettre centrale */}
          <text
            x="20"
            y="27"
            textAnchor="middle"
            className="fill-white font-bold text-lg"
            style={{ fontSize: "18px", fontWeight: "bold" }}
          >
            P
          </text>
        </svg>
      </div>

      {/* Texte PPGM */}
      <div className="flex flex-col">
        <span className="text-white font-bold text-lg leading-tight tracking-wide">
          PPGM
        </span>
        <span className="text-gray-400 text-[10px] leading-tight tracking-wider uppercase">
          Pascal Game Manager
        </span>
      </div>
    </div>
  );
}
