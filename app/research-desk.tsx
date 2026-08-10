"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AnalyzeErrorResponse } from "../lib/domain";
import { ERROR_COPY } from "../lib/presentation/error-copy";
import {
  ANALYSIS_CANCEL_ANNOUNCEMENT,
  ANALYSIS_LOADING_ANNOUNCEMENT,
  canSubmitAnalysis,
  candidateResubmissionQuery,
  getAnalysisRecoveryMode,
  parseAnalysisApiResult,
  prepareAnalysisRequest,
  type AnalysisRecoveryMode,
  type AnalysisFieldErrors,
  type AnalysisUiState,
} from "../lib/presentation/analysis-state";

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="icon">
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="m13 13 4 4" />
    </svg>
  );
}

function internalError(retryable = true): AnalyzeErrorResponse["error"] {
  return {
    code: "INTERNAL_ERROR",
    message: "Koneksi ke layanan analisis belum dapat diselesaikan.",
    retryable,
  };
}

function qualityLabel(decision: "sufficient" | "degraded" | "insufficient"): string {
  switch (decision) {
    case "sufficient":
      return "Data cukup untuk dibaca";
    case "degraded":
      return "Data terbatas; catatan tetap terlihat";
    case "insufficient":
      return "Data belum cukup";
  }
}

