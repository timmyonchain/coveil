import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { COVEIL_MATCHER_ADDRESS } from "@/lib/abi";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/[0.08]">
        <span className="text-sm font-semibold tracking-[0.2em] text-white">
          COVEIL
        </span>
        <ConnectButton />
      </nav>

      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-lg space-y-10">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-[0.25em] text-indigo-400 uppercase">
              Private Match Protocol
            </p>
            <h1 className="text-5xl font-semibold tracking-tight leading-none text-white">
              Two parties.
              <br />
              One outcome.
            </h1>
            <p className="text-base text-white/40 leading-relaxed max-w-sm">
              Compatibility scored on encrypted data. Raw financials never leave
              your browser. Results revealed only on mutual consent.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/session/create"
              className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-3 rounded-lg text-sm font-semibold tracking-tight transition-colors"
            >
              Create Session
            </Link>
            <Link
              href="/session/join"
              className="inline-flex items-center gap-2 border border-white/[0.12] hover:bg-white/[0.04] text-white px-6 py-3 rounded-lg text-sm font-semibold tracking-tight transition-colors"
            >
              Submit Profile
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-px border border-white/[0.08] rounded-xl overflow-hidden">
            {[
              { label: "Protocol", value: "FHE Matching" },
              { label: "Network", value: "Sepolia" },
              {
                label: "Contract",
                value: `${COVEIL_MATCHER_ADDRESS.slice(0, 6)}…${COVEIL_MATCHER_ADDRESS.slice(-4)}`,
              },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/[0.02] px-5 py-4">
                <p className="text-[11px] text-white/30 uppercase tracking-widest mb-1">
                  {label}
                </p>
                <p className="text-sm font-medium text-white/70 font-mono">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
