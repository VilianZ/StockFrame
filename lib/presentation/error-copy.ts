import type { AnalyzeErrorResponse, ErrorCode } from "../domain";

export interface ErrorCopy {
  title: string;
  explanation: string;
  recoveryAction: string;
}

export const ERROR_COPY: Record<ErrorCode, ErrorCopy> = {
  INVALID_REQUEST: { title: "Permintaan belum lengkap", explanation: "Periksa nama perusahaan atau ticker dan fokus riset.", recoveryAction: "Perbaiki input" },
  INSTRUMENT_NOT_FOUND: { title: "Perusahaan tidak ditemukan", explanation: "Coba gunakan ticker atau nama perusahaan yang lebih spesifik.", recoveryAction: "Ubah pencarian" },
  AMBIGUOUS_INSTRUMENT: { title: "Pencarian memiliki beberapa hasil", explanation: "Pilih perusahaan yang tepat agar data tidak tertukar.", recoveryAction: "Pilih perusahaan" },
  REQUEST_RATE_LIMITED: { title: "Permintaan terlalu cepat", explanation: "Tunggu sebentar sebelum menyusun analisis lagi.", recoveryAction: "Coba lagi nanti" },
  PROVIDER_RATE_LIMITED: { title: "Data pasar sedang dibatasi", explanation: "Sumber data sedang membatasi permintaan untuk sementara.", recoveryAction: "Coba lagi nanti" },
  PROVIDER_INVALID_KEY: { title: "Data pasar belum tersedia", explanation: "Layanan data belum dapat digunakan saat ini.", recoveryAction: "Coba lagi nanti" },
  PROVIDER_TIMEOUT: { title: "Pengambilan data terlalu lama", explanation: "Sumber data belum merespons dalam batas waktu.", recoveryAction: "Coba lagi" },
  ANALYSIS_TIMEOUT: { title: "Analisis terlalu lama", explanation: "Proses belum selesai dalam batas waktu yang tersedia.", recoveryAction: "Coba lagi dengan fokus lebih ringkas" },
  PROVIDER_UNAVAILABLE: { title: "Data pasar tidak tersedia", explanation: "Sumber data sedang tidak dapat diakses.", recoveryAction: "Coba lagi" },
  MALFORMED_PROVIDER_RESPONSE: { title: "Data pasar tidak valid", explanation: "Respons sumber data tidak dapat dipakai dengan aman.", recoveryAction: "Coba lagi" },
  INSUFFICIENT_DATA: { title: "Data belum cukup", explanation: "Evidence yang tersedia belum memadai untuk analisis yang aman.", recoveryAction: "Pilih perusahaan lain" },
  AI_UNAVAILABLE: { title: "Interpretasi AI tidak tersedia", explanation: "Data mungkin sudah diproses, tetapi laporan interpretasi belum dapat dibuat.", recoveryAction: "Coba lagi" },
  AI_INVALID_RESPONSE: { title: "Hasil interpretasi tidak valid", explanation: "Laporan model tidak memenuhi kontrak keamanan StockFrame.", recoveryAction: "Coba lagi" },
  INTERNAL_ERROR: { title: "Terjadi kesalahan", explanation: "Proses belum dapat diselesaikan. Coba lagi nanti.", recoveryAction: "Coba lagi" },
};

export function presentAnalyzeError(response: AnalyzeErrorResponse): ErrorCopy & { code: ErrorCode; retryable: boolean; candidates: AnalyzeErrorResponse["error"]["candidates"] } {
  return { ...ERROR_COPY[response.error.code], code: response.error.code, retryable: response.error.retryable, candidates: response.error.candidates };
}
