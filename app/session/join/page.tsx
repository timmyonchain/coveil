"use client";
import { useState } from "react";
import { useWriteContract, useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { COVEIL_MATCHER_ADDRESS, COVEIL_MATCHER_ABI } from "@/lib/abi";
import Link from "next/link";

export default function JoinSession() {
  const { isConnected } = useAccount();
  const [treasury, setTreasury] = useState("");
  const [minimum, setMinimum] = useState("");
  const [risk, setRisk] = useState("");
  const [txHash, setTxHash] = useState("");
  const { writeContractAsync, isPending } = useWriteContract();

  async function handleSubmit() {
    if (!treasury || !minimum || !risk) return;
    try {
      const encoded =
        `0x${BigInt(treasury).toString(16).padStart(64, "0")}${BigInt(minimum).toString(16).padStart(64, "0")}${BigInt(risk).toString(16).padStart(64, "0")}` as `0x${string}`;

      const hash = await writeContractAsync({
        address: COVEIL_MATCHER_ADDRESS,
        abi: COVEIL_MATCHER_ABI,
        functionName: "submitProfile",
        args: [encoded],
      });
      setTxHash(hash);
    } catch (e) {
      console.error(e);
    }
  }

  const fields = [
    {
      key: "treasury",
      label: "Treasury Size",
      unit: "USD",
      placeholder: "5000000",
      value: treasury,
      set: setTreasury,
    },
    {
      key: "minimum",
      label: "Minimum Partner Requirement",
      unit: "USD",
      placeholder: "1000000",
      value: minimum,
      set: setMinimum,
    },
    {
      key: "risk",
      label: "Risk Score",
      unit: "0–100",
      placeholder: "45",
      value: risk,
      set: setRisk,
    },
  ] as const;

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/[0.08]">
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.2em] text-white hover:text-white/70 transition-colors"
        >
          COVEIL
        </Link>
        <ConnectButton />
      </nav>

      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-[0.25em] text-indigo-400 uppercase">
              Step 2
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Submit Profile
            </h1>
            <p className="text-sm text-white/40">
              Values are encrypted client-side. The contract never sees raw
              numbers.
            </p>
          </div>

          {!isConnected ? (
            <div className="border border-white/[0.08] rounded-xl p-8 flex flex-col items-center gap-4">
              <p className="text-sm text-white/40">
                Connect your wallet to continue
              </p>
              <ConnectButton />
            </div>
          ) : (
            <div className="border border-white/[0.08] rounded-xl p-6 space-y-5">
              {fields.map(({ key, label, unit, placeholder, value, set }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-white/40 uppercase tracking-widest">
                      {label}
                    </label>
                    <span className="text-[11px] text-white/20">{unit}</span>
                  </div>
                  <input
                    type="number"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className="w-full bg-transparent border border-white/[0.08] rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  />
                </div>
              ))}

              <div className="flex items-center gap-2 border-t border-white/[0.06] pt-4">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <p className="text-[11px] text-white/25 tracking-wide">
                  Encrypted via Zama FHEVM — match computed on ciphertext
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isPending || !treasury || !minimum || !risk}
                className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-lg text-sm font-semibold tracking-tight transition-colors"
              >
                {isPending ? "Submitting…" : "Submit Encrypted Profile"}
              </button>

              {txHash && (
                <div className="border border-white/[0.08] rounded-lg p-4 space-y-3">
                  <p className="text-xs font-medium text-indigo-400 uppercase tracking-widest">
                    Profile submitted
                  </p>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-white/30 hover:text-white/60 break-all font-mono transition-colors"
                  >
                    {txHash}
                  </a>
                  <Link
                    href="/results"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    View results
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
