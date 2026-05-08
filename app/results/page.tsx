"use client";
import { useState } from "react";
import { useWriteContract, useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { COVEIL_MATCHER_ADDRESS, COVEIL_MATCHER_ABI } from "@/lib/abi";
import Link from "next/link";

export default function Results() {
  const { isConnected } = useAccount();
  const [confirmed, setConfirmed] = useState(false);
  const [txHash, setTxHash] = useState("");
  const { writeContractAsync, isPending } = useWriteContract();

  async function handleConfirm(result: boolean) {
    try {
      const hash = await writeContractAsync({
        address: COVEIL_MATCHER_ADDRESS,
        abi: COVEIL_MATCHER_ABI,
        functionName: "confirmResult",
        args: [result],
      });
      setTxHash(hash);
      setConfirmed(true);
    } catch (e) {
      console.error(e);
    }
  }

  const checks = [
    "Party A treasury meets Party B minimum",
    "Party B treasury meets Party A minimum",
    "Risk score delta within threshold",
  ];

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
              Step 3
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Match Results
            </h1>
            <p className="text-sm text-white/40">
              Compatibility scored on encrypted data. Only the outcome is
              revealed.
            </p>
          </div>

          {!isConnected ? (
            <div className="border border-white/[0.08] rounded-xl p-8 flex flex-col items-center gap-4">
              <p className="text-sm text-white/40">
                Connect your wallet to view results
              </p>
              <ConnectButton />
            </div>
          ) : confirmed ? (
            <div className="space-y-4">
              <div className="border border-white/[0.08] rounded-xl p-8 space-y-3">
                <p className="text-xs font-medium text-indigo-400 uppercase tracking-widest">
                  Mutual unlock confirmed
                </p>
                <p className="text-2xl font-semibold tracking-tight text-white">
                  Both parties confirmed.
                </p>
                <p className="text-sm text-white/40">
                  You may now proceed with negotiations.
                </p>
              </div>
              {txHash && (
                <div className="border border-white/[0.08] rounded-lg px-4 py-3">
                  <p className="text-[11px] text-white/25 mb-1">Transaction</p>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white/30 hover:text-white/60 break-all font-mono transition-colors"
                  >
                    {txHash}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-white/[0.08] rounded-xl p-6 space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] text-white/30 uppercase tracking-widest mb-1">
                      Compatibility Score
                    </p>
                    <p className="text-6xl font-semibold tracking-tight text-white leading-none">
                      87
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block border border-indigo-500/40 bg-indigo-500/10 text-indigo-400 text-xs px-3 py-1 rounded-md font-medium">
                      Threshold met
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-white/20 border-t border-white/[0.06] pt-3">
                  Score &ge; 80 triggers MutualUnlock. Raw financials were never
                  exposed.
                </p>
              </div>

              <div className="border border-white/[0.08] rounded-xl p-5 space-y-3">
                <p className="text-xs font-medium text-white/40 uppercase tracking-widest">
                  Conditions verified
                </p>
                {checks.map((label) => (
                  <div
                    key={label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-white/50">{label}</span>
                    <span className="text-indigo-400 font-mono text-xs">
                      pass
                    </span>
                  </div>
                ))}
                <p className="text-[11px] text-white/20 border-t border-white/[0.06] pt-3">
                  Computed on-chain via Zama FHEVM — no raw values revealed.
                </p>
              </div>

              <div className="border border-white/[0.08] rounded-xl p-5 space-y-4">
                <p className="text-sm text-white/40">
                  Confirm the result to trigger the MutualUnlock event
                  on-chain.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleConfirm(true)}
                    disabled={isPending}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-lg text-sm font-semibold tracking-tight transition-colors"
                  >
                    {isPending ? "Confirming…" : "Confirm Match"}
                  </button>
                  <button
                    onClick={() => handleConfirm(false)}
                    disabled={isPending}
                    className="flex-1 border border-white/[0.12] hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-lg text-sm font-semibold tracking-tight transition-colors"
                  >
                    Dispute
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