export function ResearchDesk() {
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState("");
  const [state, setState] = useState<AnalysisUiState>({ status: "idle" });
  const [fieldErrors, setFieldErrors] = useState<AnalysisFieldErrors>({});
  const [announcement, setAnnouncement] = useState("Meja riset siap digunakan.");
  const abortRef = useRef<AbortController | null>(null);
  const queryRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (state.status === "success") successRef.current?.focus();
  }, [state.status]);

  async function submit(queryOverride?: string): Promise<void> {
    if (!canSubmitAnalysis(state)) return;

    const nextQuery = queryOverride ?? query;
    const prepared = prepareAnalysisRequest(nextQuery, focus);
    setFieldErrors(prepared.errors);
    if (!prepared.request) {
      setState({ status: "idle" });
      setAnnouncement("Periksa input sebelum menyusun analisis.");
      if (prepared.errors.query) queryRef.current?.focus();
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: "submitting", query: prepared.request.query, focus: prepared.request.focus });
    setAnnouncement(ANALYSIS_LOADING_ANNOUNCEMENT);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(prepared.request),
        signal: controller.signal,
      });
      const payload: unknown = await response.json().catch(() => null);
      const result = parseAnalysisApiResult(payload, response.ok);

      if (result.kind === "success") {
        setState({ status: "success", data: result.data });
        setAnnouncement(`Analisis untuk ${result.data.instrument.name} sudah siap dibaca.`);
      } else if (result.kind === "ambiguous") {
        setState({
          status: "ambiguous",
          requestId: result.requestId,
          candidates: result.candidates,
          query: prepared.request.query,
          focus: prepared.request.focus,
        });
        setAnnouncement("Pencarian memiliki beberapa kandidat. Pilih satu perusahaan.");
      } else {
        setState({
          status: "error",
          requestId: result.requestId,
          error: result.error,
          query: prepared.request.query,
          focus: prepared.request.focus,
        });
        setAnnouncement(ERROR_COPY[result.error.code].title);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setState({ status: "idle" });
        setAnnouncement(ANALYSIS_CANCEL_ANNOUNCEMENT);
      } else {
        setState({
          status: "error",
          error: internalError(),
          query: prepared.request.query,
          focus: prepared.request.focus,
        });
        setAnnouncement(ERROR_COPY.INTERNAL_ERROR.title);
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void submit();
  }

  function resetDesk(): void {
    abortRef.current?.abort();
    setState({ status: "idle" });
    setAnnouncement("Meja riset siap digunakan.");
    queryRef.current?.focus();
  }

  const isSubmitting = state.status === "submitting";
  const visibleError = state.status === "error" ? ERROR_COPY[state.error.code] : undefined;
  const recoveryMode: AnalysisRecoveryMode = state.status === "error"
    ? getAnalysisRecoveryMode(state.error)
    : "none";

  return (
    <div className="research-preview" aria-label="Meja riset">
      <form className="research-form" onSubmit={handleSubmit} noValidate>
        <label className="research-field" htmlFor="research-query">
          <span className="research-field__label">Perusahaan atau ticker <em>Wajib</em></span>
          <span className={`research-field__control${fieldErrors.query ? " research-field__control--error" : ""}`}>
            <SearchIcon />
            <input
              ref={queryRef}
              id="research-query"
              name="query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Misalnya AAPL atau Apple"
              maxLength={100}
              aria-invalid={Boolean(fieldErrors.query)}
              aria-describedby={fieldErrors.query ? "research-query-error" : undefined}
              disabled={isSubmitting}
            />
          </span>
          {fieldErrors.query ? <span className="research-field__error" id="research-query-error">{fieldErrors.query}</span> : null}
        </label>

        <label className="research-field" htmlFor="research-focus">
          <span className="research-field__label">Fokus riset <em>Opsional</em></span>
          <span className={`research-field__control research-field__control--textarea${fieldErrors.focus ? " research-field__control--error" : ""}`}>
            <textarea
              id="research-focus"
              name="focus"
              value={focus}
              onChange={(event) => setFocus(event.target.value)}
              placeholder="Contoh: profitabilitas, valuasi, dan risiko utama"
              maxLength={500}
              aria-invalid={Boolean(fieldErrors.focus)}
              aria-describedby={fieldErrors.focus ? "research-focus-error" : undefined}
              disabled={isSubmitting}
            />
          </span>
          <span className="research-field__meta">
            {fieldErrors.focus ? <span className="research-field__error" id="research-focus-error">{fieldErrors.focus}</span> : <span>Fokus mengubah penekanan, bukan perhitungan canonical.</span>}
            <span>{focus.length}/500</span>
          </span>
        </label>

        <div className="research-preview__actions">
          <button className="button button--lime button--wide" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menyusun analisis..." : "Susun analisis"}
          </button>
          {isSubmitting ? <button className="research-cancel" type="button" onClick={() => abortRef.current?.abort()}>Batalkan</button> : null}
        </div>
      </form>

      <div className="research-live" aria-live="polite" aria-atomic="true">{announcement}</div>

      {state.status === "submitting" ? (
        <div className="research-state research-state--loading" role="status">
          <span className="research-state__eyebrow">Sedang diproses</span>
          <p>StockFrame mengambil data, menghitung metrik, lalu menyusun interpretasi berdasarkan evidence yang tersedia.</p>
        </div>
      ) : null}

      {state.status === "ambiguous" ? (
        <div className="research-state" role="region" aria-labelledby="candidate-title">
          <span className="research-state__eyebrow">Pilih perusahaan</span>
          <h3 id="candidate-title">Pencarian memiliki beberapa hasil.</h3>
          <p>Pilih satu kandidat agar data perusahaan tidak tertukar.</p>
          <div className="research-candidates">
            {state.candidates.map((candidate) => (
              <button
                className="research-candidate"
                key={`${candidate.instrument.symbol}-${candidate.instrument.exchange}`}
                type="button"
                onClick={() => {
                  const nextQuery = candidateResubmissionQuery(candidate.instrument.symbol);
                  setQuery(nextQuery);
                  void submit(nextQuery);
                }}
              >
                <strong>{candidate.instrument.name}</strong>
                <span>{candidate.instrument.symbol} · {candidate.instrument.exchange} · {candidate.instrument.region}</span>
              </button>
            ))}
          </div>
          <button className="research-cancel" type="button" onClick={resetDesk}>Ubah pencarian</button>
          <small className="research-state__request">ID permintaan: {state.requestId}</small>
        </div>
      ) : null}

      {state.status === "error" && visibleError ? (
        <div className="research-state research-state--error" role="alert">
          <span className="research-state__eyebrow">Belum selesai</span>
          <h3>{visibleError.title}</h3>
          <p>{visibleError.explanation}</p>
          <div className="research-preview__actions research-preview__actions--state">
            {recoveryMode === "retry" ? <button className="text-link text-link--light" type="button" onClick={() => void submit()}>{visibleError.recoveryAction}</button> : null}
            {recoveryMode === "edit" ? <button className="research-cancel" type="button" onClick={resetDesk}>{visibleError.recoveryAction}</button> : null}
            {recoveryMode === "none" ? <span className="research-state__recovery">Coba kembali setelah layanan tersedia.</span> : null}
          </div>
          {state.requestId ? <small className="research-state__request">ID permintaan: {state.requestId}</small> : null}
        </div>
      ) : null}

      {state.status === "success" ? (
        <div className="research-state research-state--success" role="region" aria-labelledby="analysis-ready-title">
          <span className="research-state__eyebrow">Analisis siap</span>
          <h3 id="analysis-ready-title" ref={successRef} tabIndex={-1}>{state.data.instrument.name} <code>{state.data.instrument.symbol}</code></h3>
          <p>{qualityLabel(state.data.quality.decision)}. Data berhasil diproses dan siap ditampilkan dalam workspace laporan.</p>
          <button className="text-link text-link--light" type="button" onClick={resetDesk}>Susun analisis lain</button>
        </div>
      ) : null}

      <p className="research-preview__note">Tidak memerlukan akun. Alat bantu riset dan edukasi, bukan nasihat investasi personal.</p>
    </div>
  );
}
