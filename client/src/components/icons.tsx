/* eslint-disable react/jsx-sort-props */
import * as React from "react";

import { IconSvgProps } from "@/types";

export const Logo: React.FC<IconSvgProps> = ({
  size = 28,
  height,
  ...props
}) => (
  <svg
    width={size || height}
    height={size || height}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.29289 2.29289C2.68342 1.90237 3.31658 1.90237 3.70711 2.29289L6.5 5.08579L9.29289 2.29289C9.68342 1.90237 10.3166 1.90237 10.7071 2.29289C11.0976 2.68342 11.0976 3.31658 10.7071 3.70711L7.91421 6.5L10.7071 9.29289C11.0976 9.68342 11.0976 10.3166 10.7071 10.7071C10.3166 11.0976 9.68342 11.0976 9.29289 10.7071L6.5 7.91421L3.70711 10.7071C3.31658 11.0976 2.68342 11.0976 2.29289 10.7071C1.90237 10.3166 1.90237 9.68342 2.29289 9.29289L5.08579 6.5L2.29289 3.70711C1.90237 3.31658 1.90237 2.68342 2.29289 2.29289ZM17.5 4C16.1193 4 15 5.11929 15 6.5C15 7.88071 16.1193 9 17.5 9C18.8807 9 20 7.88071 20 6.5C20 5.11929 18.8807 4 17.5 4ZM13 6.5C13 4.01472 15.0147 2 17.5 2C19.9853 2 22 4.01472 22 6.5C22 8.98528 19.9853 11 17.5 11C15.0147 11 13 8.98528 13 6.5ZM6.5 15C5.11929 15 4 16.1193 4 17.5C4 18.8807 5.11929 20 6.5 20C7.88071 20 9 18.8807 9 17.5C9 16.1193 7.88071 15 6.5 15ZM2 17.5C2 15.0147 4.01472 13 6.5 13C8.98528 13 11 15.0147 11 17.5C11 19.9853 8.98528 22 6.5 22C4.01472 22 2 19.9853 2 17.5ZM13.2929 13.2929C13.6834 12.9024 14.3166 12.9024 14.7071 13.2929L17.5 16.0858L20.2929 13.2929C20.6834 12.9024 21.3166 12.9024 21.7071 13.2929C22.0976 13.6834 22.0976 14.3166 21.7071 14.7071L18.9142 17.5L21.7071 20.2929C22.0976 20.6834 22.0976 21.3166 21.7071 21.7071C21.3166 22.0976 20.6834 22.0976 20.2929 21.7071L17.5 18.9142L14.7071 21.7071C14.3166 22.0976 13.6834 22.0976 13.2929 21.7071C12.9024 21.3166 12.9024 20.6834 13.2929 20.2929L16.0858 17.5L13.2929 14.7071C12.9024 14.3166 12.9024 13.6834 13.2929 13.2929Z"
      fill="currentColor"
    />
  </svg>
);

export const DiscordIcon: React.FC<IconSvgProps> = ({
  size = 24,
  width,
  height,
  ...props
}) => {
  return (
    <svg
      height={size || height}
      viewBox="0 0 24 24"
      width={size || width}
      {...props}
    >
      <path
        d="M14.82 4.26a10.14 10.14 0 0 0-.53 1.1 14.66 14.66 0 0 0-4.58 0 10.14 10.14 0 0 0-.53-1.1 16 16 0 0 0-4.13 1.3 17.33 17.33 0 0 0-3 11.59 16.6 16.6 0 0 0 5.07 2.59A12.89 12.89 0 0 0 8.23 18a9.65 9.65 0 0 1-1.71-.83 3.39 3.39 0 0 0 .42-.33 11.66 11.66 0 0 0 10.12 0q.21.18.42.33a10.84 10.84 0 0 1-1.71.84 12.41 12.41 0 0 0 1.08 1.78 16.44 16.44 0 0 0 5.06-2.59 17.22 17.22 0 0 0-3-11.59 16.09 16.09 0 0 0-4.09-1.35zM8.68 14.81a1.94 1.94 0 0 1-1.8-2 1.93 1.93 0 0 1 1.8-2 1.93 1.93 0 0 1 1.8 2 1.93 1.93 0 0 1-1.8 2zm6.64 0a1.94 1.94 0 0 1-1.8-2 1.93 1.93 0 0 1 1.8-2 1.92 1.92 0 0 1 1.8 2 1.92 1.92 0 0 1-1.8 2z"
        fill="currentColor"
      />
    </svg>
  );
};

