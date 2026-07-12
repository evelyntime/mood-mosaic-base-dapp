"use client";

import { Check, Circle, Grid3X3, Loader2, Palette, Search, Send, Square, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { parseEventLogs, type Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  COLORS,
  MAX_COLOR_LENGTH,
  MAX_MOOD_LENGTH,
  MAX_NOTE_LENGTH,
  SHAPES,
  moodMosaicAbi,
  moodMosaicContractAddress,
} from "@/lib/mood-mosaic";

const PRESETS = [
  { mood: "Focused", colorName: "Sky", note: "A clean block of attention, one task, no noise.", shape: "Square" },
  { mood: "Curious", colorName: "Lemon", note: "A bright question worth testing before the day closes.", shape: "Circle" },
  { mood: "Steady", colorName: "Mint", note: "Quiet progress, small proof, good rhythm.", shape: "Stripe" },
] as const;

function shortAddress(address?: Address) {
  if (!address || address === "0x0000000000000000000000000000000000000000") return "--";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(value?: bigint) {
  if (!value) return "--";
  return new Date(Number(value) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function friendlyError(error: unknown) {
  if (!(error instanceof Error)) return "Transaction was cancelled.";
  if (error.message.includes("User rejected")) return "Request cancelled in wallet.";
  if (error.message.includes("Invalid mood")) return "Mood needs 1 to 32 characters.";
  if (error.message.includes("Invalid color")) return "Choose a color.";
  if (error.message.includes("Invalid note")) return "Note needs 1 to 120 characters.";
  if (error.message.includes("Invalid shape")) return "Choose a shape.";
  return error.message;
}

function colorFor(name: string) {
  return COLORS.find((color) => color.name === name)?.hex ?? COLORS[0].hex;
}

function TilePreview({ mood, colorName, note, shape, maker, createdAt }: {
  mood: string;
  colorName: string;
  note: string;
  shape: string;
  maker?: Address;
  createdAt?: bigint;
}) {
  const color = colorFor(colorName);
  return (
    <article className="tile-preview" style={{ "--tile-color": color } as React.CSSProperties}>
      <div className={`tile-art ${shape.toLowerCase()}`}>
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="tile-copy">
        <p>{colorName || "Color"} / {shape || "Shape"}</p>
        <h2>{mood || "Untitled mood"}</h2>
        <blockquote>{note || "Stamp a small public mood tile on Base."}</blockquote>
      </div>
      <footer>
        <div><span>Maker</span><strong>{shortAddress(maker)}</strong></div>
        <div><span>Stamped</span><strong>{formatDate(createdAt)}</strong></div>
      </footer>
    </article>
  );
}

export function MoodMosaicApp() {
  const [tileIdInput, setTileIdInput] = useState("1");
  const [mood, setMood] = useState<string>(PRESETS[0].mood);
  const [colorName, setColorName] = useState<string>(PRESETS[0].colorName);
  const [note, setNote] = useState<string>(PRESETS[0].note);
  const [shape, setShape] = useState<string>(PRESETS[0].shape);
  const [message, setMessage] = useState("Stamp one mood tile on Base and browse the mosaic by ID.");
  const [lastAction, setLastAction] = useState<"stamp" | null>(null);

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync } = useDisconnect();
  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
    } catch {}
  }
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: hash, writeContractAsync, isPending: writing } = useWriteContract();
  const { data: receipt, isLoading: confirming } = useWaitForTransactionReceipt({ hash });
  const selectedConnector = connectors.find((connector) => connector.id === "injected") ?? connectors.find((connector) => connector.id === "baseAccount") ?? connectors[0];
  const parsedTileId = BigInt(Math.max(1, Number(tileIdInput || "1")));

  const tileQuery = useReadContract({
    abi: moodMosaicAbi,
    address: moodMosaicContractAddress,
    functionName: "getTile",
    args: [parsedTileId],
    query: { enabled: Boolean(moodMosaicContractAddress), refetchInterval: 12000 },
  });
  const totalQuery = useReadContract({
    abi: moodMosaicAbi,
    address: moodMosaicContractAddress,
    functionName: "nextTileId",
    query: { enabled: Boolean(moodMosaicContractAddress), refetchInterval: 12000 },
  });

  const tuple = tileQuery.data as readonly [Address, string, string, string, string, bigint] | undefined;
  const liveTile = useMemo(() => tuple ? {
    maker: tuple[0],
    mood: tuple[1],
    colorName: tuple[2],
    note: tuple[3],
    shape: tuple[4],
    createdAt: tuple[5],
  } : undefined, [tuple]);

  const totalTiles = totalQuery.data ? Math.max(Number(totalQuery.data) - 1, 0) : 0;
  const validFields =
    mood.trim().length > 0 &&
    mood.trim().length <= MAX_MOOD_LENGTH &&
    colorName.trim().length > 0 &&
    colorName.trim().length <= MAX_COLOR_LENGTH &&
    note.trim().length > 0 &&
    note.trim().length <= MAX_NOTE_LENGTH &&
    shape.trim().length > 0;
  const stampBlocker = !moodMosaicContractAddress
    ? "Contract not deployed yet. Run npm run deploy:contract, then add NEXT_PUBLIC_MOOD_MOSAIC_CONTRACT_ADDRESS."
    : !isConnected
      ? "Connect wallet first."
      : chainId !== base.id
        ? "Switch to Base first."
        : !validFields
          ? "Fill mood, color, note, and shape."
          : "";

  useEffect(() => {
    if (!receipt || lastAction !== "stamp") return;
    void totalQuery.refetch();
    void tileQuery.refetch();
    const logs = parseEventLogs({ abi: moodMosaicAbi, logs: receipt.logs, eventName: "TileStamped" });
    const tileId = logs[0]?.args.tileId;
    window.setTimeout(() => {
      if (tileId) setTileIdInput(tileId.toString());
      setMessage(tileId ? `Tile #${tileId.toString()} stamped on Base.` : "Mood tile stamped on Base.");
    }, 0);
  }, [lastAction, receipt, totalQuery, tileQuery]);

  async function connectWallet() {
    const queue = [connectors.find((connector) => connector.id === "injected"), connectors.find((connector) => connector.id === "baseAccount"), selectedConnector]
      .filter((connector): connector is NonNullable<typeof selectedConnector> => Boolean(connector))
      .filter((connector, index, list) => list.findIndex((item) => item.id === connector.id) === index);
    if (!queue.length) {
      setMessage("No wallet connector found. Open this app inside Base App or a wallet browser.");
      return;
    }
    let lastError: unknown;
    setMessage("Opening wallet connection...");
    for (const connector of queue) {
      try {
        await connectAsync({ connector });
        setMessage("Wallet connected. Stamp the tile when ready.");
        return;
      } catch (error) {
        lastError = error;
      }
    }
    setMessage(friendlyError(lastError));
  }

  async function stampTile() {
    const contractAddress = moodMosaicContractAddress;
    if (stampBlocker) {
      setMessage(stampBlocker);
      return;
    }
    if (!contractAddress) return;
    try {
      setLastAction("stamp");
      setMessage("Confirm the Mood Mosaic tile in your wallet.");
      await writeContractAsync({
        address: contractAddress,
        abi: moodMosaicAbi,
        functionName: "stampTile",
        args: [mood.trim(), colorName.trim(), note.trim(), shape.trim()],
        chainId: base.id,
      });
      setMessage("Tile sent. Waiting for Base confirmation...");
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  function applyPreset(index: number) {
    const preset = PRESETS[index];
    setMood(preset.mood);
    setColorName(preset.colorName);
    setNote(preset.note);
    setShape(preset.shape);
  }

  return (
    <main className="mosaic-shell">
      <section className="mosaic-hero">
        <div className="hero-title">
          <Palette />
          <div>
            <p>Mood Mosaic</p>
            <h1>Stamp a mood.</h1>
          </div>
        </div>
        <div className="hero-count"><span>Tiles</span><strong>{totalTiles}</strong><span>Base</span></div>
      </section>

      <section className="mosaic-board">
        <div className="studio-panel">
          <div className="panel-head"><Grid3X3 /><div><p>Tile studio</p><strong>{isConnected ? shortAddress(address) : "Connect to stamp"}</strong></div></div>
          <div className="preset-row">{PRESETS.map((preset, index) => <button key={preset.mood} type="button" onClick={() => applyPreset(index)}>{preset.mood}</button>)}</div>
          <label><span>Mood</span><input value={mood} maxLength={MAX_MOOD_LENGTH} onChange={(event) => setMood(event.target.value)} /></label>
          <label><span>Note</span><textarea value={note} maxLength={MAX_NOTE_LENGTH} onChange={(event) => setNote(event.target.value)} /></label>
          <div className="color-row">{COLORS.map((item) => <button key={item.name} className={colorName === item.name ? "active" : ""} style={{ "--swatch": item.hex } as React.CSSProperties} type="button" onClick={() => setColorName(item.name)}><span />{item.name}</button>)}</div>
          <div className="shape-row">{SHAPES.map((item) => <button key={item} className={shape === item ? "active" : ""} type="button" onClick={() => setShape(item)}>{shape === item ? <Check /> : item === "Circle" ? <Circle /> : <Square />}{item}</button>)}</div>
          <div className="actions">
            {!isConnected ? (
              <button className="connect" disabled={connecting} onClick={connectWallet}>{connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}Connect wallet</button>
            ) : chainId !== base.id ? (
              <button className="connect" disabled={switching} onClick={() => switchChain({ chainId: base.id })}>{switching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}Switch to Base</button>
            ) : (
              <button className="disconnect" onClick={disconnectWallet}>{shortAddress(address)}</button>
            )}
            <button className="stamp" disabled={writing || confirming} onClick={stampTile}>{writing || confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Stamp on Base</button>
          </div>
          <p className="message">{message}</p>
        </div>

        <div className="gallery-panel">
          <TilePreview mood={liveTile?.mood || mood} colorName={liveTile?.colorName || colorName} note={liveTile?.note || note} shape={liveTile?.shape || shape} maker={liveTile?.maker} createdAt={liveTile?.createdAt} />
          <section className="lookup"><div><Search /><h2>Load tile</h2></div><label><span>Tile ID</span><input value={tileIdInput} onChange={(event) => setTileIdInput(event.target.value.replace(/\D/g, ""))} /></label></section>
          <section className="about"><Palette /><strong>Mood Mosaic turns a feeling, color, note, wallet, and timestamp into a public Base tile.</strong></section>
        </div>
      </section>
    </main>
  );
}
