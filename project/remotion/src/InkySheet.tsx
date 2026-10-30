// Лист персонажа: 8 эмоций/жестов на фоне как у референса (бирюза) и рядом на тёмном фоне канала.
import React from "react";
import { AbsoluteFill } from "remotion";
import { Inky, InkyExpr, InkyHand } from "./inky";
const CELLS: [InkyExpr, InkyHand, string, [number, number], number][] = [
  ["think", "chin", "думает", [0.6, -0.4], 0], ["surprised", "down", "удивлён", [0, 0], 0], ["smug", "point", "ехидный", [0.8, 0], 0],
  ["happy", "wave", "рад", [0, 0], 0], ["scared", "up", "испуган", [-0.6, 0], 0], ["shock", "up", "шок", [0, 0], 0],
  ["neutral", "down", "спокойный", [0.3, 0.2], 1], ["sad", "down", "грустный", [-0.3, 0.4], 0],
];
export const InkySheet: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(#2fd8f0, #1bb8dc)" }}>
    <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
      {CELLS.map(([ex, hand, label, look, mark], i) => {
        const cx = (i % 2) * 540, cy = Math.floor(i / 2) * 470 + 20;
        return (<g key={i}>
          {i === 6 ? <rect x={cx + 10} y={cy} width={520} height={450} rx={30} fill="#120a26" /> : null}
          <Inky pose={{ t: 0.7 + i * 0.9, expr: ex, hand, look, mark, showMark: i === 0 || i === 6 }} x={cx + 50} y={cy - 40} scale={0.95} />
          <text x={cx + 270} y={cy + 440} fontSize={34} fontWeight={800} textAnchor="middle" fill={i === 6 ? "#fff" : "#08303a"} fontFamily="Arial">{label}{i === 6 ? " · «!»" : ""}</text>
        </g>);
      })}
    </svg>
  </AbsoluteFill>
);
