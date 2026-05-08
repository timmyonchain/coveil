"use client";
import { useState, useEffect } from "react";
import { useWriteContract, useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { COVEIL_MATCHER_ADDRESS, COVEIL_MATCHER_ABI } from "@/lib/abi";
import { Logo } from "@/components/Logo";
import { GitHubLink } from "@/components/GitHubLink";
import Link from "next/link";

export default function CreateSession() {
  const { isConnected, address } = useAccount();
  const [partyB, setPartyB] = useState("");
  const [txHash, setTxHash] = useState("");
  const { writeContractAsync, isPending } = useWriteContract();

  useEffect(() => {
    if (txHash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [txHash]);

  async function handleCreate() {
    if (!partyB) return;
    try {
      const hash = await writeContractAsync({
        address: COVEIL_MATCHER_ADDRESS,
        abi: COVEIL_MATCHER_ABI,
        functionName: "createSession",
        args: [partyB as `0x${string}`],
      });
      setTxHash(hash);
      // Persist session context so join/results pages can look up on-chain state
      if (address) {
        localStorage.setItem(
          "coveil_session",
          JSON.stringify({ partyA: address, partyB })
        );
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/[0.08]">
        <Link href="/" className="hover:opacity-70 transition-opacity">
          <Logo />
        </Link>
        <div className="flex items-center gap-4">
          <GitHubLink />
          <ConnectButton />
        </div>
      </nav>

      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-[0.25em] text-indigo-400 uppercase">
              Step 1
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Create Session
            </h1>
            <p className="text-sm text-white/40">
              Enter your counterparty&apos;s wallet address to initiate a blind
              compatibility match.
            </p>
          </div>

          {txHash ? (
            <div className="border border-white/[0.08] rounded-xl p-6 space-y-5">
              <p className="text-xs font-medium text-indigo-400 uppercase tracking-widest">
                Session created
              </p>
              <p className="text-white/60 text-sm">
                Session registered on-chain. Both parties must now submit
                encrypted profiles before the match can be computed.
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
                href="/session/join"
                className="inline-flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-2.5 rounded-lg text-sm font-semibold tracking-tight transition-colors"
              >
                Submit your profile
                <span aria-hidden>→</span>
              </Link>
            </div>
          ) : !isConnected ? (
            <div className="border border-white/[0.08] rounded-xl p-8 flex flex-col items-center gap-4">
              <p className="text-sm text-white/40">
                Connect your wallet to continue
              </p>
              <ConnectButton />
            </div>
          ) : (
            <div className="border border-white/[0.08] rounded-xl p-6 space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white/40 uppercase tracking-widest">
                  Party B Address
                </label>
                <input
                  type="text"
                  placeholder="0x…"
                  value={partyB}
                  onChange={(e) => setPartyB(e.target.value)}
                  className="w-full bg-transparent border border-white/[0.08] rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors text-sm font-mono"
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={isPending || !partyB}
                className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-lg text-sm font-semibold tracking-tight transition-colors"
              >
                {isPending ? "Creating…" : "Create Session"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