export const GithubIcon: React.FC<IconSvgProps> = ({
  size = 24,
  width,
  height,
  ...props
}) => {
  return (
    <svg
      height={size || height}
      viewBox="0 0 24 24"
      width={size || width}
      {...props}
    >
      <path
        clipRule="evenodd"
        d="M12.026 2c-5.509 0-9.974 4.465-9.974 9.974 0 4.406 2.857 8.145 6.821 9.465.499.09.679-.217.679-.481 0-.237-.008-.865-.011-1.696-2.775.602-3.361-1.338-3.361-1.338-.452-1.152-1.107-1.459-1.107-1.459-.905-.619.069-.605.069-.605 1.002.07 1.527 1.028 1.527 1.028.89 1.524 2.336 1.084 2.902.829.091-.645.351-1.085.635-1.334-2.214-.251-4.542-1.107-4.542-4.93 0-1.087.389-1.979 1.024-2.675-.101-.253-.446-1.268.099-2.64 0 0 .837-.269 2.742 1.021a9.582 9.582 0 0 1 2.496-.336 9.554 9.554 0 0 1 2.496.336c1.906-1.291 2.742-1.021 2.742-1.021.545 1.372.203 2.387.099 2.64.64.696 1.024 1.587 1.024 2.675 0 3.833-2.33 4.675-4.552 4.922.355.308.675.916.675 1.846 0 1.334-.012 2.41-.012 2.737 0 .267.178.577.687.479C19.146 20.115 22 16.379 22 11.974 22 6.465 17.535 2 12.026 2z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
};

export const MoonFilledIcon = ({
  size = 24,
  width,
  height,
  ...props
}: IconSvgProps) => (
  <svg
    aria-hidden="true"
    focusable="false"
    height={size || height}
    role="presentation"
    viewBox="0 0 24 24"
    width={size || width}
    {...props}
  >
    <path
      d="M21.53 15.93c-.16-.27-.61-.69-1.73-.49a8.46 8.46 0 01-1.88.13 8.409 8.409 0 01-5.91-2.82 8.068 8.068 0 01-1.44-8.66c.44-1.01.13-1.54-.09-1.76s-.77-.55-1.83-.11a10.318 10.318 0 00-6.32 10.21 10.475 10.475 0 007.04 8.99 10 10 0 002.89.55c.16.01.32.02.48.02a10.5 10.5 0 008.47-4.27c.67-.93.49-1.519.32-1.79z"
      fill="currentColor"
    />
  </svg>
);

export const SunFilledIcon = ({
  size = 24,
  width,
  height,
  ...props
}: IconSvgProps) => (
  <svg
    aria-hidden="true"
    focusable="false"
    height={size || height}
    role="presentation"
    viewBox="0 0 24 24"
    width={size || width}
    {...props}
  >
    <g fill="currentColor">
      <path d="M19 12a7 7 0 11-7-7 7 7 0 017 7z" />
      <path d="M12 22.96a.969.969 0 01-1-.96v-.08a1 1 0 012 0 1.038 1.038 0 01-1 1.04zm7.14-2.82a1.024 1.024 0 01-.71-.29l-.13-.13a1 1 0 011.41-1.41l.13.13a1 1 0 010 1.41.984.984 0 01-.7.29zm-14.28 0a1.024 1.024 0 01-.71-.29 1 1 0 010-1.41l.13-.13a1 1 0 011.41 1.41l-.13.13a1 1 0 01-.7.29zM22 13h-.08a1 1 0 010-2 1.038 1.038 0 011.04 1 .969.969 0 01-.96 1zM2.08 13H2a1 1 0 010-2 1.038 1.038 0 011.04 1 .969.969 0 01-.96 1zm16.93-7.01a1.024 1.024 0 01-.71-.29 1 1 0 010-1.41l.13-.13a1 1 0 011.41 1.41l-.13.13a.984.984 0 01-.7.29zm-14.02 0a1.024 1.024 0 01-.71-.29l-.13-.14a1 1 0 011.41-1.41l.13.13a1 1 0 010 1.41.97.97 0 01-.7.3zM12 3.04a.969.969 0 01-1-.96V2a1 1 0 012 0 1.038 1.038 0 01-1 1.04z" />
    </g>
  </svg>
);

export const SearchIcon = (props: IconSvgProps) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path
      d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="M22 22L20 20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);
export const Group = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height={size}
    role="presentation"
    viewBox="0 0 24 24"
    width={size}
    {...props}
  >
    <path
      d="M3.5 8a5.5 5.5 0 1 1 8.596 4.547 9.005 9.005 0 0 1 5.9 8.18.75.75 0 0 1-1.5.045 7.5 7.5 0 0 0-14.993 0 .75.75 0 0 1-1.499-.044 9.005 9.005 0 0 1 5.9-8.181A5.494 5.494 0 0 1 3.5 8zM9 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
      fill="currentColor"
      fillRule="evenodd"
    />
    <path
      d="M17.29 8c-.148 0-.292.01-.434.03a.75.75 0 1 1-.212-1.484 4.53 4.53 0 0 1 3.38 8.097 6.69 6.69 0 0 1 3.956 6.107.75.75 0 0 1-1.5 0 5.193 5.193 0 0 0-3.696-4.972l-.534-.16v-1.676l.41-.209A3.03 3.03 0 0 0 17.29 8z"
      fill="currentColor"
    />
  </svg>
);

