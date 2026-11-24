import { Canvas, useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PieceSymbol, Square } from "chess.js";
import * as THREE from "three";

const FILES = "abcdefgh";
const MODEL_HEIGHT: Record<PieceSymbol, number> = {
  p: 0.5,
  n: 0.74,
  b: 0.7,
  r: 0.58,
  q: 0.78,
  k: 0.82,
};

interface BoardPiece {
  square: Square;
  type: PieceSymbol;
  color: "w" | "b";
}

interface MoveAnimation {
  from: Square;
  to: Square;
  piece: { type: PieceSymbol; color: "w" | "b" };
}

interface PiecePalette {
  light: string;
  dark: string;
  accent: string;
}

function readThemeColor(name: string, context: CanvasRenderingContext2D) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  const pixels = context.getImageData(0, 0, 1, 1).data;
  return `rgb(${pixels[0] ?? 0} ${pixels[1] ?? 0} ${pixels[2] ?? 0})`;
}

function squarePosition(square: Square) {
  return {
    x: FILES.indexOf(square[0] ?? "a") - 3.5,
    y: Number(square[1]) - 4.5 - 0.39,
  };
}

export function ChessPieceScene({
  pieces,
  animation,
}: {
  pieces: BoardPiece[];
  animation: MoveAnimation | null;
}) {
  const [palette, setPalette] = useState<PiecePalette | null>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const texture = document.createElement("canvas");
    texture.width = 1;
    texture.height = 1;
    const context = texture.getContext("2d");
    if (!context) return;

    setPalette({
      light: readThemeColor("--piece-light", context),
      dark: readThemeColor("--piece-dark", context),
      accent: readThemeColor("--board-highlight", context),
    });
  }, []);

  const markReady = useCallback(() => {
    sceneRef.current?.setAttribute("data-scene-ready", "true");
  }, []);

  return (
    <div ref={sceneRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
      {palette && (
        <Canvas
          orthographic
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 12], zoom: 0.25, near: 0.1, far: 30 }}
          gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        >
          <ambientLight intensity={1.1} />
          <directionalLight intensity={2.7} position={[-4, 5, 8]} />
          <directionalLight intensity={0.8} position={[4, -2, 6]} />
          {pieces.map((piece) => (
            <ChessPieceModel
              key={`${piece.square}-${piece.color}-${piece.type}`}
              piece={piece}
              animation={animation}
              palette={palette}
            />
          ))}
          <SceneReady onReady={markReady} />
        </Canvas>
      )}
    </div>
  );
}

function SceneReady({ onReady }: { onReady: () => void }) {
  const isReady = useRef(false);
  useFrame(() => {
    if (isReady.current) return;
    isReady.current = true;
    onReady();
  });
  return null;
}

