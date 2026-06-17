"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { PenIcon, EraserIcon, XIcon } from "./emr-icons";

interface Props { active: boolean; onClose: () => void; }

const COLORS = ["#0f2a44", "#ef4444", "#00b4d8", "#22c55e", "#f59e0b"];
const SIZES = [2, 4, 6];

export default function DrawingCanvas({ active, onClose }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [drawing, setDrawing] = useState(false);
    const [color, setColor] = useState(COLORS[0]);
    const [size, setSize] = useState(SIZES[1]);
    const [tool, setTool] = useState<"pen" | "eraser">("pen");
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    const resize = useCallback(() => {
        const c = canvasRef.current; if (!c) return;
        const parent = c.parentElement; if (!parent) return;
        const data = c.toDataURL();
        c.width = parent.clientWidth; c.height = parent.clientHeight;
        const img = new Image();
        img.onload = () => { c.getContext("2d")?.drawImage(img, 0, 0); };
        img.src = data;
    }, []);

    useEffect(() => { if (active) { resize(); window.addEventListener("resize", resize); return () => window.removeEventListener("resize", resize); } }, [active, resize]);

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const c = canvasRef.current!; const r = c.getBoundingClientRect();
        const p = "touches" in e ? e.touches[0] : e;
        return { x: p.clientX - r.left, y: p.clientY - r.top };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => { e.preventDefault(); setDrawing(true); lastPos.current = getPos(e); };
    const endDraw = () => { setDrawing(false); lastPos.current = null; };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!drawing || !canvasRef.current) return; e.preventDefault();
        const ctx = canvasRef.current.getContext("2d")!;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
        ctx.lineWidth = tool === "eraser" ? size * 4 : size;
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        if (lastPos.current) { ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y); ctx.stroke(); }
        lastPos.current = pos;
    };

    const clearCanvas = () => { const c = canvasRef.current; if (c) { const ctx = c.getContext("2d")!; ctx.clearRect(0, 0, c.width, c.height); } };

    if (!active) return null;

    return (
        <div className="absolute inset-0 z-30">
            {/* Toolbar */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 bg-navy/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg border border-white/10"
                style={{ animation: "slideDown 0.3s ease-out" }}>
                <button onClick={() => setTool("pen")} className={`p-1.5 rounded-lg transition-all ${tool === "pen" ? "bg-cyan text-navy" : "text-white/60 hover:text-white"}`} title="Pen"><PenIcon /></button>
                <button onClick={() => setTool("eraser")} className={`p-1.5 rounded-lg transition-all ${tool === "eraser" ? "bg-cyan text-navy" : "text-white/60 hover:text-white"}`} title="Eraser"><EraserIcon /></button>
                <div className="w-px h-5 bg-white/20 mx-1" />
                {COLORS.map(c => (<button key={c} onClick={() => { setColor(c); setTool("pen"); }} className={`w-5 h-5 rounded-full border-2 transition-transform ${color === c && tool === "pen" ? "border-white scale-125" : "border-transparent"}`} style={{ background: c }} />))}
                <div className="w-px h-5 bg-white/20 mx-1" />
                {SIZES.map(s => (<button key={s} onClick={() => setSize(s)} className={`flex items-center justify-center w-6 h-6 rounded-lg transition-all ${size === s ? "bg-white/20 text-white" : "text-white/50"}`}><span className="rounded-full bg-current" style={{ width: s + 2, height: s + 2 }} /></button>))}
                <div className="w-px h-5 bg-white/20 mx-1" />
                <button onClick={clearCanvas} className="text-[10px] font-bold text-status-red/80 hover:text-status-red px-2 py-1 rounded-lg">Clear</button>
                <button onClick={onClose} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"><XIcon className="w-3.5 h-3.5" /></button>
            </div>
            <canvas ref={canvasRef} className="absolute inset-0 cursor-crosshair touch-none"
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
            />
            <style jsx>{`@keyframes slideDown { from { opacity:0; transform: translate(-50%,-10px); } to { opacity:1; transform: translate(-50%,0); } }`}</style>
        </div>
    );
}