export const Bot = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    height={size}
    viewBox="0 0 32 32"
    width={size}
    {...props}
  >
    <path
      fill="currentColor"
      d="M29.237 15.476c-.269-.65-.846-.807-1.237-.844v-3.965A2.67 2.67 0 0 0 25.333 8h-8V6.147a1.984 1.984 0 0 0 .081-2.895A2 2 0 0 0 14 4.667c0 .589.26 1.114.667 1.48V8h-8A2.67 2.67 0 0 0 4 10.667v3.996l-.11.008A1.333 1.333 0 0 0 2.654 16v2.667A1.333 1.333 0 0 0 3.987 20H4v6.667a2.67 2.67 0 0 0 2.667 2.666h18.666A2.67 2.67 0 0 0 28 26.667V20a1.334 1.334 0 0 0 1.333-1.333v-2.584a1.34 1.34 0 0 0-.096-.607Zm-22.57 11.19v-16h18.666l.002 5.329-.002.005v2.667l.002.006.001 7.994H6.666Z"
    />
    <path
      fill="currentColor"
      d="M11.333 18.667c1.105 0 2-1.194 2-2.667 0-1.473-.895-2.667-2-2.667-1.104 0-2 1.194-2 2.667 0 1.473.896 2.667 2 2.667ZM20.667 18.667c1.104 0 2-1.194 2-2.667 0-1.473-.896-2.667-2-2.667-1.105 0-2 1.194-2 2.667 0 1.473.895 2.667 2 2.667ZM10.667 21.333h10.666V24H10.667v-2.667Z"
    />
  </svg>
);

