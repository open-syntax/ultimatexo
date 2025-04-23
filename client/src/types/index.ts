import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type Board = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];
