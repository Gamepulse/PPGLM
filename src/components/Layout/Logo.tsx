import { FC } from "react";

interface LogoProps {
  onClick?: () => void;
}

export const Logo: FC<LogoProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2 cursor-pointer group"
      title="Pascal's Personal Game Manager"
    >
      {/* Logo SVG - Manette de jeu moderne */}
      <div className="relative w-10 h-10 flex items-center justify-center">
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fond circulaire avec dégradé */}
          <circle
            cx="20"
            cy="20"
            r="18"
            className="fill-indigo-600"
          />
          
          {/* Corps de la manette */}
          <path
            d="M8 20 C8 14, 32 14, 32 20 C32 28, 28 30, 24 30 L24 26 C24 24, 16 24, 16 26 L16 30 C12 30, 8 28, 8 20Z"
            className="fill-indigo-400"
          />
          
          {/* Croix directionnelle gauche */}
          <rect x="11" y="19" width="6" height="2" rx="0.5" className="fill-indigo-700" />
          <rect x="13" y="17" width="2" height="6" rx="0.5" className="fill-indigo-700" />
          
          {/* Boutons ABXY droite */}
          <circle cx="26" cy="19" r="1.5" className="fill-indigo-800" />
          <circle cx="29" cy="22" r="1.5" className="fill-indigo-800" />
          <circle cx="23" cy="22" r="1.5" className="fill-indigo-800" />
          <circle cx="26" cy="25" r="1.5" className="fill-indigo-800" />
          
          {/* Stick analogique gauche */}
          <circle cx="14" cy="22" r="2.5" className="fill-indigo-500" />
          <circle cx="14" cy="22" r="1.5" className="fill-indigo-300" />
        </svg>
      </div>

      {/* Texte PPGM */}
      <div className="flex flex-col">
        <span className="text-white font-bold text-lg leading-tight tracking-wide">
          PPGM
        </span>
        <span className="text-gray-400 text-[10px] leading-tight tracking-wider uppercase">
          Pascal's Personal Game Manager
        </span>
      </div>
    </div>
  );
}