export const Controller = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    fill="none"
    height={size}
    viewBox="0 0 24 24"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g fill="currentColor">
      <path d="M8 8.5a1 1 0 0 0-2 0V9h-.5a1 1 0 1 0 0 2H6v.5a1 1 0 1 0 2 0V11h.5a1 1 0 1 0 0-2H8v-.5ZM18 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM17 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM16 10a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM19 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
      <path
        clipRule="evenodd"
        d="M12 3c-1.812 0-4.038.258-5.782.51-2.275.327-4.127 2.007-4.608 4.278-.27 1.271-.533 2.774-.594 4.032a106.51 106.51 0 0 1-.239 3.372c-.105 1.258.314 2.554 1.084 3.476.785.94 2.028 1.575 3.463 1.173.918-.257 1.652-.902 2.197-1.538.556-.65.999-1.39 1.314-1.993.243-.463.674-.724 1.08-.724h4.17c.406 0 .837.26 1.08.724.315.602.758 1.343 1.315 1.993.544.636 1.278 1.281 2.196 1.538 1.435.402 2.678-.232 3.463-1.173.77-.922 1.189-2.218 1.084-3.476-.101-1.209-.196-2.47-.24-3.372-.06-1.258-.324-2.76-.593-4.032-.481-2.271-2.333-3.951-4.608-4.279C16.038 3.26 13.812 3 12 3ZM6.503 5.489C8.227 5.24 10.337 5 12 5c1.663 0 3.773.24 5.497.489 1.468.211 2.634 1.286 2.936 2.714.264 1.243.5 2.62.553 3.713.045.94.143 2.23.244 3.442.061.738-.196 1.513-.626 2.029-.415.497-.895.666-1.389.528-.365-.102-.782-.406-1.216-.913-.422-.493-.785-1.089-1.063-1.62-.532-1.015-1.588-1.796-2.851-1.796h-4.17c-1.263 0-2.32.78-2.851 1.796-.278.531-.641 1.127-1.063 1.62-.434.507-.85.81-1.216.913-.494.138-.974-.031-1.389-.528-.43-.516-.687-1.291-.626-2.029.101-1.212.199-2.502.244-3.442.053-1.094.29-2.47.553-3.713.302-1.428 1.468-2.503 2.936-2.714Z"
        fillRule="evenodd"
      />
    </g>
  </svg>
);

export const Link = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    fill="none"
    height={size}
    viewBox="0 0 24 24"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g stroke="currentColor" strokeLinecap="round" strokeWidth={1.5}>
      <path d="m14.162 18.488-.72.72a6.117 6.117 0 0 1-8.65-8.65l.72-.72M9.837 14.162l4.325-4.325M9.837 5.512l.721-.72a6.117 6.117 0 0 1 8.65 0m-.72 9.37.72-.72A6.099 6.099 0 0 0 20.998 9" />
    </g>
  </svg>
);

export const Lock = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    fill="none"
    height={size}
    viewBox="0 0 24 24"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12 14.5v2m-5-6.471C7.471 10 8.053 10 8.8 10h6.4c.747 0 1.329 0 1.8.029m-10 0c-.588.036-1.006.117-1.362.298a3 3 0 0 0-1.311 1.311C4 12.28 4 13.12 4 14.8v1.4c0 1.68 0 2.52.327 3.162a3 3 0 0 0 1.311 1.311C6.28 21 7.12 21 8.8 21h6.4c1.68 0 2.52 0 3.162-.327a3 3 0 0 0 1.311-1.311C20 18.72 20 17.88 20 16.2v-1.4c0-1.68 0-2.52-.327-3.162a3 3 0 0 0-1.311-1.311c-.356-.181-.774-.262-1.362-.298m-10 0V8a5 5 0 0 1 10 0v2.029"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1}
    />
  </svg>
);

export const Chat = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    fill="none"
    height={size}
    viewBox="0 0 24 24"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    {...props}
  >
    <g>
      <path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 1.6.376 3.112 1.043 4.453.178.356.237.763.134 1.148l-.595 2.226a1.3 1.3 0 0 0 1.591 1.591l2.226-.595a1.634 1.634 0 0 1 1.149.133A9.958 9.958 0 0 0 12 22Z"
        strokeWidth={1.5}
      />
      <path
        d="M8 12h.009m3.982 0H12m3.991 0H16"
        opacity={1}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </g>
  </svg>
);

export const X = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    {...props}
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const O = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    strokeWidth={2}
    {...props}
  >
    <circle cx={12} cy={12} r={8} stroke="currentColor" />
  </svg>
);

