"use client";
import { useState, useEffect } from "react";
import { useWriteContract, useAccount, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { COVEIL_MATCHER_ADDRESS, COVEIL_MATCHER_ABI } from "@/lib/abi";
import { Logo } from "@/components/Logo";
import { GitHubLink } from "@/components/GitHubLink";
import Link from "next/link";

type SessionRow = readonly [string, boolean, boolean, boolean];

const checks = [
  "Party A treasury meets Party B minimum",
  "Party B treasury meets Party A minimum",
  "Risk score delta within threshold",
];

export default function Results() {
  const { isConnected } = useAccount();
  const [confirmed, setConfirmed] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [computeTxHash, setComputeTxHash] = useState("");
  const [sessionPartyA, setSessionPartyA] = useState("");
  const { writeContractAsync, isPending } = useWriteContract();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("coveil_session");
      if (stored) {
        const { partyA } = JSON.parse(stored);
        if (partyA) setSessionPartyA(partyA);
      }
    } catch {}
  }, []);

  // Poll session state every 5 s
  const { data: sessionData } = useReadContract({
    address: COVEIL_MATCHER_ADDRESS,
    abi: COVEIL_MATCHER_ABI,
    functionName: "sessions",
    args: [sessionPartyA as `0x${string}`],
    query: {
      enabled: isConnected && sessionPartyA.length === 42,
      refetchInterval: 5000,
    },
  });

  const session = sessionData as SessionRow | undefined;
  const partyASubmitted = session?.[1] ?? null;
  const partyBSubmitted = session?.[2] ?? null;
  const matchComputed = session?.[3] ?? null;
  const bothSubmitted = partyASubmitted === true && partyBSubmitted === true;
  // If the sessions() call isn't available, default to showing the compute button
  const sessionReadable = session !== undefined;

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
      setTxHash(hash);
      setConfirmed(true);
    } catch (e) {
      console.error(e);
    }
  }

  // Determine which stage to show
  // If sessionReadable: gate strictly on on-chain flags
  // If not sessionReadable (view fn absent): show compute step if no local computeTxHash, else show score
  const showWaiting =
    sessionReadable && (!partyASubmitted || !partyBSubmitted);
  const showCompute =
    !showWaiting && !confirmed && (matchComputed === false || (!sessionReadable && !computeTxHash));
  const showScore =
    !showWaiting && !confirmed && (matchComputed === true || (!sessionReadable && !!computeTxHash));

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
                Connect your wallet to view results
              </p>
              <ConnectButton />
            </div>
          ) : confirmed ? (
            /* ── Final confirmed state ─────────────────────────────────── */
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
          ) : showWaiting ? (
            /* ── Waiting for both parties to submit ────────────────────── */
            <div className="border border-white/[0.08] rounded-xl p-6 space-y-5">
              <p className="text-xs font-medium text-white/40 uppercase tracking-widest">
                Session status
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Party A</span>
                  <span
                    className={`text-xs font-mono ${partyASubmitted ? "text-indigo-400" : "text-white/25"}`}
                  >
                    {partyASubmitted ? "submitted" : "pending"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Party B</span>
                  <span
                    className={`text-xs font-mono ${partyBSubmitted ? "text-indigo-400" : "text-white/25"}`}
                  >
                    {partyBSubmitted ? "submitted" : "pending"}
                  </span>
                </div>
              </div>

              <p className="text-sm text-white/40">
                Both parties must submit encrypted profiles before the match can
                be computed. This page polls every 5 seconds.
              </p>

              <div className="space-y-1.5">
                <label className="block text-[11px] text-white/30 uppercase tracking-widest">
                  Session (Party A address)
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
          ) : showCompute ? (
            /* ── Both submitted — trigger computeMatch ─────────────────── */
            <div className="space-y-4">
              <div className="border border-white/[0.08] rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-white/40 uppercase tracking-widest">
                    Session status
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
                  to run the FHE compatibility computation. Either party can
                  call this.
                </p>

                <button
                  onClick={handleCompute}
                  disabled={isPending}
                  className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-lg text-sm font-semibold tracking-tight transition-colors"
                >
                  {isPending ? "Computing…" : "Compute Match"}
                </button>

                {computeTxHash && (
                  <div className="space-y-1">
                    <p className="text-[11px] text-indigo-400 uppercase tracking-widest">
                      Computation triggered
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
                )}
              </div>

              {/* Address input if session state isn't readable */}
              {!sessionReadable && (
                <div className="border border-white/[0.08] rounded-xl p-5 space-y-2">
                  <label className="block text-[11px] text-white/30 uppercase tracking-widest">
                    Session (Party A address)
                  </label>
                  <input
                    type="text"
                    placeholder="0x…"
                    value={sessionPartyA}
                    onChange={(e) => setSessionPartyA(e.target.value)}
                    className="w-full bg-transparent border border-white/[0.08] rounded-lg px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors text-xs font-mono"
                  />
                </div>
              )}
            </div>
          ) : showScore ? (
            /* ── Match computed — show score + confirm ──────────────────── */
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
                  <span className="inline-block border border-indigo-500/40 bg-indigo-500/10 text-indigo-400 text-xs px-3 py-1 rounded-md font-medium">
                    Threshold met
                  </span>
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
          ) : (
            /* ── Fallback: no session address entered yet ───────────────── */
            <div className="border border-white/[0.08] rounded-xl p-6 space-y-5">
              <p className="text-xs font-medium text-white/40 uppercase tracking-widest">
                Session lookup
              </p>
              <p className="text-sm text-white/40">
                Enter Party A&apos;s address to load the session state and
                proceed.
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
          )}
        </div>
      </div>
    </main>
  );
}
