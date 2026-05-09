"use client";
import { useState, useEffect } from "react";
import {
  useWriteContract,
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { COVEIL_MATCHER_ADDRESS, COVEIL_MATCHER_ABI } from "@/lib/abi";
import { Logo } from "@/components/Logo";
import { GitHubLink } from "@/components/GitHubLink";
import Link from "next/link";

type SessionRow = readonly [string, boolean, boolean, boolean];

type Stage =
  | "no-session"   // no partyA address entered
  | "loading"      // sessions() query in flight
  | "incomplete"   // sessions() readable but one/both not submitted
  | "ready"        // both submitted, compute not yet triggered
  | "computing"    // computeMatch tx sent, waiting for mine + FHE completion
  | "score"        // matchComputed === true on-chain, score readable
  | "confirmed";   // confirmResult called

export default function Results() {
  const { isConnected } = useAccount();
  const [confirmed, setConfirmed] = useState(false);
  const [confirmTxHash, setConfirmTxHash] = useState("");
  const [computeTxHash, setComputeTxHash] = useState("");
  const [sessionPartyA, setSessionPartyA] = useState("");
  const { writeContractAsync, isPending } = useWriteContract();

  // Seed Party A address from localStorage (written by session/create)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("coveil_session");
      if (stored) {
        const { partyA } = JSON.parse(stored);
        if (partyA) setSessionPartyA(partyA);
      }
    } catch {}
  }, []);

  const validAddress = sessionPartyA.length === 42;

  // Poll sessions() every 5 s — source of truth for submission + compute flags
  const { data: sessionData, isLoading: isSessionLoading } = useReadContract({
    address: COVEIL_MATCHER_ADDRESS,
    abi: COVEIL_MATCHER_ABI,
    functionName: "sessions",
    args: [sessionPartyA as `0x${string}`],
    query: {
      enabled: isConnected && validAddress,
      refetchInterval: 5000,
    },
  });

  const session = sessionData as SessionRow | undefined;
  const sessionReadable = session !== undefined;
  const partyASubmitted = session?.[1] ?? null;
  const partyBSubmitted = session?.[2] ?? null;
  const matchComputed = session?.[3] ?? null;
  const bothSubmitted = partyASubmitted === true && partyBSubmitted === true;

  // Wait for the computeMatch tx to be mined before polling for the score
  const { isSuccess: txMined } = useWaitForTransactionReceipt({
    hash: computeTxHash as `0x${string}`,
    query: { enabled: !!computeTxHash },
  });

  // Read the actual score — only after matchComputed is true on-chain,
  // or after tx mines when sessions() isn't available (graceful fallback)
  const scoreEnabled =
    validAddress && (matchComputed === true || (txMined && !sessionReadable));

  const { data: scoreRaw } = useReadContract({
    address: COVEIL_MATCHER_ADDRESS,
    abi: COVEIL_MATCHER_ABI,
    functionName: "sessions",
    args: [sessionPartyA as `0x${string}`],
    query: { enabled: scoreEnabled },
  });

  const score: number | null =
    scoreRaw !== undefined ? Number(scoreRaw) : null;
  const aboveThreshold = score !== null && score >= 80;

  // Contract writes
  async function handleCompute() {
    try {
      const hash = await writeContractAsync({
        address: COVEIL_MATCHER_ADDRESS,
        abi: COVEIL_MATCHER_ABI,
        functionName: "computeMatch",
        args: [],
      });
      setComputeTxHash(hash);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleConfirm(result: boolean) {
    try {
      const hash = await writeContractAsync({
        address: COVEIL_MATCHER_ADDRESS,
        abi: COVEIL_MATCHER_ABI,
        functionName: "confirmResult",
        args: [result],
      });
      setConfirmTxHash(hash);
      setConfirmed(true);
    } catch (e) {
      console.error(e);
    }
  }

  // Derive stage — strict precedence, no overlaps
  let stage: Stage;
  if (confirmed) {
    stage = "confirmed";
  } else if (!validAddress) {
    stage = "no-session";
  } else if (isSessionLoading && !sessionReadable) {
    stage = "loading";
  } else if (sessionReadable && !bothSubmitted) {
    // sessions() is readable and at least one party hasn't submitted
    stage = "incomplete";
  } else if (matchComputed === true || (txMined && !sessionReadable)) {
    // FHE computation done (on-chain flag) OR tx mined without sessions() available
    stage = "score";
  } else if (computeTxHash) {
    // tx sent — waiting for mine + FHE completion
    stage = "computing";
  } else {
    // both submitted, no compute triggered yet (or sessions() unreadable fallback)
    stage = "ready";
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
                Connect your wallet to continue
              </p>
              <ConnectButton />
            </div>

          ) : stage === "no-session" ? (
            /* ── Enter Party A address ──────────────────────────────────── */
            <div className="border border-white/[0.08] rounded-xl p-6 space-y-4">
              <p className="text-xs font-medium text-white/40 uppercase tracking-widest">
                Session lookup
              </p>
              <p className="text-sm text-white/40">
                Enter Party A&apos;s wallet address to load this session.
              </p>
              <div className="space-y-1.5">
                <label className="block text-[11px] text-white/30 uppercase tracking-widest">
                  Party A address
                </label>
                <input
                  type="text"
                  placeholder="0x…"
                  value={sessionPartyA}
                  onChange={(e) => setSessionPartyA(e.target.value)}
                  className="w-full bg-transparent border border-white/[0.08] rounded-lg px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors text-xs font-mono"
                />
              </div>
            </div>

          ) : stage === "loading" ? (
            /* ── Loading ────────────────────────────────────────────────── */
            <div className="border border-white/[0.08] rounded-xl p-8 flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin flex-shrink-0" />
              <p className="text-sm text-white/40">Loading session…</p>
            </div>

          ) : stage === "incomplete" ? (
            /* ── Session incomplete ─────────────────────────────────────── */
            <div className="border border-white/[0.08] rounded-xl p-6 space-y-5">
              <p className="text-xs font-medium text-white/40 uppercase tracking-widest">
                Session incomplete
              </p>
              <p className="text-sm text-white/60">
                Both parties must submit a profile first.
              </p>
              <div className="space-y-2 border border-white/[0.06] rounded-lg px-4 py-3">
                {(
                  [
                    ["Party A", partyASubmitted],
                    ["Party B", partyBSubmitted],
                  ] as const
                ).map(([label, submitted]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-white/50">{label}</span>
                    <span
                      className={`text-xs font-mono ${submitted ? "text-indigo-400" : "text-white/25"}`}
                    >
                      {submitted ? "submitted" : "pending"}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/session/join"
                className="inline-flex items-center gap-1.5 border border-white/[0.12] hover:bg-white/[0.04] text-white/60 hover:text-white px-5 py-2.5 rounded-lg text-sm font-semibold tracking-tight transition-colors"
              >
                ← Back to submit profile
              </Link>
            </div>

          ) : stage === "ready" ? (
            /* ── Both submitted — trigger compute ───────────────────────── */
            <div className="border border-white/[0.08] rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-white/40 uppercase tracking-widest">
                  Ready
                </p>
                {sessionReadable && (
                  <span className="text-[11px] text-indigo-400 font-mono">
                    both submitted
                  </span>
                )}
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                Both encrypted profiles are on-chain. Trigger{" "}
                <code className="text-white/70 font-mono text-xs">
                  computeMatch()
                </code>{" "}
                to run the FHE compatibility computation. Either party can call
                this.
              </p>
              <button
                onClick={handleCompute}
                disabled={isPending}
                className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-lg text-sm font-semibold tracking-tight transition-colors"
              >
                {isPending ? "Sending…" : "Compute Match"}
              </button>
            </div>

          ) : stage === "computing" ? (
            /* ── Waiting for FHE computation to complete ────────────────── */
            <div className="border border-white/[0.08] rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin flex-shrink-0" />
                <p className="text-sm text-white/60">
                  FHE computation running on-chain…
                </p>
              </div>
              <p className="text-[11px] text-white/25">
                This page polls every 5 s. The page will update automatically
                when the result is ready.
              </p>
              <a
                href={`https://sepolia.etherscan.io/tx/${computeTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-white/30 hover:text-white/60 break-all font-mono transition-colors"
              >
                {computeTxHash}
              </a>
            </div>

          ) : stage === "score" ? (
            /* ── Score + confirm ────────────────────────────────────────── */
            <div className="space-y-4">
              <div className="border border-white/[0.08] rounded-xl p-6 space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] text-white/30 uppercase tracking-widest mb-1">
                      Compatibility Score
                    </p>
                    <p className="text-6xl font-semibold tracking-tight leading-none">
                      {score !== null ? score : "—"}
                    </p>
                  </div>
                  {score !== null ? (
                    <span
                      className={`inline-block border text-xs px-3 py-1 rounded-md font-medium ${
                        aboveThreshold
                          ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-400"
                          : "border-white/20 bg-white/[0.04] text-white/40"
                      }`}
                    >
                      {aboveThreshold ? "Threshold met" : "Below threshold"}
                    </span>
                  ) : (
                    <span className="text-[11px] text-white/20 font-mono">
                      reading score…
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/20 border-t border-white/[0.06] pt-3">
                  Score &ge; 80 triggers MutualUnlock. Raw financials were never
                  exposed.
                </p>
              </div>

              {/* Confirm / Dispute — only shown once we have the real score */}
              {score !== null && (
                <div className="border border-white/[0.08] rounded-xl p-5 space-y-4">
                  <p className="text-sm text-white/40">
                    Confirm the result to emit the MutualUnlock event on-chain.
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
              )}
            </div>

          ) : stage === "confirmed" ? (
            /* ── Confirmed ──────────────────────────────────────────────── */
            <div className="space-y-4">
              <div className="border border-white/[0.08] rounded-xl p-8 space-y-3">
                <p className="text-xs font-medium text-indigo-400 uppercase tracking-widest">
                  Mutual unlock confirmed
                </p>
                <p className="text-2xl font-semibold tracking-tight">
                  Both parties confirmed.
                </p>
                <p className="text-sm text-white/40">
                  You may now proceed with negotiations.
                </p>
              </div>
              {confirmTxHash && (
                <div className="border border-white/[0.08] rounded-lg px-4 py-3">
                  <p className="text-[11px] text-white/25 mb-1">Transaction</p>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${confirmTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white/30 hover:text-white/60 break-all font-mono transition-colors"
                  >
                    {confirmTxHash}
                  </a>
                </div>
              )}
            </div>

          ) : null}
        </div>
      </div>
    </main>
  );
}