export const OpenSyntaxIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 1024 1024"
    fill="none"
    {...props}
  >
    <path
      fill="currentColor"
      d="m 669.67396,466.17808 c 17.40766,-12.236 70.7828,1.95262 89.80893,11.459 33.68002,46.94067 57.32497,89.71935 44.90444,150.49391 -48.35422,236.61545 -391.10466,279.92789 -522.11822,88.18225 -27.28732,-39.88352 -30.68978,-62.7576 -43.42792,-105.66465 27.7029,21.55319 55.04766,31.33658 88.78852,39.1099 32.98061,7.02675 58.62244,1.96277 89.05205,-10.4016 31.83859,36.47149 58.41635,61.07186 101.31041,78.50359 98.01944,39.83622 193.87982,-30.62039 185.31115,-135.79181 -4.2607,-52.30194 -13.39363,-70.09852 -33.62936,-115.89059 z"
    />
    <path
      fill="currentColor"
      d="M 268.59166,539.49606 C 249.82909,517.77735 233.18842,493.12294 227.75867,465.47541 182.91503,237.15017 486.27185,118.97251 656.86149,227.9546 c 75.86793,48.46762 110.44334,97.32377 131.31429,181.11767 -23.2699,-18.23912 -64.65364,-32.85677 -94.41087,-36.40731 -19.62753,-6.80716 -61.08222,0.43917 -80.87194,9.84082 -27.62182,-27.22525 -48.82051,-50.38986 -83.47365,-67.93644 -53.86507,-27.27255 -121.50559,-33.21487 -166.32219,14.04334 -62.35605,65.76087 -38.0894,155.21333 -4.01403,226.8726 -18.45509,12.9015 -71.94513,-5.67882 -90.49144,-15.98922 z"
    />
    <path
      fill="currentColor"
      d="m 612.89297,382.50578 c 19.78972,-9.40165 61.24441,-16.64798 80.87194,-9.84082 1.29071,4.41875 24.87485,30.57985 30.91955,39.99501 14.65391,22.82003 25.34111,38.94775 34.79843,64.97711 -19.02613,-9.50638 -72.40127,-23.695 -89.80893,-11.459 -2.30774,-2.43572 -15.29252,-24.999 -18.37738,-30.20824 -12.91721,-21.8302 -21.47913,-34.89048 -38.40361,-53.46406 z"
    />
    <path
      fill="currentColor"
      d="m 268.59166,539.49606 c 18.54631,10.3104 72.03635,28.89072 90.49144,15.98922 5.73723,5.17884 19.32007,33.22501 25.19583,41.95776 10.50473,15.60073 19.72552,27.82658 32.40283,41.91385 -30.42961,12.36437 -56.07144,17.42835 -89.05205,10.4016 l 3.47342,-1.90531 c -1.16232,-5.53019 -19.48564,-26.3503 -25.00999,-34.27903 -17.63067,-25.30979 -27.93269,-44.86305 -37.50148,-74.07809 z"
    />
  </svg>
);

export const KeyboardIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x={2} y={4} width={20} height={16} rx={2} ry={2} />
    <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M7 16h10" />
  </svg>
);

export const CoffeeIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
    <line x1={6} y1={2} x2={6} y2={4} />
    <line x1={10} y1={2} x2={10} y2={4} />
    <line x1={14} y1={2} x2={14} y2={4} />
  </svg>
);

export const LightningIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

export const Person = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

export const InfoIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx={12} cy={12} r={10} />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

export const HashIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);

export const Check = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const AlertCircle = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx={12} cy={12} r={10} />
    <line x1={12} y1={8} x2={12} y2={12} />
    <line x1={12} y1={16} x2={12.01} y2={16} />
  </svg>
);

export const WifiOff = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1={1} y1={1} x2={23} y2={23} />
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1={12} y1={20} x2={12.01} y2={20} />
  </svg>
);

export const Copy = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x={9} y={9} width={13} height={13} rx={2} ry={2} />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const RefreshCw = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

export const MessageCircle = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

export const Send = ({ size = 24, ...props }: IconSvgProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m22 2-7 20-4-9-9-4z" />
    <path d="M22 2 11 13" />
  </svg>
);
