"use client";

import React, { useMemo } from "react";

// ── Minimal Self-Contained QR Code Generator (Byte Mode, EC M) ───────────────
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);

for (let i = 0, x = 1; i < 256; i++) {
  EXP_TABLE[i] = x;
  LOG_TABLE[x] = i;
  x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
}

function glog(n: number): number {
  if (n < 1) return 0;
  return LOG_TABLE[n];
}

function gexp(n: number): number {
  while (n < 0) n += 255;
  while (n >= 255) n -= 255;
  return EXP_TABLE[n];
}

function polyMultiply(p1: number[], p2: number[]): number[] {
  const result = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= gexp(glog(p1[i]) + glog(p2[j]));
    }
  }
  return result;
}

function getGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    poly = polyMultiply(poly, [1, gexp(i)]);
  }
  return poly;
}

function calcErrorCorrection(data: number[], ecCount: number): number[] {
  const gen = getGeneratorPoly(ecCount);
  const info = [...data, ...new Array(ecCount).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const lead = info[i];
    if (lead !== 0) {
      const factor = glog(lead);
      for (let j = 0; j < gen.length; j++) {
        info[i + j] ^= gexp(glog(gen[j]) + factor);
      }
    }
  }
  return info.slice(data.length);
}

interface VersionDef {
  version: number;
  size: number;
  total: number;
  ec: number;
  data: number;
}

const VERSION_INFO: (VersionDef | null)[] = [
  null,
  { version: 1, size: 21, total: 26, ec: 10, data: 16 },
  { version: 2, size: 25, total: 44, ec: 16, data: 28 },
  { version: 3, size: 29, total: 70, ec: 26, data: 44 },
  { version: 4, size: 33, total: 100, ec: 36, data: 64 },
  { version: 5, size: 37, total: 134, ec: 48, data: 86 },
  { version: 6, size: 41, total: 172, ec: 64, data: 108 },
  { version: 7, size: 45, total: 196, ec: 72, data: 124 },
  { version: 8, size: 49, total: 242, ec: 88, data: 154 },
];

function generateQRMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);
  let vInfo = VERSION_INFO[1]!;
  for (let v = 1; v < VERSION_INFO.length; v++) {
    const cur = VERSION_INFO[v];
    if (cur && bytes.length + 3 <= cur.data) {
      vInfo = cur;
      break;
    }
  }

  const { version, size, ec, data: dataCap } = vInfo;

  // 1. Bitstream construction (Byte mode = 0b0100)
  const bitStream: number[] = [];
  function pushBits(val: number, bits: number) {
    for (let i = bits - 1; i >= 0; i--) {
      bitStream.push((val >> i) & 1);
    }
  }

  pushBits(0b0100, 4); // Byte mode
  pushBits(bytes.length, 8); // Count
  for (const b of bytes) {
    pushBits(b, 8);
  }

  // Terminator
  const maxDataBits = dataCap * 8;
  const termLen = Math.min(4, maxDataBits - bitStream.length);
  pushBits(0, termLen);

  while (bitStream.length % 8 !== 0) {
    bitStream.push(0);
  }

  const padBytes = [0xec, 0x11];
  let pIdx = 0;
  while (bitStream.length < maxDataBits) {
    pushBits(padBytes[pIdx % 2], 8);
    pIdx++;
  }

  const dataCodewords: number[] = [];
  for (let i = 0; i < bitStream.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bitStream[i + j];
    }
    dataCodewords.push(b);
  }

  const ecCodewords = calcErrorCorrection(dataCodewords, ec);
  const allCodewords = [...dataCodewords, ...ecCodewords];

  // 2. Initialize Matrix
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );
  const isFunction: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  function setModule(r: number, c: number, val: boolean, isFunc = false) {
    matrix[r][c] = val;
    if (isFunc) isFunction[r][c] = true;
  }

  function placeFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        const isBorder = r === -1 || r === 7 || c === -1 || c === 7;
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        setModule(nr, nc, !isBorder && (isOuter || isInner), true);
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === null) setModule(6, i, i % 2 === 0, true);
    if (matrix[i][6] === null) setModule(i, 6, i % 2 === 0, true);
  }

  // Alignment patterns
  if (version >= 2) {
    const alignPos: Record<number, number[]> = {
      2: [6, 18],
      3: [6, 22],
      4: [6, 26],
      5: [6, 30],
      6: [6, 34],
      7: [6, 22, 38],
      8: [6, 24, 42],
    };
    const coords = alignPos[version] || [6, size - 7];
    for (const r of coords) {
      for (const c of coords) {
        if (isFunction[r][c]) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isCenter = dr === 0 && dc === 0;
            const isBox = Math.abs(dr) === 2 || Math.abs(dc) === 2;
            setModule(r + dr, c + dc, isCenter || isBox, true);
          }
        }
      }
    }
  }

  setModule(size - 8, 8, true, true);

  // Reserve format area
  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === null) isFunction[8][i] = true;
    if (matrix[i][8] === null) isFunction[i][8] = true;
  }
  for (let i = size - 8; i < size; i++) {
    if (matrix[8][i] === null) isFunction[8][i] = true;
    if (matrix[i][8] === null) isFunction[i][8] = true;
  }

  // Place data bits
  let bitIdx = 0;
  const bitArray: boolean[] = [];
  for (const cw of allCodewords) {
    for (let i = 7; i >= 0; i--) {
      bitArray.push(((cw >> i) & 1) === 1);
    }
  }

  let right = size - 1;
  let upward = true;

  while (right > 0) {
    if (right === 6) right--;
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const c of [right, right - 1]) {
        if (!isFunction[r][c]) {
          const bitVal = bitIdx < bitArray.length ? bitArray[bitIdx++] : false;
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = bitVal !== mask;
        }
      }
    }
    upward = !upward;
    right -= 2;
  }

  // Format string for EC M, Mask 0
  const formatBits = "101010000010010".split("").map((b) => b === "1");
  for (let i = 0; i < 6; i++) matrix[8][i] = formatBits[i];
  matrix[8][7] = formatBits[6];
  matrix[8][8] = formatBits[7];
  matrix[7][8] = formatBits[8];
  for (let i = 0; i < 6; i++) matrix[5 - i][8] = formatBits[9 + i];

  for (let i = 0; i < 8; i++) matrix[8][size - 1 - i] = formatBits[i];
  for (let i = 0; i < 7; i++) matrix[size - 7 + i][8] = formatBits[8 + i];

  return matrix.map((row) => row.map((cell) => cell ?? false));
}

interface QRCodeSVGProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QRCodeSVG({
  value,
  size = 200,
  className = "",
}: QRCodeSVGProps) {
  const matrix = useMemo(() => {
    try {
      return generateQRMatrix(value);
    } catch {
      return [];
    }
  }, [value]);

  if (matrix.length === 0) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center bg-gray-100 text-xs text-gray-500 rounded-lg"
      >
        QR unavailable
      </div>
    );
  }

  const moduleCount = matrix.length;
  // Border margin (quiet zone = 2 modules)
  const margin = 2;
  const totalUnits = moduleCount + margin * 2;

  return (
    <svg
      viewBox={`0 0 ${totalUnits} ${totalUnits}`}
      width={size}
      height={size}
      className={`shape-rendering-crispEdges ${className}`}
      style={{ shapeRendering: "crispEdges" }}
    >
      <rect width={totalUnits} height={totalUnits} fill="#FFFFFF" rx="1" />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c + margin}
              y={r + margin}
              width={1}
              height={1}
              fill="#0B192C"
            />
          ) : null
        )
      )}
    </svg>
  );
}