function ChessPieceModel({
  piece,
  animation,
  palette,
}: {
  piece: BoardPiece;
  animation: MoveAnimation | null;
  palette: PiecePalette;
}) {
  const group = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const target = squarePosition(piece.square);
  const isMoving = animation?.to === piece.square;
  const source = squarePosition(isMoving && animation ? animation.from : piece.square);
  const height = MODEL_HEIGHT[piece.type];
  const pieceColor = piece.color === "w" ? palette.light : palette.dark;
  const bodyPoints = useMemo(
    () => [
      new THREE.Vector2(0.25, 0),
      new THREE.Vector2(0.28, 0.055),
      new THREE.Vector2(0.22, 0.12),
      new THREE.Vector2(0.14, height * 0.31),
      new THREE.Vector2(0.11, height * 0.55),
      new THREE.Vector2(0.17, height * 0.66),
      new THREE.Vector2(0.18, height * 0.7),
      new THREE.Vector2(0, height * 0.7),
    ],
    [height],
  );
  const bodyGeometry = useMemo(() => new THREE.LatheGeometry(bodyPoints, 28), [bodyPoints]);
  const horseShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.15, 0);
    shape.lineTo(0.15, 0);
    shape.lineTo(0.08, 0.12);
    shape.lineTo(0.19, 0.21);
    shape.lineTo(0.13, 0.35);
    shape.lineTo(0.02, 0.33);
    shape.lineTo(-0.01, 0.45);
    shape.lineTo(-0.12, 0.4);
    shape.lineTo(-0.1, 0.28);
    shape.lineTo(-0.19, 0.18);
    shape.closePath();
    return shape;
  }, []);
  const horseGeometry = useMemo(
    () => new THREE.ExtrudeGeometry(horseShape, { depth: 0.075, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.02, bevelSegments: 1 }),
    [horseShape],
  );

  useEffect(() => {
    elapsed.current = 0;
    if (isMoving && group.current) group.current.position.set(source.x, source.y, 0);
  }, [animation?.from, animation?.to, isMoving, source.x, source.y]);

  useEffect(
    () => () => {
      bodyGeometry.dispose();
      horseGeometry.dispose();
    },
    [bodyGeometry, horseGeometry],
  );

  useFrame((_, delta) => {
    if (!isMoving || !animation || !group.current) return;
    elapsed.current += Math.min(delta, 0.05);
    const progress = Math.min(elapsed.current / 0.3, 1);
    const eased = 1 - (1 - progress) ** 3;
    group.current.position.set(
      source.x + (target.x - source.x) * eased,
      source.y + (target.y - source.y) * eased,
      Math.sin(progress * Math.PI) * 0.11,
    );
  });

  return (
    <group ref={group} position={[source.x, source.y, 0]}>
      <mesh castShadow geometry={bodyGeometry}>
        <meshStandardMaterial color={pieceColor} metalness={0.48} roughness={0.29} />
      </mesh>
      <mesh castShadow position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.28, 0.29, 0.09, 28]} />
        <meshStandardMaterial color={pieceColor} metalness={0.62} roughness={0.26} />
      </mesh>
      <mesh position={[0, 0.12, 0.01]}>
        <cylinderGeometry args={[0.24, 0.26, 0.055, 28]} />
        <meshStandardMaterial color={palette.accent} metalness={0.72} roughness={0.24} />
      </mesh>
      {piece.type === "p" && (
        <mesh castShadow position={[0, height * 0.7 + 0.12, 0]}>
          <sphereGeometry args={[0.12, 18, 14]} />
          <meshStandardMaterial color={pieceColor} metalness={0.44} roughness={0.26} />
        </mesh>
      )}
      {piece.type === "r" && <RookCrown y={height * 0.7 + 0.045} color={pieceColor} />}
      {piece.type === "b" && (
        <group position={[0, height * 0.7, 0]}>
          <mesh castShadow>
            <coneGeometry args={[0.16, 0.2, 12]} />
            <meshStandardMaterial color={pieceColor} metalness={0.48} roughness={0.27} />
          </mesh>
          <mesh position={[0, 0, 0.14]} rotation={[0, 0, -0.55]}>
            <boxGeometry args={[0.045, 0.2, 0.035]} />
            <meshStandardMaterial color={palette.accent} metalness={0.72} roughness={0.22} />
          </mesh>
        </group>
      )}
      {piece.type === "n" && (
        <mesh castShadow geometry={horseGeometry} position={[-0.01, height * 0.43, 0.045]}>
          <meshStandardMaterial color={pieceColor} metalness={0.48} roughness={0.27} />
        </mesh>
      )}
      {piece.type === "q" && <QueenCrown y={height * 0.7 + 0.06} color={pieceColor} accent={palette.accent} />}
      {piece.type === "k" && <ColonelCross y={height * 0.7 + 0.09} accent={palette.accent} />}
    </group>
  );
}

function RookCrown({ y, color }: { y: number; color: string }) {
  return (
    <group position={[0, y, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.19, 0.17, 0.12, 8]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
      </mesh>
      {[-1, 1].map((direction) => (
        <mesh key={direction} castShadow position={[direction * 0.1, 0.075, 0]}>
          <boxGeometry args={[0.08, 0.07, 0.23]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function QueenCrown({ y, color, accent }: { y: number; color: string; accent: string }) {
  return (
    <group position={[0, y, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.17, 0.15, 0.08, 10]} />
        <meshStandardMaterial color={color} metalness={0.52} roughness={0.25} />
      </mesh>
      {[-0.1, 0, 0.1].map((x) => (
        <mesh key={x} castShadow position={[x, 0.085, 0]}>
          <sphereGeometry args={[0.065, 12, 10]} />
          <meshStandardMaterial color={accent} metalness={0.7} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function ColonelCross({ y, accent }: { y: number; accent: string }) {
  return (
    <group position={[0, y, 0]}>
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.07, 0.24, 0.075]} />
        <meshStandardMaterial color={accent} metalness={0.78} roughness={0.2} />
      </mesh>
      <mesh castShadow position={[0, 0.035, 0]}>
        <boxGeometry args={[0.2, 0.065, 0.075]} />
        <meshStandardMaterial color={accent} metalness={0.78} roughness={0.2} />
      </mesh>
    </group>
  );
}