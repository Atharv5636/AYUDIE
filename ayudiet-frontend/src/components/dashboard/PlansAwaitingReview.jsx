import { useState } from "react";

function PlansAwaitingReview({
  plans = [],
  onApproved,
  onRejected,
  getPrimaryIssue,
  getEffectivenessScore,
  getTrendValue,
  getTrendDelta,
  getReasonSummary,
  getExpectedImpact,
  formatTrendLabel,
  getTrendMeta,
  isImmediateAttention,
  formatPlanDuration,
}) {
  const [loadingId, setLoadingId] = useState(null);

  const handleApprove = async (plan) => {
    try {
      setLoadingId(plan._id);
      console.log("REAL APPROVE BUTTON CLICKED", plan._id);
      await onApproved?.(plan._id);
    } catch {
      alert("Failed to approve plan");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (planId) => {
    const confirmReject = window.confirm(
      "Are you sure you want to reject this plan?"
    );

    if (!confirmReject) return;

    try {
      setLoadingId(planId);
      await onRejected?.(planId);
    } catch {
      alert("Failed to reject plan");
    } finally {
      setLoadingId(null);
    }
  };

  if (plans.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-2 text-lg font-semibold text-white">Pending Plans</h2>
        <p className="text-sm text-neutral-400">No plans pending review</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Pending Plans</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Review plan duration and patient context before approving or rejecting.
          </p>
        </div>

        <div className="space-y-4">
          {plans.map((plan) => {
            const primaryIssue = getPrimaryIssue?.(plan) || "none";
            const trend = getTrendValue?.(plan) || "stable";
            const trendMeta = getTrendMeta?.(trend);
            const TrendIcon = trendMeta?.icon;
            const patientName =
              typeof plan?.patient === "object"
                ? plan?.patient?.name || "Unknown Patient"
                : "Unknown Patient";
            const trendDelta = getTrendDelta?.(plan) || "No delta";

            return (
              <div
                key={plan._id}
                className="rounded-lg border border-neutral-800 bg-neutral-800/60 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{patientName}</p>
                    <p className="mt-1 text-sm text-neutral-400">{plan.title}</p>
                  </div>

                  <span className="rounded-full bg-neutral-700 px-2.5 py-1 text-[11px] font-medium text-neutral-200">
                    {formatPlanDuration?.(plan)}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-neutral-500">Plan Duration</p>
                    <p className="mt-1 text-white">{formatPlanDuration?.(plan)}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Primary Issue</p>
                    <p className="mt-1 capitalize text-white">{primaryIssue}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Trend</p>
                    <div className="mt-1 inline-flex items-center gap-2 text-white">
                      {TrendIcon ? <TrendIcon className="h-4 w-4" /> : null}
                      <span>{formatTrendLabel?.(trend) || trend}</span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">{trendDelta}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {isImmediateAttention?.(plan) ? (
                    <span className="rounded-full bg-red-500/12 px-2.5 py-1 text-[11px] font-medium text-red-300">
                      Needs Immediate Attention
                    </span>
                  ) : null}

                  <button
                    disabled={loadingId === plan._id}
                    onClick={() => handleApprove(plan)}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white transition hover:bg-green-700 disabled:opacity-50"
                  >
                    {loadingId === plan._id ? "Approving..." : "Approve"}
                  </button>

                  <button
                    disabled={loadingId === plan._id}
                    onClick={() => handleReject(plan._id)}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    {loadingId === plan._id ? "Processing..." : "Reject"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default PlansAwaitingReview;
