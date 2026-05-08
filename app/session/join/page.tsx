"use client";
import { useState, useEffect } from "react";
import { useWriteContract, useAccount, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { COVEIL_MATCHER_ADDRESS, COVEIL_MATCHER_ABI } from "@/lib/abi";
import { Logo } from "@/components/Logo";
import { GitHubLink } from "@/components/GitHubLink";
import Link from "next/link";

type SessionRow = readonly [string, boolean, boolean, boolean];

export default function JoinSession() {
  const { isConnected } = useAccount();
  const [treasury, setTreasury] = useState("");
  const [minimum, setMinimum] = useState("");
  const [risk, setRisk] = useState("");
  const [txHash, setTxHash] = useState("");
  const [sessionPartyA, setSessionPartyA] = useState("");
  const { writeContractAsync, isPending } = useWriteContract();

  // Pre-fill Party A address from localStorage if Party A used this browser
  useEffect(() => {
    try {
      const stored = localStorage.getItem("coveil_session");
      if (stored) {
        const { partyA } = JSON.parse(stored);
        if (partyA) setSessionPartyA(partyA);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (txHash) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [txHash]);

  // Poll on-chain session state every 5 s after profile is submitted
  const { data: sessionData } = useReadContract({
    address: COVEIL_MATCHER_ADDRESS,
    abi: COVEIL_MATCHER_ABI,
    functionName: "sessions",
    args: [sessionPartyA as `0x${string}`],
    query: {
      enabled: !!txHash && sessionPartyA.length === 42,
      refetchInterval: 5000,
    },
  });

  const session = sessionData as SessionRow | undefined;
  const partyASubmitted = session?.[1] ?? null;
  const partyBSubmitted = session?.[2] ?? null;
  const bothSubmitted =
    partyASubmitted === true && partyBSubmitted === true;
  // null means the view call failed / isn't available — show a soft fallback
  const sessionReadable = session !== undefined;

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

          {txHash ? (
            <div className="space-y-4">
              {/* Tx confirmation */}
              <div className="border border-white/[0.08] rounded-xl p-6 space-y-3">
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
              </div>

              {/* Session readiness */}
              <div className="border border-white/[0.08] rounded-xl p-6 space-y-5">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-white/40 uppercase tracking-widest">
                    Session status
                  </p>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] text-white/30 uppercase tracking-widest">
                      Party A address
                    </label>
                    <input
                      type="text"
                      placeholder="0x… (session creator)"
                      value={sessionPartyA}
                      onChange={(e) => setSessionPartyA(e.target.value)}
                      className="w-full bg-transparent border border-white/[0.08] rounded-lg px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors text-xs font-mono"
                    />
                  </div>
                </div>

                {sessionPartyA.length === 42 && (
                  <div className="space-y-2">
                    {sessionReadable ? (
                      <>
                        <StatusRow
                          label="Party A"
                          submitted={partyASubmitted}
                        />
                        <StatusRow
                          label="Party B"
                          submitted={partyBSubmitted}
                        />
                      </>
                    ) : (
                      <p className="text-xs text-white/25">
                        Polling on-chain state…
                      </p>
                    )}
                  </div>
                )}

                {bothSubmitted ? (
                  <Link
                    href="/results"
                    className="inline-flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-2.5 rounded-lg text-sm font-semibold tracking-tight transition-colors"
                  >
                    Both submitted — compute match
                    <span aria-hidden>→</span>
                  </Link>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-white/40">
                      Waiting for the other party to submit their encrypted
                      profile before the match can be computed.
                    </p>
                    <Link
                      href="/results"
                      className="inline-flex items-center gap-1.5 border border-white/[0.12] hover:bg-white/[0.04] text-white/50 px-5 py-2.5 rounded-lg text-sm font-semibold tracking-tight transition-colors"
                    >
                      View results page
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                )}
              </div>
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
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatusRow({
  label,
  submitted,
}: {
  label: string;
  submitted: boolean | null;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/50">{label}</span>
      {submitted === null ? (
        <span className="text-white/20 text-xs font-mono">—</span>
      ) : submitted ? (
        <span className="text-indigo-400 text-xs font-mono">submitted</span>
      ) : (
        <span className="text-white/25 text-xs font-mono">pending</span>
      )}
    </div>
  );
}
